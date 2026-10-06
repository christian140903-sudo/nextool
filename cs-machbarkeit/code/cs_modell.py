"""
Kollateralsensitivitaet als kalibrierte Wahrscheinlichkeit — Referenzimplementierung.

Zweck
-----
Dieses Modul enthaelt die vollstaendige Analysekette fuer den Machbarkeitsnachweis:
Datenaufbereitung, hierarchisches Modell, Baselines, Guetemasse, Negativkontrollen.
Es laeuft mit numpy allein, in Sekunden, auf jedem Laptop.

Die zentrale Behauptung, die hier pruefbar gemacht wird
-------------------------------------------------------
Nicht:  "Wir sagen vorher, ob Paar (A,B) Kollateralsensitivitaet zeigt."
Sondern: "Wir geben fuer jedes Paar eine Wahrscheinlichkeit an, und diese
          Wahrscheinlichkeit ist KALIBRIERT — wenn wir 70 % sagen, tritt das
          Ereignis in 70 % der Faelle ein."

Das ist ein schwaecherer, aber ehrlicher und nachweisbarer Anspruch. Und es ist
der einzige Anspruch, der mit der bekannten Nicht-Reproduzierbarkeit von
Kollateralsensitivitaet vereinbar ist.
"""
from __future__ import annotations
import numpy as np

__all__ = [
    "mic_zu_log2", "cs_index", "BetaBinomialHierarchisch",
    "baseline_zufall", "baseline_mehrheit",
    "brier_zerlegung", "ece", "auc_roc", "net_benefit",
    "permutationstest", "bootstrap_ki",
]

# =====================================================================
# 1. Datenaufbereitung
# =====================================================================

def mic_zu_log2(mic, untere_grenze=None, obere_grenze=None):
    """MIC-Werte in log2-Verduennungsstufen.

    MIC-Messungen sind INTERVALLZENSIERT: ein Wert '<=0.25' heisst nur, dass die
    Hemmung spaetestens bei 0.25 eintrat, nicht dass sie genau dort lag. Werte am
    Plattenrand ('>32') sind rechtszensiert. Wer das ignoriert, verzerrt jede
    nachfolgende Schaetzung systematisch.

    Rueckgabe: (log2-Werte, Zensierungskennung)
        Kennung  0 = exakt beobachtet
                -1 = linkszensiert  (wahrer Wert liegt darunter)
                +1 = rechtszensiert (wahrer Wert liegt darueber)
    """
    mic = np.asarray(mic, dtype=float)
    werte = np.log2(mic)
    zensur = np.zeros(len(mic), dtype=int)
    if untere_grenze is not None:
        zensur[mic <= untere_grenze] = -1
    if obere_grenze is not None:
        zensur[mic >= obere_grenze] = +1
    return werte, zensur


def cs_index(mic_resistent, mic_wildtyp):
    """Kollateralsensitivitaets-Index in log2-Einheiten.

    EINE EINZIGE Konvention, durchgehend:
        CSI = log2( MIC_wildtyp / MIC_resistent )
        CSI > 0  ->  Kollateralsensitivitaet  (resistenter Stamm ist empfindlicher)
        CSI < 0  ->  Kreuzresistenz

    Diese Festlegung ist nicht verhandelbar und muss in jeder Abbildung,
    jeder Tabelle und jedem Methodenteil identisch wiederholt werden.
    Zwei Konventionen im selben Dokument entwerten saemtliche Zahlen.
    """
    return np.log2(np.asarray(mic_wildtyp, float) / np.asarray(mic_resistent, float))


# =====================================================================
# 2. Das Modell
# =====================================================================

