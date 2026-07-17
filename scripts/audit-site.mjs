import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ignoredDirectories = new Set(['.git', 'node_modules']);
const errors = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(root);
const htmlFiles = files.filter((path) => extname(path) === '.html');

function isIndexablePage(path) {
  const head = readFileSync(path, 'utf8').slice(0, 5000);
  return !/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(head)
    && !/<meta\s+http-equiv=["']refresh["']/i.test(head);
}

const toolPages = htmlFiles.filter((path) => relative(root, path).startsWith('free-tools/') && !path.endsWith('/index.html') && isIndexablePage(path));
const guidePages = htmlFiles.filter((path) => relative(root, path).startsWith('blog/') && !path.endsWith('/index.html') && isIndexablePage(path));
const toolIndexSource = readFileSync(join(root, 'free-tools/index.html'), 'utf8');
const listedToolSlugs = [...toolIndexSource.matchAll(/\bslug:\s*'([^']+)'/g)].map((match) => match[1]);
const uniqueToolSlugs = new Set(listedToolSlugs);

function localTarget(source, rawReference) {
  const reference = rawReference.trim().replaceAll('&amp;', '&');
  if (!reference || reference.startsWith('#')) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) return null;
  if (/[{}`]/.test(reference)) return null;

  const pathname = reference.split('#')[0].split('?')[0];
  if (!pathname) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    errors.push(`${relative(root, source)}: invalid URL encoding in ${rawReference}`);
    return null;
  }

  return decoded.startsWith('/')
    ? resolve(root, `.${decoded}`)
    : resolve(source, '..', decoded);
}

function targetExists(target) {
  if (!target || !normalize(target).startsWith(root)) return false;
  if (existsSync(target)) return true;
  if (existsSync(join(target, 'index.html'))) return true;
  if (!extname(target) && existsSync(`${target}.html`)) return true;
  return false;
}

for (const htmlFile of htmlFiles) {
  const source = readFileSync(htmlFile, 'utf8');
  const withoutExamples = source
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '')
    .replace(/<textarea\b[^>]*>[\s\S]*?<\/textarea>/gi, '')
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, '<script$1></script>')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const references = [...withoutExamples.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)];

  for (const match of references) {
    const target = localTarget(htmlFile, match[1]);
    if (target && !targetExists(target)) {
      errors.push(`${relative(root, htmlFile)} -> ${match[1]}`);
    }
  }
}

for (const required of ['index.html', 'CNAME', 'robots.txt', 'sitemap.xml', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md']) {
  if (!existsSync(join(root, required))) errors.push(`missing required file: ${required}`);
}

const sitemapSource = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const sitemapPaths = new Set();
for (const match of sitemapSource.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
  const location = match[1].match(/<loc>([^<]+)<\/loc>/i)?.[1]?.trim();
  if (!location) {
    errors.push('sitemap entry without a location');
    continue;
  }

  let url;
  try {
    url = new URL(location);
  } catch {
    errors.push(`invalid sitemap URL: ${location}`);
    continue;
  }

  if (url.origin !== 'https://nextool.app') {
    errors.push(`unexpected sitemap origin: ${location}`);
    continue;
  }
  if (sitemapPaths.has(url.pathname)) errors.push(`duplicate sitemap path: ${url.pathname}`);
  sitemapPaths.add(url.pathname);

  const target = url.pathname === '/' ? join(root, 'index.html') : resolve(root, `.${decodeURIComponent(url.pathname)}`);
  const file = existsSync(target) && extname(target)
    ? target
    : existsSync(join(target, 'index.html'))
      ? join(target, 'index.html')
      : !extname(target) && existsSync(`${target}.html`)
        ? `${target}.html`
        : null;
  if (!file) errors.push(`sitemap target does not exist: ${url.pathname}`);
  else if (extname(file) === '.html' && !isIndexablePage(file)) errors.push(`sitemap includes noindex or redirect page: ${url.pathname}`);
}

for (const page of [...toolPages, ...guidePages]) {
  const pathname = `/${relative(root, page).split('\\').join('/')}`;
  if (!sitemapPaths.has(pathname)) errors.push(`indexable page missing from sitemap: ${pathname}`);
}

for (const forbidden of ['.DS_Store', '.env', '.env.local', '.env.production']) {
  if (existsSync(join(root, forbidden))) errors.push(`forbidden repository file: ${forbidden}`);
}

for (const path of files.filter((file) => ['.html', '.js'].includes(extname(file)))) {
  const source = readFileSync(path, 'utf8');
  if (/lead-capture\.js|conversion-engine\.js|product-banner\.js|\/js\/revenue\.js|2,400\+ developers|Free Developer Toolkit/i.test(source)) {
    errors.push(`${relative(root, path)}: contains the retired lead-capture funnel or an unverified audience claim`);
  }
  if (/\b(?:227|250|253|260|264|266)\+\s+(?:free\s+)?(?:browser-based\s+)?(?:developer\s+)?tools\b/i.test(source)) {
    errors.push(`${relative(root, path)}: contains a stale tool-count claim`);
  }
}

if (toolPages.length !== 269) errors.push(`expected 269 tool pages, found ${toolPages.length}`);
if (guidePages.length !== 131) errors.push(`expected 131 guide pages, found ${guidePages.length}`);
if (listedToolSlugs.length !== uniqueToolSlugs.size) errors.push('tool index contains duplicate slugs');
for (const page of toolPages) {
  const slug = relative(join(root, 'free-tools'), page).replace(/\.html$/, '');
  if (!uniqueToolSlugs.has(slug)) errors.push(`tool page missing from browse index: ${slug}`);
}
for (const slug of uniqueToolSlugs) {
  if (!existsSync(join(root, 'free-tools', `${slug}.html`))) errors.push(`tool index points to a missing page: ${slug}`);
}

const homeSource = readFileSync(join(root, 'index.html'), 'utf8');
const soulSource = readFileSync(join(root, 'soul/index.html'), 'utf8');
const proofspecSource = readFileSync(join(root, 'proofspec/index.html'), 'utf8');
const servicesSource = readFileSync(join(root, 'services/index.html'), 'utf8');
if (!/data-count="269"/.test(homeSource) || !/data-count="131"/.test(homeSource)) errors.push('home page evidence counters are stale');
if (!/Soul MCP 4\.0\.1/.test(homeSource)) errors.push('home page Soul release is stale');
if (!/Soul MCP 4\.0\.1/.test(soulSource) || !/23 Tools \+ 8 Resources \+ 3 Prompts/.test(soulSource) || !/>358</.test(soulSource)) {
  errors.push('Soul product page release evidence is stale');
}
if (!/Proofspec 0\.1\.0/.test(proofspecSource) || !/>70 \/ 70</.test(proofspecSource) || !/>98\.05%</.test(proofspecSource)) {
  errors.push('Proofspec product page release evidence is stale');
}
if (/npmjs\.com\/package\/proofspec/.test(proofspecSource)) {
  errors.push('Proofspec product page claims an npm surface before registry publication');
}
if (!/269 public tool pages/.test(servicesSource) || !/131 technical guides/.test(servicesSource)) {
  errors.push('services page public evidence is stale');
}
if (/aggregateRating|projects delivered|Live in 24 Hours|Fixed pricing from|reviewCount"\s*:\s*"253"/i.test(servicesSource)) {
  errors.push('services page contains retired or unverified commercial proof');
}

if (errors.length > 0) {
  console.error(`Site audit failed with ${errors.length} issue(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- …and ${errors.length - 100} more`);
  process.exit(1);
}

console.log(`Site audit passed: ${htmlFiles.length} HTML pages, ${toolPages.length} tools, ${guidePages.length} guides, ${sitemapPaths.size} sitemap URLs.`);
