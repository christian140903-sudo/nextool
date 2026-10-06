# -*- coding: utf-8 -*-
"""
TransCal-AMR — Vergleichsmaßstab für EHRLICHE, übertragbare Resistenzvorhersage.

Der eigene, neue Ansatz in einem Satz
--------------------------------------
Nicht "wie gut trennt das Modell?" (das misst das ganze Feld schon), sondern:
"Bleibt die Wahrscheinlichkeit EHRLICH, wenn das Modell in ein fremdes Krankenhaus
kommt — und wenn nicht, sagt es das selbst und weiß, wie wenig lokale Daten es
braucht, um wieder vertrauenswürdig zu werden — während der Messwert selbst
(Heteroresistenz, Wert nahe der Grenze) als unsicher behandelt wird?"

Vier Bausteine, die zusammen den Unterschied machen:
  1. Kalibrierung zuerst, über Standorte hinweg (nicht nur AUC).
  2. Selektive Vorhersage: das Modell darf "weiß ich hier nicht" sagen (Abstention).
  3. Rekalibrierungs-Ökonomie: wie wenige lokale Proben stellen Vertrauen wieder her?
  4. Label-Rauschen bewusst modelliert (Heteroresistenz / Wert nahe Breakpoint).

Alles numpy-only, läuft auf dem Laptop in Sekunden. Der eingebaute synthetische
Mehr-Standort-Generator zeigt die Methode SOFORT; echte öffentliche Daten
(DRIAMS, AMR-UTI, ATLAS) kommen später an dieselbe Schnittstelle.
"""
from __future__ import annotations
import numpy as np

rng_global = np.random.default_rng(20261006)

# ----------------------------------------------------------------------
# Mini-Logistik (numpy, kein sklearn): gewichtete Gradientenabstieg-Schätzung
# ----------------------------------------------------------------------
def _sigmoid(z): return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))

def fit_logistic(X, y, l2=1.0, iters=400, lr=0.3, w0=None):
    n, d = X.shape
    w = np.zeros(d) if w0 is None else w0.copy()
    for _ in range(iters):
        p = _sigmoid(X @ w)
        grad = X.T @ (p - y) / n + l2 * w / n
        w -= lr * grad
    return w

def bagged_logistic(X, y, n_models=25, l2=1.0, rng=None):
    """Ensemble für Unsicherheit: Streuung der Vorhersagen = 'weiß ich es hier?'"""
    rng = rng or np.random.default_rng(0)
    models = []
    n = len(y)
    for _ in range(n_models):
        idx = rng.integers(0, n, n)
        models.append(fit_logistic(X[idx], y[idx], l2=l2))
    return models

def ensemble_predict(models, X):
    P = np.stack([_sigmoid(X @ w) for w in models])   # (n_models, n)
    return P.mean(0), P.std(0)                         # Mittel, Unsicherheit

# ----------------------------------------------------------------------
# Gütemaße: Trennschärfe UND Kalibrierung GETRENNT
# ----------------------------------------------------------------------
def auc(p, y):
    y = np.asarray(y, int); n1 = y.sum(); n0 = len(y) - n1
    if n1 == 0 or n0 == 0: return np.nan
    up, inv, cnt = np.unique(p, return_inverse=True, return_counts=True)
    o = np.argsort(p, kind="mergesort"); r = np.empty(len(p)); r[o] = np.arange(1, len(p)+1)
    s = np.zeros(len(up)); np.add.at(s, inv, r); r = (s/cnt)[inv]
    return (r[y==1].sum() - n1*(n1+1)/2) / (n1*n0)

def ece(p, y, bins=10):
    p = np.asarray(p); y = np.asarray(y, float)
    edges = np.linspace(0, 1, bins+1); idx = np.clip(np.digitize(p, edges[1:-1]), 0, bins-1)
    e = 0.0
    for b in range(bins):
        m = idx == b
        if m.any(): e += m.mean() * abs(p[m].mean() - y[m].mean())
    return e

def calibration_slope(p, y):
    """Logistik von y auf logit(p). Slope 1 = perfekt kalibriert; <1 = überkonfident."""
    p = np.clip(np.asarray(p), 1e-6, 1-1e-6); z = np.log(p/(1-p))
    X = np.column_stack([np.ones_like(z), z])
    w = fit_logistic(X, np.asarray(y, float), l2=1e-3, iters=800, lr=0.5)
    return w[1]   # Steigung

def brier(p, y): return float(np.mean((np.asarray(p)-np.asarray(y, float))**2))

# ----------------------------------------------------------------------
# Rekalibrierung mit WENIGEN lokalen Proben (Platt-Skalierung)
# ----------------------------------------------------------------------
def platt_recalibrate(p_src, p_local, y_local):
    """Lerne a,b auf k lokalen Proben; wende auf alle Quell-Vorhersagen an."""
    z = np.log(np.clip(p_local,1e-6,1-1e-6)/(1-np.clip(p_local,1e-6,1-1e-6)))
    X = np.column_stack([np.ones_like(z), z])
    w = fit_logistic(X, np.asarray(y_local, float), l2=1e-2, iters=800, lr=0.5)
    zt = np.log(np.clip(p_src,1e-6,1-1e-6)/(1-np.clip(p_src,1e-6,1-1e-6)))
    return _sigmoid(w[0] + w[1]*zt)

