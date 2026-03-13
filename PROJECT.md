# Automated Insights LLC -- Tool Portfolio

## What This Is

A portfolio of free, single-purpose micro-tool websites monetized via Google AdSense. Each site is a static HTML/CSS/JS page (no framework, no build step, no backend) hosted on Cloudflare Pages (free tier). Revenue target: $150-$1000/month passive income via ads and affiliate links.

**This project is 100% independent from OpenMotion AI / CipherSkin.** No shared credentials, IP, code, datasets, or tools. See `.claude/CLAUDE.md` for the strict isolation rules.

## Owner

- **LLC**: Automated Insights LLC
- **GitHub**: nvogler90ps (NOT nvogler-90, which is the employer account)
- **Email**: nvogler90@gmail.com
- **Git auth**: PAT embedded in remote URL -- no `gh auth switch` needed for git operations

## Architecture

```
ai-llc/
  one-rep-max/           # 1RM strength calculator
  gpu-benchmark/         # GPU ML benchmark comparator
  llm-pricing/           # LLM API pricing calculator
  cron-generator/        # Cron expression builder
  plate-calculator/      # Barbell plate loading calculator
  json-tools/            # JSON formatter/validator/diff
  ssh-config/            # SSH config generator
  gitignore-gen/         # .gitignore generator by stack
  docker-compose-gen/    # Docker Compose YAML generator
  aws-estimator/         # AWS cost estimator by architecture
  config-converter/      # YAML/TOML/JSON/INI converter
  workout-generator/     # Injury-aware workout generator
  scripts/               # Automation scripts (trend scanner)
  trends/                # Daily trend scan reports
  .github/workflows/     # GitHub Actions (daily trend scanner)
```

### Each Site Contains
- `index.html` -- single page with all UI, SEO meta tags, structured data (JSON-LD), AdSense integration
- `css/` or `style.css` -- dark theme (bg #0f1117, surface #1a1d27, accent #6c63ff)
- `js/` or `script.js` -- all logic, no dependencies
- `ads.txt` -- AdSense verification
- `robots.txt` -- sitemap pointer
- `sitemap.xml` -- for Google Search Console
- `google0e005dad46e3cf7d.html` -- Search Console verification file

### Hosting & Deployment
- **Host**: Cloudflare Pages (free tier, unlimited bandwidth)
- **Deploy**: `npx wrangler pages deploy <dir> --project-name <name> --commit-dirty=true`
- **Requires**: Node 18+ (`nvm use 22` before wrangler commands)

### SEO & Revenue
- **AdSense publisher ID**: ca-pub-3434609691579834
- **All 12 sites** verified in Google Search Console with sitemaps submitted
- Each site has structured data, canonical URLs, Open Graph tags, and SEO content sections

## Daily Trend Scanner

Automated pipeline that identifies trending Google searches and finds tool-building opportunities.

### How It Works
1. **Fetch**: Google Trends RSS feed from 10 geos (US, GB, CA, AU, IN, DE, FR, BR, JP, KR)
2. **Pre-filter**: Remove sports, entertainment, politics, person names via keyword matching
3. **Classify**: Claude CLI (`claude -p`) classifies remaining trends as tool candidates or not
4. **Rank**: Claude CLI ranks top 5 candidates by evergreen potential, competition, feasibility, monetization
5. **Report**: Generates `trends/YYYY-MM-DD.md` and `trends/latest.json`

### Running
```bash
# Full run with LLM classification (requires claude CLI)
python scripts/trend_scanner.py

# Fetch + pre-filter only (no LLM)
python scripts/trend_scanner.py --no-llm
```

### GitHub Action
- Runs daily at 10:00 UTC in `--no-llm` mode (fetches raw trends)
- Auto-commits reports to `trends/` directory
- Full LLM classification done locally via Claude CLI

## Credential Rules (CRITICAL)

1. NEVER use AWS credentials, API keys, or git credentials from OpenMotion AI or CipherSkin
2. NEVER reference or derive from employer code, tools, datasets, or internal knowledge
3. Git auth uses a PAT in the remote URL -- no global `gh auth switch` needed for git ops
4. For `gh` CLI commands (creating repos, PRs, issues): `gh auth switch --user nvogler90ps` first
5. All ideas come from public knowledge and common internet search problems only

## Adding a New Site

1. Create directory: `mkdir site-name/`
2. Build the site (HTML/CSS/JS, dark theme, AdSense, SEO, structured data)
3. Add `ads.txt`, `robots.txt`, `sitemap.xml`, `google0e005dad46e3cf7d.html`
4. Create Cloudflare Pages project: `npx wrangler pages project create site-name --production-branch=main`
5. Deploy: `npx wrangler pages deploy site-name --project-name site-name --commit-dirty=true`
6. Add to Google Search Console (URL prefix method, auto-verifies via HTML file)
7. Submit sitemap in Search Console
8. Commit and push
