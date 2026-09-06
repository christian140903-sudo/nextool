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

1. **Drei nicht addierbare Währungen.** API-Dollar (linear, Token-Bucket, Monats-Cap $500/$1.000/$200K je Tier), Abo-Fenster (5 h + Wochenkappe, verfallend, Familien-Limits getrennt) und Gratis-Tiers (RPM/RPD/TPD, Reset täglich). Die Auswahl muss sie getrennt buchen; ein Atlas-Eintrag ohne `currency` ist ungültig. (platform.claude.com pricing + rate-limits; code.claude.com/costs; groq; cerebras — §2.1, §2.4, §3.1)
2. **Cache ist Kontingent, nicht nur Ersparnis.** Cache-Hits zählen nicht auf ITPM („2M ITPM bei 80 % Hit = effektiv 10M/Minute“); Fable 5.1 Hit 0,025×; TTL 1 h im Abo, 5 min auf Usage Credits. Stabiler Präfix ist damit Kontingent-Multiplikator. (rate-limits, pricing, costs — §2.1.1, §2.1.8, S9)
3. **Limits sind familien- und modellgetrennt.** Fable/Mythos/Opus 4.x/Opus 5/Sonnet 5 haben je eigene API-Töpfe; im Abo unterscheidet die Fehlermeldung „Opus limit“ (Familienwechsel hilft) von „session/weekly limit“ (hilft nicht). Fallback-Ketten wechseln daher die Familie, nicht die Größe. (rate-limits Fußnoten 1–3; costs — §2.1.8, S8, S13)
4. **Die Provider-Achse bestimmt das Feature-Set, nicht die Modellstärke.** Gateway/Bedrock/Vertex/Foundry ohne Web Search, Routines, Advisor, Remote Control, Channels; Connectors nur bei Abo-Auth. Diese Session läuft real über `ANTHROPIC_BASE_URL` — das Profil führt `provider` und `features_missing` als Pflichtfelder. (feature-availability; Probe §2.3 — §2.2.1, §3.2)
5. **Gratis-Bulk existiert real und ist parallelitätsbegrenzt.** Cerebras: gpt-oss-120b 1M TPD bei 5 RPM (ein Worker); Groq: 10–30 RPM, ≤500K TPD, Whisper gratis; Gemini-API Free Tier für alle gelisteten Modelle plus 5.000 Grounding-Suchen/Monat. Dasselbe offene Modell auf zwei Anbietern ist ein natürlicher Fallback; die Wellen-Regel (2–3 Agenten) folgt aus RPM, nicht aus Vorsatz. (cerebras, groq, ai.google.dev — §2.1.3–2.1.4, S7)
6. **Gegenstimme:** `codex exec` macht das Sol-Gate skriptbar; Abo-Kontingente sind nur sekundär belegt (≈10–100 Sol-Nachrichten je 5 h auf Plus); gpt-5.6-sol per API kostet $4/$20 ohne Fenster. Ohne jedes Zweitmodell bleibt Selbstkonsistenz@3 Pflicht — der gemessen stärkste Gegner. (github.com/openai/codex; developers.openai.com; Kontext §3 — §2.1.2, S3)
7. **Gemini-CLI-Gratispfad ist widersprüchlich** („replaced by Antigravity CLI on June 18th“ vs. „eingestellt“) — nur eine Laufzeitprobe entscheidet; der Atlas führt den Eintrag `contradicted`. (geminicli.com — §2.1.3, §4 Nr. 2)
8. **Lokal:** gpt-oss-20b braucht ~16 GB, gpt-oss-120b 80 GB VRAM; LM Studio nur Apple Silicon oder x64+AVX2, kein Intel-Mac. Diese Maschine (15 GiB, keine GPU) ist Klasse `small`: lokale Modelle sind Datenschutz-Stufe (P2) und Entropie-Sonde, nie Dirigent. (gpt-oss, lmstudio.ai; Probe — §2.1.6)
9. **Der Atlas veraltet in Wochen** — fünf Veraltungen in einer einzigen Recherche (Sonnet-5-Erhöhung abgesagt; Wochenbonus endet 14.9.; Antigravity; DeepSeek ×2 in sechs Wochen; Gemini-3.x-Erhöhung zum 1.1.2027). Deshalb ist er eine Gedächtnistabelle mit `verified_at`, `stale_after`, `probe`, `supersedes` und `status` — kein Dokument. (§2.5, §3.1, §3.5)
10. **Erkennung ohne Fragen, Ring 2 einmal gebündelt.** L0–L5 (Hardware, Binaries, Credential-Namen, Configs, Proben, Header) sind skriptbar und werden nie gefragt; Ring 2 (Abos, Budget, Gratis-Konten, Datenschutzklassen, Publikationsziele) wird einmal mit Default und Nutzen gefragt und mit `asked_at` gespeichert. Probe: GitHub-Token ohne `gh` → installieren, nicht fragen. (Kontext §11b; Probe — §2.3, §3.3)
11. **Auswahl ist ein geloggter, gemessener Mechanismus** (S1–S15): Währung vor Modell, Rolle bestimmt Klasse, Unabhängigkeit der Gegenstimme, Datenschutz als Filter, Deterministisches nie an ein Modell, jede Wahl mit `predicted` und `outcome` aufgelöst (N4/N3); Passungsmatrix überschreibt Vorbelegung erst ab n ≥ 20 je Zelle. (§2.4, §3.4)
12. **Erz-Bilanz:** `doctor.py` (eine hartkodierte Modell-Probe), `preflight.md` (Ring 1/2 als Prosa), `forschung-2026-09.md` (Fließtext mit KORREKTUR-Sektion) wollten Echtheit, Trennung und Wissen — Soul 10 erreicht dasselbe mit Profil (TTL + Basis), Atlas (Verfall + Probe) und Selektion (Log + Kalibrierung). Alles „so gebaut, dass …“, gemessen wird es erst in der Evaluation. (§3 Einleitung, §13)

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

#### 2.1.8 Nachtrag: Anthropic-API-Ratenlimits (Quelle: platform.claude.com/docs/en/api/rate-limits, Abruf 2026-09-06)

Die vom Vorgänger offen gelassene Rate-Limits-Seite liefert die harten Zahlen für die Währung „API-Dollar“:

