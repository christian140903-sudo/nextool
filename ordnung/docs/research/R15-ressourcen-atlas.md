# R15 — Ressourcen-Atlas: Was einem Nutzer heute gratis oder bezahlt zur Verfügung steht, und wie der Dirigent es erkennt, auswählt und einsetzt

*Recherche-Front R15, Stand 2026-09-06. Auftrag: `briefs/R15.md`. Kontext: `00-KONTEXT-FUER-AGENTEN.md` (§10–13). Maßstab: Gold aus Erz (§13). Quellenregel: nur, was in Tool-Ergebnissen (WebFetch/WebSearch/Dateien) gesehen wurde; Erinnerungswissen als [unverifiziert]. Preise und Limits ändern sich in Wochen — jede Zahl trägt Quelle und Abrufdatum; der Atlas selbst ist als lebendes Artefakt (§3.5) gedacht, dieser Bericht ist seine erste Füllung.*

## Gliederung

1. Kernaussagen (mit Quellen)
2. Detailbefunde
   - 2.1 Modelle und Zugänge (Anthropic, OpenAI, Google, Groq/Cerebras/Together, Mistral, DeepSeek, lokal)
   - 2.2 Werkzeuge und Fähigkeiten (Claude Code, Codex CLI, Gemini CLI, Cursor/Windsurf, Browser, Git/GitHub, Deployment, Datenbanken, Recherche, Office, Kommunikation, Speicher, MCP-Ökosystem)
   - 2.3 Erkennung des Nutzerprofils (automatisch vs. Ring 2), Probe auf dieser Maschine
   - 2.4 Auswahllogik (Ebene × Aufgabe × Modell/Tool), Fallback-Ketten, Kontingent-Planung
   - 2.5 Pflege des Atlas
3. Konsequenzen für das Design von Ordnung × SOUL
   - 3.1 Atlas als Datenstruktur (`atlas/*.yaml`) und Tabellen
   - 3.2 Profil-Schema `~/.soul/profile.json`
   - 3.3 Preflight-Routine (Skript-Entwurf + Ring-2-Bündelfrage)
   - 3.4 Auswahlregeln als Textbausteine für Kernel/conductor
   - 3.5 Pflegeprotokoll
4. Widersprüche / Unsicherheiten
5. Quellen

---

## 1. Kernaussagen (mit Quellen)

*(Entwurf — wird am Ende aktualisiert.)*

## 2. Detailbefunde

### 2.1 Modelle und Zugänge

**Lesehinweis.** Alle Zahlen sind Stichtagswerte (Abruf 2026-09-06) und im Atlas als `verified_at` zu führen. Drei Preisdimensionen sind für den Dirigenten relevant, nicht eine: (a) API-Tokenpreis (linear, planbar, keine Fenster), (b) Abo-Kontingent (Fenster à 5 h + Wochenkappe, nicht-linear, „verfallende“ Ressource), (c) Gratis-Tiers (RPM/RPD/TPD-Kappen, geeignet für Bulk und Gegenstimme, nie als Rückgrat). Die Auswahllogik (§2.4) muss diese drei Währungen getrennt buchen.

#### 2.1.1 Anthropic (Claude API, Abos, Claude Code)

**API-Preise (Quelle: platform.claude.com/docs/en/about-claude/pricing, Abruf 2026-09-06):**

| Modell | Input $/MTok | 5m-Cache-Write | 1h-Cache-Write | Cache-Hit | Output $/MTok | Batch In/Out | Eignung im Ebenen-Modell |
|---|---|---|---|---|---|---|---|
| Claude Fable 5.1 | 10 | 12,50 | 20 | **0,25** (0,025×) | 50 | 5 / 25 | Ebene 1 Dirigent; Ebene 2 Prüfer bei hohem Einsatz |
| Claude Mythos 5.1 (limited availability) | 10 | 12,50 | 20 | 0,25 | 50 | 5 / 25 | wie Fable, nur bei Zugang |
| Claude Fable 5 | 10 | 12,50 | 20 | 1,00 | 50 | 5 / 25 | wie Fable 5.1, Cache 4× teurer |
| Claude Opus 5 / 4.8 / 4.7 / 4.6 / 4.5 | 5 | 6,25 | 10 | 0,50 | 25 | 2,50 / 12,50 | Ebene 2 Planer/Prüfer; Ebene 1 unter Knappheit |
| Claude Sonnet 5 | **2** | 2,50 | 4 | 0,20 | **10** | 1 / 5 | Ebene 3–4 Ausführende; Standard-Arbeitspferd |
| Claude Sonnet 4.6 / 4.5 | 3 | 3,75 | 6 | 0,30 | 15 | 1,50 / 7,50 | Ausführende (älterer Tokenizer, ~30 % weniger Tokens) |
| Claude Haiku 4.5 | 1 | 1,25 | 2 | 0,10 | 5 | 0,50 / 2,50 | Ebene 5–6 Bulk, Klassifikation, Signal-Erkennung |

