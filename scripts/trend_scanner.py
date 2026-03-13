"""Daily trend scanner -- orchestrates trend fetching, filtering, and reporting.

Fetches trending search terms from multiple sources, filters them for
tool-building opportunities using keyword heuristics and LLM classification,
then generates a markdown report and structured JSON output.

Usage:
    GEMINI_API_KEY=xxx python scripts/trend_scanner.py

If GEMINI_API_KEY is not set, LLM steps are skipped and raw trend data
is output instead.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from trend_sources import fetch_all_trends
from trend_filter import pre_filter, classify_with_llm, rank_candidates

# Output directory (relative to repo root)
TRENDS_DIR = Path(__file__).resolve().parent.parent / "trends"


def main() -> None:
    """Run the full trend scanning pipeline."""
    start_time = datetime.now(timezone.utc)
    today = start_time.strftime("%Y-%m-%d")
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    print(f"=== Trend Scanner: {today} ===")
    print()

    # Ensure output directory exists
    TRENDS_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Fetch trends
    print("[1/4] Fetching trends from all sources...")
    try:
        trends, source_metadata = fetch_all_trends()
    except Exception as e:
        print(f"[ERROR] Failed to fetch trends: {e}")
        trends, source_metadata = [], {
            "rss_geos": 0, "rss_trends": 0,
            "pytrends_countries": 0, "pytrends_trends": 0,
            "total_raw": 0, "total_deduped": 0,
        }

    if not trends:
        print("[WARN] No trends fetched. Writing empty report.")
        _write_empty_report(today, start_time, source_metadata)
        return

    print(f"  Found {len(trends)} unique trends")
    print()

    # Step 2: Pre-filter
    print("[2/4] Pre-filtering trends...")
    filtered_trends, removed_count = pre_filter(trends)
    print(f"  Removed {removed_count}, kept {len(filtered_trends)}")
    print()

    # Step 3 & 4: LLM classification and ranking (if API key available)
    candidates = []
    top_5 = []
    total_llm_calls = 0

    if not api_key:
        print("[3/4] Skipping LLM classification (GEMINI_API_KEY not set)")
        print("[4/4] Skipping LLM ranking (GEMINI_API_KEY not set)")
        print()
    else:
        print(f"[3/4] Classifying {len(filtered_trends)} trends with Gemini...")
        try:
            candidates, classify_calls = classify_with_llm(filtered_trends, api_key)
            total_llm_calls += classify_calls
            print(f"  Found {len(candidates)} tool candidates ({classify_calls} LLM calls)")
        except Exception as e:
            print(f"  [ERROR] Classification failed: {e}")
            candidates = []
        print()

        if candidates:
            print(f"[4/4] Ranking top 5 from {len(candidates)} candidates...")
            try:
                top_5, rank_calls = rank_candidates(candidates, api_key)
                total_llm_calls += rank_calls
                print(f"  Top 5 selected ({rank_calls} LLM calls)")
            except Exception as e:
                print(f"  [ERROR] Ranking failed: {e}")
                top_5 = []
        else:
            print("[4/4] No candidates to rank")
        print()

    # Generate outputs
    end_time = datetime.now(timezone.utc)
    run_duration = (end_time - start_time).total_seconds()

    report_data = {
        "date": today,
        "summary": {
            "trends_scanned": len(trends),
            "pre_filtered_removed": removed_count,
            "llm_evaluated": len(filtered_trends) if api_key else 0,
            "tool_candidates_found": len(candidates),
        },
        "top_5": top_5,
        "all_candidates": candidates,
        "metadata": {
            "run_time": end_time.isoformat(),
            "run_duration_seconds": round(run_duration, 1),
            "sources": {
                "rss_geos": source_metadata.get("rss_geos", 0),
                "pytrends_countries": source_metadata.get("pytrends_countries", 0),
            },
            "llm_calls": total_llm_calls,
        },
        "all_trends": [
            {
                "term": t["term"],
                "traffic_volume": t["traffic_volume"],
                "geo_countries": t["geo_countries"],
                "source": t["source"],
            }
            for t in trends
        ] if not api_key else [],  # Include raw trends only when no LLM
    }

    # Write markdown report
    md_path = TRENDS_DIR / f"{today}.md"
    md_content = _build_markdown_report(report_data)
    md_path.write_text(md_content, encoding="utf-8")
    print(f"Report written to: {md_path}")

    # Write latest.json
    json_path = TRENDS_DIR / "latest.json"
    json_path.write_text(
        json.dumps(report_data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"JSON written to:   {json_path}")

    print()
    print(f"=== Done in {run_duration:.1f}s ===")


def _build_markdown_report(data: dict) -> str:
    """Build the markdown report string from report data."""
    summary = data["summary"]
    meta = data["metadata"]
    top_5 = data["top_5"]
    candidates = data["all_candidates"]

    lines = []
    lines.append(f"# Trend Scan: {data['date']}")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Trends scanned: {summary['trends_scanned']}")
    lines.append(f"- Pre-filtered: {summary['pre_filtered_removed']} removed")
    lines.append(f"- LLM evaluated: {summary['llm_evaluated']}")
    lines.append(f"- Tool candidates found: {summary['tool_candidates_found']}")
    lines.append("")

    # Top 5
    if top_5:
        lines.append("## Top 5 Tool Opportunities")
        lines.append("")
        for item in top_5:
            rank = item.get("rank", "?")
            tool_idea = item.get("tool_idea", item["term"])
            lines.append(f"### {rank}. {tool_idea}")
            lines.append(f"- **Trend volume**: {item.get('traffic_volume', 0):,} searches")
            lines.append(f"- **Countries**: {', '.join(item.get('geo_countries', []))}")
            lines.append(f"- **Why build this**: {item.get('why_good', 'N/A')}")
            lines.append(f"- **Rough spec**: {item.get('rough_spec', 'N/A')}")
            lines.append(f"- **Complexity**: {item.get('complexity', 'N/A')}")
            keywords = item.get("target_keywords", [])
            if keywords:
                lines.append(f"- **Target keywords**: {', '.join(keywords)}")
            build_time = item.get("estimated_build_time", "")
            if build_time:
                lines.append(f"- **Estimated build time**: {build_time}")
            lines.append("")
    else:
        lines.append("## Top 5 Tool Opportunities")
        lines.append("")
        lines.append("_No tool candidates identified in this scan._")
        lines.append("")

    # All candidates table
    if candidates:
        lines.append("## All Candidates")
        lines.append("")
        lines.append("| # | Term | Volume | Idea | Complexity |")
        lines.append("|---|------|--------|------|------------|")
        for idx, c in enumerate(candidates, 1):
            term = c["term"].replace("|", "\\|")
            idea = c.get("tool_idea", "").replace("|", "\\|")
            volume = f"{c.get('traffic_volume', 0):,}"
            complexity = c.get("complexity", "?")
            lines.append(f"| {idx} | {term} | {volume} | {idea} | {complexity} |")
        lines.append("")

    # Raw trends (only when no LLM was used)
    raw_trends = data.get("all_trends", [])
    if raw_trends:
        lines.append("## Raw Trends (no LLM classification)")
        lines.append("")
        lines.append("| # | Term | Volume | Countries | Source |")
        lines.append("|---|------|--------|-----------|--------|")
        for idx, t in enumerate(raw_trends[:100], 1):  # Cap at 100 for readability
            term = t["term"].replace("|", "\\|")
            volume = f"{t.get('traffic_volume', 0):,}"
            countries = ", ".join(t.get("geo_countries", []))
            source = t.get("source", "?")
            lines.append(f"| {idx} | {term} | {volume} | {countries} | {source} |")
        if len(raw_trends) > 100:
            lines.append(f"| ... | _({len(raw_trends) - 100} more)_ | | | |")
        lines.append("")

    # Metadata
    lines.append("## Metadata")
    lines.append(f"- Run time: {meta['run_time']}")
    sources = meta["sources"]
    lines.append(f"- Sources: RSS ({sources['rss_geos']} geos), pytrends ({sources['pytrends_countries']} countries)")
    lines.append(f"- LLM calls: {meta['llm_calls']}")
    lines.append(f"- Duration: {meta.get('run_duration_seconds', 0)}s")
    lines.append("")

    return "\n".join(lines)


def _write_empty_report(today: str, start_time: datetime, source_metadata: dict) -> None:
    """Write an empty report when no trends were fetched."""
    TRENDS_DIR.mkdir(parents=True, exist_ok=True)

    end_time = datetime.now(timezone.utc)
    data = {
        "date": today,
        "summary": {
            "trends_scanned": 0,
            "pre_filtered_removed": 0,
            "llm_evaluated": 0,
            "tool_candidates_found": 0,
        },
        "top_5": [],
        "all_candidates": [],
        "metadata": {
            "run_time": end_time.isoformat(),
            "run_duration_seconds": round((end_time - start_time).total_seconds(), 1),
            "sources": {
                "rss_geos": source_metadata.get("rss_geos", 0),
                "pytrends_countries": source_metadata.get("pytrends_countries", 0),
            },
            "llm_calls": 0,
        },
        "all_trends": [],
    }

    md_path = TRENDS_DIR / f"{today}.md"
    md_path.write_text(_build_markdown_report(data), encoding="utf-8")

    json_path = TRENDS_DIR / "latest.json"
    json_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Empty report written to: {md_path}")


if __name__ == "__main__":
    main()
