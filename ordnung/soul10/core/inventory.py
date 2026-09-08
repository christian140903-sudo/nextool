"""Bestandsaufnahme: was steht auf diesem Gerät zur Verfügung — Profil und eine gebündelte Nachricht.

Befund: bewusstsein/werkzeuge/bestandsaufnahme.py läuft (ENTSCHEIDUNG §1, letzte Zeile;
06-AUFTRAG §6.5: „macht die oberste Ebene handlungsfähig, ohne dass sie etwas wissen muss");
Geheimnisse werden nur als vorhanden/nicht vorhanden gemeldet — 0 Werte verlassen den Code.
Erz → Gold: bestandsaufnahme.py druckte einen JSON-Bericht auf stdout und blieb dort stehen.
Hier schreiben dieselben Funktionen (byte-nah übernommen) das Profil profile.json, das
Guard und Dirigent lesen (R14 §2.5: keine hartkodierten Remotes, Namen, Sprachen), und aus
den offenen Fragen entsteht EINE Ring-2-Nachricht (was / warum / was passiert ohne), nach
der die Arbeit weiterläuft.

Sicherheitsregel, die im Code steht und nicht im Vorsatz:
  Geheimnisse werden NUR als vorhanden/nicht vorhanden gemeldet, nie im Wert.
  Kein Schlüssel, kein Token, kein Passwort verlässt diese Funktionen.
"""
from __future__ import annotations

import json
import os
import platform
import re
import shutil
import subprocess

from . import bus, paths

TIMEOUT = 6


# --- übernommen aus bewusstsein/werkzeuge/bestandsaufnahme.py (byte-nah) -------------------
def _sh(cmd):
    try:
        p = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=TIMEOUT)
        return p.stdout.strip() if p.returncode == 0 else ""
    except Exception:
        return ""


# Werkzeuge mit abweichendem Versionsaufruf (beim Ausfuehren gefunden, nicht geraten)
SONDERFALL = {"go": "version", "java": "-version", "docker": "--version",
              "apt": "--version", "kubectl": "version --client"}


def _ver(exe, arg="--version"):
    if not shutil.which(exe):
        return None
    out = _sh(f"{exe} {SONDERFALL.get(exe, arg)} 2>&1 | head -2")
    # Java meldet die Version in Anfuehrungszeichen: openjdk version "21.0.1"
    m = re.search(r'"(\d+(?:\.\d+)*)"', out) or re.search(r"\d+\.\d+(?:\.\d+)?", out)
    if m:
        return m.group(1) if m.lastindex else m.group(0)
    return out.splitlines()[0][:40] if out else "vorhanden"


def geraet():
    d = {"system": platform.system(), "release": platform.release(),
         "maschine": platform.machine(), "python": platform.python_version()}
    if d["system"] == "Linux":
        mem = _sh("grep MemTotal /proc/meminfo")
        m = re.search(r"(\d+)", mem)
        d["ram_gb"] = round(int(m.group(1)) / 1048576, 1) if m else None
        d["cpu_kerne"] = os.cpu_count()
        mod = _sh("grep -m1 'model name' /proc/cpuinfo")
        d["cpu"] = mod.split(":", 1)[1].strip() if ":" in mod else None
    elif d["system"] == "Darwin":
        b = _sh("sysctl -n hw.memsize")
        d["ram_gb"] = round(int(b) / 1073741824, 1) if b.isdigit() else None
        d["cpu_kerne"] = os.cpu_count()
        d["cpu"] = _sh("sysctl -n machdep.cpu.brand_string") or None
        d["apple_silicon"] = "arm" in d["maschine"].lower()
    else:
        d["cpu_kerne"] = os.cpu_count()
    try:
        st = os.statvfs(os.path.expanduser("~"))
        d["platz_frei_gb"] = round(st.f_bavail * st.f_frsize / 1073741824, 1)
    except Exception:
        d["platz_frei_gb"] = None
    return d


