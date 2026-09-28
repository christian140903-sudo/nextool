# Architektur Soul 10 — Dateibaum, Schnittstellen, Regeln für den Bau

*Stand 2026-09-07. Verbindliche Vorgabe für jeden Bau-Agenten. Was hier steht, wird so
gebaut; wer abweichen muss, meldet die Abweichung im Rückgabewert, statt still zu bauen.
Die Begründung jeder Entscheidung steht in `ENTSCHEIDUNG.md`; die Zahlen in
`bewusstsein/uebergabe/01-BEFUNDE.md`.*

---

## 1. Dateibaum

```
ordnung/soul10/
  ENTSCHEIDUNG.md            # warum (liegt vor)
  ARCHITEKTUR.md             # diese Datei
  README.md                  # was es ist, was gemessen ist, wie man es startet (Phase Doku)
  CLAUDE.md                  # Betriebsanweisung für den Dirigenten (≤ 40 Zeilen, ≤ 15 Direktiven)
  bin/soul                   # POSIX sh → python3 core/cli.py
  bin/soul.cmd               # Windows
  .claude/settings.json      # Hooks
  .claude/hooks/hook.py      # dünner Zeiger auf core/events.py
  core/__init__.py
  core/paths.py              # (liegt vor) Zustandsbaum, IDs, Zeit — alles lazy
  core/bus.py                # (liegt vor) Ereignis-Bus JSONL, Maskierung, Rotation
  core/model.py              # (liegt vor) Adapter auf `claude -p`, Fake-Modus, gemessene Texte, Abgriff
  core/memory/__init__.py
  core/memory/ledger.py      # Schema, Guards, remember, Zustandsübergänge, render, Hash-Kette
  core/memory/recall.py      # Suche, Rang, Briefing, Ebenen-Sicht
  core/memory/retract.py     # Rückbau von Einträgen, Quarantäne-Propagation
  core/memory/predict.py     # Vorhersagen, Auflösung, Brier
  core/memory/consolidate.py # Takt A (Inbox → Episoden), Takt B (Dubletten, Widerspruch, Retention)
  core/memory/selfmodel.py   # Selbstmodell aus Episoden mit Belegschwelle
  core/probes.py             # Probentypen, Validierung, Ausführung
  core/contract.py           # Vertrag als Datei, Probenpflicht, Urteil nur per Quittung
  core/verifier.py           # Sprosse 1 deterministisch, Sprosse 2 eigene Instanz, Quittung
  core/decompose.py          # Nahtprüfung, Nahtprotokoll, mechanische Zusammenführung
  core/switch.py             # Vorfilter (signals-Port), Entropie-Sonde, Stufe, Routing-Log
  core/rollback.py           # Rückbau-Konto für Handlungen, Rückbauquote
  core/inventory.py          # Bestandsaufnahme (übernommen), Profil, gebündelte Ring-2-Nachricht
  core/guard.py              # Ausnahmeliste (aus SOUL übernommen, profilgesteuert)
  core/events.py             # Hook-Handler
  core/dirigent.py           # die Schleife als Code
  core/cli.py                # `soul <befehl>`
  tests/conftest.py          # (liegt vor) SOUL10_HOME → tmp, Fake-Modell
  tests/test_*.py            # je Modul eine Datei
  eval/README.md             # Verweis auf bewusstsein/harness als Prüfstrecke; M3-Skript
```

Zustand zur Laufzeit liegt **nie** im Repo, sondern unter `SOUL10_HOME`
(Standard `~/.soul10`), siehe `core/paths.py`.

---

## 2. Regeln für jedes Modul

1. **Python 3.11, nur Standardbibliothek.** Kein pip, kein Netz in Tests, kein Modellaufruf
   in Tests (Fake über `core.model.FAKE`, siehe conftest).
2. **Pfade nur über `core.paths`, lazy.** Kein Modul berechnet Pfade beim Import; alles
   über Funktionen (`paths.home()`, `paths.db()` …), damit Tests `SOUL10_HOME` setzen können.
3. **Modellaufrufe nur über `core.model.call`.** Nirgends direkt `subprocess claude`.
4. **Kein DELETE im Hauptbuch.** Zustandsübergänge nur über `ledger.transition`.
5. **Fail-open beim Loggen, fail-closed beim Guard.** Ein kaputter Bus hält nichts an;
   ein Guard-Treffer ohne Mandat blockiert.
6. **Keine Schweigeklausel** in irgendeinem modellgerichteten Text: nicht „still", nicht
   „unsichtbar", nicht „nur das Ergebnis", nicht „keine Zwischenschritte", nicht
   „erscheint nie im Text". Gemessen: −66,7 pp. `tests/test_texte.py` prüft das.
7. **Gemessene Texte byte-gleich.** `model.AUFWANDSREGEL` == `bewusstsein/harness/arme.py:V5_NUR_ZUTEILUNG`;
   `ledger.REGEL_HERKUNFT` == `suiten_gedaechtnis.REGEL_HERKUNFT`; `model.PRUEFER_SYSTEM`
   und `model.pruefer_prompt()` == Wortlaut aus `mehrfach.arch_pruefer`. Tests vergleichen.
8. **Modul-Docstring** nennt in zwei Zeilen den Befund (`Befund: …` mit Zahl und Quelle)
   und die Erz-Zeile (`Erz → Gold: …` — was das Original wollte, wo es stehen blieb, was
   hier anders ist). Kommentare und Docstrings deutsch, Bezeichner englisch oder deutsch,
   aber konsistent je Modul.
9. **Jeder Mechanismus schreibt eine Bus-Zeile** (`bus.emit`), sonst gilt er als tot.
10. **Namen sagen, was der Code tut**, nicht, was er verspricht. Kein Bewusstseins-Vokabular.
11. **Nur die eigenen Dateien anfassen.** `paths.py`, `bus.py`, `model.py`, `conftest.py`
    werden nicht verändert; wer dort etwas braucht, meldet es im Rückgabewert.
12. **Kein `git commit`.** Der Orchestrator committet.

---

## 3. Fundament (liegt vor — nur lesen)

### `core/paths.py`
```python
home() -> Path                 # $SOUL10_HOME oder ~/.soul10; legt an: state/, state/contracts/,
                               # state/receipts/, inbox/, rollback/, watch/
db() -> Path                   # home()/memory.db
ledger_file() -> Path          # home()/ledger.jsonl
bus_file() -> Path             # home()/watch/events.jsonl
routing_file() -> Path         # home()/watch/routing.jsonl
rollback_file() -> Path        # home()/state/rollback.jsonl
profile_file() -> Path         # home()/profile.json
snapshot_file() -> Path        # home()/state/snapshot.json
mandate_file() -> Path         # home()/state/mandate.json
contracts_dir(), receipts_dir(), inbox_dir(), rollback_dir() -> Path
soul10_root() -> Path          # ordnung/soul10 (Repo-Pfad des Codes)
repo_root() -> Path            # das nextool-Repo (für Tests, die die Prüfstrecke lesen)
now_iso() -> str               # UTC, Sekunden, z. B. 2026-09-07T21:30:00Z
today() -> str                 # YYYY-MM-DD (UTC)
new_id(prefix: str = "") -> str  # zeitlich sortierbar: <ms seit Epoche 13-stellig>-<6 hex>
sha256_text(text: str) -> str
parse_iso(text: str) -> datetime    # UTC-bewusst; akzeptiert '…Z', Offsets, reines Datum — EINE Stelle für Zeitrechnung
days_between(a_iso: str, b_iso: str) -> float   # b − a in Tagen
```