| Tier | Monats-Cap | Fable 5.x RPM / ITPM / OTPM | Opus 5, Sonnet 5, Haiku 4.5 RPM / ITPM / OTPM |
|---|---|---|---|
| Start | $500 | 1.000 / 500K / 100K | 1.000 / 2M / 400K |
| Build | $1.000 | 2.000 / 1,5M / 300K | 5.000 / 5M / 1M |
| Scale | $200.000 | 4.000 / 4M / 800K | 10.000 / 10M / 2M |
| Custom | kein Cap | verhandelt | verhandelt |

Regeln mit Design-Gewicht:
- Neue Organisationen können in einem **Evaluation-Tier** „with limits below the standard limits“ starten — der Atlas darf für einen frischen API-Key nicht die Start-Werte annehmen, sondern muss die Header lesen. Alle Tabellenwerte sind „maximum allowed usage, not guaranteed minimums“.
- **Cache-aware ITPM:** „only uncached input tokens count toward your ITPM rate limits“ (`cache_read_input_tokens` zählen nicht; Ausnahme Haiku 3.5). Beispiel der Seite: 2M ITPM bei 80 % Cache-Hit = effektiv 10M Input/Minute. → Cache-Disziplin ist nicht nur Kostensparen, sondern **verfünffacht bis verzehnfacht das Kontingent**.
- **Limits sind pro Modell getrennt** („you can use different models up to their respective limits simultaneously“); Fable 5.1 und Fable 5 teilen einen Topf, Mythos einen eigenen, Opus 4.x einen gemeinsamen, Opus 5 und Sonnet 5 je eigene. → Bei Fable-Erschöpfung ist Opus 5 ein *vollständig unabhängiger* Topf, nicht nur eine schwächere Stufe.
- Token-Bucket statt Fenster-Reset; der Spend-Cap-429 kommt **ohne** `retry-after` und mit `error.details.error_code: enforced_spend_limit_reached` — die Fallback-Logik muss diesen Fall vom gewöhnlichen 429 unterscheiden (Warten hilft bis zum 1. des Folgemonats nicht). Selbst gesetzte Limits liefern HTTP 400 `invalid_request_error`.
- Header `anthropic-ratelimit-{requests,tokens,input-tokens,output-tokens}-{limit,remaining,reset}`, `retry-after`, `anthropic-workspace-id`; programmatisch zusätzlich die Rate-Limits-API. → Schicht L5 (Kontingent-Zustand) ist für API-Keys **exakt** lesbar, nicht geschätzt — jeder Aufruf liefert den Zustand gratis mit.
- Batch-API: eigene RPM (1.000/2.000/4.000), Warteschlangen-Kappen 200K/300K/500K Requests, max. 100.000 Requests pro Batch. Fast mode: eigene Limits (`anthropic-fast-*`), nur Opus 5 / 4.8. „Claude Platform on AWS“: Start-Tier ohne automatischen Aufstieg, kein Fast mode, keine Workspace-Limits.

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


## 3. Konsequenzen für das Design von Ordnung × SOUL

**Erz-Bilanz vorweg (Regel §13.1).** Das Original hatte drei Ansätze: `playbooks/preflight.md` („Bedarf denken, nicht raten“, Ring 1 selbst beschaffen, Ring 2 bündeln — richtige Absicht, aber Prosa ohne Mechanismus: kein Skript, kein Profil, keine Persistenz der Antworten), `core/doctor.py` (eine echte Modell-Probe gegen genau *ein* hartkodiertes Modell `claude-fable-5-1[1m]`, Z. 30, mit Cache — der Keim einer Erkennung, blind für alles außer Claude) und `knowledge/forschung-2026-09.md` (Werkzeugwissen als personengebundener Fließtext, dessen KORREKTUR-Sektion den Verfall selbst beweist, R14 §2.4). Wo sie stehen blieben: Wissen ohne Verfall, Probe ohne Profil, Ring 2 ohne Gedächtnis. Was Soul 10 anders macht: Der Atlas ist eine **Gedächtnistabelle mit Verfall und Proben**, das Profil ist **eine Datei, die Starter, Guard, Gegenstimme und Auswahl lesen**, und die Auswahl ist ein **geloggter, gemessener Mechanismus** (N4) — nicht die Ermahnung „nutze das Beste“.

### 3.1 Atlas als Datenstruktur und konsolidierte Tabelle

Ablage: `~/.soul/atlas/` (Plugin-Datenpfad, R14 Ä5), git-versioniert, ein YAML je Anbieter (`anthropic.yaml`, `openai.yaml`, `google.yaml`, `groq.yaml`, `cerebras.yaml`, `mistral.yaml`, `deepseek.yaml`, `local.yaml`, `tools.yaml`, `services.yaml`) plus `index.yaml` (Version, Quellenliste, letzte Pflege). Eintrags-Schema — jedes Feld Pflicht, sonst ist der Eintrag ungültig:

```yaml
- id: anthropic/sonnet-5/api
  kind: model            # model | tool | tier | feature | service
  provider: anthropic
  access: api            # api | subscription | free_tier | local | bundled
  currency: api_usd      # api_usd | sub_window | free_daily | local_compute
  price: {in: 2.00, out: 10.00, cache_write_5m: 2.50, cache_write_1h: 4.00, cache_hit: 0.20, batch_in: 1.00, batch_out: 5.00, unit: usd_per_mtok}
  limits: {rpm: 1000, itpm: 2000000, otpm: 400000, window: token_bucket, tier: start, cache_counts_itpm: false}
  capabilities: [tool_use, context_1m, json_schema, thinking, batch, web_fetch]
  privacy_max: P1        # höchste Datenschutzklasse, die hierhin darf
  roles: {ausfuehrend: 1, pruefer: 2, planer: 3, dirigent: 3, bulk: 2, gegenstimme: 0}   # 0 = nie, 1 = erste Wahl (Vorbelegung)
  probe: {cmd: "claude -p ok --model claude-sonnet-5 --max-budget-usd 0.02", expect: model_id, last_result: null, last_at: null}
  source: {url: "https://platform.claude.com/docs/en/about-claude/pricing", kind: official, verified_at: "2026-09-06"}
  stale_after: 14d       # Preise 14d · Kontingente 7d · Gratis-Tier-Existenz 1d · Feature-Matrix 30d
  confidence: 0.9        # official 0.9 · official+probe 1.0 · secondary 0.5 · contradicted 0.2
  status: verified       # verified | secondary | contradicted | expired | retired
  supersedes: null       # id@verified_at des Vorgängereintrags — nie mutieren
  notes: "Preiserhöhung auf $3/$15 zum 1.9.2026 abgesagt (Seitennotiz)."
```

