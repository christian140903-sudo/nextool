"""Der Dirigent: die Schleife als Code — situieren, Vertrag, Schalter, Plan, Ausführung, getrennte Prüfung, Erinnern.

Befund: Der Prüfer als eigene Instanz gewinnt +20,0 pp (84,0 % gegen 64,0 % SC@3, 01-BEFUNDE C1);
die Aufwandsregel gewinnt +12,4 pp auf schweren Aufgaben und kostet −16,7 pp Formattreue als
Dauerschicht (01-BEFUNDE §4); Auflagen als Text −15,3 bis −34,4 pp (B2/B3); Zusammenführung im
Modell 33 % gegen 94 % im Code, Nahtprotokoll 72 % gegen 43 % ohne (M2, 2026-09-08). Der Dirigent
ist die Summe dieser Zeilen (ENTSCHEIDUNG §2).
Erz → Gold: R14 §2.3 beschreibt die Dirigenten-Schleife als modellgerichteten Text (≈ 720 Wörter,
acht Schritte, Stoppregeln als Ermahnung); SOUL CLAUDE.md sagte „Vorhaben zuerst" und „Beleg ≠
Urteil" als Vorsatz. Hier ist jeder Schritt eine Funktion mit Stoppregel: ohne Probe entsteht kein
Vertrag (ContractError propagiert), die Aufwandsregel wird nur eingeblendet, wenn der Schalter
„aufwand" sagt, zerlegt wird nur nach Nahtprüfung und zusammengeführt im Code, das Urteil kommt
allein aus verifier.verify per Quittung, das Ergebnis wird mit Herkunft erinnert (source werkzeug,
source_ref dirigent:<id>), und jeder Schritt schreibt eine Bus-Zeile. Ein Lauf ist ein Versuch;
ob ein zweiter folgt, entscheidet der Aufrufer mit der Quittung in der Hand.

Bezeichner deutsch (Schrittnamen wie in ARCHITEKTUR 5.10), Kommentare deutsch.
"""
from __future__ import annotations

from datetime import timedelta

from . import bus, contract, decompose, inventory, paths, switch, verifier
from . import model as _model  # Alias: der Parameter `model` (Modellname) überdeckt sonst das Modul
from .memory import ledger

# Randabhängige Bedingung: ein Agent ist genauer (94 %), solange die Liste in einen Kontext passt.
# Darüber ist das Nahtprotokoll (72 %) besser als Zerlegung ohne Protokoll (43 %) — M2.
EINZELN_MAX_ZEICHEN = 4000
# Das erinnerte Ergebnis ist ein Eintrag, kein Dokument (ledger: 16 KB Grenze; Episoden kurz).
ERGEBNIS_MAX_ZEICHEN = 2000
# Episoden aus Läufen sind Arbeitsstände: 14 Tage wie consolidate.EPISODE_TTL_TAGE.
EPISODE_TTL_TAGE = 14
# Die sieben Schritte; jeder schreibt "dirigent.<schritt>" auf den Bus.
SCHRITTE = ("situieren", "vertrag", "schalter", "plan", "ausfuehren", "pruefen", "erinnern")
FORMEN = ("einzeln", "zerlegt")
AGENT = "dirigent"


# --- Hilfen -----------------------------------------------------------------------------------
def _fmt(value) -> str:
    """Zahl als Text ohne Nachkommastellen, wenn sie ganz ist; sonst kompakt."""
    if value is None:
        return ""
    return str(int(value)) if float(value).is_integer() else f"{value:g}"


