// Validates ledger.mjs and generates generated/*.tex and ledger.json.
//
//   node build.mjs          write generated files
//   node build.mjs --check  fail if generated files are missing or stale
//
// Zero dependencies, Node.js 20 or newer.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assumptions, interpretations, requirements, revision, sources, transitions } from './ledger.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const errors = [];

const REQUIREMENT_CLASSES = ['NORMATIVE', 'DERIVED', 'PROCEDURAL', 'GOVERNANCE'];
const TYPES = ['DEF', 'THM', 'PERT', 'HEUR', 'NUM', 'HYP', 'TOOL'];
const STATUSES = ['VERIFIED', 'STANDARD', 'PARTIAL', 'OPEN', 'FALSE', 'HEURISTIC', 'NUMERICAL', 'PREPRINT'];
// A proof step may never rest on these.
const INADMISSIBLE = new Set(['FALSE', 'HEURISTIC', 'NUMERICAL', 'PREPRINT']);
const CLOSING = new Set(['VERIFIED', 'STANDARD']);

// ---------------------------------------------------------------- validation

const byId = new Map();
for (const [kind, items] of [['source', sources], ['requirement', requirements], ['interpretation', interpretations], ['assumption', assumptions], ['transition', transitions]]) {
  for (const item of items) {
    if (byId.has(item.id)) errors.push(`duplicate id ${item.id}`);
    byId.set(item.id, { kind, item });
  }
}
const idsOf = (kind) => new Set([...byId].filter(([, v]) => v.kind === kind).map(([id]) => id));
const requirementIds = idsOf('requirement');
const assumptionIds = idsOf('assumption');
const interpretationIds = idsOf('interpretation');

for (const req of requirements) {
  if (!REQUIREMENT_CLASSES.includes(req.cls)) errors.push(`${req.id}: unknown class ${req.cls}`);
  if (!req.anchor) errors.push(`${req.id}: missing anchor`);
  for (const i of req.interp ?? []) if (!interpretationIds.has(i)) errors.push(`${req.id}: unknown interpretation ${i}`);
}
for (const a of assumptions) {
  if (!TYPES.includes(a.type)) errors.push(`${a.id}: unknown type ${a.type}`);
  if (!STATUSES.includes(a.status)) errors.push(`${a.id}: unknown status ${a.status}`);
  if (!a.source) errors.push(`${a.id}: missing source`);
}

const covered = new Set();
for (const t of transitions) {
  for (const c of t.covers) {
    if (!requirementIds.has(c)) errors.push(`${t.id}: covers unknown requirement ${c}`);
    covered.add(c);
  }
  for (const p of t.premises) {
    const entry = byId.get(p);
    if (!entry || entry.kind !== 'assumption') {
      errors.push(`${t.id}: unknown premise ${p}`);
    } else if (INADMISSIBLE.has(entry.item.status)) {
      errors.push(`${t.id}: premise ${p} has inadmissible status ${entry.item.status}`);
    }
  }
}
for (const req of requirements) {
  if (['NORMATIVE', 'DERIVED'].includes(req.cls) && !covered.has(req.id)) {
    errors.push(`${req.id}: mathematical requirement not covered by any transition`);
  }
}

// A plain-quoted string silently eats LaTeX backslashes (\t becomes a TAB):
// reject control characters so such slips cannot reach the PDF.
for (const [id, { item }] of byId) {
  for (const [key, value] of Object.entries(item)) {
    if (typeof value === 'string' && /[\u0000-\u001f]/.test(value)) errors.push(`${id}.${key}: control character (use String.raw)`);
  }
}

// Every \ref{...} that looks like a ledger id must resolve.
const ledgerIdPattern = /^(?:YM-\d+|I-\d+|A-\d+|T\d+|S\d+)$/;
function scanRefs(owner, text) {
  for (const [, target] of String(text).matchAll(/\\ref\{([^}]+)\}/g)) {
    if (ledgerIdPattern.test(target) && !byId.has(target)) errors.push(`${owner}: dangling reference ${target}`);
  }
}
for (const [id, { item }] of byId) for (const value of Object.values(item)) if (typeof value === 'string') scanRefs(id, value);