### `core/bus.py`
```python
emit(event: str, **fields) -> None   # JSONL {"ts", "event", **fields}; maskiert Secret-Muster;
                                     # Rotation ab 5 MB; fail-open
tail(n: int = 50, event: str|None = None) -> list[dict]   # event filtert per Präfix, z. B. 'contract.'
```

### `core/model.py`
```python
DEFAULT_MODEL = "claude-haiku-4-5-20251001"
FAKE: Callable[[str|None, str], dict] | None   # Tests setzen das (conftest tut es)
call(system: str|None, user: str, *, model: str|None = None, thinking: int|None = 0,
     timeout: int = 300, max_retries: int = 3) -> dict
     # {"ok": bool, "text": str, "output_tokens": int, "model": str, "error": str|None}
extract_last_number(text: str) -> float|None      # deutsche und englische Dezimalschreibweise
extract_last_line(text: str) -> str
AUFWANDSREGEL: str            # byte-gleich V5_NUR_ZUTEILUNG
PRUEFER_SYSTEM: str           # "Du bist ein unabhaengiger Pruefer. Du uebernimmst nichts ungeprueft."
pruefer_prompt(aufgabe: str, vorschlag: str) -> str   # Wortlaut aus mehrfach.arch_pruefer
```

### `tests/conftest.py`
Setzt vor jedem Test `SOUL10_HOME` auf ein frisches `tmp_path`, setzt `model.FAKE` auf
einen Fake, der `"42"` liefert (überschreibbar per `monkeypatch.setattr(model, "FAKE", …)`),
und fügt `ordnung/soul10` dem `sys.path` hinzu. Tests importieren `from core import …`.

---

## 4. Säule 1 — `core/memory/`

### 4.1 `ledger.py`

**Befund:** Gedächtnis +68,3 pp; flach vergiftet 0,0 % richtig / 73,3 % falsch; Etikett am
Eintrag 95,0 %, Regel allein 1,7 %. **Erz → Gold:** SOUL `core/memory.py` (eine Tabelle,
3 Status, Zitatpflicht, Secret-Guard, FTS5) → Schema mit Herkunft, Vertrauen, Zeit,
Widerspruch, Verfall, Ableitung; Zustandsübergänge in einer Funktion; Hash-Kette.

Konstanten:
```python
KINDS   = ("episode","fact","procedure","self","user","rejected","prediction","retraction","contract","harvest")
STATUS  = ("candidate","active","superseded","disputed","quarantined","retracted","archived")
SOURCES = {"nutzer": 0.8, "werkzeug": 0.9, "dokument": 0.7, "eigener_schluss": 0.4, "import": 0.3, "extern": 0.3}
TTL     = ("durable","seasonal","short","conditional")   # conditional: expires_when ist Prosa für den Leser, kein Code wertet sie aus
VISIBILITY = ("public","private","never")
TRANSITIONS = {  # (von, nach) — alles andere ist LedgerError
  ("candidate","active"), ("candidate","archived"), ("candidate","quarantined"), ("candidate","retracted"),
  ("active","superseded"), ("active","disputed"), ("active","archived"), ("active","quarantined"), ("active","retracted"),
  ("disputed","active"), ("disputed","superseded"), ("disputed","retracted"), ("disputed","quarantined"),
  ("archived","active"), ("archived","retracted"),
  ("quarantined","active"), ("quarantined","retracted"),
  ("superseded","retracted"),
}
REGEL_HERKUNFT: str   # byte-gleich zu suiten_gedaechtnis.REGEL_HERKUNFT
```

Tabelle `memories` (SQLite, WAL): `id TEXT PK, kind, status, title, body, tags (JSON), source,
source_ref, trust REAL, importance INT, valid_from, valid_to, recorded_at, retired_at,
last_accessed, access_count INT, strength REAL, ttl_class, expires_at, expires_when,
derived_from (JSON), supersedes, disputes, mission_id, level INT, agent, visibility,
session_id, model_id`. FTS5 `memories_fts(title, body, tags)` mit Triggern wie in SOUL.
Nebentabellen: `predictions(id, claim, confidence, domain, model_id, due_at, resolved_at,
outcome INT, brier REAL, contract_id, created_at)`, `retractions(id, target_id, reason, by,
at, contaminated_ids JSON)`, `access_log(memory_id, session_id, at, via)`.
`ledger.jsonl`: je Schreiboperation `{op, id, at, by, prev_hash, hash}`; `hash =
sha256(prev_hash + kanonisches JSON der Zeile ohne hash)`.

Funktionen:
```python
class LedgerError(ValueError)
connect() -> sqlite3.Connection           # legt Schema an; row_factory = Row
remember(title: str, body: str, *, source: str, kind: str = "fact", source_ref: str = "",
         trust: float|None = None, importance: int = 3, tags: Iterable[str] = (),
         valid_from: str|None = None, valid_to: str|None = None, ttl_class: str = "durable",
         expires_at: str|None = None, expires_when: str|None = None,
         derived_from: Iterable[str] = (), supersedes: str|None = None,
         mission_id: str = "", level: int = 1, agent: str = "", visibility: str = "private",
         session_id: str = "", model_id: str = "", status: str = "active") -> str
```
Guards in `remember` (Reihenfolge, jede mit eigener Fehlermeldung):
1. `source` fehlt oder nicht in SOURCES → `LedgerError("Eintrag ohne Herkunft abgelehnt")`.
2. `source in ("nutzer","werkzeug")` und `source_ref` leer → LedgerError (Zitat- bzw. Werkzeugpflicht).
3. `kind`/`status`/`ttl_class`/`visibility` ungültig → LedgerError.
4. `body` > 16 KB → LedgerError. Secret-Muster (Regex aus SOUL) in title/body → LedgerError.
5. Imperativ an das System selbst aus fremder Quelle — jede Quelle außer `nutzer` und
   `eigener_schluss`, also `werkzeug`/`dokument`/`import`/`extern` (Regex, mind.:
   `\b(ignoriere|vergiss|du musst|ab jetzt|override|ignore (all|previous)|disregard)\b`, case-insensitive)
   → LedgerError("Anweisung an mich selbst aus fremder Quelle abgelehnt").
6. `source in ("extern","dokument","import")` → `status` wird auf `"candidate"` gezwungen (Quarantäne vor Aktivierung).
7. `kind == "self"` → `status` wird auf `"candidate"` gezwungen (das Selbst wird nie direkt aktiv).
8. `trust` None → Startwert aus SOURCES; sonst auf [0.05, 0.95] begrenzt und zusätzlich auf
   `TRUST_MAX[source]` — ein `eigener_schluss` mit 0,95 wird abgelehnt, nicht stillschweigend gekappt.
9. `supersedes` gesetzt → der alte Eintrag wird per `transition(alt, "superseded")` abgelöst,
   `retired_at` und `valid_to` = jetzt; der neue trägt `supersedes = alt`. Abgelöst wird nur in
   Herkunftsordnung: der neue Eintrag muss aktiv werden, `SOURCE_RANK` darf nicht darunter liegen
   und das Vertrauen nicht geringer sein — sonst LedgerError. Geburtsstatus nur `active` oder
   `candidate`; jeder andere Zustand entsteht über `transition`.
10. Schreibt Zeile in `ledger.jsonl` und `bus.emit("memory.remember", id=…, kind=…, source=…)`.