Vier Entwurfsentscheidungen: (1) `currency` ist Pflicht, weil die drei Währungen nicht addierbar sind (§2.4). (2) `roles` ist *Vorbelegung*, die die Passungsmatrix (N4) überschreibt — der Atlas trägt Defaults, das Gedächtnis trägt Messungen. (3) `probe` macht jeden Eintrag falsifizierbar (Beleg ≠ Urteil). (4) `supersedes` statt Überschreiben, damit Preisverläufe (DeepSeek Faktor 2 in sechs Wochen) sichtbar bleiben und Kalibrierung (N3) möglich wird: Der Atlas sagt vor jedem Vorhaben dessen Kosten vorher; das Ergebnis-Log löst die Vorhersage auf.

**Konsolidierter Atlas (Stand 2026-09-06; Details und Quellen in §2; Sekundärwerte *kursiv*):**

| Kategorie | Angebot | gratis | bezahlt | Limits (Kern) | Eignung (Ebene/Rolle) | Quelle |
|---|---|---|---|---|---|---|
| Claude API | Fable 5.1 | nein (Startguthaben) | $10/$50, Cache-Hit $0,25 | Start 1.000 RPM / 500K ITPM, Cap $500/Monat | E1 Dirigent; E2 Prüfer bei hohem Einsatz | pricing, rate-limits |
| Claude API | Opus 5 | nein | $5/$25 | 1.000 RPM / 2M ITPM, eigener Topf | E2 Planer/Prüfer; E1 unter Knappheit | dito |
| Claude API | Sonnet 5 | nein | $2/$10 | 2M ITPM, eigener Topf | E3–4 Ausführende (Standard) | dito |
| Claude API | Haiku 4.5 | nein | $1/$5 | 2M ITPM | E5–6 Bulk, Signale, Entropie-Sonde | dito |
| Claude Abo | Free | ja | — | kein Claude Code | für Soul 10 unbrauchbar | claude.com/pricing |
| Claude Abo | Pro $20 / Max $100+ | — | 5-h-Fenster + Wochenkappe; *≈45/225/900 Nachrichten je Fenster* | Familien-Limits getrennt (Opus/Sonnet) | Dirigent-Session, Routines, Remote Control, Advisor | pricing, code.claude.com/costs, *Sekundär* |
| OpenAI API | gpt-5.6-sol / terra / luna | nein | $4/$20 · $2/$12 · $0,20/$1,20; Cached 0,1×; Batch −50 % | nicht abgerufen | Gegenstimme (sol), E3–4 (terra), Bulk (luna) | developers.openai.com |
| ChatGPT-Abo + Codex | Plus $20 / Pro $100–200 | Free enthält Minimum | *10–100 Sol-Nachrichten je 5 h (Plus) bis 2.000 Luna* | ein Pool für CLI/IDE/Cloud | Gegenstimme via `codex exec` | github.com/openai/codex, *Sekundär* |
| Google | Gemini CLI (Login) | *1.000 Req/Tag — Pfad seit 18.6.2026 unsicher* | AI Pro/Ultra 1.500/2.000 | Modell-Routing intransparent | Gegenstimme mit Grounding | geminicli.com |
| Google | Gemini API Free Tier | ja, alle gelisteten Modelle; 250 Req/Tag Flash unbezahlt | 3.8 Flash $0,75/$3,75 (bis 31.12.26) | RPM/TPM nur im AI-Studio-Dashboard | Gegenstimme, Bulk, Websuche gratis (5.000/Monat) | ai.google.dev |
| Gratis-Inferenz | Cerebras gpt-oss-120b | ja: 1M TPD, 5 RPM | PAYG ohne Tageslimit | 5 RPM → 1 Worker | Bulk-Prüfer, Entropie-Sonde | inference-docs.cerebras.ai |
| Gratis-Inferenz | Groq gpt-oss-120b/20b, qwen3.x, whisper | ja: 10–30 RPM, ≤500K TPD | Developer-Plan | TPD-Kappe | Klassifikation, Kurzprüfung, Sprach-Input | console.groq.com |
| Gratis-Inferenz | Mistral Free mode | ja, „included monthly usage“ (Zahlen nur im Konto) | PAYG darüber | unbekannt | Gegenstimme dritter Familie | docs.mistral.ai |
| Cloud günstig | DeepSeek V4 Flash/Pro | nein | *$0,14–0,66 / $0,28–1,98; Off-Peak −50 %* | *1M Kontext* | Bulk Off-Peak, nur P0 | api-docs.deepseek.com (Tabelle nicht erfasst), *Sekundär* |
| Lokal | gpt-oss-20b (Ollama/LM Studio) | ja | Hardware | ≥16 GB RAM; Apple Silicon oder x64+AVX2 | P2-Daten, Formatprüfer, Entropie-Sonde | github.com/openai/gpt-oss, lmstudio.ai |
| Lokal | gpt-oss-120b | ja | ≥80 GB VRAM | — | E3-Ausführender ohne Cloud | dito |
| Werkzeug | Claude Code (Subagents, Skills, Hooks, Workflows, Agent Teams, `-p`, Goal, Worktrees) | im Abo/API | Abo/API | Feature-Set hängt am Provider (Gateway/Bedrock ohne Web Search, Routines, Advisor) | Rückgrat E1–E6 | code.claude.com feature-availability |
| Werkzeug | Codex CLI, Gemini CLI, Cursor (Hobby $0 – Ultra) | teils | Abo | Cursor IDE-gebunden | Gegenstimme, Zweit-Ausführender | §2.2.2 |
| Werkzeug | Playwright MCP, Chrome DevTools MCP, `gh`, gehosteter GitHub-MCP | ja | — | Node ≥18 | Browser, Git ohne Kontext-Overhead | §2.2.3 |
| Dienst | Vercel Hobby, Netlify Free, Supabase Free, GitHub Pages | ja | Overage/Pläne | *Pause statt Overage; Supabase Pause nach 7 Tagen Inaktivität* | Prototypen, Miguel-für-alle-Artefakte | *Sekundär* |
| Dienst | SQLite | ja | — | keine | Gedächtnis, Atlas, Logs | SOUL core/memory.py |
| Dienst | Anthropic Web Search / Web Fetch / Code Execution | Fetch gratis; Code-Exec 1.550 h/Monat | Search $10/1.000 | — | Recherche, Atlas-Pflege | platform.claude.com pricing |
| Ökosystem | MCP-Registry; Connectors (Scite, PubMed, Drive, Gmail, Slack …) | Discovery ja / Connectors im Abo | — | Connectors nur bei Abo-Auth sichtbar | Fachrecherche, Kommunikation — zur Laufzeit zählen | registry.modelcontextprotocol.io, feature-availability |