# ----------------------------------------------------------------------
# Synthetischer Mehr-Standort-Datensatz MIT Verteilungs-Shift + Label-Rauschen
# ----------------------------------------------------------------------
def make_multisite(n_sites=5, n_per=600, n_feat=5, shift=1.2, hetero_noise=0.0, rng=None):
    rng = rng or np.random.default_rng(1)
    w_true = rng.normal(0, 1.0, n_feat)
    sites = []
    for s in range(n_sites):
        X = rng.normal(0, 1, (n_per, n_feat))
        site_intercept = rng.normal(0, shift)          # <-- Verteilungs-Shift je Standort
        feat_drift = rng.normal(0, 0.4, n_feat)        # andere Feature-Verteilung
        X = X + feat_drift
        logit = X @ w_true + site_intercept
        p = _sigmoid(logit)
        y = (rng.random(n_per) < p).astype(int)
        if hetero_noise > 0:                           # Label-Rauschen nahe der Grenze
            near = np.abs(p - 0.5) < 0.15
            flip = near & (rng.random(n_per) < hetero_noise)
            y[flip] = 1 - y[flip]
        sites.append((X, y))
    return sites

# ----------------------------------------------------------------------
# Hauptexperiment: Leave-one-site-out, alle vier Bausteine
# ----------------------------------------------------------------------
def run(hetero_noise=0.0, seed=1):
    rng = np.random.default_rng(seed)
    sites = make_multisite(hetero_noise=hetero_noise, rng=rng)
    K = len(sites)
    rows = []
    sel_gain = []; recal_curves = []
    for held in range(K):
        Xtr = np.vstack([sites[s][0] for s in range(K) if s != held])
        ytr = np.concatenate([sites[s][1] for s in range(K) if s != held])
        Xte, yte = sites[held]
        models = bagged_logistic(Xtr, ytr, rng=rng)
        p, u = ensemble_predict(models, Xte)
        rows.append((held, auc(p, yte), ece(p, yte), calibration_slope(p, yte), brier(p, yte)))

        # Baustein 2: selektive Vorhersage — behalte die 70% sichersten (kleinstes u)
        keep = u <= np.quantile(u, 0.70)
        sel_gain.append((ece(p, yte), ece(p[keep], yte[keep])))

        # Baustein 3: Rekalibrierungs-Ökonomie — ECE nach k lokalen Proben
        curve = []
        for k in (0, 10, 25, 50, 100, 200):
            if k == 0:
                curve.append((k, ece(p, yte))); continue
            li = rng.choice(len(yte), k, replace=False)
            prec = platt_recalibrate(p, p[li], yte[li])
            mask = np.ones(len(yte), bool); mask[li] = False      # auf ungesehenem Rest messen
            curve.append((k, ece(prec[mask], yte[mask])))
        recal_curves.append(curve)
    return rows, sel_gain, recal_curves

def _mean_curve(curves):
    ks = [k for k,_ in curves[0]]
    return [(k, float(np.mean([c[i][1] for c in curves]))) for i,k in enumerate(ks)]

if __name__ == "__main__":
    print("="*74)
    print("TransCal-AMR — Demo auf synthetischen Mehr-Standort-Daten (5 Standorte)")
    print("="*74)
    for label, hn in (("ohne Label-Rauschen", 0.0), ("mit Heteroresistenz-Rauschen 30%", 0.30)):
        rows, sel, recal = run(hetero_noise=hn)
        auc_m = np.mean([r[1] for r in rows]); ece_m = np.mean([r[2] for r in rows])
        slope_m = np.mean([r[3] for r in rows])
        print(f"\n### {label}")
        print(f"  Leave-one-site-out, gemittelt über 5 fremde Standorte:")
        print(f"    Trennschärfe   AUC            = {auc_m:5.3f}   (gut: das Modell UNTERSCHEIDET)")
        print(f"    Kalibrierung   ECE            = {ece_m:5.3f}   (klein = ehrlich; >0.05 = überkonfident)")
        print(f"    Kalibrierung   Slope          = {slope_m:5.3f}   (1.0 = perfekt; <1 = zu selbstsicher)")
        before = np.mean([b for b,_ in sel]); after = np.mean([a for _,a in sel])
        print(f"  Baustein 2 — Abstention: ECE {before:.3f} (alle)  ->  {after:.3f} (sicherste 70%)")
        mc = _mean_curve(recal)
        print(f"  Baustein 3 — Rekalibrierungs-Ökonomie (ECE nach k lokalen Proben):")
        print("      " + "  ".join(f"k={k}:{v:.3f}" for k,v in mc))
    print("\n" + "="*74)
    print("Lesart: Über fremde Standorte ist die AUC ok, aber die Kalibrierung bricht")
    print("(ECE hoch, Slope <1). Abstention senkt den Fehler auf dem, was das Modell sich")
    print("zutraut. Schon wenige Dutzend lokale Proben stellen die Ehrlichkeit wieder her.")
    print("Label-Rauschen verschlechtert die Kalibrierung sichtbar — genau der blinde")
    print("Fleck (Heteroresistenz), den das Feld bisher übergeht. Das ist der Beitrag.")