```python
get(id: str) -> dict|None                          # tags/derived_from als Listen
transition(id: str, new_status: str, *, reason: str = "", by: str = "system") -> dict
    # DIE eine Funktion für Zustandsübergänge. Illegal → LedgerError. Setzt retired_at bei
    # superseded/retracted/archived; ledger.jsonl; bus.emit("memory.transition", …)
dispute(id_a: str, id_b: str, *, reason: str) -> None   # beide → disputed, disputes verweist aufeinander
render(entry: dict) -> str
    # f"[{datum}] [Quelle: {source}] [Vertrauen: {trust_de}] {text}"
    # datum = valid_from[:10] falls gesetzt, sonst recorded_at[:10]; trust_de = f"{trust:.1f}".replace(".", ",")
    # text = body, falls body leer: title. Genau dieses Format ist gemessen (95,0 %).
render_many(entries: list[dict]) -> str            # eine Zeile je Eintrag
touch(id: str, *, session_id: str = "", via: str = "search") -> None
    # last_accessed, access_count += 1, strength += 1.0, access_log-Zeile
stats() -> dict                                    # gesamt, je status, je kind, je source
verify_chain() -> bool                             # Hash-Kette von ledger.jsonl intakt; ein fehlender
                                                   # Kopfanker (state/ledger.head) gilt nur bei leerer Kette als heil
verify_state() -> dict                             # {"ok", "geprueft", "abweichend": [ids], "unbelegt": [ids]}
                                                   # Zustandshash je Eintrag gegen die Kette UND Gegenzähler: jede
                                                   # Zeile in memories braucht eine Kettenzeile mit row_hash.
                                                   # Abrufzähler (last_accessed, access_count, strength) stehen nicht
                                                   # im Zustandshash (touch schreibt keine Kettenzeile), sondern
                                                   # werden über strength == 7*importance + access_count geprüft
check_secrets(*texte) -> None                      # Secret-Muster in irgendeinem Feld → LedgerError
```

Tests (≥ 15): jeder Guard (je ein Test), Rendering byte-genau gegen die Vorlage aus
`suiten_gedaechtnis._eintrag_herkunft("Text", "2026-08-14", "nutzer", "0,8")`, Supersession
setzt valid_to/retired_at, illegale Übergänge, dispute beidseitig, Hash-Kette intakt und
Manipulation erkannt, REGEL_HERKUNFT byte-gleich, self → candidate, extern → candidate,
FTS-Suche über Umlaute-freie Tokens.

### 4.2 `recall.py`

**Befund:** Rauschen n.s. bei 12/60/200 Einträgen → Rang statt Vektoren.

```python
retention(entry: dict, now: str|None = None) -> float     # exp(-Δtage / max(strength, 1.0))
search(query: str, *, limit: int = 8, status: Iterable[str] = ("active",), kinds: Iterable[str]|None = None,
       min_trust: float = 0.0, mission_id: str|None = None, session_id: str = "") -> list[dict]
    # FTS5 mit gequoteten Tokens (SOUL-Muster), Rang = (1/(1+bm25)) * trust * (0.5 + 0.5*retention) * (1 + 0.1*importance);
    # touch() je Treffer; bus.emit("memory.search", n=…). status nur aus LADBARE_STATUS (active, candidate,
    # archived, disputed, superseded): retracted/quarantined wird nie geladen, nie berührt (Bus status_verweigert).
briefing(*, max_lines: int = 60, level: int = 1, extra_sections: list[tuple[str, list[str]]] = (),
         with_rule: bool = True, name: str|None = None) -> str
    # Reihenfolge: Kopfzeile "# Soul-10-Briefing (<datum>)"; Selbstmodell-Kurzform (≤ 10 Zeilen,
    # aus selfmodel.render — lazy import, bei ImportError weglassen); extra_sections (z. B. offene
    # Verträge, offene Rückbau-Posten — vom Aufrufer übergeben); Top-Einträge nach Rang (active,
    # retention ≥ 0.3, visibility != never) mit ledger.render; zum Schluss REGEL_HERKUNFT (with_rule).
    # NIE mehr als max_lines Zeilen; kürzt zuerst die Einträge, nie die Regel.
level_view(level: int, *, mission_id: str|None = None, max_lines: int = 15) -> str
    # level 1: briefing(); level 2: Kurzidentität (≤ 5) + Einträge der Mission;
    # level ≥ 3: nur fact/procedure/contract der Mission, kein self, kein user, keine Regel-Erklärung nötig
```
Tests (≥ 6): Briefing ≤ 60 Zeilen bei 200 Einträgen, Regel steht drin, Etikett steht in
jeder Eintragszeile, `never`-Einträge fehlen, Ebene 3 enthält kein `self`, Rang bevorzugt
höheres Vertrauen bei gleichem Text.

### 4.3 `retract.py`
```python
retract(id: str, *, reason: str, by: str = "nutzer") -> dict
    # transition(id, "retracted"); alle Einträge, deren derived_from id enthält, rekursiv → quarantined;
    # retractions-Zeile; bus; Rückgabe {"target": id, "contaminated": [ids]}
contamination_share() -> float     # G5: Anteil quarantinierter Kinder aller retracted Einträge (Ziel 1.0)
```
Tests (≥ 4): Kette A→B→C, retract(A) quarantiniert B und C; unbeteiligte bleiben; Anteil 1.0.

### 4.4 `predict.py`
```python
predict(claim: str, confidence: float, *, domain: str = "allgemein", model_id: str = "",
        due_at: str|None = None, contract_id: str|None = None) -> str
resolve(id: str, outcome: bool) -> dict            # brier = (confidence - int(outcome))**2
due(now: str|None = None) -> list[dict]
calibration(*, domain: str|None = None, model_id: str|None = None) -> dict
    # {"n", "brier", "buckets": [{"lo","hi","n","mean_conf","hit_rate"}]}  (5 Eimer)
```
Tests (≥ 4).