### 3.2 Profil-Schema `~/.soul/profile.json`

Das Profil ist die *einzige* Stelle, an der Starter (R14 Ä5), Guard-Mandate (R14 §2.5), Gegenstimme-Backends (Ä7) und Auswahl (§3.4) ihre Parameter lesen. Drei Schichten (`device` → `user` → `project`; die speziellere überschreibt), und strikte Trennung von **beobachtet** (Skript), **geprobt** (Aufruf) und **erklärt** (Ring-2-Antwort) über das Feld `basis`.

```jsonc
{
  "schema": "soul-profile/1",
  "generated_at": "2026-09-06T…Z", "preflight_version": "…", "atlas_version": "<git-hash>",
  "user": { "name": null, "language": "de", "agent_name": "Miguel", "miguel_tier": "public" },      // public | full (Kontext §10)
  "device": {                                   // basis: observed · TTL 30d
    "os": "linux", "arch": "x86_64", "cpu_cores": 4, "ram_gb": 15, "gpu": null, "vram_gb": 0, "disk_free_gb": 30,
    "local_model_class": "small",               // none | small (≤9B) | medium (≤20B) | large (≥32 GB / ≥24 GB VRAM) | xl (≥80 GB VRAM)
    "network": { "proxy": true, "anthropic_reachable": true }
  },
  "runtime": {                                  // basis: observed · TTL 1d
    "claude_code": { "version": "2.1.261", "provider": "gateway", "auth": "api_key",   // first_party | gateway | bedrock | vertex | foundry · subscription | api_key
                     "features_missing": ["web_search", "routines", "remote_control", "advisor", "channels"] },
    "binaries": { "claude": "2.1.261", "git": "…", "node": "22.22.2", "python3": "3.11.15", "docker": "…", "playwright": "…",
                  "codex": null, "gemini": null, "ollama": null, "lms": null, "gh": null },
    "credentials_present": ["ANTHROPIC_BASE_URL", "GH_TOKEN", "GITHUB_TOKEN", "CLOUDSDK_AUTH_ACCESS_TOKEN"],   // nur Namen, nie Werte
    "configs": { "mcp_servers": [], "hooks": [], "skills": [], "connectors": [] }
  },
  "accounts": [                                 // je Zugang ein Eintrag · basis: observed | probed | declared | declared_willing | declared_declined | absent
    { "id": "anthropic/api", "kind": "api", "tier": "unknown", "basis": "probed",
      "probe": { "at": "…", "model_id": "claude-…", "ok": true },
      "quota": { "currency": "api_usd", "budget_month_usd": null, "headers_last": { "input_tokens_remaining": null, "reset": null } } },
    { "id": "anthropic/subscription", "kind": "subscription", "tier": "max20", "basis": "declared", "asked_at": "…", "expires_at": "+90d",
      "quota": { "currency": "sub_window", "window_h": 5, "weekly_cap": true, "state": "green", "reset_at": null } },
    { "id": "openai/codex", "kind": "subscription", "basis": "absent" },
    { "id": "google/gemini_api", "kind": "free_tier", "basis": "declared_willing" },
    { "id": "cerebras/free", "kind": "free_tier", "basis": "declared_declined" }
  ],
  "privacy": {                                  // basis: declared · Defaults konservativ
    "classes": { "P0": "public", "P1": "internal", "P2": "private_memory", "P3": "secrets" },
    "allowed": { "P0": ["*"], "P1": ["anthropic", "openai", "google"], "P2": ["local", "anthropic"], "P3": [] },
    "training_optout_confirmed": { "anthropic": null, "openai": null, "google": null }
  },
  "consent": {                                  // Zustimmung im Design (§11b): einmal, widerrufbar, im Monitor sichtbar
    "accepted_at": "…",
    "standing_mandates": ["install", "mcp_add", "repo_clone", "local_write", "own_remote_push"],
    "ring2_core": ["secrets-exfiltration", "zahlungen", "remote-loeschung", "soul-integritaet"],
    "ring2_project": { "extern-publizieren": ["github.com/<user>/*"], "prod-aenderung": [] },
    "ring2_answers": [ { "q": "codex_abo", "a": "no", "asked_at": "…", "default_used": false } ]
  },
  "selection": {                                // Vorbelegung + Verweis auf gemessene Passung
    "gegenstimme_backend": "self_consistency_3", // codex | gemini_cli | gemini_api | groq | cerebras | mistral | claude_other_family | self_consistency_3
    "max_concurrent_workers": 3, "isolation": false, "fit_matrix": "~/.soul/memory/fit.sqlite"
  },
  "history": [ { "at": "…", "event": "preflight", "changes": ["gh: absent → 2.x installed"] } ]
}
```

Regeln: **`declared` ohne `probe` ist keine Grundlage für teure Schritte** (erst Probe, dann Nutzung). `ring2_answers` verhindern Wiederholungsfragen (Verfall 90 Tage — Abos ändern sich). Secrets erscheinen nie; die Guard-Kategorie `secrets-exfiltration` prüft auch Preflight und Profil selbst. `miguel_tier` entscheidet, welcher Gedächtnisspeicher gemountet wird (öffentlicher Miguel vs. vollständiger Miguel, Kontext §10). `features_missing` wird nicht geraten, sondern aus `tools.yaml` (Feature-Availability-Matrix) × `provider`/`auth` abgeleitet. `atlas_version` im Profil und in jedem Auswahl-Log macht rückwirkend nachvollziehbar, mit welchem Wissensstand entschieden wurde.

### 3.3 Preflight-Routine

`soul preflight [--deep] [--project <pfad>]` — läuft bei Installation (voll), bei jedem Sitzungsstart (Delta aus Cache, <5 s) und vor jedem Vorhaben (Projektschicht). Zeitbudget ohne Proben <60 s, mit Proben <3 min; jede Probe ≤ $0,02. Ergebnis ist immer eine Datei (`profile.json` + `preflight.log` als JSONL mit Roh-Ausgaben), nie nur Terminaltext (Roh-Artefakt-Zwang, Kontext §3).

