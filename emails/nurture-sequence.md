# NexTool Email Nurture Sequence

> 6-email sequence for "Free Developer Toolkit" signups
> Sender: hello@nextool.app | Reply-to: hello@nextool.app
> Sign-off: The NexTool Team
> Timing: Day 0, 3, 7, 10, 14, 21

---

## Setup Instructions

### Step 1: Create Brevo Account

1. Go to https://www.brevo.com and sign up for the free plan (300 emails/day, unlimited contacts).
2. Complete email verification for your account email.
3. Fill out sender profile (company name: NexTool, website: nextool.app).

### Step 2: Set Up Sender Email and Verify Domain

1. Navigate to **Settings > Senders, Domains & Dedicated IPs > Senders**.
2. Add sender: `hello@nextool.app` (display name: "NexTool").
3. Go to **Domains** tab and add `nextool.app`.
4. Add the DNS records Brevo provides to your domain registrar:
   - SPF record (TXT): Allows Brevo to send on your behalf.
   - DKIM record (TXT): Cryptographic email authentication.
   - DMARC record (TXT): `v=DMARC1; p=none; rua=mailto:hello@nextool.app`
5. Click **Verify** in Brevo after DNS records propagate (can take up to 48 hours).

### Step 3: Create Automation Workflow

1. Go to **Automations > Create a Workflow > Start from scratch**.
2. Entry point: **Contact added to list** (select your "Free Toolkit Signups" list).
3. Add each email as a step with the following delays:
   - Email 1: No delay (immediate on signup)
   - Email 2: Wait 3 days
   - Email 3: Wait 4 days (7 days total)
   - Email 4: Wait 3 days (10 days total)
   - Email 5: Wait 4 days (14 days total)
   - Email 6: Wait 7 days (21 days total)
4. Activate the workflow.

### Step 4: Import Email Templates

1. Go to **Campaigns > Templates > New Template**.
2. Choose **Plain text** (not drag-and-drop) for maximum deliverability.
3. Create 6 templates matching Emails 1-6 below.
4. Use personalization tag `{{ contact.FIRSTNAME | default: "there" }}` for the greeting.
5. Set each template's subject line (use A/B testing feature for the variant subjects).

### Step 5: Connect Signup Form (API Key Swap)

1. Go to **Settings > API Keys > Generate a new API key**.
2. Copy the API key.
3. Open `lead-capture.js` in the NexTool codebase.
4. Replace the placeholder API key with your Brevo API key:
   ```javascript
   const BREVO_API_KEY = 'xkeysib-YOUR_KEY_HERE';
   ```
5. Set the list ID to your "Free Toolkit Signups" list:
   ```javascript
   const BREVO_LIST_ID = 2; // Check your list ID in Brevo > Contacts > Lists
   ```
6. The lead capture form should POST to Brevo's API:
   ```
   POST https://api.brevo.com/v3/contacts
   Headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" }
   Body: { "email": "<user_email>", "listIds": [BREVO_LIST_ID], "attributes": { "FIRSTNAME": "<user_name>" } }
   ```
7. Test the full flow: sign up on nextool.app, confirm contact appears in Brevo, verify Email 1 sends immediately.

---

## Email 1: Welcome (Day 0 - Immediate)

**Subject A:** Welcome to NexTool - your toolkit is ready
**Subject B:** You're in. Here's your free developer toolkit.

**Preview text:** 150+ tools, zero installs, ready right now.

---

Hey {{ contact.FIRSTNAME | default: "there" }},

Welcome to NexTool. You just gave yourself access to 150+ free browser-based developer tools - no installs, no signups, no nonsense.

Here's your toolkit home base:
https://nextool.app/welcome.html

Bookmark that. Everything lives there.

To get you started, here are 5 tools our users open the most:

1. JSON Formatter & Validator - Paste messy JSON, get clean output instantly.
   https://nextool.app/free-tools/json-formatter.html

2. Regex Tester - Build and test patterns with real-time highlighting.
   https://nextool.app/free-tools/regex-tester.html

3. Base64 Encoder/Decoder - Encode, decode, done. Handles text and files.
   https://nextool.app/free-tools/base64-encoder-decoder.html