Belegte Zusatzregeln aus derselben Seite:
- **Cache-Multiplikatoren:** 5m-Write 1,25×, 1h-Write 2×, Hit 0,1× (Fable 5.1/Mythos 5.1: 0,025×). Cache lohnt ab **einem** Hit (5m) bzw. **zwei** Hits (1h). Multiplikatoren stapeln mit Batch (50 %) und Data-Residency (1,1× bei `inference_geo: "us"` ab Claude 4.6).
- **Sonnet 5 bleibt bei $2/$10** — die für 1. September 2026 angekündigte Erhöhung auf $3/$15 „will not occur“ (Seiten-Notiz).
- **Tokenizer-Warnung:** Claude 4.7+ und Mythos nutzen einen Tokenizer, der „approximately 30% more tokens for the same text“ erzeugt. Für den Atlas heißt das: Preisvergleich nur pro *Text*, nicht pro Token; ein Sonnet-4.6-Prompt ist nicht 1:1 mit einem Sonnet-5-Prompt vergleichbar.
- **1M-Kontext ohne Aufpreis:** „Claude 4.6 and later models … include the full 1M token context window at standard pricing“ — kein Long-Context-Tier mehr; Cache und Batch gelten über das ganze Fenster.
- **Fast Mode** (Research Preview, nur Opus 5/4.8, nur First-Party-API): $10/$50, nicht mit Batch kombinierbar.
- **Server-Tools:** Web Search $10 pro 1.000 Suchen; Web Fetch kostenlos (nur Tokens, `max_content_tokens` als Schutz); Code Execution kostenlos mit Web Search/Fetch, sonst 1.550 Gratis-Container-Stunden/Monat, danach $0,05/h; Tool-Use-System-Prompt kostet je Modell 286–804 Tokens, Computer-Use-Toolset ~4.500, Browser-Toolset ~6.600 Tokens pro Request.
- **Claude Managed Agents:** Tokens zu Listenpreis + $0,08 pro Session-Stunde (`running`-Zeit), kein Batch-Rabatt.
- **Rate-Limit-Stufen:** Start / Build / Scale (Details auf der Rate-Limits-Seite, nicht abgerufen). Gratis: „New users receive a small amount of free credits“ — kein dauerhafter Free-Tier.
- **Cloud-Wege:** Bedrock, Vertex, „Claude Platform on AWS“ und Microsoft Foundry (CCU = $0,01, 100 CCU = $1), regionale Endpunkte +10 %.

**Abos und Claude-Code-Kontingente:** siehe Fortsetzung unten (claude.com/pricing, support.claude.com; Sekundärquellen als solche markiert).

**Abos (Quelle: claude.com/pricing, Abruf 2026-09-06):**

| Plan | Preis | Modelle | Claude Code | Kontext | Bemerkung |
|---|---|---|---|---|---|
| Free | $0 | Sonnet, Haiku | **nein** (auch kein Cowork/Design) | — | Web/Desktop/Mobile, Web Search, Memory, Connectors, Skills |
| Pro | $20/Monat ($17 jährlich, $200 upfront) | Opus, Sonnet, Haiku, „limited Fable access“ | ja (+ Cowork, Design, Science) | 200k | Projects, M365-Integration |
| Max | „$100+“ | wie Pro | ja | 200k | „Choose 5x or 20x more usage than Pro“, höhere Output-Limits, Priority Access, Early Access |
| Team Standard | $20 (jährl.) / $25 | alle | ja | — | „more usage than Pro“, SSO, Enterprise Search |
| Team Premium | $100 (jährl.) / $125 | alle | ja | — | „5x more usage than standard seats“ |
| Enterprise | „$20/seat“ + Verbrauch | alle | ja | — | SCIM, Audit-Logs, Compliance-API |