```
P0 Gerät (TTL 30d)       uname -sm · nproc | sysctl -n hw.ncpu · free -g | sysctl -n hw.memsize · nvidia-smi --query-gpu=memory.total --format=csv
                         | system_profiler SPDisplaysDataType · df -h $HOME
                         → device.* ; local_model_class nach Schwellen §2.1.6
P1 Binaries (TTL 1d)     for b in claude codex gemini ollama lms gh git node python3 uv docker brew playwright vercel netlify supabase sqlite3 psql:
                         command -v $b && $b --version
                         → runtime.binaries ; Credential vorhanden + Binary fehlt → Aufgabe „installieren“ (Ring 1, Standing Mandate `install`), keine Frage
P2 Credentials (Namen)   env | cut -d= -f1 | grep -E 'ANTHROPIC|OPENAI|GEMINI|GOOGLE|GROQ|CEREBRAS|MISTRAL|DEEPSEEK|TOGETHER|GH_|GITHUB|VERCEL|NETLIFY|SUPABASE'
                         test -e ~/.codex/auth.json ~/.gemini ~/.config/gh/hosts.yml ~/.ollama
                         → credentials_present ; Werte werden nie gelesen, nie geloggt ; der Guard-Hook überwacht den Preflight selbst
P3 Konfiguration (1d)    jq '.mcpServers|keys' ~/.claude.json .mcp.json · ~/.claude/settings.json (hooks, plugins) · ~/.codex/config.toml
                         · ~/.gemini/settings.json · ~/.cursor/mcp.json — Secrets maskiert
                         → runtime.configs ; Provider: ANTHROPIC_BASE_URL gesetzt → gateway ; CLAUDE_CODE_USE_BEDROCK/VERTEX/FOUNDRY → entsprechend ; sonst first_party
                         → features_missing aus tools.yaml
P4 Proben (1d, --deep    claude -p ok --model <stärkstes laut Atlas> --max-budget-usd 0.02 → model_id aus Antwort/Log (doctor.py-Lehre: --init-only validiert nichts)
   oder bei Delta)       codex exec "reply ok" · gemini -p ok · curl -s localhost:11434/api/tags · curl -s localhost:1234/v1/models
                         bei Key-Namen: GET …/v1/models bei Groq/Cerebras/Mistral (Berechtigung prüfen, kein Inferenzaufruf)
                         → accounts[].probe ; Widerspruch Doku ↔ Probe → Atlas-Eintrag `contradicted` (Beleg ≠ Urteil)
P5 Kontingent (Sitzung)  API: letzte anthropic-ratelimit-*-Header aus dem Ereignis-Log · Abo: Fensterzustand aus /usage-Parse oder Schätzung aus Tier + Verbrauchslog
                         · Gratis: x-ratelimit-*-Header → quota.state (Ampel), quota.reset_at
P6 Ring-2-Bündel         genau EINE Nachricht (Vorlage unten), nur bei Erstlauf, Verfall oder erkannter Änderung ; Antworten optional,
                         Arbeit läuft mit Defaults weiter ; Antworten → consent.ring2_answers mit asked_at
```

**Vorlage der Bündelfrage** — generiert aus Profil + Atlas, jede Zeile trägt Nutzen, Kosten und Default (Kontext §11b: nur das Nötigste, gebündelt):

> Ich habe deine Umgebung geprüft (`~/.soul/preflight.log`). Erkannt: Claude Code 2.1.261 über Gateway (kein Web Search, keine Routines), GitHub-Token ohne `gh` (installiere ich), Playwright vorhanden, 15 GB RAM ohne GPU (lokal nur kleine Modelle), kein Codex/Gemini/Ollama. Was ich nicht sehen kann und einmal frage — Schweigen wählt den Default:
> 1. Claude-Abo? [Free / Pro / Max5 / Max20 / Team / keins] — Default: keins → ich plane mit API-Budget.
> 2. Monatliches API-Budget in USD? — Default: 0 → nur Abo-Fenster und Gratis-Tiers.
> 3. Codex-/ChatGPT-Abo? [nein / Plus / Pro100 / Pro200] — Nutzen: unabhängige Gegenstimme ohne Claude-Kontingent. Ohne: Selbstkonsistenz@3 (gemessen stärkster Ersatz; kostet 3 Sonnet-Aufrufe je Gate).
> 4. Darf ich Gratis-Konten vorbereiten? [Gemini-API-Key / Cerebras / Groq] — Nutzen: 1M Tokens/Tag gpt-oss-120b (Cerebras) als Bulk-Prüfer; 5.000 Websuchen/Monat (Gemini). Default: nein.
> 5. Datenschutz: Projektdaten an Anthropic/OpenAI/Google (P1)? Private Gedächtnisdaten nur lokal (P2)? — Default: P1 ja, P2 nur lokal.
> 6. Publizieren/Prod: wohin darf ich ohne Rückfrage deployen? — Default: nur eigene GitHub-Repos, kein Prod.

**Gold-aus-Erz-Zeile:** `doctor.py` wollte sicherstellen, dass ein Modell *echt* läuft (richtig: die `--init-only`-Falle) und blieb bei einem Modell und drei Statusklassen stehen; `preflight.md` wollte Ring 1 von Ring 2 trennen und blieb Prosa. Soul 10 verallgemeinert beides zu einer **Profil-Erzeugung mit Verfall**: jede Feststellung hat TTL und Basis, jede Probe ist geloggter Beleg, jede Ring-2-Frage hat Default und Gedächtnis. Kill-Check: Jede Preflight-Zeile speist mindestens eine Regel in §3.4 — was keine Regel liest, wird nicht erhoben (Anti-Performance: der Preflight soll nicht gründlich *wirken*, sondern Entscheidungen speisen).

### 3.4 Auswahlregeln als Textbausteine für Kernel / conductor

Für den Ordnung-Kernel (Dirigenten-Schleife, Schritt 1 „Situieren“ und Schritt 4 „kleinste tragende Ebenenstruktur“, R14 §2.3) als versionierter Block `conductor/selection.md`. Jede Regel ist so formuliert, dass sie als Check in `conductor/select.py` implementierbar ist („Algorithmus schlägt Willensakt“); Regeln, die kein Check werden können, gehören nicht hinein.