def grafik():
    g = {"nvidia": None, "vram_gb": None, "apple_gpu": None}
    if shutil.which("nvidia-smi"):
        out = _sh("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader")
        if out:
            teile = out.splitlines()[0].split(",")
            g["nvidia"] = teile[0].strip()
            m = re.search(r"(\d+)", teile[1] if len(teile) > 1 else "")
            g["vram_gb"] = round(int(m.group(1)) / 1024, 1) if m else None
    if platform.system() == "Darwin":
        g["apple_gpu"] = _sh("system_profiler SPDisplaysDataType 2>/dev/null | grep -m1 Chipset") or None
    return g


def werkzeuge():
    kandidaten = {
        "ki_clis": ["claude", "codex", "gemini", "cursor", "aider", "continue", "goose"],
        "lokale_modelle": ["ollama", "llama-server", "llamafile", "lmstudio", "vllm", "mlx_lm.generate"],
        "laufzeiten": ["python3", "node", "deno", "bun", "go", "rustc", "java"],
        "paketverwaltung": ["pip", "pipx", "uv", "npm", "pnpm", "yarn", "brew", "apt", "cargo"],
        "container": ["docker", "podman", "colima", "kubectl"],
        "quellcode": ["git", "gh", "jq", "rg", "fd", "make"],
    }
    return {k: {e: v for e in liste if (v := _ver(e)) is not None}
            for k, liste in kandidaten.items()}


def zugaenge():
    """NUR Vorhandensein. Werte werden nie gelesen oder ausgegeben."""
    schluessel = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY",
                  "GROQ_API_KEY", "MISTRAL_API_KEY", "TOGETHER_API_KEY", "OPENROUTER_API_KEY",
                  "HF_TOKEN", "GITHUB_TOKEN", "GH_TOKEN", "AWS_ACCESS_KEY_ID",
                  "AZURE_OPENAI_API_KEY", "DEEPSEEK_API_KEY"]
    vorhanden = {k: bool(os.environ.get(k)) for k in schluessel}
    dateien = {}
    for name, pfad in [("claude", "~/.claude"), ("codex", "~/.codex"),
                       ("ollama_modelle", "~/.ollama/models"), ("aws", "~/.aws"),
                       ("gcloud", "~/.config/gcloud"), ("hf", "~/.cache/huggingface")]:
        dateien[name] = os.path.isdir(os.path.expanduser(pfad))
    return {"umgebungsvariablen": vorhanden, "konfigurationen": dateien,
            "hinweis": "Nur Vorhandensein geprueft. Es wurde kein Wert gelesen."}


def lokale_modelle():
    if not shutil.which("ollama"):
        return {"ollama": False}
    out = _sh("ollama list")
    modelle = []
    for z in out.splitlines()[1:]:
        if z.strip():
            modelle.append(z.split()[0])
    return {"ollama": True, "modelle": modelle}


def empfehlung(g, gr):
    """Welche lokale Modellgroesse traegt dieses Geraet?"""
    ram = g.get("ram_gb") or 0
    vram = gr.get("vram_gb") or 0
    nutzbar = max(vram, ram * 0.6)   # ohne GPU grob 60 % des RAM fuer das Modell
    if nutzbar >= 40:
        stufe = "70B (Q4) laeuft; 32B komfortabel"
    elif nutzbar >= 20:
        stufe = "32B (Q4) laeuft; 14B komfortabel"
    elif nutzbar >= 10:
        stufe = "14B (Q4) laeuft; 7-8B komfortabel"
    elif nutzbar >= 5:
        stufe = "7-8B (Q4) laeuft; 3B komfortabel"
    elif nutzbar >= 2:
        stufe = "3B (Q4) laeuft; darunter nur 1B"
    else:
        stufe = "kein lokales Modell sinnvoll"
    return {"nutzbarer_speicher_gb": round(nutzbar, 1), "lokale_stufe": stufe,
            "grundlage": "VRAM wenn GPU vorhanden, sonst 60 % des RAM"}


