# Trend Scanner

Automated daily identification of trending search terms that could become micro-tool websites (calculators, converters, generators, etc.).

## How it works

1. **Fetch**: Pulls trending searches from Google Trends RSS (10 geos) and pytrends (15 countries)
2. **Pre-filter**: Removes obvious non-tool trends (sports, entertainment, politics, person names)
3. **Classify**: Uses Claude CLI (`claude -p`) to identify which trends suggest a tool-building opportunity
4. **Rank**: Selects the top 5 opportunities based on volume, evergreen potential, competition, feasibility, and monetization

## Running manually

Full run with LLM classification (requires Claude CLI installed and authenticated):

```bash
python scripts/trend_scanner.py
```

Without LLM (just fetches and pre-filters trends):

```bash
python scripts/trend_scanner.py --no-llm
```

## Output

Reports are stored in this directory:

- `YYYY-MM-DD.md` -- daily markdown report with top 5 opportunities and all candidates
- `latest.json` -- structured JSON of the most recent scan

## GitHub Action

The `daily-trends.yml` workflow runs automatically at 10:00 UTC every day in `--no-llm` mode (fetches and pre-filters trends). LLM classification is done locally via Claude CLI when reviewing opportunities. The workflow can also be triggered manually from the Actions tab.
