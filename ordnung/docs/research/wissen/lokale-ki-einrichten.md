---
name: lokale-ki-einrichten
description: >
  Load when the task involves running models locally (Ollama, LM Studio, llama.cpp, vLLM),
  choosing a quantization, sizing hardware (RAM/VRAM/CPU/GPU), deciding what a local model may
  do inside the pipeline, or handling private data that must not leave the machine.
schicht: handwerk
sichtbarkeit: public
version: 2026-09-06.1
verfaellt_am: 2026-12-05
haltbarkeit_default: H2
signale: [local_ai, ollama, quantization, hardware, privacy_p2]
ladestufe_default: 1
abhaengig_von: [kontingent-kosten, sicherheit-autonome-agenten]
gemessen: {geladen: 0, gewirkt: 0, letzte_nutzung: null}
autor: mining
---

## Kurzform (≤ 120 Wörter)
Speicher zuerst: Gewichte-GiB ≈ Parameter (Mrd.) × bpw / 8, plus KV-Cache, plus 1–2 GiB Reserve; Q4_K_M ≈ 0,57 GiB pro Milliarde. Q4_K_M ist der Standard (≈ +3 % Perplexität), Q5_K_M/Q6_K für Code und Reasoning, wenn Speicher reicht. Klassen: none < 8 GB · small 8–15 (≤ 9B) · medium 16–31 (≤ 20B) · large ≥ 32 GB RAM oder ≥ 24 GB VRAM · xl ≥ 80 GB VRAM. Lokal ist gut für Klassifikation, Extraktion, Entropie-Sonde, Vorprüfung, Zusammenfassung von Tool-Output, PII-Scrub, Gedächtnis-Triage — nie für den Dirigenten. Passung messen (6-Item-Kalibrierset), nicht nach Namen raten. Lokal ist die einzige Stufe für private Daten (vollständiger Miguel).

## Kernprinzipien
1. [R@R16 §2.4.1 aus llama.cpp-README] H1 Rechenregel Gewichte-GiB ≈ Parameter × bpw / 8; Llama-3.1-8B: F16 14,96 GiB, Q4_K_M 4,58 (4,89 bpw), Q5_K_M 5,33, Q6_K 6,14, Q8_0 7,95.
2. [B-Sekundär@q3 2026-09-06, Primär arXiv 2601.14277 Tabelle nicht abgerufen] H2 Perplexität Llama-3.1-8B: F16 7,32 · Q8_0 7,33 · Q6_K 7,35 · Q5_K_M 7,40 · Q4_K_M 7,56; unter Q4 steiler Abfall.
3. [B-Sekundär@q3] H2 Empfehlung: Q4_K_M universeller Default („~72 % VRAM gespart"), Q5_K_M sobald Speicher reicht (Code/Reasoning), Q8_0 nur als Referenz.
4. [R@R15 §2.1.6] H2 gpt-oss-20b „within 16GB of memory" (21B, 3,6B aktiv, MXFP4), gpt-oss-120b eine 80-GB-GPU; Apache 2.0; Ollama `ollama pull gpt-oss:20b`.
5. [R@R15 §2.1.6] H2 LM Studio: macOS nur Apple Silicon, macOS 14+, 16 GB+ empfohlen; Windows/Linux x64 mit AVX2 oder ARM; CLI `lms`.
6. [R@R15/R16] H1 Klassen none/small/medium/large/xl (Kurzform); Preflight ermittelt sie ohne Frage: RAM/VRAM/CPU, `which ollama`, `curl localhost:11434/api/tags`, LM-Studio-Port.
7. [R@R16 §2.4.1] H1 MoE (z. B. 30B-A3B): Speicher der Gesamtparameter, Tempo der aktiven — beste Klasse für CPU-only mit viel RAM.
8. [R@R16 §2.4.2] H3 Aider-Polyglot (Stand 2025-11-20): gpt-oss-120b (high) 41,8 % ($0,74/Lauf), Qwen3-32B 40,0 % ($0,76) vs. gpt-5 (high) 88,0 % ($29,08) — lokal ≈ halbe Frontier-Rate bei ≈ 1/40 Kosten auf schweren Aufgaben; auf leichten Aufgaben Lücke null (Chriso HumanEval: qwen 93–97 % nackt [G]).
9. [R@R16 §2.4.3] H1 Rollen lokal: Klassifikation/Routing-Signale, Extraktion in Schema, Entropie-Sonde (3 Wiederholungen), Vorprüfung (nie Wahrheitsurteil), Tool-Output-Zusammenfassung, PII-/Secret-Scrub vor Cloud-Aufrufen, Gedächtnis-Triage, Formatierschritt, Code-Entwürfe mit Test-Verifizierer.
10. [R@R16 §2.4.4] H1 Passung messen: 6-Item-Kalibrierset je Modell (2× Extraktion, 1× Klassifikation, 1× Zusammenfassung mit Längenband, 2× Code-Fix mit Test); Rolle nur bei pass_rate ≥ 5/6; Thinking-Budget pro Rolle fixiert.
11. [G] H1 Modelle reagieren in entgegengesetzte Richtungen auf denselben Frame (Antwortlänge B/A 0,65 vs. 1,41) — Frames für lokale Modelle einzeln messen.
12. [Kontext §10] H1 P2-Daten (vollständiger Miguel) verlassen die Maschine nicht → lokales Modell ist die einzige Verarbeitungsstufe dafür.

## Entscheidungsregeln
- RAM ≥ 16 GB, keine GPU → ein 7–9B-Q4 oder MoE-30B-A3B (wenn ≥ 24 GB RAM); erwartete Geschwindigkeit CPU-only einstellig Tokens/s [U].
- Aufgabe deterministisch lösbar (Regex, Parser)? → gar kein Modell.
- Aufgabe = Klassifikation/Extraktion/Zusammenfassung → lokal, nach Kalibrierset.
- Aufgabe = Architektur/Synthese/lange Kontexte/Urteil → Cloud; lokal höchstens als Entropie-Sonde davor.
- Private Daten → lokal oder gar nicht.

## Werkzeuge
Ollama (REST `http://localhost:11434/api/chat`), LM Studio (`lms`), llama.cpp (`tools/quantize`), vLLM [R@R15]; GGUF-Formate Q2_K_S … Q8_0, F16 [R@R16].

## Anti-Patterns
- VRAM ohne KV-Cache und Reserve rechnen [P].
- Modell nach Arena-Ranking wählen: LMArena ist Präferenz, kein Korrektheitsmaß; Längenbias gilt [G, R16 §2.4.2].
- Lokales Modell als Dirigent [R@R15 „nie Dirigent"].

## Unter welcher Bedingung ist dieses Dossier falsch?
Neue Quantisierungsformate oder Modellgenerationen (Groq listet laut R15 `qwen3.6-27b`/`qwen3.8-27b`, hier ungemessen) verschieben 2, 3, 8. Wenn das Kalibrierset zeigt, dass ein lokales Modell auch Urteilsrollen besteht, ist 9 zu eng.

## Quellen
- @q3 Suchergebnis-Zusammenfassung zu arXiv 2601.14277 (Kurt, 2026-01-11) und Sekundärblogs (Abruf 2026-09-06; Primärtabelle nicht abgerufen — Prüfauftrag)
- R15 §2.1.6, §2.3; R16 §2.4 (llama.cpp tools/quantize/README.md, qwenlm.github.io, aider.chat dort belegt)