### 4.5 `consolidate.py`
```python
inbox_write(session_id: str, record: dict) -> None       # inbox/<session_id>.jsonl (Hooks schreiben hier);
    # setzt `at` (Schreibzeit) und `line_id` (paths.new_id()), falls sie fehlen — die Zeilen-ID trägt die Idempotenz
takt_a(session_id: str) -> dict
    # Inbox → Einträge kind="episode", source="werkzeug", source_ref=f"{tool}:{args_hash}", status active,
    # ttl_class "short", expires_at +14 Tage; danach Inbox-Datei nach inbox/verarbeitet/ verschieben.
    # Kein Modellaufruf. Jede Zeile einzeln: Guard → "abgelehnt", anderer Fehler → "fehler" (Bus-Zeile),
    # schon verbucht (Zeilen-ID `line_id` der Inbox, am Eintrag als Tag `inbox:<id>`; Zeilen ohne ID: Sitzung,
    # Verweis, Ereigniszeit, Inhalt) → "uebersprungen"; die Datei wandert immer. Ein Werkzeugverweis im
    # Namensraum der Steuerung (`consolidate:takt_b:`) wird als "abgelehnt" zurückgewiesen.
    # Rückgabe {"episoden", "abgelehnt", "unlesbar", "uebersprungen", "fehler", "ids"}
takt_b(now: str|None = None) -> dict
    # (1) Dubletten: candidate mit identischem normalisiertem Titel+Body wie ein active → candidate archived (Grund "dublette")
    # (2) Widerspruch: gleicher normalisierter Titel, anderer Body, über die Aussage-Arten hinweg gruppiert
    #     (die Art gehört nicht in den Schlüssel — sie ist ein freies Feld des Aufrufers): Arten
    #     fact/procedure/user/rejected (nie self, nie episode). Sieger = stärkster AKTIVER Eintrag in Herkunftsordnung (SOURCE_RANK, dann Vertrauen).
    #     Aktiv und schwächer → superseded; aktiv und gleich stark → dispute(); Kandidat schwächer → archived;
    #     Kandidat gleich stark oder stärker → bleibt Kandidat, Bus "memory.takt_b.kandidat_widerspricht".
    #     Nur Kandidaten: nichts. (Standfestigkeitsregel: ein Kandidat gewinnt nie, eigener_schluss löst nutzer
    #     nie ab, das Datum zählt nicht.)
    # (3) expires_at überschritten → archived (Grund "abgelaufen")
    # (4) Retention < 0.1 und keine aktiven derived_from-Kinder → archived
    # (4b) Aktivierung: Kandidaten der Aussage-Arten, ≥ KANDIDAT_FRIST_TAGE (1) alt, ohne aktiven Eintrag
    #     gleichen Titels (über die Arten hinweg; die Art entscheidet nicht, ob eine Aussage besetzt ist),
    #     untereinander einig → active (Guards laufen in transition erneut)
    # (5) Selbst-Kandidaten prüfen → selfmodel.promote_eligible()
    # Rückgabe: Zähler je Schritt; schreibt einen episode-Eintrag "Konsolidierung" mit den Zahlen
    # (visibility never: in Kette und Zählung, nicht im Briefing)
takt_b_faellig(now=None, *, intervall_stunden=6.0) -> bool   # Drossel für das Sitzungsende; liest das letzte Protokoll
letzter_takt_b() -> str|None     # jüngste Episode mit source_ref-Präfix `consolidate:takt_b:`, Titel
                                 # "Konsolidierung" und agent `consolidate` — Takt A kommt in diesen Namensraum nicht
```
Tests (≥ 6): Inbox → Episoden; Dublette; niedrigeres Vertrauen weicht; gleiches Vertrauen → disputed; Ablauf; Retention.

### 4.6 `selfmodel.py`
**Befund:** Identität aus Logs 94,0 % gegen Persona 91,9 % (Richtung stimmt, Größe nicht);
Rückgrat 7–14 % → keine Persona-Deklaration. **Erz → Gold:** SOUL.md deklarierte; hier wächst
das Selbst aus Episoden mit Zähler.
```python
evidence(entry: dict, *, vergeben: set[str] = frozenset()) -> dict   # {"episodes": n, "sessions": k} über derived_from;
    # Episoden aus `vergeben` zählen nicht — eine Episode belegt höchstens einen Zug, und diese Vergabe
    # rechnen promote_eligible UND render
promote_eligible(*, min_episodes: int = 2, min_sessions: int = 2) -> list[str]   # self-Kandidaten → active
render(*, name: str|None = None, max_lines: int = 15) -> str
    # "# Selbstmodell: <name oder 'namensoffen'>"; aktive self-Einträge mit ledger.render;
    # Kandidaten als "Hypothese über mich (Belege e/s): …"; ohne Einträge: eine Zeile "noch keine belegten Züge"
```
Tests (≥ 4).

---

## 5. Säule 3 — Durchführung

### 5.1 `probes.py`
```python
class ProbeError(ValueError)
PROBE_TYPES = ("shell", "file", "answer", "forbid")
validate(probe: dict) -> None
    # shell:  {"type":"shell","cmd":str, "expect_exit":int=0, "expect_regex":str?, "forbid_regex":str?, "timeout":int=60}
    # file:   {"type":"file","path":str, "must_exist":bool=True, "contains_regex":str?, "forbids_regex":str?}
    # answer: {"type":"answer","expected":str|number, "extract":"last_number"|"last_line"|"exact", "tolerance":float=0}
    # forbid: {"type":"forbid","path":str, "regex":str}      # Stub-Muster, z. B. TODO|NotImplemented|pass  # noqa
run(probe: dict, *, cwd: str|None = None, answer_text: str|None = None, contract_id: str|None = None) -> dict
    # {"type", "passed": bool, "detail": str, "stdout_head": str, "exit": int|None, "at": str, "token": str}
    # token = "l1:<nonce>:<HMAC-SHA256>" über Probe, Vertrag und Lauf; Schlüssel state/lauf.key unter
    # SOUL10_HOME (0600, nie im Repo). NUR run() vergibt Token; es steht auch in der probe.run-Bus-Zeile.
    # Jede Musterprüfung läuft mit harter Frist (REGEX_TIMEOUT = 5 s) in einem Kindprozess; Frist-
    # überschreitung = nicht bestanden. Dateien mit st_nlink > 1 (Hardlink) sind nicht prüfbar.
check_run_token(run: dict, probe: dict, contract_id: str|None) -> str|None   # None = gültiges Token
run_token_used(run: dict) -> bool;  spend_run_tokens(runs: list[dict]) -> None   # jedes Token nur einmal
```
Tests (≥ 6).

### 5.2 `contract.py`
**Befund:** Prüfer +20,0 pp; Auflagen als Text −15,3 bis −34,4 pp, obwohl 97,8 % ankommen.
**Erz → Gold:** SOUL `mission.py` (ein Vorhaben, Prosa-Kriterien, `not-evaluated`) → Vertragsdatei
mit typisierten Proben, Probenpflicht, Urteil nur per Quittung (R14 Ä1/N2/N5).
```python
class ContractError(ValueError)
STATUS = ("open","running","blocked","delivered","verified","failed")
new(goal: str, probes: list[dict], *, non_goals: Iterable[str] = (), inputs: Iterable[str] = (),
    budget: dict|None = None, level: int = 1, parent: str|None = None, assignee: str = "",
    mission_id: str|None = None) -> dict
    # ContractError("Auftrag ohne Abnahmeprobe abgelehnt") bei leeren Proben; probes.validate je Probe;
    # budget-Default {"turns":30,"tokens":20000,"minutes":30,"thinking":4000}; status open; verdict "not-evaluated";
    # Datei state/contracts/<id>.json; bus.emit("contract.new", …)
load(id) -> dict;  save(c: dict) -> None;  list_open() -> list[dict]   # status not in (verified, failed)
    # new() schreibt die Anker probes_sha256 und goal_sha256 (einmal, nie danach); save() vergleicht Proben
    # und Ziel gegen DIESE Anker statt gegen die Platte, verlangt für jeden Statuswechsel den deckenden
    # Log-Eintrag (start/block/deliver/set_verdict) und schreibt bus.emit("contract.save", from/to).
    # Ein Vertrag, dessen Proben oder Ziel vom Anker abweichen, ist beschädigt: nur noch als fail/failed
    # schreibbar, ohne menschlichen Eingriff nicht mehr verifizierbar.
damaged(c: dict) -> str    # "" wenn Proben und Ziel zum Anker passen, sonst der Schaden als Text
snapshot() -> dict;  restore(vorher: dict) -> list[str]   # Abbild aller Verträge / Rücknahme, je Bus-Zeile
start(id) -> dict;  block(id, reason: str) -> dict
deliver(id, *, artefacts: Iterable[str] = (), report: str = "") -> dict   # status delivered; report ist Behauptung
set_verdict(id, receipt: dict) -> dict
    # akzeptiert NUR Quittungen mit Schlüsseln {contract_id, probes_hash, contract_sha256, probe_runs
    # (nicht leer), verdict in (pass, fail), verifier {kind, model}, at, hash}; hash muss sha256 des
    # kanonischen JSON ohne "hash" sein; JEDER probe_run mit passed=True braucht ein gültiges, noch nicht
    # verbrauchtes Lauf-Token aus probes.run (fail-closed) — die Form einer Quittung beweist nichts, nur
    # ein gelaufener Probelauf tut es; sonst ContractError. pass → verified, fail → failed.
    # Kein anderer Weg setzt verdict; save() lehnt jede Änderung an verdict/receipt ab.
render_handover(id) -> str
    # kurzer Übergabetext für eine untere Ebene: Ziel; Nicht-Ziele; Eingaben; "Du siehst nicht: …";
    # die Proben als Kommandos/Erwartungen wörtlich; Budget; "Bei Blockade: melden, nicht improvisieren.
    # Ohne gelaufene Probe lautet dein Ergebnis 'nicht geprüft', nie 'fertig'."  — keine weiteren Auflagen (gemessen schädlich)
```
Tests (≥ 8): Ablehnung ohne Probe; ungültige Probe; verdict ohne Quittung unmöglich; gefälschter Hash; Lebenszyklus; Handover enthält Probenkommando.

