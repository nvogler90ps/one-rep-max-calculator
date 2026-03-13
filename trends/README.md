# Trend Scanner

Automated daily identification of trending search terms that could become micro-tool websites (calculators, converters, generators, etc.).

## How it works

1. **Fetch**: Pulls trending searches from Google Trends RSS (10 geos) and pytrends (15 countries)
2. **Pre-filter**: Removes obvious non-tool trends (sports, entertainment, politics, person names)
3. **Classify**: Uses Gemini 2.5 Flash to identify which trends suggest a tool-building opportunity
4. **Rank**: Selects the top 5 opportunities based on volume, evergreen potential, competition, feasibility, and monetization

## Running manually

```bash
GEMINI_API_KEY=your-key-here python scripts/trend_scanner.py
```

Without a Gemini API key, the scanner skips LLM steps and outputs raw trend data:

```bash
python scripts/trend_scanner.py
```

## Output

Reports are stored in this directory:

- `YYYY-MM-DD.md` -- daily markdown report with top 5 opportunities and all candidates
- `latest.json` -- structured JSON of the most recent scan

## GitHub Action

The `daily-trends.yml` workflow runs automatically at 10:00 UTC every day. It can also be triggered manually from the Actions tab. Results are committed and pushed to this directory automatically.
