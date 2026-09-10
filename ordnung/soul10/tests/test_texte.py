"""Texte: kein Schweigeklausel-Muster in irgendeinem String-Literal unter core/ (AST-Scan) und in CLAUDE.md;
gemessene Texte byte-gleich zur Prüfstrecke; Betriebsanweisung ≤ 40 Zeilen, ≤ 15 Direktiven, nur Verweise
auf Befehle, die `soul` kennt; jedes Modul nennt Befund und Erz-Zeile."""
import ast
import re
import sys

import pytest

from core import cli, model, paths
from core.memory import ledger

# ARCHITEKTUR.md Abschnitt 6 (a): gemessen −66,7 pp allein, −97,3 pp auf Sonnet.
SCHWEIGEKLAUSEL = re.compile(
    r"\bstill\b|unsichtbar|nur das Ergebnis|keine Zwischenschritte|erscheint nie im Text|\bsilent|invisibl"
    r"|\bnur mit (der|dem|einer) (Zahl|Anzahl|Wort|Ergebnis)\b",
    re.IGNORECASE)
# Die eine erlaubte Form der Ausgabe-Unterdrückung ist der gemessene M2-Wortlaut („Antworte nur mit
# der Zahl" / „Antworte NUR mit der Anzahl als Zahl", 100 % sauber teilbar, 72 % Naht, 94 % ein
# Agent). Er darf nur dort stehen, wo er gemessen wurde: im Arbeiter-Systemprompt und in den drei
# Fragetexten (decompose) und im Einzelaufruf des Dirigenten (GANZ-Arm). Jede weitere Kopie fällt auf.
GEMESSENE_UNTERDRUECKUNG = {
    "core/decompose.py": ("Antworte nur mit der Zahl.", "Antworte NUR mit der Anzahl als Zahl."),
    "core/dirigent.py": ("Antworte NUR mit der Anzahl als Zahl.",),
}
HARNESS = paths.repo_root() / "bewusstsein" / "harness"
CLAUDE_MD = paths.soul10_root() / "CLAUDE.md"
DIREKTIVE = re.compile(r"^\s*\d+\.\s")
# Module ohne Befund-Zeile: nur die Paketdateien (paths.py trägt seit dem Fundament-Update beide Zeilen).
OHNE_BEFUND = {"__init__.py"}
# Verweise, die die Betriebsanweisung mindestens tragen muss (ARCHITEKTUR 5.12).
PFLICHTVERWEISE = ("soul contract new", "soul verify", "soul decompose --check", "soul remember",
                   "soul recall", "soul contract handover", "soul ring2", "soul rollback",
                   "soul contract block", "soul mandate", "soul status", "soul monitor")
# Persona- und Bewusstseins-Vokabular, Denkstruktur, Personalisierung: nichts davon (R14 Ä9, Regel 10).
VERBOTEN_IN_CLAUDE_MD = ("Persona", "Persönlichkeit", "Charakter", "Bewusstsein", "Denkstruktur",
                         "Frame", "Chriso", "Miguel", "Mac")


def _core_files():
    return sorted((paths.soul10_root() / "core").rglob("*.py"))


def _string_literals(path):
    """Alle String-Literale einer Datei: Docstrings, Konstanten, f-String-Teile, Bus-Texte."""
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            yield node.lineno, node.value


def _erlaubt(path, text):
    try:
        rel = str(path.relative_to(paths.soul10_root()))
    except ValueError:  # Datei außerhalb des Pakets (Scanner-Selbsttest): keine Ausnahme
        return False
    return any(text.strip().endswith(t) or text.strip() == t for t in GEMESSENE_UNTERDRUECKUNG.get(rel, ()))


def _treffer(path):
    return [(ln, m.group(0)) for ln, text in _string_literals(path)
            for m in [SCHWEIGEKLAUSEL.search(text)] if m and not _erlaubt(path, text)]


def _harness_module(name):
    if str(HARNESS) not in sys.path:
        sys.path.insert(0, str(HARNESS))
    return __import__(name)


# --- (a) Schweigeklausel -------------------------------------------------------------------------
def test_scanner_findet_das_muster(tmp_path):
    """Der Linter ist nicht leer: ein Modul mit Schweigeklausel würde auffallen."""
    probe = tmp_path / "verboten.py"
    probe.write_text('A = "Arbeite still"\n'
                     'B = "Gib nur das Ergebnis"\n'
                     'def f():\n    """Der Weg erscheint nie im Text."""\n'
                     'C = f"{A} is invisible"\n'
                     'D = ("keine Zwischenschritte", "unsichtbar", "silent mode")\n', encoding="utf-8")
    gefunden = [m.lower() for _, m in _treffer(probe)]
    assert gefunden == ["still", "nur das ergebnis", "erscheint nie im text", "invisibl",
                        "keine zwischenschritte", "unsichtbar", "silent"]
    sauber = tmp_path / "erlaubt.py"
    sauber.write_text('X = "stillschweigend ist kein Treffer, Stillstand auch nicht"\n', encoding="utf-8")
    assert _treffer(sauber) == []