### 5.3 `verifier.py`
**Befund:** A_PRUEFER 84,0 % bei 2,00 Aufrufen gegen SC@3 64,0 %; auf trivialen Aufgaben 100 % abgreifbar, 0 % formattreu.
```python
verify(contract_id: str, *, use_model: bool = False, model: str|None = None, thinking: int = 0,
       proposal_text: str|None = None, cwd: str|None = None, counter_voice_cmd: str|None = None) -> dict
    # Sprosse 1: alle Proben laufen (probes.run; answer-Proben mit proposal_text). Eine fehlgeschlagen → "fail".
    # Sprosse 2 (nur wenn use_model und proposal_text): check_answer(); weicht der Prüfer ab → "fail" + "korrektur".
    # counter_voice_cmd: Shell-Vorlage mit {prompt}; letzte Zeile = Zweitmeinung; wird protokolliert, entscheidet nicht allein.
    # Quittung: {"contract_id","probes_hash","contract_sha256","probe_runs","verdict",
    #            "verifier":{"kind":"deterministic"|"model"|"deterministic+model","model"}, "korrektur": str|None,
    #            "pruefer", "counter_voice", "contract_changed", "changed_contracts", "contract_damaged",
    #            "at", "hash"}; Datei state/receipts/<contract_id>-<ts>.json; contract.set_verdict; bus
    # Vor den Proben contract.snapshot(), danach contract.restore(): was eine Probe an Verträgen ändert
    # oder löscht — am geprüften wie an einem fremden —, wird zurückgenommen, steht als changed_contracts
    # in Quittung und Bus-Zeile und macht das Urteil fail.
    # counter_voice.cmd, pruefer.error und pruefer.model gehen maskiert (bus.mask) in die Quittung.
check_answer(task: str, proposal: str, *, model: str|None = None, thinking: int = 0) -> dict
    # genau der gemessene Mechanismus: model.call(PRUEFER_SYSTEM, pruefer_prompt(task, proposal));
    # {"final_text", "final_value": extract_last_number, "proposal_value", "changed": bool, "calls": 1}
```
Tests (≥ 6, mit Fake-Modell): Probe scheitert → fail ohne Modellaufruf; Prüfer korrigiert → fail mit Korrektur; Quittung gültig; Hash korrekt.

### 5.4 `decompose.py`
**Befund:** sauber teilbar 100 % gegen 89 %; Randabhängigkeit 28 % (Ursache: Naht mehrdeutig); Modell fügt zusammen 33 %.
Vorlage: `bewusstsein/harness/zerlegung.py::_teil_frage_naht` (M2 misst genau diesen Text).
```python
class DecomposeError(ValueError)
NEIGHBOR_RE, POSITION_RE, CUMULATIVE_RE, GLOBAL_RE
                                          # de/en; Nachbar (davor/danach/vorherig/unmittelbar/previous/next/adjacent/consecutive),
                                          # Position (erste/letzte/allererste/position/stelle/first/last/index),
                                          # Kumulation (bisher/kumuliert/laufend/summe bis/so far/running/cumulative/zwischensumme/median/sortier),
                                          # GLOBAL (nach der Schlussprüfung in benannte Alternativen zerlegt: decompose._GLOBAL_PARTS,
                                          # 27 Stück): Superlative und Ränge (größte, zweitkleinste, biggest, top), Anteile AN DER LISTE
                                          # (obere Hälfte, second half of the list, above the mean), Aggregate ÜBER DIE LISTE (Summe der
                                          # Liste, count of even numbers), Häufigkeit (kommt doppelt vor, occurs twice), Quantor +
                                          # Nachbarwort (alle anderen, every other), Reichweite über die Naht, Musterpositionen (jede
                                          # zweite, odd-indexed, am Ende DER LISTE) — listenweiter Bezug, nicht zerlegbar.
                                          # Wörter OHNE Bezug auf andere Listenelemente gehören NICHT dazu („Anzahl von Ziffern",
                                          # „doppelt so groß wie 20", „eine 0 am Ende", „die Hälfte von 50", „alle Zahlen in der Liste"
                                          # als bloße Anrede): gemessen 0 Fehlalarme auf 40 ausformulierten sauber teilbaren Bedingungen
                                          # bei 58 von 58 erkannten listenweiten. Jede Alternative braucht ein Beispiel, das NUR sie
                                          # trifft (Test), sonst gehört sie gelöscht.
seam_check(condition: str) -> dict        # {"classes": [...], "hits": [...], "decomposable": bool, "protocol": "none"|"naht", "reason": str, "empfehlung": "zerlegen"|"einzeln"|"nicht_zerlegbar"}
                                          # cumulative/global → decomposable False, empfehlung nicht_zerlegbar (auch nicht per force);
                                          # neighbor/position → "naht", empfehlung "einzeln" (ein Agent ist genauer, M2); sonst "none", empfehlung "zerlegen".
                                          # Die Fehlkosten sind asymmetrisch (übersehene Abhängigkeit = stille falsche Zahl): im Zweifel nicht zerlegen.
chunk_instruction(items: list, condition: str, offset: int, n_total: int, before, after) -> str
                                          # das Nahtprotokoll (Wortlaut wie in zerlegung._teil_frage_naht, Test vergleicht die drei Lesart-Zeilen)
plan(items: list, condition: str, *, parts: int, force: bool = False) -> dict
                                          # DecomposeError bei None/Nicht-Zahl in der Liste, leerer Bedingung, parts keine ganze Zahl ≥ 1;
                                          # DecomposeError wenn nicht zerlegbar (Kumulation, global); bei Protokoll "naht" ebenfalls DecomposeError,
                                          # solange force=False — GEMESSEN (M2, 2026-09-08): mit Nahtprotokoll 72,2 % gegen 33,3 % ohne, aber ein
                                          # einzelner Agent liegt bei 94 %. Regel: randabhängig → ein Agent, solange die Aufgabe in einen Kontext
                                          # passt; force=True nur, wenn sie das nicht tut (dann ist 72,2 % besser als 33,3 %). Sauber teilbar: 100 %
                                          # gegen 83–89 % → zerlegen. Rückgabe sonst {"protocol", "chunks":[{"index","offset","items","before","after","instruction"}], "merge":"sum", "empfehlung"}
merge(values: list, op: str = "sum") -> tuple   # (wert, fehlend) — mechanisch; None und bool zählen als fehlend
run(items: list, condition: str, *, parts: int, model: str|None = None, thinking: int = 0, workers: int = 5, force: bool = False) -> dict
                                          # plan → parallele model.call je Chunk → merge; bus.emit("decompose.run", protocol=…, calls=…, missing=…)
                                          # Arbeiterwert nur plausibel, wenn ganzzahlig und 0 ≤ v ≤ len(chunk.items); endet die Antwort
                                          # auf „X von N" (auch „X of N", „X out of N", „X/N"), ist N der Nenner: dann zählt X, und nur
                                          # wenn N = len(chunk.items) ist — sonst fehlend mit
                                          # bus.emit("decompose.implausible", index, items, value) — nie eine stille falsche Zahl in der Summe
                                          # {"value", "calls", "missing", "protocol", "chunks": n}
```
Tests (≥ 8): Klassifikation je Klasse (de/en), Kumulation verweigert, Chunk-Grenzen (offset/before/after) korrekt, erster/letzter Chunk markiert, merge zählt Fehlende, run mit Fake-Modell summiert.

