"""Filter and classify trending search terms to find tool-building opportunities.

Uses a two-stage approach:
1. Pre-filter: remove obvious non-tool trends (sports, entertainment, politics, etc.)
2. LLM classification: use Gemini 2.5 Flash to identify tool candidates and rank them.
"""

import json
import re
import time
from typing import Optional

# Keywords that strongly indicate non-tool trends
SPORTS_KEYWORDS = {
    "score", "playoff", "season", "championship", "vs", "game", "match",
    "league", "draft", "trade", "nfl", "nba", "mlb", "nhl", "fifa",
    "world cup", "super bowl", "touchdown", "quarterback", "roster",
}

ENTERTAINMENT_KEYWORDS = {
    "episode", "movie", "trailer", "premiere", "concert", "album",
    "died", "arrested", "scandal", "wedding", "divorce", "netflix",
    "hulu", "disney", "grammy", "oscar", "emmy", "box office",
    "celebrity", "singer", "actor", "actress", "rapper",
}

POLITICS_KEYWORDS = {
    "election", "vote", "senate", "congress", "president", "governor",
    "campaign", "ballot", "impeach", "legislation", "democrat",
    "republican", "parliament", "minister", "political",
}

ALL_EXCLUDE_KEYWORDS = SPORTS_KEYWORDS | ENTERTAINMENT_KEYWORDS | POLITICS_KEYWORDS

# Pattern for person names: 2-3 capitalized words
PERSON_NAME_PATTERN = re.compile(
    r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$"
)

BATCH_SIZE = 25
MAX_RETRIES = 1


def pre_filter(trends: list[dict]) -> tuple[list[dict], int]:
    """Remove obvious non-tool trends using keyword and pattern matching.

    Args:
        trends: List of trend dicts from trend_sources.

    Returns:
        Tuple of (filtered trends, count of removed trends).
    """
    kept = []
    removed = 0

    for trend in trends:
        term = trend["term"]
        term_lower = term.lower()

        # Check for person name pattern
        if PERSON_NAME_PATTERN.match(term):
            removed += 1
            continue

        # Check for exclude keywords
        should_exclude = False
        for keyword in ALL_EXCLUDE_KEYWORDS:
            if keyword in term_lower:
                should_exclude = True
                break

        if should_exclude:
            removed += 1
            continue

        # Also check related articles for strong signals
        articles_text = " ".join(trend.get("related_articles", [])).lower()
        exclude_in_articles = 0
        for keyword in ALL_EXCLUDE_KEYWORDS:
            if keyword in articles_text:
                exclude_in_articles += 1

        # Only exclude based on articles if there's overwhelming evidence
        # (3+ exclude keywords in articles AND the term itself is short/vague)
        if exclude_in_articles >= 3 and len(term.split()) <= 2:
            removed += 1
            continue

        kept.append(trend)

    return kept, removed


def classify_with_llm(
    trends: list[dict],
    api_key: str,
) -> tuple[list[dict], int]:
    """Classify trends as TOOL_CANDIDATE or NOT_TOOL using Gemini 2.5 Flash.

    Processes trends in batches of 25 per API call.

    Args:
        trends: Pre-filtered list of trend dicts.
        api_key: Gemini API key.

    Returns:
        Tuple of (list of tool candidate dicts, number of LLM calls made).
    """
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    candidates = []
    llm_calls = 0

    for i in range(0, len(trends), BATCH_SIZE):
        batch = trends[i:i + BATCH_SIZE]
        batch_terms = []
        for idx, trend in enumerate(batch):
            batch_terms.append({
                "index": idx,
                "term": trend["term"],
                "traffic_volume": trend["traffic_volume"],
                "geo_countries": trend["geo_countries"],
                "related_articles": trend.get("related_articles", [])[:3],
            })

        prompt = _build_classification_prompt(batch_terms)

        for attempt in range(MAX_RETRIES + 1):
            try:
                response = model.generate_content(prompt)
                llm_calls += 1
                parsed = _parse_classification_response(response.text)
                break
            except json.JSONDecodeError:
                if attempt < MAX_RETRIES:
                    print(f"  [WARN] JSON parse failed, retrying (attempt {attempt + 1})...")
                    time.sleep(1)
                    continue
                else:
                    print(f"  [WARN] JSON parse failed after retries, skipping batch")
                    parsed = []
            except Exception as e:
                print(f"  [WARN] LLM call failed: {e}")
                llm_calls += 1
                parsed = []
                break

        # Merge LLM results back with original trend data
        for result in parsed:
            if result.get("classification") != "TOOL_CANDIDATE":
                continue

            idx = result.get("index", -1)
            if 0 <= idx < len(batch):
                original = batch[idx]
                candidates.append({
                    **original,
                    "tool_idea": result.get("tool_idea", ""),
                    "why_good": result.get("why_good", ""),
                    "complexity": result.get("complexity", "medium"),
                })

        # Small delay between batches to respect rate limits
        if i + BATCH_SIZE < len(trends):
            time.sleep(0.5)

    return candidates, llm_calls


