#!/usr/bin/env python3
"""Bestandsaufnahme: was steht auf diesem Geraet zur Verfuegung?

Erste Handlung der obersten Ebene auf einem fremden Geraet. Ergebnis ist ein
JSON-Bericht, aus dem der Dirigent seinen Ressourcenplan ableitet.

Sicherheitsregel, die im Code steht und nicht im Vorsatz:
  Geheimnisse werden NUR als vorhanden/nicht vorhanden gemeldet, nie im Wert.
  Kein Schluessel, kein Token, kein Passwort verlaesst diese Funktion.
Damit ist die Bestandsaufnahme gefahrlos protokollier- und anzeigbar.
"""
import json, os, platform, shutil, subprocess, sys, re

TIMEOUT = 6


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


if __name__ == "__main__":
    print(json.dumps(aufnehmen(), ensure_ascii=False, indent=1))
