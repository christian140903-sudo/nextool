"""Bestandsaufnahme: Funktionen byte-gleich zum Original, Profil ohne Geheimniswerte,
EINE Ring-2-Nachricht mit jeder offenen Frage genau einmal."""
import ast
import json
import re

from core import bus, inventory, paths

SECRET = re.compile(
    r"(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_\-]{20,}|ghp_[A-Za-z0-9]{20,}"
    r"|xox[bpars]-[A-Za-z0-9\-]+|eyJ[A-Za-z0-9_\-]{20,})"
)
SCHWEIGEKLAUSEL = re.compile(
    r"\bstill\b|unsichtbar|nur das Ergebnis|keine Zwischenschritte|erscheint nie im Text|\bsilent|invisibl", re.I)
FAKE_KEYS = {
    "ANTHROPIC_API_KEY": "sk-ant-api03-" + "A" * 40,
    "OPENAI_API_KEY": "sk-" + "b" * 40,
    "GITHUB_TOKEN": "ghp_" + "C" * 36,
    "AWS_ACCESS_KEY_ID": "AKIA" + "D" * 16,
}
UEBERNOMMEN = ("_sh", "_ver", "geraet", "grafik", "werkzeuge", "zugaenge",
               "lokale_modelle", "empfehlung", "offene_fragen", "aufnehmen")


def _schnell(monkeypatch):
    """werkzeuge() ruft ~40 Programme auf; Tests ohne Bezug dazu bekommen einen festen Wert."""
    monkeypatch.setattr(inventory, "werkzeuge", lambda: {"ki_clis": {"claude": "2.1"}, "laufzeiten": {}})


def _zugaenge(*, keys=False, claude=False, codex=False):
    return {"umgebungsvariablen": {"ANTHROPIC_API_KEY": keys, "OPENAI_API_KEY": False},
            "konfigurationen": {"claude": claude, "codex": codex, "ollama_modelle": False},
            "hinweis": "Nur Vorhandensein geprueft. Es wurde kein Wert gelesen."}


def _profil(*, keys=False, claude=False, ollama=False, ram=8.0):
    """Ein Profil von Hand, ohne Bestandsaufnahme — die Nachricht hängt nur am Profil."""
    g = {"system": "Linux", "release": "6", "maschine": "x86_64", "python": "3.11", "ram_gb": ram,
         "cpu_kerne": 4, "cpu": "Test", "platz_frei_gb": 10.0}
    gr = {"nvidia": None, "vram_gb": None, "apple_gpu": None}
    z = _zugaenge(keys=keys, claude=claude)
    lm = {"ollama": True, "modelle": ["llama3:8b"]} if ollama else {"ollama": False}
    return {"geraet": g, "grafik": gr, "werkzeuge": {}, "lokale_modelle": lm, "zugaenge": z,
            "empfehlung": inventory.empfehlung(g, gr), "offene_fragen": inventory.offene_fragen(z, lm),
            "user": {"name": None, "language": "de"}, "identity_name": None, "own_remotes": ["origin"],
            "consent": {"given": False, "at": None, "ring2": []}, "written_at": "2026-09-08T00:00:00Z"}


# --- Übernahme -------------------------------------------------------------------------------------
def test_funktionen_byte_gleich_zum_original():
    original = (paths.repo_root() / "bewusstsein" / "werkzeuge" / "bestandsaufnahme.py").read_text(encoding="utf-8")
    eigen = (paths.soul10_root() / "core" / "inventory.py").read_text(encoding="utf-8")

    def funktionen(src):
        return {n.name: ast.get_source_segment(src, n) for n in ast.parse(src).body
                if isinstance(n, ast.FunctionDef)}
    o, e = funktionen(original), funktionen(eigen)
    for name in UEBERNOMMEN:
        assert e[name] == o[name], name
    # die Sicherheitsregel steht im Code, nicht im Vorsatz
    assert "Werte werden nie gelesen oder ausgegeben" in ast.get_docstring(
        next(n for n in ast.parse(eigen).body if isinstance(n, ast.FunctionDef) and n.name == "zugaenge"))