def _plus_tage(iso: str, tage: int) -> str:
    return (paths.parse_iso(iso) + timedelta(days=tage)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _darstellung(items: list) -> str:
    return ", ".join(map(str, items))


def pruefe_liste(items: list | None, condition: str | None) -> None:
    """Stoppregel vor dem ersten Schreibvorgang: eine Liste braucht eine Bedingung und Inhalt.
    Ohne Liste gibt es nichts zu prüfen."""
    if items is None:
        return
    if not condition:
        raise ValueError("items ohne condition: die Bedingung fehlt, die Nahtprüfung braucht sie")
    if len(items) == 0:
        raise ValueError("leere Liste: nichts zu zählen, kein Auftrag")


def aufgabentext(goal: str, items: list | None, condition: str | None) -> str:
    """Der Text für einen Einzelaufruf. Ohne Liste ist es das Ziel selbst; mit Liste folgt die
    Gesamtliste und die Bedingung — der Einzelaufruf sieht die ganze Liste (M2: ein Agent 94 %)."""
    if items is None:
        return goal
    return (f"{goal}\n\nListe: {_darstellung(items)}\n\n"
            f"Wie viele Zahlen in dieser Liste erfuellen: {condition}?\n"
            f"Antworte NUR mit der Anzahl als Zahl.")


# --- Schritt 0: situieren ---------------------------------------------------------------------
def situieren() -> tuple[dict, bool]:
    """Profil lesen; fehlt es, Bestandsaufnahme schreiben. Rückgabe (profil, neu_geschrieben)."""
    profile = inventory.load_profile()
    written = profile is None
    if written:
        profile = inventory.write_profile()
    geraet = profile.get("geraet", {}) or {}
    bus.emit("dirigent.situieren", profile_written=written, system=geraet.get("system"),
             offene_fragen=len(profile.get("offene_fragen") or []),
             identity_name=profile.get("identity_name"))
    return profile, written


# --- Schritt 1: Vertrag -----------------------------------------------------------------------
def vertrag(goal: str, probes: list[dict], *, session_id: str) -> dict:
    """Vertrag anlegen. Ohne Probe wirft contract.new ContractError — der Dirigent fängt das nicht.
    Der Vertrag ist seine eigene Mission (mission_id = id), damit Einträge daran hängen."""
    c = contract.new(goal, probes, assignee=f"{AGENT}:{session_id}")
    c["mission_id"] = c["id"]
    contract.save(c)
    bus.emit("dirigent.vertrag", contract_id=c["id"], probes=len(probes), session_id=session_id)
    return c


# --- Schritt 2: Schalter ----------------------------------------------------------------------
def schalter(goal: str, *, probe: bool, model: str | None, contract_id: str | None = None) -> dict:
    """Stufe direkt/aufwand/pruefer aus switch.decide; die Aufwandsregel liegt in s["inject"]."""
    s = switch.decide(goal, probe=probe, model=model)
    bus.emit("dirigent.schalter", contract_id=contract_id, stage=s["stage"], reason=s["reason"],
             inject=bool(s["inject"]), probe_calls=s["probe"]["calls"] if s.get("probe") else 0)
    return s


# --- Schritt 3: Plan ---------------------------------------------------------------------------
def plan(items: list | None, condition: str | None, *, parts: int,
         contract_id: str | None = None) -> dict:
    """Form der Ausführung aus der Nahtprüfung (M2-Regel, ARCHITEKTUR 5.4/5.10).

    Ohne Liste: Einzelaufruf. Mit Liste: 'zerlegen' → decompose.run ohne Protokoll;
    'einzeln' → Einzelaufruf, solange die Listen-Darstellung ≤ EINZELN_MAX_ZEICHEN ist, sonst
    decompose.run(force=True) mit Nahtprotokoll; 'nicht_zerlegbar' → Einzelaufruf, geloggt.
    Rückgabe {"form", "protocol", "forced", "empfehlung", "classes", "reason", "n_items", "chars", "parts"}.
    """
    if items is None:
        p = {"form": "einzeln", "protocol": "none", "forced": False, "empfehlung": None,
             "classes": [], "reason": "keine Liste: ein Aufruf", "n_items": 0, "chars": 0, "parts": 1}
    else:
        pruefe_liste(items, condition)
        check = decompose.seam_check(condition)
        chars = len(_darstellung(items))
        if check["empfehlung"] == "zerlegen":
            form, protocol, forced = "zerlegt", "none", False
        elif check["empfehlung"] == "einzeln" and chars > EINZELN_MAX_ZEICHEN:
            form, protocol, forced = "zerlegt", "naht", True
        else:  # 'einzeln' in einem Kontext, oder 'nicht_zerlegbar': ein Agent sieht die Gesamtliste
            form, protocol, forced = "einzeln", "none", False
        p = {"form": form, "protocol": protocol, "forced": forced, "empfehlung": check["empfehlung"],
             "classes": check["classes"], "reason": check["reason"], "n_items": len(items),
             "chars": chars, "parts": int(parts)}
    bus.emit("dirigent.plan", contract_id=contract_id,
             **{k: v for k, v in p.items() if k != "reason"}, reason=p["reason"][:200])
    return p


# --- Schritt 4: ausführen ---------------------------------------------------------------------
def ausfuehren(c: dict, s: dict, p: dict, *, items: list | None, condition: str | None,
               model: str | None, thinking: int) -> dict:
    """Vertrag starten, Modell rufen (Aufwandsregel nur, wenn der Schalter sie liefert), liefern.

    Zerlegt: decompose.run ruft je Ausschnitt mit dem gemessenen Arbeiter-Systemprompt und führt
    im Code zusammen; ein fehlender Ausschnitt macht das Ergebnis unbrauchbar → Blockade statt
    Lieferung einer plausiblen falschen Zahl; eine verweigerte Zerlegung (DecomposeError) ebenso.
    Einzeln: ein Aufruf; Fehler → Blockade.
    Rückgabe {"ok", "text", "calls", "missing", "error", "system_injected"}.
    """
    contract.start(c["id"])
    system = s["inject"] or None
    if p["form"] == "zerlegt":
        try:
            r = decompose.run(items, condition, parts=p["parts"], model=model, thinking=thinking,
                              force=p["forced"])
            calls, missing, value = r["calls"], r["missing"], r["value"]
            ok = value is not None and missing == 0
            text = _fmt(value) if ok else ""
            error = None if ok else f"{missing} von {r['chunks']} Ausschnitten ohne Wert"
        except decompose.DecomposeError as exc:
            # Stoppregel: verweigert decompose die Zerlegung, gibt es kein Ergebnis — Blockade,
            # nie ein Einzelaufruf als Ausweg, den der Plan nicht vorgesehen hat.
            calls, missing, ok, text = 0, 0, False, ""
            error = f"Zerlegung verweigert: {str(exc)[:200]}"
    else:
        r = _model.call(system, aufgabentext(c["goal"], items, condition), model=model, thinking=thinking)
        calls, missing = 1, 0
        ok = bool(r.get("ok")) and bool((r.get("text") or "").strip())
        text = (r.get("text") or "") if ok else ""
        error = None if ok else (r.get("error") or "leere Antwort")
    if ok:
        contract.deliver(c["id"], report=text)
    else:
        contract.block(c["id"], f"Ausführung ohne Ergebnis: {error}")
    bus.emit("dirigent.ausfuehren", contract_id=c["id"], form=p["form"], protocol=p["protocol"],
             system_injected=system is not None, calls=calls, ok=ok, chars=len(text),
             missing=missing, error=error)
    return {"ok": ok, "text": text, "calls": calls, "missing": missing, "error": error,
            "system_injected": system is not None}


def panne(contract_id: str, exc: BaseException) -> str | None:
    """Eine Panne auf dem Weg (Adapter, Arbeiter, Hauptbuch) darf keinen Vertrag verwaist in
    `running` lassen — den sähe kein Prüfgate mehr, das nur `delivered` kennt. Läuft er noch, wird er blockiert (kein Urteil);
    ist er schon geliefert, fängt ihn das Prüfgate. Rückgabe: der Status danach."""
    grund = f"Panne im Dirigenten: {type(exc).__name__}: {bus.mask(str(exc)[:160])}"
    try:
        status = contract.load(contract_id)["status"]
        if status in ("open", "running"):
            contract.block(contract_id, grund)
            status = "blocked"
    except Exception as inner:  # noqa: BLE001 — auch das Blockieren kann scheitern (Platte voll)
        status = None
        grund += f" | Blockade fehlgeschlagen: {type(inner).__name__}"
    bus.emit("dirigent.panne", contract_id=contract_id, status=status, error=grund[:300])
    return status


# --- Schritt 5: prüfen -------------------------------------------------------------------------
def pruefen(c: dict, s: dict, ausfuehrung: dict, *, use_model_verifier: bool, model: str | None,
            thinking: int, cwd: str | None, counter_voice_cmd: str | None) -> dict | None:
    """verifier.verify als getrennte Instanz; die Quittung setzt das Urteil. Nichts geliefert →
    nichts zu prüfen (der Vertrag ist blockiert, nicht gescheitert)."""
    if not ausfuehrung["ok"]:
        bus.emit("dirigent.pruefen", contract_id=c["id"], skipped=True,
                 reason="blockiert: keine Lieferung, keine Prüfung")
        return None
    use_model = bool(use_model_verifier) or s["stage"] == "pruefer"
    v = verifier.verify(c["id"], use_model=use_model, model=model, thinking=thinking,
                        proposal_text=ausfuehrung["text"], cwd=cwd, counter_voice_cmd=counter_voice_cmd)
    bus.emit("dirigent.pruefen", contract_id=c["id"], verdict=v["verdict"], verifier=v["verifier"],
             use_model=use_model, korrektur=v["korrektur"], calls=v["calls"],
             probes=v["probes"], probes_failed=v["probes_failed"])
    return v


# --- Schritt 6: erinnern -----------------------------------------------------------------------
def erinnern(c: dict, s: dict, p: dict, ausfuehrung: dict, v: dict | None, *, session_id: str,
             model_id: str) -> str | None:
    """Das Endergebnis als Episode mit Herkunft: source werkzeug, source_ref dirigent:<id>.

    Greift ein Guard des Hauptbuchs (Imperativ im Ergebnistext, Secret), bleibt der Eintrag aus
    und der Lauf meldet es auf dem Bus — das Hauptbuch ist fail-closed, der Lauf läuft zu Ende.
    """
    now = paths.now_iso()
    ergebnis = ausfuehrung["text"][:ERGEBNIS_MAX_ZEICHEN]
    if v is None:
        verdict = "not-evaluated"
        body = f"Blockiert ohne Lieferung: {ausfuehrung['error']}"
    else:
        verdict = v["verdict"]
        body = (f"Urteil {verdict} ({v['verifier']}, Quittung {v['receipt']['hash'][:12]}); "
                f"Stufe {s['stage']}; Form {p['form']}/{p['protocol']}; Ergebnis: {ergebnis}")
        if v["korrektur"]:
            body += f"; Korrektur des Prüfers: {v['korrektur']}"
    try:
        memory_id = ledger.remember(
            c["goal"][:80], body, kind="episode", source="werkzeug",
            source_ref=f"{AGENT}:{c['id']}", mission_id=c["id"], ttl_class="short",
            valid_from=now, expires_at=_plus_tage(now, EPISODE_TTL_TAGE),
            tags=[AGENT, verdict, s["stage"]], importance=3, agent=AGENT,
            session_id=session_id, model_id=model_id or "",
        )
    except ledger.LedgerError as exc:
        bus.emit("dirigent.erinnern", contract_id=c["id"], memory_id=None, rejected=True,
                 grund=str(exc)[:160])
        return None
    bus.emit("dirigent.erinnern", contract_id=c["id"], memory_id=memory_id, rejected=False,
             verdict=verdict)
    return memory_id


# --- Die Schleife ------------------------------------------------------------------------------
def run(goal: str, probes: list[dict], *, items: list | None = None, condition: str | None = None,
        parts: int = 1, model: str | None = None, thinking: int = 0, use_model_verifier: bool = True,
        cwd: str | None = None, session_id: str = "cli", probe_switch: bool = False,
        counter_voice_cmd: str | None = None) -> dict:
    """Ein Lauf: situieren → Vertrag → Schalter → Plan → ausführen → prüfen → erinnern.

    Jeder Abbruch nach dem Vertrag — Ausnahme, Strg-C, SystemExit — führt über panne(): der Vertrag
    wird blockiert, statt in `running` zu bleiben, wo ihn kein Prüfgate mehr sieht.

    Stoppregeln: ohne Probe kein Vertrag (ContractError propagiert, nichts wird geschrieben);
    Modell ohne Ergebnis oder Zerlegung mit Lücke → Vertrag blockiert, kein Urteil; das Urteil
    setzt allein die Quittung des Prüfers. Rückgabe {"contract_id", "status", "stage", "protocol",
    "form", "verdict", "final_text", "final_value", "korrektur", "calls", "receipt", "memory_id",
    "plan", "profile_written"}.
    """
    pruefe_liste(items, condition)  # kaputte Eingabe: nichts wird geschrieben, auch kein Profil
    profile, profile_written = situieren()
    c = vertrag(goal, probes, session_id=session_id)
    try:
        s = schalter(goal, probe=probe_switch, model=model, contract_id=c["id"])
        p = plan(items, condition, parts=parts, contract_id=c["id"])
        a = ausfuehren(c, s, p, items=items, condition=condition, model=model, thinking=thinking)
        v = pruefen(c, s, a, use_model_verifier=use_model_verifier, model=model, thinking=thinking,
                    cwd=cwd, counter_voice_cmd=counter_voice_cmd)
        memory_id = erinnern(c, s, p, a, v, session_id=session_id, model_id=model or _model.DEFAULT_MODEL)
    except BaseException as exc:  # auch Strg-C und SystemExit: kein Vertrag bleibt in running zurück
        panne(c["id"], exc)
        raise

    calls = (s["probe"]["calls"] if s.get("probe") else 0) + a["calls"] + (v["calls"] if v else 0)
    status = contract.load(c["id"])["status"]
    result = {
        "contract_id": c["id"],
        "status": status,
        "stage": s["stage"],
        "protocol": p["protocol"],
        "form": p["form"],
        "verdict": v["verdict"] if v else "not-evaluated",
        "final_text": a["text"],
        "final_value": v["final_value"] if v else _model.extract_last_number(a["text"]),
        "korrektur": v["korrektur"] if v else None,
        "calls": calls,
        "receipt": v["receipt"] if v else None,
        "memory_id": memory_id,
        "plan": p,
        "profile_written": profile_written,
        "error": a["error"],
    }
    bus.emit("dirigent.run", contract_id=c["id"], status=status, stage=s["stage"],
             protocol=p["protocol"], form=p["form"], verdict=result["verdict"], calls=calls,
             memory_id=memory_id, identity_name=profile.get("identity_name"))
    return result