if (errors.length) {
  console.error(`Ledger validation failed with ${errors.length} issue(s):`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

// ---------------------------------------------------------------- derived data

const statusOf = (id) => byId.get(id).item.status;
const transitionStatus = transitions.map((t) => {
  const blocking = t.premises.filter((p) => !CLOSING.has(statusOf(p)));
  const toPin = t.premises.filter((p) => statusOf(p) === 'STANDARD');
  return { id: t.id, status: blocking.length ? 'OPEN' : 'CLOSED', blocking, toPin };
});
const closedCount = transitionStatus.filter((t) => t.status === 'CLOSED').length;
const countBy = (items, key) => Object.fromEntries([...new Set(items.map((i) => i[key]))].map((k) => [k, items.filter((i) => i[key] === k).length]));

// ---------------------------------------------------------------- LaTeX output

// Ledger ids become hyperlinks that print the id itself.
// Bibliography keys such as [OS75] become citations; numeric [45] (S1's own
// numbering) stays literal.
const tex = (s) => String(s)
  .replace(/\\ref\{([^}]+)\}/g, (m, id) => (ledgerIdPattern.test(id) ? `\\idref{${id}}` : m))
  .replace(/\[([A-Za-z]+\d{2}[a-z]?)\]/g, '\\cite{$1}');
const anchor = (id) => `\\leavevmode\\phantomsection\\label{${id}}\\textsf{${id}}`;
const ids = (list) => list.map((id) => `\\idref{${id}}`).join(', ');
const header = '% Generated by build.mjs from ledger.mjs. Do not edit by hand.\n';

const requirementsTex = header + [
  '\\begin{longtable}{@{}p{1.25cm}p{9.3cm}P{2.5cm}l@{}}',
  '\\toprule ID & Requirement & Anchor & Class\\\\ \\midrule \\endhead',
  '\\bottomrule \\endfoot',
  ...requirements.map((r) => `${anchor(r.id)} & \\textbf{${tex(r.title)}.} ${tex(r.text)}${r.interp ? ` \\emph{(Reading: ${ids(r.interp)}.)}` : ''} & \\footnotesize ${tex(r.anchor)} & \\classbadge{${r.cls}}\\\\[2pt]`),
  '\\end{longtable}',
].join('\n') + '\n';

const interpretationsTex = header + interpretations.map((i) => [
  `\\begin{interpretation}{${i.id}}{${tex(i.title)}}`,
  `\\item[Issue] ${tex(i.issue)}`,
  `\\item[Working reading] ${tex(i.reading)}`,
  `\\item[Positive track] ${tex(i.positive)}`,
  `\\item[Negative track] ${tex(i.negative)}`,
  '\\end{interpretation}',
].join('\n')).join('\n\n') + '\n';

const assumptionsTex = header + [
  '\\begin{longtable}{@{}p{1.2cm}p{8.8cm}p{0.95cm}p{1.85cm}P{2.3cm}@{}}',
  '\\toprule ID & Statement \\textit{and scope} & Type & Status & Source\\\\ \\midrule \\endhead',
  '\\bottomrule \\endfoot',
  ...assumptions.map((a) => `${anchor(a.id)} & ${tex(a.text)}\\newline{\\footnotesize\\itshape ${tex(a.scope)}} & \\footnotesize\\textsf{${a.type}} & \\statusbadge{${a.status}} & \\footnotesize ${tex(a.source)}\\\\[2pt]`),
  '\\end{longtable}',
].join('\n') + '\n';

const transitionsTex = header + [
  '\\begin{longtable}{@{}p{0.8cm}p{6.6cm}P{3.0cm}P{2.5cm}p{1.6cm}@{}}',
  '\\toprule ID & Transition (separate theorem) & Covers & Premises & Status\\\\ \\midrule \\endhead',
  '\\bottomrule \\endfoot',
  ...transitions.map((t, n) => {
    const s = transitionStatus[n];
    const premises = t.premises.map((p) => (s.blocking.includes(p) ? `\\idref{${p}}\\textsuperscript{\\,!}` : `\\idref{${p}}`)).join(', ');
    return `${anchor(t.id)} & \\textbf{${tex(t.title)}.} ${tex(t.text)} & \\footnotesize ${ids(t.covers)} & \\footnotesize ${premises} & \\statusbadge{${s.status}}\\\\[2pt]`;
  }),
  '\\end{longtable}',
].join('\n') + '\n';

const sourcesTex = header + [
  '\\begin{tabularx}{\\textwidth}{@{}lX@{}}',
  '\\toprule ID & Source, retrieval and fingerprint\\\\ \\midrule',
  ...sources.map((s) => `\\textsf{${s.id}} & ${s.title}${s.url ? `\\newline\\url{${s.url}}\\newline{\\footnotesize retrieved ${s.retrieved}, ${s.bytes.toLocaleString('en-US')} bytes, SHA-256 \\texttt{\\seqsplit{${s.sha256}}}}` : ''}\\\\[3pt]`),
  '\\bottomrule',
  '\\end{tabularx}',
].join('\n') + '\n';

const summaryTex = header + [
  `\\newcommand{\\LedgerVersion}{${revision.version}}`,
  `\\newcommand{\\LedgerDate}{${revision.date}}`,
  `\\newcommand{\\NumRequirements}{${requirements.length}}`,
  `\\newcommand{\\NumInterpretations}{${interpretations.length}}`,
  `\\newcommand{\\NumAssumptions}{${assumptions.length}}`,
  `\\newcommand{\\NumTransitions}{${transitions.length}}`,
  `\\newcommand{\\NumClosedTransitions}{${closedCount}}`,
  `\\newcommand{\\NumOpenAssumptions}{${assumptions.filter((a) => a.status === 'OPEN').length}}`,
  `\\newcommand{\\NumFalseAssumptions}{${assumptions.filter((a) => a.status === 'FALSE').length}}`,
].join('\n') + '\n';

const json = JSON.stringify({
  revision,
  sources,
  requirements,
  interpretations,
  assumptions,
  transitions: transitions.map((t, n) => ({ ...t, computed: transitionStatus[n] })),
  summary: {
    requirementsByClass: countBy(requirements, 'cls'),
    assumptionsByStatus: countBy(assumptions, 'status'),
    closedTransitions: closedCount,
    totalTransitions: transitions.length,
  },
}, null, 2) + '\n';

const outputs = {
  'generated/requirements.tex': requirementsTex,
  'generated/interpretations.tex': interpretationsTex,
  'generated/assumptions.tex': assumptionsTex,
  'generated/transitions.tex': transitionsTex,
  'generated/sources.tex': sourcesTex,
  'generated/summary.tex': summaryTex,
  'ledger.json': json,
};

if (process.argv.includes('--check')) {
  const stale = Object.entries(outputs).filter(([path, content]) => {
    const file = join(here, path);
    return !existsSync(file) || readFileSync(file, 'utf8') !== content;
  }).map(([path]) => path);
  if (stale.length) {
    console.error(`Generated files are stale: ${stale.join(', ')}. Run: node build.mjs`);
    process.exit(1);
  }
} else {
  mkdirSync(join(here, 'generated'), { recursive: true });
  for (const [path, content] of Object.entries(outputs)) writeFileSync(join(here, path), content);
}

console.log(`Ledger valid: ${requirements.length} requirements, ${interpretations.length} interpretations, ${assumptions.length} assumptions, ${transitions.length} transitions (${closedCount} closed).`);
for (const t of transitionStatus) {
  const detail = t.blocking.length ? `blocked by ${t.blocking.join(', ')}` : 'all premises closing';
  console.log(`  ${t.id.padEnd(3)} ${t.status.padEnd(6)} ${detail}${t.toPin.length ? `; pin locators: ${t.toPin.join(', ')}` : ''}`);
}