# --- Profil --------------------------------------------------------------------------------------------
def test_profil_wird_geschrieben_und_gelesen(monkeypatch):
    _schnell(monkeypatch)
    assert inventory.load_profile() is None
    p = inventory.write_profile(name="Chriso", language="de", identity_name="Miguel")
    assert paths.profile_file().exists()
    geladen = inventory.load_profile()
    assert geladen == p
    assert geladen["user"] == {"name": "Chriso", "language": "de"}
    assert geladen["identity_name"] == "Miguel"
    assert geladen["own_remotes"] == ["origin"]
    assert geladen["consent"] == {"given": False, "at": None, "ring2": []}
    assert geladen["written_at"] and geladen["geraet"]["system"]
    for k in ("geraet", "grafik", "werkzeuge", "lokale_modelle", "zugaenge", "empfehlung", "offene_fragen"):
        assert k in geladen
    rec = bus.tail(1, "inventory.profile")[0]
    assert rec["path"] == str(paths.profile_file()) and rec["own_remotes"] == ["origin"]


def test_keine_geheimniswerte_im_profil(monkeypatch):
    for k, v in FAKE_KEYS.items():
        monkeypatch.setenv(k, v)
    p = inventory.write_profile()                       # echte Bestandsaufnahme, echte Umgebung
    text = paths.profile_file().read_text(encoding="utf-8")
    for k, v in FAKE_KEYS.items():
        assert v not in text, k
        assert p["zugaenge"]["umgebungsvariablen"][k] is True
    assert SECRET.search(text) is None
    assert p["zugaenge"]["hinweis"].startswith("Nur Vorhandensein")
    assert SECRET.search(paths.bus_file().read_text(encoding="utf-8")) is None


def test_erneute_aufnahme_loescht_keine_zustimmung(monkeypatch):
    _schnell(monkeypatch)
    inventory.write_profile(name="Chriso")
    prof = inventory.load_profile()
    prof["own_remotes"] = ["origin", "meinfork"]
    prof["consent"] = {"given": True, "at": "2026-09-08T00:00:00Z", "ring2": ["abo"]}
    paths.profile_file().write_text(json.dumps(prof), encoding="utf-8")
    p2 = inventory.write_profile()
    assert p2["own_remotes"] == ["origin", "meinfork"]
    assert p2["consent"] == {"given": True, "at": "2026-09-08T00:00:00Z", "ring2": ["abo"]}
    assert p2["user"]["name"] == "Chriso" and p2["written_at"] >= prof["written_at"]


def test_load_profile_bei_fehlender_oder_kaputter_datei():
    assert inventory.load_profile() is None
    paths.profile_file().write_text("{kaputt", encoding="utf-8")
    assert inventory.load_profile() is None
    paths.profile_file().write_text("[1, 2]", encoding="utf-8")
    assert inventory.load_profile() is None


# --- Ring 2: eine Nachricht ---------------------------------------------------------------------
def test_ring2_enthaelt_jede_offene_frage_genau_einmal():
    profil = _profil()
    fragen = profil["offene_fragen"]
    assert len(fragen) == 4                      # keine Schlüssel, keine CLI, kein Ollama, Kostendeckel
    text = inventory.ring2_message(profil)
    for f in fragen:
        assert text.count(f) == 1, f
    assert text.rstrip().endswith(inventory.RING2_SCHLUSS)
    assert text.count("# Einrichtung") == 1      # eine Nachricht, eine Überschrift
    assert bus.tail(1, "inventory.ring2")[0]["fragen"] == 4


def test_ring2_empfehlungen_mit_was_warum_ohne():
    text = inventory.ring2_message(_profil())
    for titel in ("- Abo", "- Schlüssel", "- Lokales Modell"):
        assert text.count(titel) == 1
    assert text.count("Was:") == 3 and text.count("Warum:") == 3 and text.count("Ohne:") == 3
    assert "Antworten sind optional" in text
    assert SCHWEIGEKLAUSEL.search(text) is None


def test_ring2_passt_sich_dem_profil_an():
    voll = _profil(keys=True, claude=True, ollama=True, ram=80.0)   # 60 % von 80 GB = 48 GB → 70B-Stufe
    text = inventory.ring2_message(voll)
    assert len(voll["offene_fragen"]) == 1 and "Kostendeckel" in text
    assert "vorhanden: claude" in text and "Ollama ist da (1 Modelle)" in text
    assert "70B (Q4)" in text
    assert text.count("Was:") == 3 and text.rstrip().endswith(inventory.RING2_SCHLUSS)