class BetaBinomialHierarchisch:
    """Hierarchisches Beta-Binomial-Modell mit partial pooling.

    Jedes Arzneimittelpaar (A->B) hat eine eigene, unbekannte Wahrscheinlichkeit
    p_AB, dass ein unabhaengiges Evolutionsreplikat Kollateralsensitivitaet zeigt.
    Beobachtet werden k Treffer aus n Replikaten.

    Der naive Schaetzer k/n ist bei den in der Literatur ueblichen n = 3 bis 5
    Replikaten unbrauchbar: er kann nur wenige diskrete Werte annehmen und
    behauptet bei k=0 oder k=n eine Sicherheit, die die Daten nicht hergeben.

    Das hierarchische Modell leiht Information ueber alle Paare hinweg. Extreme
    Schaetzungen werden zur gemeinsamen Mitte gezogen, und zwar umso staerker,
    je weniger Replikate vorliegen. Das ist der Mechanismus, der die
    Kalibrierung herstellt.

    Die Hyperparameter werden hier per Momentenmethode geschaetzt (Empirical
    Bayes). Fuer die Publikationsversion ist ein voller Sampler vorzuziehen
    (PyMC oder NumPyro), weil er die Unsicherheit der Hyperparameter selbst
    mitfuehrt; die Punktschaetzung hier unterschaetzt sie leicht.
    """

    def __init__(self, min_praezision: float = 1e-6):
        self.min_praezision = min_praezision
        self.alpha_ = self.beta_ = None

    def fit(self, k, n):
        k = np.asarray(k, float)
        n = np.asarray(n, float)
        roh = k / n
        m = roh.mean()
        varianz_gesamt = roh.var(ddof=1)
        varianz_stichprobe = np.mean(m * (1 - m) / n)
        varianz_zwischen = max(varianz_gesamt - varianz_stichprobe, self.min_praezision)
        praezision = max(m * (1 - m) / varianz_zwischen - 1, self.min_praezision)
        self.alpha_ = m * praezision
        self.beta_ = (1 - m) * praezision
        return self

    def predict_proba(self, k, n):
        """Posterior-Mittelwert je Paar."""
        if self.alpha_ is None:
            raise RuntimeError("fit() muss zuerst aufgerufen werden")
        k = np.asarray(k, float); n = np.asarray(n, float)
        return (k + self.alpha_) / (n + self.alpha_ + self.beta_)

    def predict_intervall(self, k, n, breite=0.90, ziehungen=4000, rng=None):
        """Glaubwuerdigkeitsintervall je Paar durch Ziehung aus dem Posterior."""
        rng = rng or np.random.default_rng(0)
        k = np.asarray(k, float); n = np.asarray(n, float)
        a = k + self.alpha_
        b = (n - k) + self.beta_
        zieh = rng.beta(a[:, None], b[:, None], size=(len(k), ziehungen))
        lo, hi = (1 - breite) / 2, 1 - (1 - breite) / 2
        return np.quantile(zieh, [lo, hi], axis=1)

    def shrinkage(self, n):
        """Anteil, zu dem ein Paar zum Gesamtmittel gezogen wird. Diagnostisch
        wertvoll: zeigt, wie stark das Modell bei gegebener Replikatzahl eingreift."""
        n = np.asarray(n, float)
        return (self.alpha_ + self.beta_) / (n + self.alpha_ + self.beta_)


# =====================================================================
# 3. Baselines — ohne sie ist jedes Ergebnis wertlos
# =====================================================================

def baseline_zufall(n, rng=None):
    """Konstante Vorhersage 0.5. Der absolute Mindestmassstab."""
    return np.full(n, 0.5)

def baseline_mehrheit(k_train, n_train, n_test):
    """Konstante Vorhersage = Gesamthaeufigkeit im Trainingssatz.
    Ueberraschend stark und der eigentliche Gegner: ein Modell, das diese
    Baseline nicht schlaegt, hat nichts Paarspezifisches gelernt."""
    return np.full(n_test, np.sum(k_train) / np.sum(n_train))


# =====================================================================
# 4. Guetemasse
# =====================================================================

def brier_zerlegung(p, y, n_bins=10):
    """Murphy-Zerlegung des Brier-Scores.

        Brier = Reliability - Resolution + Uncertainty

    Reliability  = Kalibrierungsfehler. Kleiner ist besser, 0 ist perfekt.
                   DAS ist der primaere Endpunkt des Vorhabens.
    Resolution   = Faehigkeit, zwischen Faellen zu unterscheiden. Groesser ist besser.
    Uncertainty  = Grundrauschen der Daten. Nicht beeinflussbar, dient der Einordnung.
    """
    p = np.asarray(p, float); y = np.asarray(y, float)
    brier = np.mean((p - y) ** 2)
    kanten = np.linspace(0, 1, n_bins + 1)
    idx = np.clip(np.digitize(p, kanten[1:-1]), 0, n_bins - 1)
    ybar = y.mean()
    rel = res = 0.0
    for b in range(n_bins):
        m = idx == b
        if not m.any():
            continue
        w = m.sum() / len(p)
        rel += w * (p[m].mean() - y[m].mean()) ** 2
        res += w * (y[m].mean() - ybar) ** 2
    return {"brier": brier, "reliability": rel, "resolution": res,
            "uncertainty": ybar * (1 - ybar)}


