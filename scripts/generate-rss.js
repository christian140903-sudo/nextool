#!/usr/bin/env node
/**
 * RSS Feed Generator for NexTool Blog
 * Reads blog HTML files, extracts metadata, generates valid RSS 2.0 feed.
 *
 * Usage: node scripts/generate-rss.js
 * Output: feed.xml in project root
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const OUTPUT = path.join(__dirname, '..', 'feed.xml');
const SITE_URL = 'https://nextool.app';
const FEED_URL = `${SITE_URL}/feed.xml`;
const MAX_ITEMS = 50;

function extractMeta(html, name) {
    // Try meta name="..."
    let match = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i'));
    if (match) return match[1];
    // Try meta property="..."
    match = html.match(new RegExp(`<meta\\s+property="${name}"\\s+content="([^"]*)"`, 'i'));
    if (match) return match[1];
    // Try reversed attribute order (content before name/property)
    match = html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+name="${name}"`, 'i'));
    if (match) return match[1];
    match = html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+property="${name}"`, 'i'));
    if (match) return match[1];
    return '';
}

function extractTitle(html) {
    const match = html.match(/<title>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
}

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toRFC822(isoDate) {
    if (!isoDate) return new Date().toUTCString();
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return new Date().toUTCString();
        return d.toUTCString();
    } catch {
        return new Date().toUTCString();
    }
}

// Read all blog posts
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
console.log(`[RSS] Found ${files.length} blog posts`);

const posts = [];

for (const file of files) {
    const filepath = path.join(BLOG_DIR, file);
    // Read only first 5KB for metadata (performance)
    const fd = fs.openSync(filepath, 'r');
    const buf = Buffer.alloc(5000);
    const bytesRead = fs.readSync(fd, buf, 0, 5000, 0);
    fs.closeSync(fd);
    const html = buf.toString('utf8', 0, bytesRead);

    const title = extractTitle(html);
    const description = extractMeta(html, 'description');
    const pubDate = extractMeta(html, 'article:published_time');
    const author = extractMeta(html, 'author') || 'Christian Bucher';
    const image = extractMeta(html, 'og:image');
    const category = extractMeta(html, 'article:section');
    const url = `${SITE_URL}/blog/${file}`;

    if (!title) {
        console.log(`  [SKIP] ${file} — no title`);
        continue;
    }

    posts.push({
        title,
        description: description || title,
        url,
        pubDate,
        author,
        image,
        category,
        file
    });
}

// Sort by publish date (newest first), fallback to filename
posts.sort((a, b) => {
    if (a.pubDate && b.pubDate) {
        return new Date(b.pubDate) - new Date(a.pubDate);
    }
    if (a.pubDate) return -1;
    if (b.pubDate) return 1;
    return b.file.localeCompare(a.file);
});

// Take top N
const items = posts.slice(0, MAX_ITEMS);
console.log(`[RSS] Including ${items.length} posts in feed (of ${posts.length} total)`);

// Build RSS XML
const now = new Date().toUTCString();
let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>NexTool Blog — AI Tools, Development &amp; Automation</title>
  <link>${SITE_URL}/blog/</link>
  <description>Expert guides on AI consciousness, developer tools, automation, and web development. Built by Christian Bucher.</description>
  <language>en-us</language>
  <lastBuildDate>${now}</lastBuildDate>
  <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml"/>
  <image>
    <url>${SITE_URL}/img/favicon.svg</url>
    <title>NexTool Blog</title>
    <link>${SITE_URL}/blog/</link>
  </image>
  <copyright>Copyright ${new Date().getFullYear()} Christian Bucher. All rights reserved.</copyright>
  <managingEditor>hello@nextool.app (Christian Bucher)</managingEditor>
  <webMaster>hello@nextool.app (Christian Bucher)</webMaster>
  <ttl>60</ttl>
`;

for (const item of items) {
    rss += `
  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${escapeXml(item.url)}</link>
    <guid isPermaLink="true">${escapeXml(item.url)}</guid>
    <description>${escapeXml(item.description)}</description>
    <pubDate>${toRFC822(item.pubDate)}</pubDate>
    <dc:creator>${escapeXml(item.author)}</dc:creator>`;

    if (item.category) {
        rss += `
    <category>${escapeXml(item.category)}</category>`;
    }

    if (item.image) {
        rss += `
    <media:content url="${escapeXml(item.image)}" medium="image"/>`;
    }

    rss += `
  </item>`;
}

rss += `
</channel>
</rss>
`;

fs.writeFileSync(OUTPUT, rss, 'utf8');
console.log(`[RSS] Feed written to ${OUTPUT}`);
console.log(`[RSS] ${items.length} items, ${rss.length} bytes`);