def _build_classification_prompt(batch_terms: list[dict]) -> str:
    """Build the classification prompt for a batch of trends."""
    terms_json = json.dumps(batch_terms, indent=2)

    return f"""You are a tool/utility website evaluator. For each trending search term below,
classify it as either TOOL_CANDIDATE or NOT_TOOL.

A TOOL_CANDIDATE is a trend that suggests people need a web-based tool, calculator,
converter, generator, reference, or utility. Examples: unit conversions, file format
converters, calculators, generators (passwords, QR codes), lookup tools, validators,
formatters, etc.

NOT_TOOL means the trend is about news, people, events, entertainment, sports, or
anything that doesn't suggest a web tool need.

For each TOOL_CANDIDATE, also provide:
- tool_idea: a short description of what tool to build
- why_good: why this would make a good micro-tool website
- complexity: "low", "medium", or "high"

Return ONLY valid JSON -- an array of objects. Each object must have:
- "index": the original index number
- "classification": "TOOL_CANDIDATE" or "NOT_TOOL"
- "tool_idea": (only for TOOL_CANDIDATE)
- "why_good": (only for TOOL_CANDIDATE)
- "complexity": (only for TOOL_CANDIDATE)

Trending terms:
{terms_json}

Respond with ONLY the JSON array, no markdown fences, no explanation."""


def _parse_classification_response(text: str) -> list[dict]:
    """Parse the LLM's JSON response, handling common formatting issues."""
    text = text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines (fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    return json.loads(text)


def rank_candidates(
    candidates: list[dict],
    api_key: str,
) -> tuple[list[dict], int]:
    """Rank tool candidates and return the top 5 with detailed specs.

    Makes one LLM call to rank all candidates.

    Args:
        candidates: List of tool candidate dicts from classify_with_llm.
        api_key: Gemini API key.

    Returns:
        Tuple of (top 5 ranked candidates with specs, number of LLM calls made).
    """
    if not candidates:
        return [], 0

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    # Prepare summary of all candidates for ranking
    candidate_summaries = []
    for idx, c in enumerate(candidates):
        candidate_summaries.append({
            "index": idx,
            "term": c["term"],
            "traffic_volume": c["traffic_volume"],
            "geo_countries": c["geo_countries"],
            "tool_idea": c.get("tool_idea", ""),
            "why_good": c.get("why_good", ""),
            "complexity": c.get("complexity", "medium"),
        })

    prompt = _build_ranking_prompt(candidate_summaries)

    llm_calls = 0
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = model.generate_content(prompt)
            llm_calls += 1
            ranked = _parse_ranking_response(response.text)
            break
        except json.JSONDecodeError:
            if attempt < MAX_RETRIES:
                print(f"  [WARN] Ranking JSON parse failed, retrying...")
                time.sleep(1)
                continue
            else:
                print(f"  [WARN] Ranking JSON parse failed after retries")
                # Fall back to top 5 by traffic volume
                ranked = _fallback_ranking(candidates)
        except Exception as e:
            print(f"  [WARN] Ranking LLM call failed: {e}")
            llm_calls += 1
            ranked = _fallback_ranking(candidates)
            break

    # Merge ranking data back into candidate dicts
    top_5 = []
    for rank_entry in ranked[:5]:
        idx = rank_entry.get("index", -1)
        if 0 <= idx < len(candidates):
            original = candidates[idx]
            top_5.append({
                **original,
                "rank": len(top_5) + 1,
                "rough_spec": rank_entry.get("rough_spec", ""),
                "target_keywords": rank_entry.get("target_keywords", []),
                "estimated_build_time": rank_entry.get("estimated_build_time", ""),
                "tool_idea": rank_entry.get("tool_idea", original.get("tool_idea", "")),
                "why_good": rank_entry.get("why_good", original.get("why_good", "")),
            })

    return top_5, llm_calls


def _build_ranking_prompt(candidates: list[dict]) -> str:
    """Build the ranking prompt for all tool candidates."""
    candidates_json = json.dumps(candidates, indent=2)

    return f"""You are a micro-tool website strategist. Given these tool candidates derived from
trending searches, rank the TOP 5 best opportunities to build as small, single-purpose
web tools/calculators/utilities.

Consider these factors:
- Search volume (higher is better)
- Evergreen potential (will people search this next month too?)
- Competition (less competition is better)
- Feasibility (can it be built as a simple static site with JS?)
- Monetization potential (ad-friendly, high-value keywords)

For each of the top 5, provide:
- index: the original index from the input
- tool_idea: refined tool name/description
- why_good: why this is a top pick
- rough_spec: 2-3 sentences describing what to build
- target_keywords: list of 3-5 SEO keywords to target
- estimated_build_time: rough estimate (e.g., "2-4 hours", "1 day")

Return ONLY valid JSON -- an array of exactly 5 objects, ranked from best to worst.
No markdown fences, no explanation.

Candidates:
{candidates_json}"""


def _parse_ranking_response(text: str) -> list[dict]:
    """Parse the ranking LLM response."""
    text = text.strip()

    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    return json.loads(text)


def _fallback_ranking(candidates: list[dict]) -> list[dict]:
    """Fallback ranking by traffic volume when LLM ranking fails."""
    sorted_candidates = sorted(
        candidates,
        key=lambda c: c.get("traffic_volume", 0),
        reverse=True,
    )
    return [
        {
            "index": candidates.index(c),
            "tool_idea": c.get("tool_idea", c["term"]),
            "why_good": c.get("why_good", "High search volume"),
            "rough_spec": "Build a simple web tool based on this trend.",
            "target_keywords": [c["term"].lower()],
            "estimated_build_time": "2-4 hours",
        }
        for c in sorted_candidates[:5]
    ]