Verbindlich aus `code.claude.com/docs/en/costs` (offiziell, Abruf 2026-09-06) — die für den Dirigenten relevanten Mechanik-Fakten:
- **Fenster:** Seat-Kontingent auf Teams/Enterprise „resets on a rolling five-hour window and a weekly window“, geteilt mit Chat und Cowork. Für Pro/Max sagt support.claude.com nur „usage limits that are shared across Claude and Claude Code“; die Zahl der Nachrichten je Fenster steht **nirgends offiziell**. Sekundärquellen (morphllm, ccforeveryone, explainx; nicht offiziell): Pro ≈ 45 Nachrichten/5 h, Max 5x ≈ 225, Max 20x ≈ 900; Wochen-Kappe on top; ein 50-%-Bonus auf Wochenlimits läuft bis 14. September 2026 und wird durch dauerhaft +25 % ersetzt [Sekundärquelle, unverifiziert].
- **Fehlermeldungen unterscheiden Ceilings:** „You've hit your session limit“ / „weekly limit“ gilt modellübergreifend (Modellwechsel hilft nicht); „You've hit your Opus limit“ / „Sonnet limit“ ist **familienbezogen** — „switching to a model outside that family with `/model` does keep the developer working“. → Fallback-Kette muss die Modellfamilie wechseln, nicht die Größe.
- **Auto-Wait:** ab v2.1.234 kann Claude Code nach Limit-Reset automatisch weitermachen (`/rate-limit-options`, Setting `autoContinueAtUsageLimit`).
- **Usage Credits** (Extra-Nutzung nach Kontingent) per `/usage-credits`, mit monatlicher Ausgabengrenze; **Cache-TTL fällt von 1 h auf 5 min**, sobald Credits gezogen werden („The lifetime is an hour on a subscription and drops to five minutes once you're drawing on usage credits; on an API key … five minutes by default“) — Teams sollen den TTL explizit wählen.
- **Kostenlage API:** „average cost is around $13 per developer per active day and $150–250 per developer per month“, 90 % unter $30/Tag. `--max-budget-usd` als hartes Budget für `-p`-Läufe; `/usage` mit Attribution nach Skills/Subagents/Plugins/MCP-Servern und Behavior-Flags (long context, cache misses ≥10 %).
- **Agent Teams:** „approximately 7x more tokens than standard sessions when teammates run in plan mode“; Empfehlung Sonnet für Teammates; Flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- **Kontext-Ökonomie:** MCP-Tool-Definitionen sind „deferred by default“; „Tools like `gh`, `aws`, `gcloud` … are still more context-efficient than MCP servers“; CLAUDE.md unter 200 Zeilen, Spezialwissen in Skills; Hooks als Vorfilter (Beispiel: Testausgabe auf Fehler filtern); Subagents für „verbose operations“.
- **Thinking:** „Disabling thinking is not available on Fable models, which always use extended thinking“; Effort via `/effort`; `MAX_THINKING_TOKENS` nur für Modelle mit festem Budget.
- **Hintergrundverbrauch:** Scheduled Tasks, Cross-Session-Messages und Goal-Check-ins (max. 3 idle check-ins pro Goal) schicken jeweils den **vollen Kontext**; `/clear` kostet nichts, `/compact` ist selbst ein großer Request.

#### 2.1.2 OpenAI (API, ChatGPT-Abos, Codex, gpt-oss)

**API-Preise (Quelle: developers.openai.com/api/docs/pricing, Abruf 2026-09-06; Input / Cached Input / Output $/MTok):**

| Modell | Input | Cached | Output | Eignung |
|---|---|---|---|---|
| gpt-5.6-astra | 10,00 | 1,00 | 50,00 | Gegenstimme/Prüfer höchster Stufe (Preisklasse Fable) |
| gpt-5.6-sol | 4,00 | 0,40 | 20,00 | **Sol-Gate** (SOULs Gegenstimme), Planer Ebene 2 |
| gpt-5.6-terra | 2,00 | 0,20 | 12,00 | Ausführende Ebene 3–4 |
| gpt-5.6-luna | 0,20 | 0,02 | 1,20 | Bulk, Klassifikation, Ebene 5–6 |
| gpt-5.5 / 5.5-pro | 5,00 / 30,00 | 0,50 / – | 30,00 / 180,00 | Pro nur für Einzel-Urteile |
| gpt-5.4 / -mini / -nano | 2,50 / 0,75 / 0,20 | 0,25 / 0,075 / 0,02 | 15,00 / 4,50 / 1,25 | Vorgängergeneration |
| gpt-5.3-codex | 1,75 | 0,175 | 14,00 | Code-Ausführende |
| gpt-5 / -mini / -nano | 1,25 / 0,25 / 0,05 | 0,125 / 0,025 / 0,005 | 10,00 / 2,00 / 0,40 | Billigste Bulk-Stufe |

Regeln: **Batch API −50 %** auf alle Modelle; **Flex processing** zu Batch-Preisen für ausgewählte Modelle; **Fast mode 2×**; Cached Input durchgehend **0,1×** (kein separater Cache-Write-Preis wie bei Anthropic — Caching ist implizit und gratis im Write).

**Codex mit ChatGPT-Plan** (help.openai.com-Artikel 11369540 lieferte 403; Zahlen aus Suchtreffern morphllm/inventivehq/simplemetrics, die den Help-Center-Artikel zitieren — [Sekundärquelle]): Codex ist in Free/Go ($8)/Plus ($20)/Pro ($100 = 5×, $200 = 20×)/Business ($25/User)/Enterprise enthalten; „10–100 local messages per 5-hour window on GPT-5.6 Sol, 25–200 on Terra, 250–2,000 on Luna“, Cloud-Tasks und Code-Reviews mit getrennten Allowances, Wochenlimits zusätzlich; CLI, IDE und Cloud ziehen aus **einem** Pool; alternativ API-Key-Abrechnung ohne Fenster. Chrisos eigene Einschätzung („am besten ein Codex-Abo“, Kontext §11b) passt zur Preisstruktur: Ein Pro-$200-Abo liefert als Gegenstimme/Zweitmodell planbare Kapazität ohne Tokenrechnung.

**gpt-oss (offene Gewichte):** in Groq und Cerebras als Gratis-Modelle verfügbar (§2.1.4); lokale Hardware siehe §2.1.6.

#### 2.1.3 Google (Gemini CLI, AI Studio/API, Vertex)

**Gemini-CLI-Zugangswege (Quelle: geminicli.com/docs/resources/quota-and-pricing, Abruf 2026-09-06):**

| Weg | Kontingent | Modelle | Kosten |
|---|---|---|---|
| Google-Konto (Code Assist Individual) | „1,000 requests“/Tag | „as determined by Gemini CLI“ | $0 |
| Google AI Pro / Ultra | 1.500 / 2.000 Requests/Tag | dito | Abo |
| Gemini-API-Key unbezahlt | „250 maximum model requests / user / day“ | **Flash only** | $0 |
| Gemini-API-Key bezahlt | nach Tier | alle | Token |
| Vertex AI Express | „90 days before you need to enable billing“ | — | $0 dann Token |

**Widerspruch, den nur eine Laufzeitprobe auflöst:** Dieselbe Seite trägt den Hinweis „Gemini CLI will be replaced by Antigravity CLI on June 18th“ für unbezahlte Tiers und Google-One-Nutzer; Sekundärquellen (inventivehq, tembo) behaupten, der kostenlose Login-Pfad sei am 18. Juni 2026 eingestellt worden. Der Atlas darf hier **keinen** statischen Wert führen — der Preflight muss `gemini` real aufrufen und die Antwort loggen (§3.3).

**Gemini-API-Preise (Quelle: ai.google.dev/gemini-api/docs/pricing, Abruf 2026-09-06):** Gemini 3.8 Flash und 3.7 Flash $0,75/$3,75 bis 31.12.2026, ab 1.1.2027 $1,50/$7,50; 3.5 Flash $1,50/$9,00; 3.5 Flash-Lite $0,30/$2,50; 2.5 Pro $1,25/$10 (≤200k) bzw. $2,50/$15 (>200k); 2.5 Flash $0,30/$2,50; 2.5 Flash-Lite $0,10/$0,40; **Free Tier „Yes“ für alle gelisteten Modelle**; Batch −50 %; Google-Search-Grounding 5.000 Gratis-Requests/Monat auf 3.x (dann $14/1.000), 1.500 RPD auf 2.5 (dann $35/1.000). Rate-Limit-Stufen (ai.google.dev/gemini-api/docs/rate-limits): Free („Active project or free trial“), Tier 1 (Billing verknüpft, $250 Cap), Tier 2 ($100 bezahlt + 3 Tage), Tier 3 ($1.000 + 30 Tage); **konkrete RPM/TPM/RPD stehen nur im AI-Studio-Dashboard** („View your active rate limits in AI Studio“; „not guaranteed“). Für den Atlas: Gemini-Free-Tier = **günstigste Gegenstimme mit Websuche** (Grounding gratis), aber Kontingent nur zur Laufzeit lesbar.

#### 2.1.4 Gratis-Inferenz-Tiers: Groq, Cerebras, Together, Mistral

| Anbieter | Gratis-Modelle | Gratis-Limits | Bezahlt | Quelle |
|---|---|---|---|---|
| **Groq** | openai/gpt-oss-120b, gpt-oss-20b, gpt-oss-safeguard-20b, qwen/qwen3.6-27b, qwen3.8-27b, groq/compound(-mini), prompt-guard, whisper-large-v3(-turbo), orpheus TTS | RPM 10–30, RPD 100–14,4K, TPM 1,2K–70K, TPD 3,6K–500K (je Modell) | „Developer“-Plan: höhere Limits, Batch, Flex | console.groq.com/docs/rate-limits |
| **Cerebras** | gpt-oss-120b, qwen-3.8-27b | RPM 5, uncached TPM 30K, total TPM 90K, TPH 1M, **TPD 1M** | Developer PAYG: gpt-oss-120b 1M uncached TPM, RPM 1K, „Hourly and daily restrictions don't apply“; $5 Credits nach Zahlungsmittel (30 Tage) | inference-docs.cerebras.ai/support/rate-limits |
| **Together** | keine (nur $5 Startguthaben) [Sekundärquelle] | — | 200+ OSS-Modelle PAYG | Suchtreffer docs.together.ai/rate-limits (nicht abgerufen) |
| **Mistral** | „Free mode lets you create API keys and use included monthly usage within the limits shown on the Limits page“ | Zahlen nur auf der Limits-Seite (nicht abgerufen); Sekundär: ~1 Mrd Tokens/Monat, ~50K TPM, Telefonverifizierung [unverifiziert] | Pay-as-you-go „beyond included monthly usage“ | docs.mistral.ai/admin/billing-usage/usage-limits |

Einordnung für die Auswahllogik: **Cerebras (1M TPD, 5 RPM) ist der beste Gratis-Bulk-Kanal für ein 120B-Modell**, aber mit 5 RPM nicht parallelisierbar — ein Ausführender, nicht sechs. **Groq** hat höhere RPM (10–30), aber TPD bis 500K — passend für Signal-Klassifikation, Verhaltensentropie-Messung (3 Wiederholungen billig) und kurze Prüfaufgaben. Beide bieten **dasselbe Modell (gpt-oss-120b)** → identischer Prompt, zwei Kontingente, natürlicher Fallback. Whisper bei Groq gratis = Sprachnotizen als Input-Kanal ohne Zusatzkosten.

#### 2.1.5 DeepSeek

Quelle api-docs.deepseek.com/quick_start/pricing (Abruf 2026-09-06) nennt die aktuellen Modelle **deepseek-v4-flash, deepseek-v4-pro, deepseek-v4-flash-vision-exp** und verweist auf ein Anthropic-API-kompatibles Format („For examples using the Anthropic API format, please refer to Anthropic API“) — d. h. DeepSeek ist über `ANTHROPIC_BASE_URL` als Claude-Code-Backend denkbar [Folgerung, nicht getestet]. Die Preistabelle wurde vom Abruf nicht erfasst; Nachtrag in §2.1.7 falls Suche erfolgreich, sonst als offene Lücke.

#### 2.1.6 Lokale Modelle (Ollama, LM Studio, gpt-oss) und Hardware

| Fakt | Wert | Quelle |
|---|---|---|
| gpt-oss-20b Speicherbedarf | „within 16GB of memory“ (21B Parameter, 3,6B aktiv, MXFP4-MoE) | github.com/openai/gpt-oss |
| gpt-oss-120b Speicherbedarf | „fit into a single 80GB GPU (like NVIDIA H100 or AMD MI300X)“ (117B, 5,1B aktiv) | dito |
| Lizenz / Runtimes | Apache 2.0; Ollama (`ollama pull gpt-oss:20b`), LM Studio, vLLM, Transformers, Metal | dito |
| Ollama | macOS/Windows/Linux/Docker (`ollama/ollama`), lokale REST-API `http://localhost:11434/api/chat` | github.com/ollama/ollama |
| LM Studio macOS | Apple Silicon (M1–M4) Pflicht, macOS 14+, „16GB+ RAM recommended“, 8-GB-Macs nur kleine Modelle; **Intel-Macs nicht unterstützt** | lmstudio.ai/docs/app/system-requirements |
| LM Studio Windows/Linux | x64 (AVX2 Pflicht) oder ARM; ≥16 GB RAM, ≥4 GB VRAM empfohlen; Linux Ubuntu 20.04+ als AppImage; CLI `lms` | dito |
| Faustregel RAM je Modellgröße | Q4-Quantisierung ≈ 0,55–0,65 GB pro Mrd. Parameter + Kontext-Cache; 7–9B → ~6 GB, 13B → ~9 GB, 30B → ~20 GB | [unverifiziert, Rechenregel; Ollama-README-Tabelle wurde vom Abruf nicht erfasst] |

Für **diese Maschine** (Probe §2.3: 15 GiB RAM, 4 Kerne, keine GPU) folgt: gpt-oss-20b liegt an der 16-GB-Grenze und ist praktisch nicht lauffähig; ein 7–9B-Q4-Modell wäre ladbar, aber CPU-only langsam (Größenordnung einstellige Tokens/s [unverifiziert]). Der Preflight muss daraus die Klasse `local: none|small|medium|large` ableiten (Schwellen: <8 GB none; 8–15 small ≤9B; 16–31 medium ≤20B/gpt-oss-20b; ≥32 GB oder ≥24 GB VRAM large; ≥80 GB VRAM gpt-oss-120b). **Eignung:** lokale Modelle sind die einzige Stufe für Daten der Privatheitsklasse P2 (vollständiger Miguel, §2.4) ohne Drittanbieter; als Prüfer für triviale Formatchecks; als Entropie-Sonde (3 billige Wiederholungen) — nie als Dirigent.

#### 2.1.7 DeepSeek — Nachtrag aus Sekundärquellen (widersprüchlich)

Die offizielle Preisseite wurde nicht erfasst. Suchtreffer (cloudzero, benchlm, aipricing.guru, pricepertoken; alle Sekundär) nennen für **V4 Flash** $0,14/$0,28 (Juli 2026) bzw. $0,22/$0,66 (Anfang September 2026) mit Peak-Aufschlag $0,44/$1,32 in 01:00–04:00 und 06:00–10:00 UTC; für **V4 Pro** $0,435/$0,87 bzw. $0,66/$1,98; Cache-Hit ~$0,003/MTok; 1M Kontext, 384K Max-Output. Die Spannweite zeigt genau das Pflegeproblem des Atlas: **zwei Zahlen, sechs Wochen auseinander, Faktor 2.** Bis zur Laufzeitprüfung gilt DeepSeek als „günstigste Cloud-Klasse mit Off-Peak-Fenster, Zahlen unbestätigt“; Eignung: Bulk in Off-Peak, Gegenstimme dritter Familie, Datenschutz-Klasse nur P0.

### 2.2 Werkzeuge und Fähigkeiten

#### 2.2.1 Claude Code als Laufzeit (Quelle: code.claude.com llms.txt-Index, feature-availability, costs, overview; Abruf 2026-09-06)

Vollständiges Fähigkeitsinventar, gruppiert nach dem, was der Dirigent damit *tut*:

| Fähigkeit | Doku-Seite | Verfügbarkeit | Nutzen für den Dirigenten |
|---|---|---|---|
| Subagents (`.claude/agents`), Skills, Hooks, Commands, CLAUDE.md, Plugins, MCP, Checkpoints, Sandboxing, **Workflows** (dynamische Subagent-Orchestrierung), OpenTelemetry | sub-agents, skills, hooks, workflows, monitoring-usage | **jeder Provider** („work on every provider“) | Kern der Ebenen 2–6; Hooks = Sensorik + Guards; Workflows = programmatische Fan-outs |
| Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) | agent-teams | jeder Provider, Flag | parallele Vollsessions; **~7× Tokens** in Plan-Mode → nur bei echter Parallelität |
| Cross-Session Messaging (`/list-agents`, `/peers`) | cross-session-messaging | v2.1.224+; API-Key: nur gleiche Maschine; andere Maschinen nur via Remote Control | Dirigent ↔ Worker-Kommunikation ohne Datei-Polling |
| Headless `claude -p`, `--max-budget-usd`, Agent SDK (TS/Python), structured outputs | headless, agent-sdk/* | jeder Provider | Ebenen 3–6 als budgetierte Einzelprozesse; Prüfer mit JSON-Verdict |
| Goal (`/goal`, Idle-Check-ins max. 3) | goal | jeder Provider | „bis fertig“-Ausdauer; Kosten: jeder Check-in sendet vollen Kontext |
| Worktrees | worktrees | jeder Provider | parallele Ausführende ohne Dateikonflikt |
| Scheduling: Routines (`/schedule`, Cloud), Desktop Scheduled Tasks, `/loop` | routines, desktop-scheduled-tasks, scheduled-tasks | Routines/Desktop nur **claude.ai-Abo**; `/loop` überall | Atlas-Pflege (§2.5), Kontingent-Wellen um Reset-Zeiten |
| Web-Sessions (`claude --cloud`, `--teleport`), Mobile, Remote Control, Channels (Telegram/Discord/iMessage/Webhooks), Dispatch, Slack | claude-code-on-the-web, remote-control, channels, slack | nur Abo; Remote Control/Channels bei Team/Enterprise admin-enabled; Computer use + Dispatch nur Pro/Max | Live-Ansicht + Stopp von überall; Ereignis-Eingänge |
| Chrome-Extension, Computer use | chrome, computer-use | nur Abo (Computer use: Pro/Max) | Browser-Automation ohne Fremd-MCP |
| Advisor (Eskalation harter Entscheidungen), Ultrareview, Code Review, Artifacts | advisor, ultrareview, code-review, artifacts | Advisor: Abo + Console; Ultrareview: Abo; Code Review: Team/Enterprise; Artifacts: Pro+ | Advisor = eingebaute Gegenstimme-Stufe; Artifacts = Sichtbarkeit nach außen |
| Fast mode | fast-mode | Abo (Team/Enterprise owner-enabled), Console provisioned; **nicht** auf Bedrock/Vertex/Foundry | nur für interaktive Engpässe (2× Preis) |
| Auto mode, Permission modes, managed settings | auto-mode-config, permission-modes | Auto mode auf 3P nur Sonnet 5 / Opus 4.7+ / Fable | Zustimmung im Design → `bypassPermissions`/auto + Guard-Hook |
| `/usage` (Attribution je Skill/Subagent/MCP, Behavior-Flags), `/insights`, `/context`, `/cost` | costs | Abo/API | Selbstmessung des Verbrauchs = Datenquelle für N4 |
| Gateways (`ANTHROPIC_BASE_URL`), LLM-Gateway, Claude apps gateway | gateways, llm-gateway | überall | **Achtung:** nicht-first-party Base-URL schaltet Remote Control, server-managed settings ab; Tool Search default aus |

Zwei Befunde mit Design-Gewicht: (1) **Die Provider-Achse bestimmt das Feature-Set**, nicht die Modellstärke — ein Nutzer mit Bedrock-Key hat kein Web Search, keine Routines, keinen Advisor, keine Channels („Alternatives: for scheduling, use `/loop` instead of `/schedule`“). Das Profil muss deshalb `provider` als eigenes Feld führen. (2) **Der Gateway-Fall ist real:** Diese Session läuft mit gesetztem `ANTHROPIC_BASE_URL` (Probe §2.3) — der Preflight muss daraus ableiten, welche Fähigkeiten fehlen, statt sie im Plan vorauszusetzen.

#### 2.2.2 Andere Agenten-CLIs und IDEs

| Werkzeug | Zugang | Kosten | Autonomiefähigkeit | Quelle |
|---|---|---|---|---|
| **Codex CLI** | `curl -fsSL https://chatgpt.com/codex/install.sh \| sh`, `npm i -g @openai/codex`, `brew install --cask codex`; Login „Sign in with ChatGPT“ (Plus/Pro/Business/Edu/Enterprise) oder API-Key; Config `~/.codex/config.toml`; macOS arm64/x86_64, Linux x86_64/arm64 | im ChatGPT-Abo enthalten (Kontingente §2.1.2) oder API-Token | `codex exec` für nicht-interaktive Läufe → **Sol-Gate-Aufruf skriptbar** (SOULs `gates/sol.sh` nutzt genau das) | github.com/openai/codex |
| **Gemini CLI** | Google-Login / API-Key / Vertex | Kontingente §2.1.3; Free-Pfad seit 18.6.2026 unsicher | `gemini -p` [unverifiziert Flag]; MCP-Client | geminicli.com |
| **Cursor** | Hobby $0 (limitierte Agent-Requests), Pro $20, Pro+ „3x Pro limits“, Ultra „20x Pro limits“, Teams $40/User (Premium 5×), Enterprise | Abo; „Bugbot on usage-based billing“ | „MCPs, skills, and hooks“, „Cloud agents“ — IDE-gebunden, nicht headless-skriptbar aus Soul heraus | cursor.com/pricing |
| **Windsurf** | nicht abgerufen | — | — | [keine Quelle in dieser Front] |

#### 2.2.3 Browser, Git/GitHub, Deployment, Datenbanken

- **Browser:** `npx @playwright/mcp@latest` (Node ≥18, `npx playwright install chromium`); `npx -y chrome-devtools-mcp` (Chrome DevTools Protocol, Performance/Debugging); beide gratis, lokal, MCP; Alternative ohne Fremd-MCP: Claude-Code-Chrome-Extension (nur Abo) bzw. API-Browser-Toolset (~6.600 Tokens Overhead/Request). Auf dieser Maschine ist `playwright` bereits installiert (Probe).
- **Git/GitHub:** `gh` CLI (kontexteffizienter als MCP laut Claude-Doku) oder der **gehostete GitHub-MCP-Server** `https://api.githubcopilot.com/mcp/` (GA seit 2025-09-04, OAuth 2.1 + PKCE, keine lokale Installation). Probe zeigt `GH_TOKEN`/`GITHUB_TOKEN` gesetzt, aber kein `gh` → Preflight muss Credential-Name und Binary getrennt bewerten („Token ohne Werkzeug“ → Werkzeug nachinstallieren, nicht Nutzer fragen).
- **Deployment (Sekundärquellen, Stand 2026):** Vercel Hobby: 100 GB Fast Data Transfer/Monat, 100K Function-Invocations, 10 s Ausführung, 1 gleichzeitiger Build; Projekt wird bei Überschreitung **pausiert** (kein Overage); nicht-kommerzielle Klausel. Netlify Free: **300 Credits/Monat hartes Limit** über fünf Meter (Deploys, Compute, Bandwidth, Requests, AI Inference), Pause bei Erreichen. GitHub Pages: statisch, gratis für öffentliche Repos [unverifiziert]. Eignung: Prototypen und Miguel-für-alle-Artefakte; nichts, was nachts pausiert werden darf.
- **Datenbanken:** Supabase Free (Sekundär): 2 Projekte, 500 MB DB, 1 GB Storage, 5 GB Egress, 50K MAU, **Pause nach 7 Tagen ohne DB-Request** (manuelles Unpause). SQLite: lokal, $0, kein Pausenrisiko — richtiger Speicher für Gedächtnis und Atlas (SOUL nutzt SQLite+FTS5). Postgres-Client `psql` ist hier vorhanden.

#### 2.2.4 Recherche, Office, Kommunikation, Speicher, MCP-Ökosystem

- **Recherche:** Anthropic Web Search $10/1.000 Suchen (API) bzw. im Abo enthalten; Web Fetch gratis; Gemini Google-Search-Grounding 5.000 Requests/Monat gratis auf 3.x; Fachdatenbanken als **claude.ai-Connectors** (in dieser Session sichtbar: Scite, Consensus, PubMed, bioRxiv, Elicit, ChEMBL) — laden „only when your claude.ai subscription is the active authentication method“ (feature-availability) → im API-Key-Modus unsichtbar; der Preflight muss Connectors zur Laufzeit zählen (`ListMcpResourcesTool`/`/mcp`), nicht annehmen.
- **Office/Design:** Anthropic-Skills docx/pptx/xlsx/pdf, Artifacts, Design-Canvas, Dataviz (als Skills in dieser Session gelistet) — Abo-gebunden, sonst als eigene Skills nachrüstbar.
- **Kommunikation/Speicher:** Gmail, Slack, Google Drive, Dropbox als Connectors (hier sichtbar); Slack zusätzlich als Claude-Code-Oberfläche (`@Claude`).
- **MCP-Registry:** registry.modelcontextprotocol.io — „community driven registry service“, „app store for MCP servers“; API-Freeze v0.1 seit 2025-10-24 („no breaking changes“), Status weiterhin „preview“; Veröffentlichung via `mcp-publisher`, Namensräume mit Eigentumsnachweis (`io.github.<user>/…`, DNS/HTTP für Domains); GitHub spiegelt Einträge unter `github.com/mcp/<namespace>`. Die Registry ist **Discovery, keine Qualitätsprüfung** — dieselbe Regel wie SOULs `ECOSYSTEM-CANDIDATES` für Awesome-Listen („Nur Discovery-Quelle, nie ungeprüft kopieren oder automatisch aktivieren“).

### 2.3 Erkennung des Nutzerprofils — mit realer Probe

**Probe auf dieser Maschine (Bash, 2026-09-06), wörtlich:** `claude` 2.1.261 vorhanden; `codex`, `gemini`, `ollama`, `lms`, `gh`, `brew`, `vercel`, `netlify`, `supabase`, `sqlite3` **fehlen**; vorhanden: git, node 22.22.2, npm/npx, python 3.11.15, uv, pip, docker, jq, rg, curl, psql, playwright. OS Linux 6.18 x86_64, 4 Kerne, 15 GiB RAM, 30 GB frei, keine NVIDIA-GPU. Umgebungsvariablen (nur Namen): `ANTHROPIC_BASE_URL`, `GH_TOKEN`, `GITHUB_TOKEN`, `CLOUDSDK_AUTH_ACCESS_TOKEN`, `MAX_THINKING_TOKENS`; keine `OPENAI_/GEMINI_/GROQ_/CEREBRAS_`-Keys. `~/.claude.json` vorhanden ohne `mcpServers`; `~/.codex`, `~/.gemini`, `~/.ollama` fehlen; `/home/user/soul/.mcp.json` leer (bestätigt R14-Befund 6). `api.anthropic.com` erreichbar (HTTP 404 auf `/` = Host antwortet).

**Was daraus automatisch folgt, ohne eine Frage:** Provider = Gateway (Base-URL gesetzt → Remote Control, server-managed settings aus, Tool Search default aus); GitHub-Zugang vorhanden, Werkzeug `gh` fehlt → installieren; lokale Modelle: Klasse `none/small`; Browser-Automation sofort möglich (playwright + node); Docker vorhanden → Sandboxes und Ollama-Container möglich, aber ohne GPU; Codex/Gemini als Gegenstimme **nicht** verfügbar → Gegenstimme-Fallback auf Groq/Cerebras (braucht Key = Ring 2) oder Anthropic-Zweitfamilie (Opus vs Fable, schwächere Unabhängigkeit).

**Erkennungsschichten (jede geloggt, jede mit Zeitstempel):**

| Schicht | Quelle | Methode | Ring |
|---|---|---|---|
| L0 Hardware/OS | `uname`, `nproc`, `free`/`sysctl hw.memsize`, `nvidia-smi`/`system_profiler SPDisplaysDataType`, `df` | lesen | 0 |
| L1 Binaries + Versionen | `command -v` für claude, codex, gemini, ollama, lms, gh, git, node, python3, uv, docker, brew, playwright, vercel, netlify, supabase, sqlite3, psql | lesen | 0 |
| L2 Credentials **nur nach Namen** | `env \| cut -d= -f1`, Existenz von `~/.codex/auth.json`, `~/.gemini/`, `~/.config/gh/hosts.yml`, Keychain-Einträge nur zählen | nie Werte lesen/loggen | 0 |
| L3 Konfiguration | `~/.claude.json`, `~/.claude/settings.json`, `.mcp.json`, `~/.codex/config.toml`, `~/.gemini/settings.json`, `~/.cursor/mcp.json` → Server-Namen, Modell-Defaults, Hooks | lesen, Secrets maskieren | 0 |
| L4 Live-Proben | `claude -p "ok" --model haiku --max-budget-usd 0.02`; `codex exec "ok"`; `gemini -p "ok"`; `curl localhost:11434/api/tags`; `curl localhost:1234/v1/models` (LM Studio, Port [unverifiziert]); `GET /models` bei Groq/Cerebras/Mistral wenn Key-Name existiert | minimaler Aufruf, Antwort+Modell-ID loggen (Chrisos Roh-Artefakt-Zwang) | 0 |
| L5 Kontingent-Zustand | Claude: `/usage` nur interaktiv → aus Abo-Tier schätzen; API: Rate-Limit-Header; Gratis-Tiers: Header `x-ratelimit-*` | lesen | 0 |
| **L6 Ring 2 — einmal, gebündelt** | Abo-Stufen (Claude Free/Pro/Max5/Max20/Team; ChatGPT Free/Go/Plus/Pro100/Pro200; Google AI Pro/Ultra; Cursor), monatliches Geldbudget für API, gewünschte Privatheitsklassen je Datenart, Bereitschaft zu Gratis-Konten (Groq, Cerebras, Mistral, Gemini-API-Key), vorhandene aber nicht exportierte Keys | **fragen**, mit Default je Frage („keine Antwort = …“) | 2 |

Prinzip: **Alles, was ein Skript feststellen kann, wird nie gefragt; alles, was gefragt wird, wird nie zweimal gefragt** (Antworten landen im Profil mit `asked_at`). Konto-Anlage und Key-Beantragung bleiben Ring 2 (Kontext §11b), aber der Dirigent bereitet sie vor: Er nennt in der Bündelfrage den konkreten Nutzen („Cerebras-Key: 1M Tokens/Tag gpt-oss-120b gratis = Bulk-Prüfer ohne dein Claude-Kontingent“).

### 2.4 Auswahllogik

**Drei Währungen, getrennt gebucht.** (1) API-Dollar: linear, unbegrenzt, planbar → Budgetgrenze pro Vorhaben. (2) Abo-Fenster: 5-h-Fenster + Wochenkappe, **verfallend** — ungenutztes Kontingent ist verloren, also Bulk-Arbeit *vor* Fenster-Reset legen, nicht danach; modellfamilien-spezifische Limits („Opus limit“) erlauben Weiterarbeit durch Familienwechsel. (3) Gratis-Tiers: Tages-/Minutenkappen, Reset täglich; RPM bestimmt die Parallelität (Cerebras 5 RPM → genau ein Worker; Groq 10–30 RPM → bis 3 Worker = Chrisos Wellen-Regel aus der Provider-Physik abgeleitet, nicht als Vorsatz).

**Rollen × Kandidaten (Standardordnung; überschrieben durch gemessene Passung N4, sobald n ≥ 20 pro Zelle):**

| Rolle (Ebene) | Anforderung | 1. Wahl | 2. | 3. | Nie |
|---|---|---|---|---|---|
| Dirigent (1) | stärkstes Tool-Use-Modell, langer Kontext, 1M bei großen Projekten | Fable 5.1 (Abo Max / API) | Opus 5 | Sonnet 5; gpt-5.6-sol via Codex | lokale Modelle, Gratis-Tiers |
| Gegenstimme (2, Sol-Gate) | **andere Familie/anderer Anbieter** als Dirigent | gpt-5.6-sol (Codex-Abo) | Gemini 3.8 Flash / 2.5 Pro (Free Tier, Grounding gratis) | gpt-oss-120b (Cerebras/Groq gratis) → Opus 5 (gleicher Anbieter, mit Vermerk „reduzierte Unabhängigkeit“) | dasselbe Modell wie Dirigent |
| Prüfer (2) | darf **nicht** Erzeuger des Artefakts sein (Beleg ≠ Urteil); JSON-Verdict | Opus 5 | Sonnet 5 | gpt-5.6-terra; Gemini Flash | Erzeuger-Modell |
| Planer (2) | Struktur, Vertrag, Abnahmekriterien | Opus 5 | Fable (wenn Dirigent Opus) | Sonnet 5 | Haiku |
| Ausführende (3–4) | Code/Text bauen, Tool-Use | Sonnet 5 ($2/$10) | gpt-5.6-terra | Gemini 3.8 Flash ($0,75/$3,75) | — |
| Bulk/Klassifikation/Entropie-Sonde (5–6) | billig, viele Aufrufe | Haiku 4.5 | gpt-5.6-luna, Gemini Flash-Lite | Groq/Cerebras gpt-oss, lokal | Fable/Opus |
| Deterministisches | Format, Lint, Tests, Diff, Hash | **kein Modell** — Hook/Skript | — | — | jedes Modell |

**Achsen-Regeln:**
- *Qualität*: unbekanntes Modell = „strong“ behandeln (modelTier-Lehre), aber **nach 3 Läufen messen** statt nach Namen raten; Frame-Stufe nach N5 (voll/reduziert/keine) nur, wenn Entropie@3 Nutzen prognostiziert (AUC 0,968); Deckeneffekt: Modelle mit ≥93 % Baseline bekommen keinen Frame.
- *Kosten*: Selbstkonsistenz@3 auf Sonnet ($6/$30 effektiv) vor Einzelaufruf Fable ($10/$50) — Chrisos Gegenbefund macht das zur Pflichtprüfung; Cache-Disziplin: stabiler Präfix (Kernel, Atlas-Scheibe, Dossier) vor variablem Teil, 1h-TTL im Abo; Batch −50 % für alles ohne Zeitdruck (Atlas-Pflege, Gedächtnis-Konsolidierung, Auswertung von Logs).
- *Kontingent*: Ampel je Währung (grün <50 %, gelb <80 %, rot); bei gelb Bulk auf Gratis/Batch umlenken, bei rot Familienwechsel oder `autoContinueAtUsageLimit`-Wartezeit **eingeplant** statt erlitten.
- *Latenz*: Groq/Cerebras für kurze Prüf- und Klassifikationsaufrufe (schnellste Inferenz); Fast mode (2×) nur, wenn ein Mensch wartet.
- *Datenschutz* (Klassen im Profil): P0 öffentlich → jeder Anbieter; P1 intern → First-Party-APIs (Anthropic/OpenAI/Google) ohne Gratis-Tiers mit Trainingsvorbehalt [Trainingsklauseln in dieser Front nicht geprüft]; P2 privater Miguel-Speicher → nur lokal oder Anthropic-First-Party nach ausdrücklicher Zustimmung im Onboarding; P3 Secrets → nie an ein Modell (Guard blockt pfad-exakt, R14 B1).
- *Determinismus*: Prüfer mit `temperature 0` wo verfügbar; Mehrheitsentscheid 3 Prüfer bei irreversiblen Schritten (`irreversible`-Signal aus `signals.ts`).

**Fallback-Ketten (Auslöser → Aktion):** HTTP 429/„session limit“ → nächste Familie gleicher Rolle; „weekly limit“ → Rolle auf API-Dollar oder Gratis-Tier umlegen, Rest planen; Kontext-Überlauf → 1M-Modell (Claude ≥4.6 ohne Aufpreis) statt Kompaktion, wenn Verlust teuer; Tool-Call-Fehler ×2 → anderer Anbieter; Gateway ohne Web Search → WebFetch mit Ziel-URL (offizielle Alternative laut feature-availability) oder Gemini-Grounding; Gratis-Tier 403/„discontinued“ → Atlas-Eintrag `contradicted`, Alternative aus Kette.

**Auswahl loggen und messen (N4):** jeder Modellaufruf schreibt `selection` (task_id, role, signals, candidates[], chosen, reason_codes[], predicted{quality,cost,latency}, currency, quota_state) und nach Abschluss `outcome` (tokens_in/out/cached, cost_usd, latency_ms, verdict des Prüfers, retracted?). Aus (model, role, signal-Bündel) entsteht eine laufende Passungsmatrix mit n und Konfidenzintervall; sie überschreibt die Standardordnung erst ab n ≥ 20 und nicht-überlappenden Intervallen — sonst bleibt der Default (Chrisos Regel: Einzelmessungen wertlos, ab 3 Läufen belastbar; bei Modellpassung sind 3 zu wenig, weil Aufgabenmischung streut).

### 2.5 Pflege des Atlas

**Befund:** Innerhalb dieser einen Recherche fanden sich vier Veraltungen in Echtzeit — Sonnet-5-Preiserhöhung abgesagt (Notiz auf der Preisseite), Claude-Code-Wochenbonus endet 14.9. und wird +25 % dauerhaft (Sekundär), Gemini-CLI-Free-Pfad „replaced by Antigravity CLI on June 18th“, DeepSeek-Preise Faktor 2 in sechs Wochen, Gemini-3.x-Flash-Preise mit fest terminierter Erhöhung zum 1.1.2027. Ein statischer Atlas ist am Tag seiner Fertigstellung teilweise falsch. Deshalb ist der Atlas **kein Dokument, sondern eine Gedächtnistabelle mit Verfall** (Säule 1, Kontext §12): jeder Eintrag trägt `source_url`, `verified_at`, `stale_after`, `confidence`, `status ∈ {verified, secondary, contradicted, expired}`, `last_probe`.

**Pflegeprotokoll (Entwurf, Details §3.5):** Quellenliste = die offiziellen URLs aus §5 mit je einem Extraktions-Prompt; wöchentliche Routine (Cloud, wenn Abo; sonst Desktop Scheduled Task oder `/loop` beim Start) holt jede Seite per WebFetch (kostenlos), hasht den Inhalt, extrahiert Zahlen mit Haiku (Batch, −50 %), vergleicht mit dem Bestand, schreibt Änderungen als `supersedes`-Einträge (keine Mutation — SOUL-Gedächtnis-Lehre); **Laufzeitproben schlagen Dokumente** (Beleg ≠ Urteil): sagt die Doku „free tier yes“ und die Probe 403, wird der Eintrag `contradicted` und die Auswahl nutzt die Probe; Verfallsfristen: Preise 14 Tage, Kontingente 7 Tage, Gratis-Tier-Existenz 1 Tag (Probe), Feature-Matrix 30 Tage; Sekundärquellen nur als Hinweis (`confidence 0.5`), nie als Auswahlgrundlage ohne Probe.