```
SELECTION RULES v0.1 — Soul 10 · Ordnung-Kernel · conductor

S1  WÄHRUNG VOR MODELL. Bestimme zuerst die Währung des Schritts (api_usd | sub_window | free_daily | local_compute) aus
    profile.accounts und den Ampelzustand (grün <50 %, gelb <80 %, rot). Rot = Währung für diese Rolle gesperrt.
S2  ROLLE BESTIMMT KLASSE. dirigent → stärkstes Tool-Use-Modell, ≥200k Kontext, 1M bei großen Projekten · planer/pruefer → stark,
    read-only, kurze Läufe · ausfuehrend → mittlere Klasse · bulk → billigste Klasse mit JSON · deterministisch → KEIN Modell (Hook/Skript).
S3  UNABHÄNGIGKEIT DER GEGENSTIMME. gegenstimme ≠ Modell des Erzeugers UND ≠ Kontext des Erzeugers. Reihenfolge: anderer Anbieter >
    andere Familie gleicher Anbieter (Vermerk reduced_independence) > Selbstkonsistenz@3 in frischem Kontext. Ohne Zweitquelle ist
    Selbstkonsistenz@3 Pflicht — sie ist der gemessen stärkste Gegner des Frames (Kontext §3), keine Notlösung.
S4  BELEG ≠ URTEIL. pruefer hat das Artefakt nie erzeugt; temperature 0 wo verfügbar; bei Signal `irreversible` drei Prüfer aus zwei
    Familien, Mehrheit entscheidet, Minderheitsvotum wird geloggt.
S5  SELBSTKONSISTENZ-SCHRANKE. Vor Aufstieg einer Rolle in die teurere Klasse: liefert Selbstkonsistenz@3 der günstigeren Klasse bei
    gleichem Budget dasselbe? (Passungsmatrix; ohne Messung Aufstieg erlaubt, aber als Hypothese geloggt.)
S6  DATENSCHUTZ IST FILTER, NICHT GEWICHT. Kandidaten außerhalb profile.privacy.allowed[klasse] existieren für diesen Schritt nicht.
    P3 erreicht nie ein Modell; der Guard erzwingt es pfad-exakt.
S7  PARALLELITÄT AUS RPM. max_workers = min(profile.selection.max_concurrent_workers, floor(rpm_kandidat / rpm_je_worker)).
    Cerebras 5 RPM → 1 · Groq 30 RPM → 3 · Claude-API Start-Tier → durch ITPM begrenzt. Die Wellen-Regel ist Provider-Physik, kein Vorsatz.
S8  FENSTER-ÖKONOMIE. sub_window verfällt: Bulk vor dem Reset planen, nicht danach; Reset aus quota.reset_at. „Opus limit“/„Sonnet limit“
    → Familienwechsel; „session/weekly limit“ → Währungswechsel oder eingeplantes Warten (autoContinueAtUsageLimit), nie erlittenes.
S9  CACHE-DISZIPLIN. Stabiler Präfix (Kernel, Atlas-Scheibe, Dossier, Vertrag) vor variablem Teil; 1h-TTL im Abo, bewusst 5m auf Credits;
    Cache-Hits zählen nicht auf ITPM → hoher Hit-Anteil ist Kontingent, nicht nur Ersparnis. Cache-Miss ≥10 % in /usage → Präfix prüfen.
S10 BATCH FÜR ALLES OHNE UHR. Atlas-Pflege, Gedächtnis-Konsolidierung, Log-Auswertung, Eval-Läufe → Batch (−50 %), nie im Sitzungsfenster.
S11 UNBEKANNT = STRONG, DANN MESSEN. Unbekannte Modelle als strong behandeln, Ausgabeformat nie anfassen (Formatschaden-Lehre); nach
    3 Läufen Eigenstreuung; ab n ≥ 20 je (modell, rolle, signalbündel) darf die Passungsmatrix die Vorbelegung überschreiben.
S12 FRAME-STUFE NACH NUTZENPROGNOSE. voll/reduziert/keine (N5) aus Entropie@3 und Deckeneffekt (≥93 % Baseline → keine); Stufe geloggt.
S13 FALLBACK IST KETTE, NICHT SPRUNG. 429 mit retry-after <60 s → warten, sonst nächster Kandidat gleicher Rolle · enforced_spend_limit_reached
    → Währung bis Monatsende sperren · Gratis-Tier 403/„discontinued“ → Atlas contradicted + nächster · Tool-Fehler ×2 → Anbieterwechsel ·
    Kontextüberlauf → 1M-Modell (Claude ≥4.6, kein Aufpreis) vor Kompaktion, wenn Verlust teuer.
S14 JEDE WAHL WIRD GELOGGT UND AUFGELÖST. selection{task, role, signals, candidates, chosen, reason_codes, predicted{quality,cost,latency},
    atlas_version} + outcome{tokens, cost, latency, verdict, retracted}. Ohne outcome ist die Wahl not-evaluated; predicted vs. outcome → Kalibrierung (N3).
S15 RING 2 NUR GEBÜNDELT, MIT NUTZEN. Fehlt ein Zugang, der den Plan verbessert: weiterarbeiten mit Fallback, Empfehlung ins Ring-2-Bündel
    (Nutzen, Kosten, was ohne passiert). Nie tröpfchenweise, nie zweimal dieselbe Frage, Empfehlung profilabhängig (§4 Nr. 8).
```

Kern als Pseudocode (`conductor/select.py`):

```python
def choose(role, signals, profile, atlas, fit):
    c = [e for e in atlas.models if e.status in ("verified", "secondary") and e.roles.get(role, 0) > 0]
    c = [e for e in c if e.provider in profile.privacy.allowed[signals.privacy_class]]                   # S6
    c = [e for e in c if quota_state(profile, e.currency) != "red"]                                      # S1
    if role == "gegenstimme": c = independent(c, producer=signals.producer)                              # S3
    if role == "pruefer":     c = [e for e in c if e.id != signals.producer]                             # S4
    key = lambda e: (fit.score(e.id, role, signals) if fit.n(e.id, role, signals) >= 20 else e.roles[role],
                     cost_estimate(e, signals))                                                          # S11, S2
    ranked = sorted(c, key=key)
    chosen = ranked[0] if ranked else self_consistency_fallback(profile)                                 # S3, S5
    log_selection(role, signals, ranked, chosen, predicted=predict(chosen, signals), atlas_version=atlas.version)  # S14
    return chosen, dict(max_workers=workers_from_rpm(chosen, profile), frame=frame_level(signals))       # S7, S12
```

### 3.5 Pflegeprotokoll

**Quellenliste** = `atlas/index.yaml: sources[]` mit je `url`, `extract_prompt` (die präzise Frage, die in dieser Front gestellt wurde — z. B. „Extract input/output/cache prices per model, exact numbers, note any scheduled changes“), `expected_fields`, `stale_after`. Startliste: die offiziellen URLs aus §5.

