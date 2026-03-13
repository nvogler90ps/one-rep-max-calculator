"""Fetch trending search terms from Google Trends RSS feeds and pytrends.

Aggregates trends from multiple geographies, deduplicates them, and returns
a unified list of trend dicts ready for filtering and classification.
"""

import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Optional

import requests

# Google Trends RSS geos to scrape
RSS_GEOS = ["US", "GB", "CA", "AU", "IN", "DE", "FR", "BR", "JP", "KR"]

# Additional countries for pytrends (beyond what RSS covers reliably)
PYTRENDS_COUNTRIES = [
    "united_states", "united_kingdom", "canada", "australia", "india",
    "germany", "france", "brazil", "japan", "south_korea",
    "mexico", "italy", "spain", "netherlands", "sweden",
]

RSS_URL_PATTERN = "https://trends.google.com/trending/rss?geo={geo}"

# Namespace used in Google Trends RSS
HT_NS = {"ht": "https://trends.google.com/trending/rss"}

REQUEST_TIMEOUT = 15  # seconds


def fetch_rss_trends(geo: str, timeout: int = REQUEST_TIMEOUT) -> list[dict]:
    """Fetch trends from Google Trends RSS feed for a single geo.

    Args:
        geo: Two-letter country code (e.g., "US", "GB").
        timeout: HTTP request timeout in seconds.

    Returns:
        List of trend dicts with keys: term, traffic_volume, source,
        related_articles, geo_countries, timestamp.
    """
    url = RSS_URL_PATTERN.format(geo=geo)
    trends = []

    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [WARN] RSS fetch failed for {geo}: {e}")
        return trends

    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError as e:
        print(f"  [WARN] RSS parse failed for {geo}: {e}")
        return trends

    for item in root.iter("item"):
        title_el = item.find("title")
        if title_el is None or not title_el.text:
            continue

        term = title_el.text.strip()

        # Approximate traffic volume
        traffic_el = item.find("ht:approx_traffic", HT_NS)
        traffic_volume = 0
        if traffic_el is not None and traffic_el.text:
            traffic_str = traffic_el.text.strip().replace("+", "").replace(",", "")
            try:
                traffic_volume = int(traffic_str)
            except ValueError:
                pass

        # Related article titles
        related_articles = []
        for news_item in item.findall("ht:news_item", HT_NS):
            news_title = news_item.find("ht:news_item_title", HT_NS)
            if news_title is not None and news_title.text:
                related_articles.append(news_title.text.strip())

        trends.append({
            "term": term,
            "traffic_volume": traffic_volume,
            "source": "rss",
            "related_articles": related_articles,
            "geo_countries": [geo],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    return trends


def fetch_pytrends_trends() -> list[dict]:
    """Fetch additional trends using pytrends trending_searches().

    pytrends can be fragile, so all calls are wrapped in try/except.

    Returns:
        List of trend dicts.
    """
    trends = []

    try:
        from pytrends.request import TrendReq
    except ImportError:
        print("  [WARN] pytrends not installed, skipping pytrends source")
        return trends

    pytrends = TrendReq(hl="en-US", tz=360)

    for country in PYTRENDS_COUNTRIES:
        try:
            df = pytrends.trending_searches(pn=country)
            if df is None or df.empty:
                continue

            for term in df[0].tolist():
                term = str(term).strip()
                if not term:
                    continue

                # Map pytrends country name back to rough geo code
                geo_code = _country_to_geo(country)

                trends.append({
                    "term": term,
                    "traffic_volume": 0,  # pytrends doesn't give volume here
                    "source": "pytrends",
                    "related_articles": [],
                    "geo_countries": [geo_code],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
        except Exception as e:
            print(f"  [WARN] pytrends failed for {country}: {e}")
            continue

    return trends


def _country_to_geo(country_name: str) -> str:
    """Map pytrends country name to a two-letter geo code."""
    mapping = {
        "united_states": "US",
        "united_kingdom": "GB",
        "canada": "CA",
        "australia": "AU",
        "india": "IN",
        "germany": "DE",
        "france": "FR",
        "brazil": "BR",
        "japan": "JP",
        "south_korea": "KR",
        "mexico": "MX",
        "italy": "IT",
        "spain": "ES",
        "netherlands": "NL",
        "sweden": "SE",
    }
    return mapping.get(country_name, country_name.upper()[:2])


def deduplicate_trends(trends: list[dict]) -> list[dict]:
    """Deduplicate trends by normalized term, merging geo_countries and keeping
    the highest traffic volume.

    Args:
        trends: Raw list of trend dicts (may contain duplicates).

    Returns:
        Deduplicated list, preserving original casing from the first occurrence.
    """
    seen: dict[str, dict] = {}

    for trend in trends:
        key = trend["term"].lower().strip()

        if key in seen:
            existing = seen[key]
            # Merge geo countries
            for geo in trend["geo_countries"]:
                if geo not in existing["geo_countries"]:
                    existing["geo_countries"].append(geo)
            # Keep higher traffic volume
            if trend["traffic_volume"] > existing["traffic_volume"]:
                existing["traffic_volume"] = trend["traffic_volume"]
            # Merge related articles
            for article in trend["related_articles"]:
                if article not in existing["related_articles"]:
                    existing["related_articles"].append(article)
            # Merge sources
            if trend["source"] not in existing["source"]:
                existing["source"] = f"{existing['source']},{trend['source']}"
        else:
            seen[key] = {
                "term": trend["term"],
                "traffic_volume": trend["traffic_volume"],
                "source": trend["source"],
                "related_articles": list(trend["related_articles"]),
                "geo_countries": list(trend["geo_countries"]),
                "timestamp": trend["timestamp"],
            }

    return list(seen.values())


def fetch_all_trends() -> tuple[list[dict], dict]:
    """Fetch and deduplicate trends from all sources.

    Returns:
        Tuple of (deduplicated trends list, metadata dict with source counts).
    """
    all_trends = []
    rss_geo_count = 0
    pytrends_country_count = 0

    # RSS feeds
    print("Fetching RSS trends...")
    for geo in RSS_GEOS:
        print(f"  Fetching {geo}...")
        geo_trends = fetch_rss_trends(geo)
        all_trends.extend(geo_trends)
        if geo_trends:
            rss_geo_count += 1

    rss_count = len(all_trends)
    print(f"  RSS total: {rss_count} trends from {rss_geo_count} geos")

    # pytrends
    print("Fetching pytrends trends...")
    pytrends_trends = fetch_pytrends_trends()
    all_trends.extend(pytrends_trends)
    pytrends_count = len(pytrends_trends)

    # Count unique pytrends countries that returned data
    pytrends_geos = set()
    for t in pytrends_trends:
        for g in t["geo_countries"]:
            pytrends_geos.add(g)
    pytrends_country_count = len(pytrends_geos)

    print(f"  pytrends total: {pytrends_count} trends from {pytrends_country_count} countries")

    # Deduplicate
    print("Deduplicating...")
    deduped = deduplicate_trends(all_trends)
    print(f"  {len(all_trends)} raw -> {len(deduped)} unique trends")

    metadata = {
        "rss_geos": rss_geo_count,
        "rss_trends": rss_count,
        "pytrends_countries": pytrends_country_count,
        "pytrends_trends": pytrends_count,
        "total_raw": len(all_trends),
        "total_deduped": len(deduped),
    }

    return deduped, metadata