### 5.5 `switch.py`
**Befund:** Aufwandsregel +12,4 pp auf schwer, −16,7 pp Formattreue auf trivial als Dauerschicht; Prüfer 0 % formattreu auf trivial; A_SELEKTIV hält sich zurück (2,08 Aufrufe).
**Erz → Gold:** `signals.ts` (Proto-Router ohne Test, Falsch-Positive `oder`/`besser`/`live`/`user`) → deterministischer Vorfilter mit Test und Log; die Stufe ist binär, weil nur zwei Stufen gemessen sind.
```python
SIGNALS: dict[str, re.Pattern]   # Port von signals.ts ohne die Falsch-Positiv-Wörter (R10 §2.2.4); plus "format_locked";
                                 # Allerweltswörter (team, public, patient, buy, ship, launch, api, delete, add, …) nur mit Kontext
STAKES_SIGNALS = ("irreversible", "durable", "architecture", "affects_others", "commitment", "recommendation")
FORMAT_SIGNAL = "format_locked"; SIGNAL_SCAN_HEAD = 3000; SIGNAL_SCAN_TAIL = 1500; SIGNAL_SCAN_MIDDLE = 1000
    # D017: < 50 ms auch bei 120 000 Zeichen (kalt gemessen 36 ms). Aus der MITTE kommen die Umgebungen billiger
    # Stichwörter dazu (_SCAN_KEYS: Einsatzhöhe und Formatzwang) — sonst wäre die Stufe durch bloße Platzierung von
    # Text steuerbar. Die Regexe über den vollen Text sind gemessen zu teuer (sechs Einsatzhöhe-Regexe 206 ms,
    # format_locked allein 89 ms).
prefilter(prompt: str) -> dict   # {"len", "signals": [...], "trivial": bool, "format_locked": bool, "sentences": int}
    # trivial: ≤ 200 Zeichen UND kein Signal UND höchstens ein Satz/eine Frage (Satzende an [.!?] + Leerraum, auch
    # vor Kleinbuchstaben; ein Semikolon zählt nur außerhalb von Code, Klammer, Zitat und Aufzählung und nur mit zwei
    # Wörtern je Seite; Ordinale, Abkürzungen, Datum/Version/IP/Uhrzeit/Tausendergruppen sind EINE Größe; die
    # Ordinal-Ausnahme greift nicht vor einem Satzanfang — „um 9. Wie lange dauert er?" sind zwei Sätze)
    # format_locked nur als Ausgabe-Direktive: „als/as JSON", „nur/only/valid JSON", „Antworte mit ja oder nein", „single number",
    # „number only", „nur die Antwort", „in einem Wort", „keine Erklärung", „Format: CSV" … — „JSON" als Thema ist keiner;
    # eine negierte Erklärung („erklär nichts", „do not explain") ist kein reasoning-Signal
entropy_probe(task: str, *, model: str|None = None, thinking: int = 0, n: int = 2) -> dict
    # n billige Aufrufe (model.call ohne Systemprompt); Vergleich der extract_last_number bzw. letzten Zeile
    # {"agree": bool, "values": [...], "calls": n}
decide(prompt: str, *, probe: bool = False, model: str|None = None) -> dict
    # stage "direkt"  wenn trivial, oder wenn format_locked OHNE Einsatzhöhe (kein STAKES_SIGNAL) — nichts einblenden, kein Prüfer
    # stage "aufwand" sonst (AUFWANDSREGEL einblenden; mit Formatzwang und Einsatzhöhe ebenfalls: die Regel endet im verlangten Format)
    # stage "pruefer" wenn probe=True und entropy_probe uneinig (zusätzlich Prüfer rufen)
    # Log: routing.jsonl {"ts","sha","len","signals","trivial","format_locked","stage","reason"} — NIE der Prompttext; rotiert ab 5 MB wie der Bus
    # Rückgabe {"stage", "reason", "inject": AUFWANDSREGEL oder "", "signals", "sentences", ...}; der Hook blendet nach `inject` ein
    # Die Stufe "pruefer" ist Opt-in (`soul switch --probe`, `soul run --probe-switch`); der Hook ruft ohne Sonde.
```
Tests (≥ 12, davon ein Datensatz ≥ 40 Prompts de/en mit Soll-Stufe, Trefferquote ≥ 90 %): trivial erkannt, Formatzwang erkannt, Signale ohne Falsch-Positive auf `oder`/`besser`, Log ohne Prompttext, Uneinigkeit → pruefer.