**Takt in drei Ringen:** (a) *Wöchentlich* — Routine im Abo; sonst Desktop Scheduled Task oder `/loop` beim ersten Start der Woche; API-only: cron mit `claude -p --max-budget-usd 0.50` in einem **eigenen, minimalen Kontext** (nie in der Dirigenten-Session, weil Routines vollen Kontext senden): jede Quelle per WebFetch (kostenlos) holen, Inhalt hashen, nur bei Hash-Änderung mit Haiku im Batch extrahieren, Diff gegen Bestand, Änderungen als `supersedes`-Einträge mit `changed_fields`; Verdachtsfälle (Preis ±20 %, „discontinued“/„replaced“, neue Modell-IDs, terminierte Änderungen wie „ab 1.1.2027“) als je eine Zeile im nächsten Monitor-Briefing. (b) *Täglich / je Sitzung* — Gratis-Tier-Existenz und Modell-IDs per Probe (P4), Kontingent-Header (P5). (c) *Ereignisgetrieben* — jedes 429/403/404 mit unerwartetem Text, jede Modell-ID-Zurückweisung („does not support this model“, doctor.py-Lehre), jede Abweichung >10 % zwischen `predicted.cost` und `outcome.cost` löst sofort die Neu-Prüfung genau dieser Quelle aus. Kostenrahmen: ~20 Seiten × ~10K Tokens ≈ 200K Input-Tokens Haiku im Batch ≈ $0,10/Woche plus Proben ≈ $0,20 — der Kill-Check (Wert > Aufwand×5) ist mit einem einzigen vermiedenen Fehlplan erfüllt.

**Versionierung:** `~/.soul/atlas` ist ein git-Repo; jede Pflege ein Commit `atlas: 2026-09-13 (3 changed, 1 contradicted)`; `atlas_version` = Commit-Hash im Profil und in jedem `selection`-Log — rückwirkend ist klar, mit welchem Wissensstand entschieden wurde (Kalibrierung braucht das). Rückbau: `git revert` eines Pflegecommits ist die N2-Umkehr; `contradicted`-Einträge bleiben stehen, bis eine Probe sie bestätigt oder widerlegt.

**Kennzeichnung von Unsicherem:** `status`/`confidence` sind Pflicht; die Auswahl liest `contradicted`/`expired` nie als Grundlage, `secondary` nur nach Probe; das Monitor-Briefing zeigt die Zahl „unsichere Einträge in aktiver Nutzung“ — Null ist das Ziel, jede Abweichung ein sichtbarer Posten (Invariante 6, Ehrlichkeit über Limits).

**Zwei Stufen, ein Atlas:** Atlas-Einträge sind öffentliches Wissen (Preise, Limits, Installationswege) und gehören in „Miguel für alle“ — teilbar, im öffentlichen Repo publizierbar, von anderen Nutzern per signierten Commits beziehbar. Das Profil ist privat und bleibt lokal. Wissen wird geteilt, Zugänge nie. Anonymisierte Passungsdaten (N4) *könnten* denselben Weg gehen — das ist eine Produktentscheidung, keine Recherchefrage (§4 Nr. 7).

## 4. Widersprüche / Unsicherheiten

1. **Abo-Kontingente sind nirgends offiziell beziffert.** Pro/Max-Nachrichten je Fenster (≈45/225/900) und der Wochenbonus stammen aus Sekundärquellen; support.claude.com sagt nur „shared across Claude and Claude Code“. Das Profil führt sie als `declared`/`secondary`; Fenster-Ökonomie (S8) plant deshalb auf geschätzter Basis — Gegenmittel: konservative Ampel (gelb ab 60 %) bis ein `/usage`-Parser steht.
2. **Gemini-CLI-Gratispfad:** Die offizielle Seite sagt „Gemini CLI will be replaced by Antigravity CLI on June 18th“, Sekundärquellen sagen „eingestellt“. Nur die Probe entscheidet; der Eintrag bleibt `contradicted`, bis `gemini -p ok` einmal erfolgreich war.
3. **DeepSeek, Mistral, Together, Windsurf:** DeepSeeks Preistabelle wurde in zwei Anläufen nicht erfasst (Seite liefert „Your First API Call“), Mistral verweist ins Konto, Together und Windsurf ohne Quelle. Alle bleiben `secondary`/`unknown` mit `confidence ≤0,5`.
4. **Trainings- und Datenschutzklauseln** der Gratis-Tiers (Groq, Cerebras, Gemini Free, Mistral Free) wurden nicht geprüft. S6 setzt sie deshalb konservativ auf P0; vor der ersten Nutzung mit Projektdaten ist eine eigene Prüfung der Nutzungsbedingungen Pflicht (`privacy.training_optout_confirmed`).
5. **Ratenlimits sind Maxima, keine Garantien** („maximum allowed usage, not guaranteed minimums“; Evaluation-Tier unterhalb Start). Der Atlas führt Tier-Werte nur als Obergrenze; die Wahrheit steht in den Headern (P5).
6. **Lokale Hardware-Faustregel** (0,55–0,65 GB je Mrd. Parameter bei Q4) ist unverifiziert; die Ollama-README-Tabelle wurde nicht erfasst. `local_model_class`-Schwellen sind Startwerte, per Probe (`ollama run` mit Zeitmessung) zu kalibrieren.
7. **Passungsmatrix-Skalierung:** n ≥ 20 je Zelle bei ~6 Rollen × ~12 Modellen × Signalbündeln ist für einen Einzelnutzer in Monaten nicht erreichbar; realistisch werden 5–8 Zellen belastbar, der Rest bleibt Vorbelegung. Ehrlich: N4 wirkt für Vielnutzer oder mit geteilten anonymisierten Messungen — eine Produktentscheidung.
8. **Widerspruch zu Chrisos „am besten ein Codex-Abo“:** Für ein Profil mit Claude Max20 + Gemini Free + Cerebras ist ein Codex-Abo *Unabhängigkeits*-, nicht Kapazitätsgewinn — und Selbstkonsistenz@3 ist der gemessen stärkere Gegner (Kontext §3). Für Nutzer *ohne* jedes zweite Modell ist die Empfehlung richtig; für Nutzer mit API-Budget ist gpt-5.6-sol per API ($4/$20, kein Fenster) oft die bessere Gegenstimme als ein Abo-Pool mit 10–100 Nachrichten je 5 h. Der Atlas spricht die Empfehlung profilabhängig aus (S15), nicht pauschal.
9. **Pflege verbraucht Kontingent:** Bei Abo-only-Nutzern läuft die Wochenroutine im geteilten Fenster (Routines senden vollen Kontext). Gegenmittel: eigener Minimalkontext, Batch, nie in der Dirigenten-Session; bei Gateway/Bedrock ohne Routines Rückfall auf `/loop`/cron, vom Preflight als „manuell angestoßen“ markiert.
10. **„Bester KI-Nutzer nutzt alles“ vs. Isolation:** R14 Ä5 stellt `--strict-mcp-config` auf „Default aus“, damit werden fremde Nutzer-MCPs mitgeladen — auch schlechte oder kontextteure. Der Atlas führt deshalb je erkanntem MCP-Server einen Kontextkosten-Eintrag (`/context`-Messung; Tool-Definitionen deferred) und der Preflight behandelt den Nutzer-MCP-Bestand als *Kandidaten*, nicht als Pflicht (ECOSYSTEM-Regel: Discovery, nie ungeprüft aktivieren).
11. **Feature-Availability ist selbst flüchtig** (Remote Control, Channels, Advisor, Routines hängen an Abo/Provider und wechseln). `features_missing` ist nur so gut wie `tools.yaml` und braucht dieselbe Wochenpflege wie Preise.
12. **Unter welcher Bedingung ist dieser Bericht falsch?** (a) Wenn ein Anbieter Kontingente nicht mehr je Familie, sondern pauschal deckelt — dann bricht S8 „Familienwechsel“. (b) Wenn Cache-Hits auf ITPM angerechnet werden — dann bricht die Kontingent-Multiplikation in S9. (c) Wenn die Passungsmatrix nach drei Monaten in keiner Zelle n ≥ 20 erreicht — dann ist N4 für Einzelnutzer Verwaltung statt Wirkung und wird zurückgebaut. (d) Wenn die Ring-2-Bündelfrage in Nutzertests trotzdem als Bevormundung erlebt wird — dann müssen mehr Fragen zu Defaults mit stiller Rückmeldung werden.