def offene_fragen(z, lm):
    """Was das Geraet NICHT verraet -- daraus wird die eine gebuendelte Nutzerfrage."""
    f = []
    if not any(z["umgebungsvariablen"].values()):
        f.append("Keine API-Schluessel in der Umgebung gefunden. Gibt es Zugaenge, "
                 "die anders hinterlegt sind (Abo, Weboberflaeche, Passwortmanager)?")
    if not z["konfigurationen"].get("claude") and not z["konfigurationen"].get("codex"):
        f.append("Keine KI-CLI-Konfiguration gefunden. Welche KI-Abonnements bestehen?")
    if not lm.get("ollama"):
        f.append("Kein Ollama installiert. Soll ein lokales Modell eingerichtet werden?")
    f.append("Gibt es Kontingent-Grenzen oder Kostendeckel, die eingehalten werden muessen?")
    return f


def aufnehmen():
    g = geraet(); gr = grafik(); lm = lokale_modelle(); z = zugaenge()
    return {"geraet": g, "grafik": gr, "werkzeuge": werkzeuge(),
            "lokale_modelle": lm, "zugaenge": z,
            "empfehlung": empfehlung(g, gr), "offene_fragen": offene_fragen(z, lm)}


# --- Profil: die Datei, die Guard und Dirigent lesen ----------------------------------------
DEFAULT_OWN_REMOTES = ["origin"]
DEFAULT_CONSENT = {"given": False, "at": None, "ring2": []}
RING2_SCHLUSS = "Antworten sind optional; die Arbeit läuft weiter."