4. Color Converter - HEX, RGB, HSL conversions with a visual picker.
   https://nextool.app/free-tools/color-converter.html

5. UUID Generator - Bulk-generate v4 UUIDs for your projects.
   https://nextool.app/free-tools/uuid-generator.html

Every tool runs entirely in your browser. Your data never leaves your machine.

You'll hear from me a few more times with tips and lesser-known features. Nothing spammy - just stuff that'll actually save you time.

Happy building,
The NexTool Team

P.S. Reply to this email anytime. I read every message.

---
To stop receiving these emails, click here: {{ unsubscribe }}
NexTool | nextool.app


---

## Email 2: Value Bomb (Day 3)

**Subject A:** 5 things you can do with NexTool right now
**Subject B:** You're probably doing these tasks the hard way

**Preview text:** Real workflows, real time saved. No theory.

---

Hey {{ contact.FIRSTNAME | default: "there" }},

I want to show you 5 concrete things you can do with NexTool right now. Not "cool features" - actual workflows that replace 10-minute tasks with 10-second ones.

1. CONVERT JSON TO CSV (AND BACK)
   Got an API response you need in a spreadsheet? Paste the JSON, download the CSV.
   https://nextool.app/free-tools/json-to-csv.html

2. TEST AND DEBUG REGEX PATTERNS
   Stop guessing. Paste your text, build your pattern, see matches highlighted live.
   https://nextool.app/free-tools/regex-tester.html

3. GENERATE A COLOR PALETTE FROM ANY IMAGE
   Upload a photo, extract the exact colors. Great for matching brand assets.
   https://nextool.app/free-tools/color-palette-generator.html

4. DIFF TWO FILES SIDE-BY-SIDE
   Paste two versions of anything - code, config files, text. See every difference highlighted.
   https://nextool.app/free-tools/text-diff-checker.html

5. FORMAT AND MINIFY CODE INSTANTLY
   SQL, HTML, CSS, JavaScript - paste it ugly, get it clean. Or minify it for production.
   https://nextool.app/free-tools/sql-formatter.html

Here's the thing: these aren't five separate apps with five separate accounts. They're all on one site, in your browser, ready in seconds.

Want to go deeper? I wrote a guide on data format conversions that covers the less obvious stuff:
https://nextool.app/blog/data-format-conversion-guide.html

Talk soon,
The NexTool Team

---
To stop receiving these emails, click here: {{ unsubscribe }}
NexTool | nextool.app


---

## Email 3: Power User Tips (Day 7)

**Subject A:** Most people don't know NexTool can do this
**Subject B:** The NexTool features nobody talks about

**Preview text:** Pipeline builder, workspaces, keyboard shortcuts - the hidden stuff.

---

Hey {{ contact.FIRSTNAME | default: "there" }},

You've been using NexTool for about a week now. Time to show you what's under the hood.

Most people use NexTool one tool at a time. That works fine. But there are three features that turn it into something much more powerful:

PIPELINE BUILDER
Chain multiple tools together into a single workflow. Example: take raw JSON, validate it, convert to CSV, then encode as Base64 - all in one pipeline. Set it up once, reuse it forever.

WORKSPACE
Save your inputs, outputs, and tool configurations. Come back tomorrow, everything's still there. No more re-pasting the same data every morning.

KEYBOARD SHORTCUTS
- Ctrl/Cmd + Enter: Run the current tool
- Ctrl/Cmd + S: Save to workspace
- Ctrl/Cmd + K: Quick-switch between tools (search by name)
- Ctrl/Cmd + Shift + C: Copy output to clipboard

These three things together change how you work. Instead of "let me go find that tool again," it becomes "let me run my pipeline."

For more on getting the most out of your dev workflow, this post covers the bigger picture:
https://nextool.app/blog/developer-productivity-tools-2026.html

The short version: the fastest tool is the one you don't have to think about.

Cheers,
The NexTool Team

---
To stop receiving these emails, click here: {{ unsubscribe }}
NexTool | nextool.app


---

## Email 4: Social Proof / Story (Day 10)

**Subject A:** Why we built 150+ free tools
**Subject B:** The real story behind NexTool

**Preview text:** We built these tools because we were tired of searching for them.