def ece(p, y, n_bins=10):
    """Expected Calibration Error: mittlerer Abstand zwischen zugesagter und
    eingetretener Haeufigkeit, gewichtet nach Besetzung der Klassen."""
    p = np.asarray(p, float); y = np.asarray(y, float)
    kanten = np.linspace(0, 1, n_bins + 1)
    idx = np.clip(np.digitize(p, kanten[1:-1]), 0, n_bins - 1)
    e = 0.0
    for b in range(n_bins):
        m = idx == b
        if m.any():
            e += (m.sum() / len(p)) * abs(p[m].mean() - y[m].mean())
    return e


def auc_roc(p, y):
    """ROC-AUC ueber die Mann-Whitney-Rangstatistik, mit Bindungskorrektur."""
    p = np.asarray(p, float); y = np.asarray(y, int)
    n1 = y.sum(); n0 = len(y) - n1
    if n1 == 0 or n0 == 0:
        return np.nan
    up, inv, cnt = np.unique(p, return_inverse=True, return_counts=True)
    o = np.argsort(p, kind="mergesort")
    r = np.empty(len(p), float); r[o] = np.arange(1, len(p) + 1)
    s = np.zeros(len(up)); np.add.at(s, inv, r)
    r = (s / cnt)[inv]
    return (r[y == 1].sum() - n1 * (n1 + 1) / 2) / (n1 * n0)


def net_benefit(p, y, schwelle):
    """Decision Curve Analysis.

    Beantwortet die Frage, die eine Klinikerin tatsaechlich stellt: Wenn ich nur
    dann auf Wirkstoff B wechsle, wenn das Modell mindestens 'schwelle'
    Wahrscheinlichkeit angibt — ist mir damit gedient, verglichen mit 'immer
    wechseln' oder 'nie wechseln'?

    Dies ist die Bruecke von der Statistik zur Anwendung. Ohne sie bleibt jede
    AUC eine Zahl ohne Konsequenz.
    """
    p = np.asarray(p, float); y = np.asarray(y, int)
    N = len(y)
    behandelt = p >= schwelle
    rp = np.sum(behandelt & (y == 1))
    fp = np.sum(behandelt & (y == 0))
    return rp / N - (fp / N) * (schwelle / (1 - schwelle))


# =====================================================================
# 5. Kontrollen
# =====================================================================

def permutationstest(p, y, statistik=auc_roc, n_perm=2000, rng=None):
    """Label-Permutation. Zwingende Negativkontrolle.

    Liefert den beobachteten Wert, die Nullverteilung und den p-Wert.
    Faellt die Statistik unter Permutation NICHT auf ihren Nullwert, liegt ein
    Datenleck vor — nicht ein Befund.
    """
    rng = rng or np.random.default_rng(0)
    beobachtet = statistik(p, y)
    null = np.array([statistik(p, rng.permutation(y)) for _ in range(n_perm)])
    null = null[~np.isnan(null)]
    p_wert = (np.sum(null >= beobachtet) + 1) / (len(null) + 1)
    return {"beobachtet": beobachtet, "null_median": float(np.median(null)),
            "null_ki": tuple(np.quantile(null, [0.025, 0.975])), "p_wert": p_wert}


def bootstrap_ki(p, y, statistik=auc_roc, n_boot=2000, breite=0.95, rng=None):
    """Bootstrap-Konfidenzintervall ueber Faelle."""
    rng = rng or np.random.default_rng(0)
    N = len(y)
    werte = []
    for _ in range(n_boot):
        idx = rng.integers(0, N, N)
        v = statistik(p[idx], y[idx])
        if not np.isnan(v):
            werte.append(v)
    lo, hi = (1 - breite) / 2, 1 - (1 - breite) / 2
    return float(statistik(p, y)), tuple(np.quantile(werte, [lo, hi]))
