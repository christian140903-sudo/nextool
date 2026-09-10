"""Vorhersagen: Brier = (Konfidenz − Ausgang)², Fälligkeit über die Zeitrechnung, fünf Eimer, Filter."""
import pytest

from core import bus
from core.memory import predict
from core.memory.predict import PredictError


def test_predict_und_resolve_rechnen_brier():
    hoch = predict.predict("Der Test läuft grün.", 0.9, domain="tests", model_id="haiku")
    tief = predict.predict("Der Build bricht.", 0.9, domain="tests", model_id="haiku")
    offen = predict.get(hoch)
    assert offen["claim"] == "Der Test läuft grün." and offen["confidence"] == 0.9
    assert offen["resolved_at"] is None and offen["outcome"] is None and offen["brier"] is None
    treffer = predict.resolve(hoch, True)
    fehlschlag = predict.resolve(tief, False)
    assert treffer["outcome"] == 1 and treffer["brier"] == pytest.approx(0.01)
    assert fehlschlag["outcome"] == 0 and fehlschlag["brier"] == pytest.approx(0.81)
    assert treffer["resolved_at"] and fehlschlag["resolved_at"]
    assert predict.brier(0.5, True) == pytest.approx(0.25)


def test_fail_closed_bei_ungueltiger_eingabe():
    with pytest.raises(PredictError, match="ohne Behauptung"):
        predict.predict("   ", 0.5)
    with pytest.raises(PredictError, match="außerhalb"):
        predict.predict("zu sicher", 1.5)
    with pytest.raises(PredictError, match="außerhalb"):
        predict.predict("negativ", -0.1)
    with pytest.raises(PredictError, match="keine Zahl"):
        predict.predict("Text", "hoch")
    with pytest.raises(PredictError, match="Fälligkeit"):
        predict.predict("wann?", 0.5, due_at="irgendwann")
    with pytest.raises(PredictError, match="Keine Vorhersage"):
        predict.resolve("gibt-es-nicht", True)
    pid = predict.predict("einmalig", 0.7)
    predict.resolve(pid, True)
    with pytest.raises(PredictError, match="bereits aufgelöst"):
        predict.resolve(pid, False)
    assert predict.get(pid)["outcome"] == 1  # der erste Ausgang bleibt stehen


def test_due_liefert_nur_faellige_unaufgeloeste():
    gestern = predict.predict("fällig gestern", 0.6, due_at="2026-09-07")
    heute = predict.predict("fällig heute Mittag", 0.6, due_at="2026-09-08T12:00:00Z")
    morgen = predict.predict("fällig morgen", 0.6, due_at="2026-09-09")
    predict.predict("ohne Fälligkeit", 0.6)
    faellig = predict.due(now="2026-09-08T12:00:00Z")
    assert [p["id"] for p in faellig] == [gestern, heute]
    assert all(p["due_at"].endswith("Z") for p in faellig)
    predict.resolve(gestern, False)
    assert [p["id"] for p in predict.due(now="2026-09-08T12:00:00Z")] == [heute]
    assert [p["id"] for p in predict.due(now="2026-09-10")] == [heute, morgen]


def test_calibration_fuenf_eimer_und_mittelwert():
    for konf, ausgang in ((0.1, False), (0.1, True), (0.5, True), (0.5, False), (0.9, True),
                          (0.9, True), (0.9, False), (1.0, True)):
        predict.resolve(predict.predict(f"k={konf}", konf), ausgang)
    predict.predict("offen", 0.3)
    kal = predict.calibration()
    assert kal["n"] == 8 and kal["unresolved"] == 1
    assert len(kal["buckets"]) == 5
    assert [b["lo"] for b in kal["buckets"]] == [0.0, 0.2, 0.4, 0.6, 0.8]
    assert [b["n"] for b in kal["buckets"]] == [2, 0, 2, 0, 4]
    leer = kal["buckets"][1]
    assert leer["mean_conf"] is None and leer["hit_rate"] is None
    oben = kal["buckets"][4]
    assert oben["mean_conf"] == pytest.approx((0.9 * 3 + 1.0) / 4)
    assert oben["hit_rate"] == pytest.approx(0.75)
    erwartet = (0.01 + 0.81 + 0.25 + 0.25 + 0.01 + 0.01 + 0.81 + 0.0) / 8
    assert kal["brier"] == pytest.approx(erwartet)


def test_calibration_filtert_domaene_und_modell_und_leer_ist_none():
    leer = predict.calibration()
    assert leer["n"] == 0 and leer["brier"] is None and len(leer["buckets"]) == 5
    assert all(b["n"] == 0 and b["hit_rate"] is None for b in leer["buckets"])
    predict.resolve(predict.predict("Mathe a", 0.9, domain="mathe", model_id="haiku"), True)
    predict.resolve(predict.predict("Mathe b", 0.9, domain="mathe", model_id="sonnet"), False)
    predict.resolve(predict.predict("Code", 0.3, domain="code", model_id="haiku"), False)
    assert predict.calibration(domain="mathe")["n"] == 2
    assert predict.calibration(domain="mathe", model_id="haiku")["brier"] == pytest.approx(0.01)
    assert predict.calibration(domain="mathe", model_id="sonnet")["brier"] == pytest.approx(0.81)
    assert predict.calibration(model_id="haiku")["n"] == 2
    assert predict.calibration(domain="physik")["n"] == 0


def test_bus_zeilen_je_mechanismus():
    pid = predict.predict("Bus", 0.8, domain="bus", contract_id="c1")
    predict.resolve(pid, True)
    predict.due()
    predict.calibration(domain="bus")
    ereignisse = {e["event"] for e in bus.tail(20, event="memory.")}
    assert {"memory.predict", "memory.resolve", "memory.predictions_due",
            "memory.calibration"} <= ereignisse
    vorhersage = bus.tail(5, event="memory.predict")[0]
    assert vorhersage["id"] == pid and vorhersage["contract_id"] == "c1"


def test_secret_in_behauptung_abgelehnt():
    with pytest.raises(PredictError, match="Secret"):
        predict.predict("Der Schlüssel sk-abcdefghijklmnopqrstuvwxyz1234 gilt noch", 0.5)
    assert predict.calibration()["unresolved"] == 0