---

Hey {{ contact.FIRSTNAME | default: "there" }},

I want to tell you how NexTool started. Not the polished version - the real one.

We needed a JSON formatter. So we searched for one. Found a site that worked but was plastered with ads. The next one wanted us to create an account. The third one sent our data to a server.

For a JSON formatter.

So we built one. Then we needed a Base64 decoder. Same story. Built that too. Then a regex tester. Then a diff checker. Then a markdown preview tool.

After about 30 tools, we realized we weren't building a tool anymore. We were building a toolkit - the one we wished existed.

That was the rule: every tool had to be something we'd actually use ourselves. Browser-only, no data leaving your machine, no accounts required, no ads on the free version.

150+ tools later, here we are. And people keep asking for more.

The full toolkit: https://nextool.app

Some of our most popular categories:
- Developer tools (formatters, converters, generators)
- Text and data tools (diff, encoding, hashing)
- Design tools (colors, images, CSS)
- SEO and web tools (meta tags, structured data, sitemaps)

If there's a tool you wish existed, reply to this email. Seriously. That's how half our tools got built - someone asked.

Thanks for being here,
The NexTool Team

---
To stop receiving these emails, click here: {{ unsubscribe }}
NexTool | nextool.app


---

## Email 5: Soft Pro Pitch (Day 14)

**Subject A:** Free vs. Pro - here's the honest difference
**Subject B:** What NexTool Pro actually gives you (and what it doesn't)

**Preview text:** $29 one-time. No subscription. Here's what changes.

---

Hey {{ contact.FIRSTNAME | default: "there" }},

You've been using NexTool for two weeks. By now you know whether these tools are useful to you or not. So let me be straight with you about NexTool Pro.

WHAT STAYS FREE:
Every tool. All 150+ of them. Forever. We are not putting tools behind a paywall.

WHAT PRO ADDS:

1. Clean output - no NexTool branding on exports, downloads, or generated content. Your clients see your work, not our logo.

2. Enhanced features - bigger input limits, batch processing, additional output formats. The tools do more.

3. No ads - zero banners, zero popups, zero distractions. Just tools.

4. Priority updates - new tools and features ship to Pro users first.

WHAT IT COSTS:
$29. One time. Not $29/month. Not $29/year. One payment, lifetime access.

We're keeping this price for early supporters. It will go up.

If you're using NexTool regularly and the free version is working fine, keep using it. No hard feelings. But if the branding on exports bugs you, or you keep hitting input limits, Pro solves that.

Take a look: https://nextool.app/pro.html

No trial, no credit card games. Just a clear upgrade if you want it.

Cheers,
The NexTool Team

---
To stop receiving these emails, click here: {{ unsubscribe }}
NexTool | nextool.app


---

## Email 6: Last Chance / Hard CTA (Day 21)

**Subject A:** Quick question about your NexTool experience
**Subject B:** Before I stop emailing you - one question

**Preview text:** Founding member pricing won't last. Honest check-in.

---

Hey {{ contact.FIRSTNAME | default: "there" }},

This is my last email in this series. After this, you'll only hear from me when we ship something worth telling you about.

Before I go, I have a genuine question: have you found NexTool useful?

If yes, I want to make sure you know about the founding member offer before it closes.

NexTool Pro - $29 one-time (founding member price)
https://nextool.app/pro.html

This price is for early subscribers only. When we move out of the founding phase, Pro goes to $49. That is not a marketing trick - it is the actual plan.

Here's what you get:
- Clean, unbranded output on every tool
- Enhanced features and higher limits
- Zero ads, zero distractions
- Lifetime access, no recurring charges

If NexTool hasn't been useful to you, no worries. You can unsubscribe below and I won't bother you again.

But if you've been using the tools and thinking "maybe later" about Pro - later is going to cost more. Now's the time.

Get Pro: https://nextool.app/pro.html

Thanks for giving NexTool a shot. Whatever you decide, the free tools are always here for you.

All the best,
The NexTool Team

P.S. If something didn't work, or there's a tool you wanted but couldn't find, reply and tell me. I take that stuff seriously.

---
To stop receiving these emails, click here: {{ unsubscribe }}
NexTool | nextool.app
