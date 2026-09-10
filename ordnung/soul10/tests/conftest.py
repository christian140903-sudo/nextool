"""Testgrundlage: frischer Zustandsbaum je Test, Fake-Modell, kein Netz.

SOUL10_HOME zeigt auf tmp_path; model.FAKE liefert "42". Tests, die anderes Verhalten
brauchen, setzen monkeypatch.setattr(model, "FAKE", eigene_funktion).
"""
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core import model  # noqa: E402


def _fake_default(system, user, **kw):
    return {"ok": True, "text": "42", "output_tokens": 1}


@pytest.fixture(autouse=True)
def _frischer_zustand(tmp_path, monkeypatch):
    monkeypatch.setenv("SOUL10_HOME", str(tmp_path / "soul10-home"))
    monkeypatch.setattr(model, "FAKE", _fake_default)
    yield


@pytest.fixture
def fake_model(monkeypatch):
    """Setzt eine Antwortliste: fake_model(["7", "9"]) liefert nacheinander 7, dann 9, dann 9 ..."""
    def _setzen(antworten):
        rest = list(antworten)
        aufrufe = []

        def _fake(system, user, **kw):
            aufrufe.append({"system": system, "user": user, **kw})
            text = rest.pop(0) if len(rest) > 1 else (rest[0] if rest else "")
            return {"ok": True, "text": text, "output_tokens": len(text)}

        monkeypatch.setattr(model, "FAKE", _fake)
        return aufrufe
    return _setzen