### 5.6 `rollback.py`
**Befund:** Widerrufbarkeit ist messbar, „hätte der Nutzer eingegriffen" nicht (03-OFFENE-FRAGEN Rang 5). Soul 5.0 N2.
```python
KINDS = ("install","file","config","git","command","other")
register(kind: str, description: str, *, undo: str|None, evidence: dict|None = None, contract_id: str|None = None) -> dict
    # {"id","at","kind","description","undo","needs_confirmation": undo is None, "status":"open","contract_id"}; rollback.jsonl; bus
snapshot_file(path: str) -> dict         # kopiert nach rollback/<id>/<basename>; register(kind="file", undo=<PY -c shutil.copy …>)
                                         # (Python-Einzeiler unter sys.executable, damit er auf jeder Plattform läuft);
                                         # Datei existiert nicht → undo = Löschbefehl (PY -c os.remove)
infer_from_bash(command: str, *, cwd: str|None = None) -> dict|None
    # Pfade werden BEI DER ABLEITUNG absolut gegen `cwd` verankert (Verzeichnis, in dem der Befehl läuft; `cd` in
    # der Kette wird mitgeführt). Ein cd-Ziel aus Variable oder Glob lässt sich nicht verankern → Posten ohne
    # Rückweg (Bestätigungspflicht) statt eines Befehls, der im falschen Verzeichnis löscht. Der erzeugte Einzeiler
    # fasst nur an, was im Zeitfenster des Befehls entstand (st_ctime zwischen Registrierung − 2 s und + 15 min).
    # Glieder quote-bewusst getrennt (split_segments). pip/pip3/pipx/uv install X → uninstall; npm/pnpm/yarn install|add X →
    # uninstall/remove; apt-get install → remove; brew install → uninstall; cargo install → uninstall (nur wohlgeformte
    # Paketnamen, sonst None); git commit → git revert --no-edit HEAD; mkdir [-p] P → Python-Einzeiler, der genau die neu
    # angelegten Ebenen entfernt (nichts Neues → None); cp A B → Python-Einzeiler, der B entfernt; mv A B → der B nach A
    # zurückschiebt; existiert ein Ziel schon → {"kind","description","undo": None, "overwrites": [ziele]} statt eines
    # erfundenen Rückwegs; sonst None. Rückgabe {"kind","description","undo"}
register_from_bash(command: str, *, evidence=None, contract_id=None, cwd: str|None = None) -> dict|None
    # der Weg des pre-tool-Hooks: infer_from_bash + register; das Verzeichnis der Ableitung steht als
    # evidence["cwd"] im Posten; überschriebene Datei → snapshot_file (byte-genauer
    # Rückweg), überschriebenes Verzeichnis → Posten ohne Rückweg (needs_confirmation)
argv_chain(cmd: str) -> list[list[str]]  # undo ist eine Argumentliste in Shell-Schreibweise (shlex); && und ; trennen Glieder
undo(id: str, *, dry_run: bool = False) -> dict    # führt die Glieder OHNE Shell aus (shell=False, timeout 120 je Glied),
                                         # Pipes/Umleitungen/$VAR sind Literale; status undone|undo_failed; bus
list_open() -> list[dict]
quota() -> dict                          # {"registered","with_undo","without_undo","undone_ok","undone_failed","quote": with_undo/registered}
```
Tests (≥ 8, der abgeleitete Rückweg wird AUSGEFÜHRT geprüft — Ableitung in Verzeichnis A, Rückbau aus Verzeichnis B:
in B verschwindet nichts; eine Substring-Zusicherung auf dem erzeugten Befehlsstring gilt nicht als Regressionstest):
infer je Befehlsklasse, Snapshot + Undo stellt Inhalt wieder her, ohne Undo → needs_confirmation, Quote;
Metazeichen in Paketnamen/Pfaden führen nichts aus; cp/mv über bestehendes Ziel sichert statt zu löschen.

### 5.7 `inventory.py`
Übernimmt `bewusstsein/werkzeuge/bestandsaufnahme.py` (Funktionen `geraet, grafik, werkzeuge,
zugaenge, lokale_modelle, empfehlung, offene_fragen, aufnehmen` byte-nah; Geheimnisse nur als
vorhanden/nicht vorhanden — die Regel bleibt im Code). Zusätzlich:
```python
write_profile(*, name: str|None = None, language: str = "de", identity_name: str|None = None) -> dict
    # aufnehmen() + {"user": {"name", "language"}, "identity_name", "own_remotes": ["origin"], "consent": {"given": False, "at": None, "ring2": []}, "written_at"}
    # → profile.json; bus
load_profile() -> dict|None
ring2_message(profile: dict) -> str
    # EINE gebündelte Nachricht: offene Fragen aus offene_fragen(); Empfehlungen (Abo, Schlüssel, lokales Modell) je
    # mit "was / warum / was passiert ohne"; endet mit "Antworten sind optional; die Arbeit läuft weiter."
```
Tests (≥ 4): Profil wird geschrieben und gelesen; keine Secret-Werte im Profil (Regex-Test); Nachricht enthält jede offene Frage genau einmal.

### 5.8 `guard.py`
Aus `/home/user/soul/core/guard.py` übernehmen (Kategorien, Regexe, `classify`, Mandate). Änderungen:
`ROOT`-Pfade → `paths.soul10_root()` für geschützte Dateien (`core/guard.py`, `core/events.py`,
`.claude/settings.json`, `.claude/hooks/`), `paths.mandate_file()` und `paths.profile_file()` (own_remotes ist
der Anker der exakten Push-Prüfung: wer das Profil schreibt, macht jedes Remote zum eigenen; eine vom Standard
abweichende Liste schreibt die Bus-Zeile `guard.own_remotes`); `OWN_REMOTES` aus
`inventory.load_profile().get("own_remotes", ["origin"])` (lazy); keine Mac-Pfade. Tests (≥ 8) aus
`/home/user/soul/tests/test_guard.py` übernehmen, soweit übertragbar.
Nach der adversarialen Prüfung: `push_targets(cmd)` liest je `git push` das Ziel aus den Argumenten (Wert von
`--repo`, sonst erstes Nicht-Options-Argument; ohne Ziel = Upstream = eigen) und vergleicht EXAKT mit den eigenen
Remotes; ein eigener Push befreit kein anderes Kommando in derselben Zeile — eingestuft wird Glied für Glied
(`rollback.split_segments`), für `extern-publizieren` UND `remote-loeschung`; läuft ein Muster über eine
Trennstelle, bleibt es ein Treffer. Der Stolperdraht für Shell-Schreibzugriffe auf die Wache
(`bash_path_candidates`) löst jedes Token als Pfad gegen das mitgeführte `cd`-Verzeichnis auf (Optionen nach `cd`
werden übersprungen; exakt, kein Substring) und misst jeden RELATIVEN Pfad zusätzlich an seinen Pfadgliedern, weil
der Hook-Prozess nicht dort stehen muss wie die Shell; ein cd-Ziel aus Variable, Glob oder ein nicht vorhandenes
Ziel zieht die Prüfung enger, nicht weiter (fail-closed, §2 Regel 5). `classify(tool_name, tool_input, *, cwd=None)`
und `decide(tool_name, tool_input, *, cwd=None)` nehmen das Arbeitsverzeichnis aus der Hook-Nutzlast.
Schreibverben: `> >> sed -i tee mv cp rm chmod truncate ln`; Inline-Code sperrt nur mit Schreibhinweis im Code
selbst (`open(...,"w/a/x")`, `.write`, unlink/remove/rename/rmtree/copy/move/chmod, system/popen/subprocess/shutil)
— reines Lesen der Wache bleibt frei und steht als `guard.lesezugriff` am Bus. Eine Schlüssel-Variable (`$…KEY|TOKEN|SECRET|
PASSWORD|CREDENTIAL…`) in der Ziel-URL eines Netz-Werkzeugs ist `secrets-exfiltration`; im Header nicht.

### 5.9 `events.py`, `.claude/settings.json`, `.claude/hooks/hook.py`
Vorlage: `/home/user/soul/core/events.py` (Fail-open/-closed, Maskierung, Zusammenfassung). Modi:

| Modus (argv[1]) | stdin (Claude Code) | Tut | stdout |
|---|---|---|---|
| `session-start` | `{session_id, source}` | `bus.emit`; `recall.briefing(extra_sections=[offene Verträge (contract.list_open), offene Rückbau-Posten (rollback.list_open)])` | Briefing als Text |
| `user-prompt` | `{session_id, prompt}` | `switch.decide(prompt)`; Routing-Log | bei stage `aufwand`: JSON `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext": AUFWANDSREGEL}}`; sonst nichts |
| `pre-tool` | `{session_id, tool_name, tool_input, cwd}` | `guard.decide(tool, tool_input, cwd=payload["cwd"])` → deny-JSON wie SOUL bei Treffer ohne Mandat; sonst: Bash → `rollback.register_from_bash(cmd, cwd=payload["cwd"])` (überschriebene Datei → Sicherungskopie); Write/Edit auf bestehende Datei → `rollback.snapshot_file`; `bus.emit("pre", …)` | deny-JSON oder nichts |
Claude Code liefert `cwd` im PreToolUse-Payload. Der Hook-Prozess steht nicht zwingend dort, wo die Bash-Sitzung
steht; ohne diese Durchreichung greifen die Namensprüfung der Wache und die Verankerung des Rückwegs weiter, aber
ungenauer.
| `post-tool` | `{session_id, tool_name, tool_input, tool_response}` | `consolidate.inbox_write(session_id, {at, tool, args_hash, outcome, summary})`; bus | nichts |
| `stop` | `{session_id, stop_hook_active}` | **Prüfgate:** Verträge mit status `delivered` und ohne Quittung → JSON `{"decision":"block","reason":"Vertrag <id> ist geliefert, aber nicht geprüft. `soul verify <id>` ausführen oder `soul contract block <id> <grund>`."}` — außer `stop_hook_active` ist true (keine Schleife). Sonst `consolidate.takt_a(session_id)`, dann `consolidate.takt_b()` wenn `takt_b_faellig()` (höchstens alle 6 h, fail-open); bus | block-JSON oder nichts |
| `pre-compact` | `{session_id}` | `snapshot.json` = {offene Verträge, offene Rückbau-Posten, at}; bus | nichts |
| `subagent-stop` | `{session_id, agent_id?}` | bus mit level-Feld | nichts |
| `session-end` | `{session_id}` | `consolidate.takt_a`; `consolidate.takt_b` wenn fällig; bus | nichts |

Exit-Code immer 0 (Entscheidungen über JSON). Hook-Fehler → `bus.emit("hook-fehler", …)`, Exit 0.
`.claude/settings.json`: alle Modi registriert (`"command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/hook.py\" <modus>"`),
`env`: `ENABLE_PROMPT_CACHING_1H: "1"`. `hook.py`: fügt `soul10_root` dem `sys.path` hinzu, ruft `core.events.main()`.
Tests (≥ 10): je Modus ein Beispiel-stdin; Prüfgate blockiert und blockiert nicht bei `stop_hook_active`; deny-JSON; Aufwandsregel nur bei stage aufwand; Inbox-Zeile entsteht.

### 5.10 `dirigent.py`
**Erz → Gold:** R14 §2.3 (Dirigenten-Schleife als Prosa) → Funktionen mit Stoppregeln.
```python
run(goal: str, probes: list[dict], *, items: list|None = None, condition: str|None = None, parts: int = 1,
    model: str|None = None, thinking: int = 0, use_model_verifier: bool = True, cwd: str|None = None,
    session_id: str = "cli", probe_switch: bool = False) -> dict
    # 0 situieren: profile = inventory.load_profile() or inventory.write_profile()
    # 1 vertrag  : c = contract.new(goal, probes, mission_id=…)  (ContractError propagiert — ohne Probe kein Auftrag)
    # 2 schalter : s = switch.decide(goal, probe=probe_switch)
    # 3 plan     : items+condition → decompose.seam_check; empfehlung 'zerlegen' → decompose.run;
    #              'einzeln' → Einzelaufruf, solange die Item-Darstellung ≤ EINZELN_MAX_ZEICHEN (4 000) ist,
    #              sonst decompose.run(force=True) (M2: 72 % > 33 %); 'nicht_zerlegbar' → Einzelaufruf, geloggt
    # 4 ausführen: system = s["inject"] or None; model.call(system, goal) → proposal; contract.deliver
    # 5 prüfen   : verifier.verify(c["id"], use_model=use_model_verifier or s["stage"]=="pruefer", proposal_text=…)
    # 6 erinnern : ledger.remember(title=goal[:80], body=<endergebnis>, kind="episode", source="werkzeug",
    #              source_ref=f"dirigent:{c['id']}", mission_id=c["id"], ttl_class="short")
    # 7 Rückgabe : {"contract_id","stage","protocol","verdict","final_text","final_value","calls","receipt"}
    # jeder Schritt: bus.emit("dirigent.<schritt>", …)
```
Tests (≥ 6, Fake-Modell): ohne Probe → ContractError; answer-Probe pass → verified; Prüfer korrigiert → failed + Korrektur; Zerlegung mit Naht; Episode geschrieben; Bus-Zeilen je Schritt.

### 5.11 `cli.py`, `bin/soul`, `bin/soul.cmd`
`argparse` mit Unterbefehlen (jeder ruft genau eine Modulfunktion, druckt JSON oder Text):
`contract new|show|list|deliver|block|handover` · `verify <id> [--model] [--proposal TEXT]` ·
`remember --source S --ref R --kind K TITLE BODY` · `recall QUERY` · `briefing` · `retract ID --reason` ·
`predict CLAIM --confidence` · `resolve ID --outcome true|false` · `calibration` · `rollback list|undo|quota|register` ·
`inventory [--write]` · `ring2` · `decompose --check CONDITION` · `switch PROMPT` · `consolidate [a|b]` ·
`self` · `status` (stats + offene Verträge + Rückbauquote + Kalibrierung) · `monitor [-n]` (bus.tail) ·
`run GOAL --probe JSON [...]`. `bin/soul`: `#!/bin/sh` → `exec python3 "$(dirname "$0")/../core/cli.py" "$@"`.
Exit-Codes: 0 ok · 1 ein Modul hat abgelehnt (Meldung auf stderr) · 2 Aufruf falsch · 3 Urteil nicht „pass" · 4 innerer Fehler
(Datenbank gesperrt, Datei kaputt: Meldung statt Traceback, Bus-Zeile trotzdem) · 64 kein Befehl. `soul status` zeigt zusätzlich
`state_ok`, `contamination_share` (G5) und `predictions_due`.
Tests (≥ 4, über `subprocess` mit `SOUL10_HOME`): `soul contract new` ohne Probe → Exit ≠ 0 mit Meldung; `soul status` läuft; `soul switch "Berechne 2+2, nur die Zahl"` → direkt.

### 5.12 `CLAUDE.md` (Betriebsanweisung, ≤ 40 Zeilen, ≤ 15 Direktiven, deutsch)
Inhalt in dieser Reihenfolge: Rolle (Dirigent; Zustimmung bei Einrichtung; sichtbar statt erlaubt);
Vertrag vor Arbeit (`soul contract new`, ohne Probe kein Auftrag); fertig sagt nur `soul verify`;
zerlegen nur nach `soul decompose --check`, zusammenführen im Code; erinnern mit Herkunft, lesen vor
Dateien; Rückweg je Handlung mit Außenwirkung; untere Ebenen mit `soul contract handover`, Budget
begrenzt, zwei Ebenen Normalfall; Ring 2 gebündelt, eine Nachricht, weiterarbeiten; ehrliche
Ausgänge. **Keine Denkstruktur, keine Persona, keine Schweigeklausel.**

---

## 6. Tests — Gesamtabnahme

```bash
cd /home/user/nextool/ordnung/soul10 && python3 -m pytest tests -q
```
Ziel ≥ 110 Tests, alle grün. Zusätzlich `tests/test_texte.py`: (a) kein Schweigeklausel-Muster
(`\bstill\b|unsichtbar|nur das Ergebnis|keine Zwischenschritte|erscheint nie im Text|\bsilent|invisibl`)
in irgendeinem String-Literal unter `core/` (AST-Scan); (b) `model.AUFWANDSREGEL` byte-gleich
`arme.V5_NUR_ZUTEILUNG`; (c) `ledger.REGEL_HERKUNFT` byte-gleich `suiten_gedaechtnis.REGEL_HERKUNFT`;
(d) `CLAUDE.md` ≤ 40 Zeilen.