def test_keine_schweigeklausel_in_core():
    dateien = _core_files()
    assert len(dateien) >= 20
    verstoesse = {f"{p.relative_to(paths.soul10_root())}:{ln}": m for p in dateien for ln, m in _treffer(p)}
    assert verstoesse == {}


def test_keine_schweigeklausel_in_claude_md():
    text = CLAUDE_MD.read_text(encoding="utf-8")
    assert SCHWEIGEKLAUSEL.search(text) is None


# --- (b)(c) gemessene Texte byte-gleich ----------------------------------------------------------
def test_aufwandsregel_byte_gleich_zu_arme():
    assert model.AUFWANDSREGEL == _harness_module("arme").V5_NUR_ZUTEILUNG


def test_regel_herkunft_byte_gleich_zu_suiten_gedaechtnis():
    assert ledger.REGEL_HERKUNFT == _harness_module("suiten_gedaechtnis").REGEL_HERKUNFT


def test_pruefer_wortlaut_byte_gleich_zu_arch_pruefer():
    src = (HARNESS / "mehrfach.py").read_text(encoding="utf-8")
    seg = src[src.index("def arch_pruefer"):]
    seg = seg[:seg.index("def arch_selektiv")]
    assert model.PRUEFER_SYSTEM in seg
    prompt_src = seg[seg.index("p = ("):seg.index("b = runner.call_model")]
    teile = [ast.literal_eval('"' + t + '"') for t in re.findall(r'f"((?:[^"\\]|\\.)*)"', prompt_src)]
    vorlage = "".join(teile)
    assert "{frage}" in vorlage and "{a.get('text','')}" in vorlage
    erwartet = vorlage.replace("{frage}", "F").replace("{a.get('text','')}", "V")
    assert model.pruefer_prompt("F", "V") == erwartet


# --- (d) Betriebsanweisung ----------------------------------------------------------------------
def test_claude_md_hoechstens_40_zeilen_und_15_direktiven():
    zeilen = CLAUDE_MD.read_text(encoding="utf-8").splitlines()
    assert 1 <= len(zeilen) <= 40
    direktiven = [z for z in zeilen if DIREKTIVE.match(z)]
    assert 1 <= len(direktiven) <= 15


def test_claude_md_verweist_nur_auf_befehle_die_soul_kennt():
    text = CLAUDE_MD.read_text(encoding="utf-8")
    for verweis in PFLICHTVERWEISE:
        assert verweis in text, verweis
    genannt = set(re.findall(r"`soul ([a-z0-9-]+)", text))
    assert genannt and genannt <= set(cli.command_names())
    unteraktionen = set(re.findall(r"`soul contract ([a-z]+)", text))
    assert unteraktionen <= {"new", "show", "list", "deliver", "block", "handover"}


def test_claude_md_reihenfolge_ohne_persona_und_denkstruktur():
    text = CLAUDE_MD.read_text(encoding="utf-8")
    for wort in VERBOTEN_IN_CLAUDE_MD:
        assert re.search(r"\b" + re.escape(wort) + r"\b", text) is None, wort
    # Reihenfolge nach ARCHITEKTUR 5.12: Rolle, Vertrag, Prüfer, Zerlegung, Gedächtnis, Rückweg,
    # Ebenen, Ring 2, ehrliche Ausgänge.
    marken = ["Dirigent", "soul contract new", "soul verify", "soul decompose --check", "soul remember",
              "soul rollback", "soul contract handover", "soul ring2", "soul contract block"]
    positionen = [text.index(m) for m in marken]
    assert positionen == sorted(positionen)
    assert "Zustimmung" in text and "Sichtbarkeit" in text and "Deutsch" in text


# --- Regel 8: Befund und Erz-Zeile in jedem Modul --------------------------------------------------
@pytest.mark.parametrize("pfad", [p for p in _core_files() if p.name not in OHNE_BEFUND],
                         ids=lambda p: str(p.relative_to(paths.soul10_root() / "core")))
def test_modul_docstring_nennt_befund_und_erz(pfad):
    doc = ast.get_docstring(ast.parse(pfad.read_text(encoding="utf-8"))) or ""
    befund = re.search(r"^Befund: (?P<text>.*?)^Erz → Gold: ", doc, re.MULTILINE | re.DOTALL)
    assert befund, "Befund-Zeile und Erz-Zeile fehlen oder stehen in falscher Reihenfolge"
    assert re.search(r"\d", befund.group("text")), "Befund ohne Zahl"