def load_profile() -> dict | None:
    """profile.json lesen; fehlt sie oder ist sie kaputt → None (der Aufrufer schreibt neu)."""
    try:
        data = json.loads(paths.profile_file().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def write_profile(*, name: str | None = None, language: str = "de",
                  identity_name: str | None = None) -> dict:
    """aufnehmen() + Nutzer, Identität, eigene Remotes, Zustimmung → profile.json.

    Vom Nutzer gesetzte Felder eines vorhandenen Profils (own_remotes, consent, Name) werden
    übernommen, wenn der Aufruf nichts Neues liefert — eine erneute Bestandsaufnahme löscht
    keine Zustimmung. Vor dem Schreiben läuft die Secret-Maske des Busses über den gesamten
    Text: auch ein Versionsstring, der wie ein Token aussieht, landet nicht auf Platte.
    """
    vorher = load_profile() or {}
    alt_user = vorher.get("user") if isinstance(vorher.get("user"), dict) else {}
    profile = aufnehmen()
    profile.update({
        "user": {"name": name if name is not None else alt_user.get("name"),
                 "language": language or alt_user.get("language") or "de"},
        "identity_name": identity_name if identity_name is not None else vorher.get("identity_name"),
        "own_remotes": list(vorher.get("own_remotes") or DEFAULT_OWN_REMOTES),
        "consent": dict(vorher.get("consent") or DEFAULT_CONSENT),
        "written_at": paths.now_iso(),
    })
    text = bus.mask(json.dumps(profile, ensure_ascii=False, indent=1, default=str))
    profile = json.loads(text)
    target = paths.profile_file()
    tmp = target.with_name(target.name + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, target)
    z = profile.get("zugaenge", {})
    bus.emit("inventory.profile", path=str(target),
             system=profile.get("geraet", {}).get("system"),
             schluessel_vorhanden=sum(1 for v in z.get("umgebungsvariablen", {}).values() if v),
             ollama=bool(profile.get("lokale_modelle", {}).get("ollama")),
             offene_fragen=len(profile.get("offene_fragen", [])),
             own_remotes=profile.get("own_remotes"))
    return profile


# --- Ring 2: eine gebündelte Nachricht ------------------------------------------------------
def _empfehlungen(profile: dict) -> list[dict]:
    """Drei Empfehlungen (Abo, Schlüssel, lokales Modell), je was / warum / was passiert ohne."""
    z = profile.get("zugaenge", {}) or {}
    konf = z.get("konfigurationen", {}) or {}
    keys = z.get("umgebungsvariablen", {}) or {}
    n_keys = sum(1 for v in keys.values() if v)
    lm = profile.get("lokale_modelle", {}) or {}
    emp = profile.get("empfehlung", {}) or {}
    stufe = emp.get("lokale_stufe", "unbekannt")
    out = []
    if konf.get("claude") or konf.get("codex"):
        vorhanden = ", ".join(k for k in ("claude", "codex") if konf.get(k))
        out.append({"titel": "Abo", "was": f"Eine zweite KI-CLI als Gegenstimme (vorhanden: {vorhanden}).",
                    "warum": "Der Prüfer gewinnt als eigene Instanz (+20,0 pp); ein Fremdkommando "
                             "aus einer anderen Modellfamilie ist im Prüfer als Gegenstimme konfigurierbar.",
                    "ohne": "Die Prüfung läuft mit derselben Modellfamilie wie die Arbeit."})
    else:
        out.append({"titel": "Abo", "was": "Ein KI-Abonnement mit eingeloggter CLI (Claude Code oder Codex).",
                    "warum": "Ohne eingeloggte CLI gibt es keinen Modellaufruf; alle Mechanismen hängen daran.",
                    "ohne": "Nur lokale Modelle, falls vorhanden; sonst steht die Arbeit."})
    if n_keys:
        out.append({"titel": "Schlüssel", "was": f"API-Schlüssel sind vorhanden ({n_keys}); es wird nur geprüft, "
                                                 f"ob sie gesetzt sind, nie ihr Wert.",
                    "warum": "Messläufe und Massenaufgaben laufen über die API statt über die Sitzung.",
                    "ohne": "Nichts weiter nötig."})
    else:
        out.append({"titel": "Schlüssel", "was": "Ein API-Schlüssel (z. B. ANTHROPIC_API_KEY) in der Umgebung.",
                    "warum": "Messläufe und Massenaufgaben laufen über die API statt über die Sitzung.",
                    "ohne": "Alles läuft über die CLI-Sitzung; deren Kontingent gilt für Arbeit und Prüfung."})
    if lm.get("ollama"):
        modelle = lm.get("modelle") or []
        out.append({"titel": "Lokales Modell", "was": f"Ollama ist da ({len(modelle)} Modelle); Gerät trägt: {stufe}.",
                    "warum": "Lokal ist kostenlos und offline verfügbar — für Vorfilter, Entwürfe, Massenläufe.",
                    "ohne": "Jede Anfrage kostet Kontingent; offline keine Arbeit."})
    else:
        out.append({"titel": "Lokales Modell", "was": f"Ein lokales Modell über Ollama; Gerät trägt: {stufe}.",
                    "warum": "Lokal ist kostenlos und offline verfügbar — für Vorfilter, Entwürfe, Massenläufe.",
                    "ohne": "Jede Anfrage kostet Kontingent; offline keine Arbeit."})
    return out


def ring2_message(profile: dict) -> str:
    """EINE gebündelte Nachricht an den Nutzer: Gerät, offene Fragen, Empfehlungen, Schluss."""
    g = profile.get("geraet", {}) or {}
    gr = profile.get("grafik", {}) or {}
    fragen = list(profile.get("offene_fragen") or [])
    empfehlungen = _empfehlungen(profile)
    zeilen = ["# Einrichtung — eine gebündelte Nachricht (Ring 2)", ""]
    gpu = gr.get("nvidia") or gr.get("apple_gpu") or "keine GPU erkannt"
    zeilen.append(f"Gerät: {g.get('system', '?')} {g.get('maschine', '')}, "
                  f"{g.get('ram_gb', '?')} GB RAM, {g.get('cpu_kerne', '?')} Kerne, {gpu}.")
    zeilen.append("")
    zeilen.append(f"## Offene Fragen ({len(fragen)})")
    for i, frage in enumerate(fragen, 1):
        zeilen.append(f"{i}. {frage}")
    zeilen.append("")
    zeilen.append(f"## Empfehlungen ({len(empfehlungen)})")
    for e in empfehlungen:
        zeilen.append(f"- {e['titel']}")
        zeilen.append(f"  Was: {e['was']}")
        zeilen.append(f"  Warum: {e['warum']}")
        zeilen.append(f"  Ohne: {e['ohne']}")
    zeilen.append("")
    zeilen.append(RING2_SCHLUSS)
    text = "\n".join(zeilen)
    bus.emit("inventory.ring2", fragen=len(fragen), empfehlungen=len(empfehlungen), zeichen=len(text))
    return text
