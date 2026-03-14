#!/usr/bin/env bash
set -euo pipefail

# Submit all URLs to IndexNow (Bing, Yandex, etc.)
# Run after deploying new content.

DOMAIN="https://automated-insights.com"
KEY="3dee9fe9b7d9a9e32a6d0e90b99936b7"
SITE="$(cd "$(dirname "$0")/.." && pwd)/site"

# Collect all page URLs
urls=()
while IFS= read -r f; do
    # Convert file path to URL
    dir="$(dirname "$f")"
    rel="${dir#$SITE}"
    if [ "$rel" = "" ]; then
        urls+=("${DOMAIN}/")
    else
        urls+=("${DOMAIN}${rel}/")
    fi
done < <(find "$SITE" -name "index.html" -type f)

echo "Found ${#urls[@]} URLs to submit"

# Build JSON payload (IndexNow accepts up to 10,000 URLs per batch)
json_urls=""
for url in "${urls[@]}"; do
    if [ -n "$json_urls" ]; then
        json_urls="$json_urls,"
    fi
    json_urls="$json_urls\"$url\""
done

payload="{\"host\":\"automated-insights.com\",\"key\":\"${KEY}\",\"keyLocation\":\"${DOMAIN}/${KEY}.txt\",\"urlList\":[${json_urls}]}"

# Submit to IndexNow API
response=$(curl -s -w "\n%{http_code}" -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json" \
    -d "$payload")

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -1)

echo "IndexNow response: HTTP $http_code"
if [ "$http_code" = "200" ] || [ "$http_code" = "202" ]; then
    echo "Success! ${#urls[@]} URLs submitted to Bing, Yandex, and other IndexNow partners."
else
    echo "Response: $body"
fi