## 5. Quellen

**Offiziell (Abruf 2026-09-06, vom Vorgänger dieser Front bzw. in dieser Fortsetzung):**
1. https://platform.claude.com/docs/en/about-claude/pricing — Modellpreise, Cache-Multiplikatoren, Tokenizer-Hinweis, 1M-Kontext, Server-Tools, Managed Agents
2. https://platform.claude.com/docs/en/api/rate-limits — Tiers, Spend-Caps, RPM/ITPM/OTPM, Cache-aware ITPM, Header (diese Fortsetzung)
3. https://claude.com/pricing — Abos Free/Pro/Max/Team/Enterprise
4. https://code.claude.com/docs/en/costs — Fenster, Familien-Limits, Usage Credits, Cache-TTL, Agent Teams, `/usage`
5. https://code.claude.com/docs/en/feature-availability — Feature × Provider/Abo-Matrix
6. https://code.claude.com/docs/en/overview — Fähigkeitsinventar
7. https://code.claude.com/llms.txt — Doku-Index
8. support.claude.com — Usage-Limits-Artikel (Pro/Max, „shared across Claude and Claude Code“)
9. https://developers.openai.com/api/docs/pricing — gpt-5.x-Preise, Batch/Flex/Fast
10. https://github.com/openai/codex — Codex CLI: Installation, Login, `codex exec`
11. https://github.com/openai/gpt-oss — Speicherbedarf gpt-oss-20b/120b, Runtimes, Lizenz
12. https://geminicli.com/docs/resources/quota-and-pricing — Gemini-CLI-Zugangswege, Antigravity-Hinweis
13. https://ai.google.dev/gemini-api/docs/pricing — Gemini-API-Preise, Free Tier, Grounding
14. https://ai.google.dev/gemini-api/docs/rate-limits — Tier-Stufen
15. https://console.groq.com/docs/rate-limits — Gratis-Modelle und Limits
16. https://inference-docs.cerebras.ai/support/rate-limits — Free/Developer-Limits
17. https://docs.mistral.ai/admin/billing-usage/usage-limits — Free mode, PAYG (Zahlen nur im Konto)
18. https://api-docs.deepseek.com/quick_start/pricing — Modellnamen, Anthropic-Format-Hinweis (Preistabelle nicht erfasst)
19. https://github.com/ollama/ollama — Installation, `localhost:11434/api/chat`
20. https://lmstudio.ai/docs/app/system-requirements — Hardware-Anforderungen
21. https://cursor.com/pricing — Pläne
22. https://registry.modelcontextprotocol.io — MCP-Registry (Preview, API-Freeze v0.1)
23. https://api.githubcopilot.com/mcp/ — gehosteter GitHub-MCP-Server (GA 2025-09-04)
24. https://help.openai.com/en/articles/11369540 — Codex-Kontingente im ChatGPT-Plan (HTTP 403, nicht lesbar; nur über Sekundärquellen)
25. npm `@playwright/mcp`, `chrome-devtools-mcp` — Installationswege laut Vorgänger, Quell-URL dort nicht vermerkt

**Sekundär (nur Hinweis, `confidence 0.5`):** morphllm, ccforeveryone, explainx (Claude-Abo-Nachrichten je Fenster, Wochenbonus); inventivehq, simplemetrics (Codex-Kontingente, Gemini-Free-Pfad); tembo (Gemini CLI); cloudzero, benchlm, aipricing.guru, pricepertoken (DeepSeek-Preise); Suchtreffer zu Vercel-Hobby-, Netlify-Free-, Supabase-Free-Limits; docs.together.ai/rate-limits (nicht abgerufen).

**Lokale Dateien:**
- /home/user/nextool/ordnung/docs/research/00-KONTEXT-FUER-AGENTEN.md (§3 Messungen, §10–13 Zielbild und Maßstab)
- /home/user/nextool/ordnung/docs/research/briefs/R15.md
- /home/user/nextool/ordnung/docs/research/R14-soul-basis-kritik-und-dirigent.md (Dirigenten-Schleife §2.3, Onboarding-Blöcke, Ä5/Ä7/Ä11, Guard-Bewertung)
- /home/user/soul/playbooks/preflight.md (Ring 1/Ring 2 als Prosa)
- /home/user/soul/core/doctor.py (Modell-Probe mit Cache; `MODEL` hartkodiert Z. 30)
- /home/user/soul/core/guard.py (`CATEGORIES` Z. 85–92)
- Probe dieser Maschine (Bash, 2026-09-06, §2.3)
