<div align="center">

# NexTool — public proof, tools and technical guides

**Christian Bucher's public engineering portfolio, 269 indexable browser-tool pages and 131 technical guides in one static site.**

[![Site audit](https://github.com/christian140903-sudo/nextool/actions/workflows/site-audit.yml/badge.svg)](https://github.com/christian140903-sudo/nextool/actions/workflows/site-audit.yml)
[![Tools](https://img.shields.io/badge/tool%20pages-269-5bdc93?style=flat-square)](https://nextool.app/free-tools/)
[![Guides](https://img.shields.io/badge/guides-131-e8a54a?style=flat-square)](https://nextool.app/blog/)
[![License: MIT](https://img.shields.io/badge/license-MIT-7c818b?style=flat-square)](LICENSE)

[**Portfolio**](https://nextool.app/) · [**Browse tools**](https://nextool.app/free-tools/) · [**Soul MCP 4.0.1**](https://nextool.app/soul/) · [**Read the guides**](https://nextool.app/blog/)

</div>

## What this repository is

NexTool started as a collection of small browser utilities. It grew into the
public evidence layer for a broader body of work: the tools remain available,
while the home page now explains the systems behind them and separates live,
local and conceptual claims.

| Surface | Verifiable state |
| --- | --- |
| Browser tools | 269 indexable HTML tool pages under `free-tools/` |
| Technical guides | 131 published article pages under `blog/` |
| Soul MCP | Dedicated page for the live `soul-mcp@4.0.1` npm release |
| Portfolio | Public project map with direct npm, GitHub and live-tool evidence |
| Delivery | Static GitHub Pages site with no build step |

The counts above are derived from repository files and enforced by the site
audit. They do not imply 269 independent products or 131 externally reviewed
papers.

## Run it locally

```bash
git clone https://github.com/christian140903-sudo/nextool.git
cd nextool
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

Run the zero-dependency repository audit with Node.js 20 or newer:

```bash
npm test
```

## Architecture

- static HTML, CSS and JavaScript; no application framework or build pipeline
- one page per tool or guide, plus shared assets where practical
- GitHub Pages deployment through the `CNAME` file
- public proof console on the home page reads the public npm and GitHub APIs
- automated checks for local links, referenced assets, repository hygiene and
  the published tool/article counts

## Privacy and trust boundary

Many utilities process input entirely in the browser. Some pages load
third-party libraries or call public APIs for features that cannot work
offline. Do not assume every page is offline merely because the site itself is
static; inspect the relevant page before entering sensitive data.

The automated audit proves repository structure and local references. It does
not certify third-party services, article accuracy or the behavior of every
browser API.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for the page contract and local checks.
For a vulnerability or privacy issue, follow [SECURITY.md](SECURITY.md) and do
not open a public issue containing secrets or personal data.

## License

MIT — see [LICENSE](LICENSE). Names, logos and third-party assets remain subject
to their respective trademark and license terms.
