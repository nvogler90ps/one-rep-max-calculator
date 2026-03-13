#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
DOMAIN="https://automated-insights.com"

# Directories to skip when discovering tools
SKIP_DIRS="scripts .github .git .claude .wrangler node_modules site site-homepage trends"

# ---------- clean slate ----------
rm -rf "$SITE"
mkdir -p "$SITE"

# ---------- discover tools ----------
tools=()
for dir in "$ROOT"/*/; do
    name="$(basename "$dir")"
    # skip non-tool directories
    skip=false
    for s in $SKIP_DIRS; do
        if [ "$name" = "$s" ]; then
            skip=true
            break
        fi
    done
    if $skip; then
        continue
    fi
    # must contain an index.html
    if [ -f "$dir/index.html" ]; then
        tools+=("$name")
    fi
done

echo "Found ${#tools[@]} tools: ${tools[*]}"

# ---------- copy tools into site/<tool-name>/ ----------
for tool in "${tools[@]}"; do
    cp -R "$ROOT/$tool" "$SITE/$tool"

    # remove per-tool root-only files
    rm -f "$SITE/$tool/ads.txt"
    rm -f "$SITE/$tool/robots.txt"
    rm -f "$SITE/$tool"/google*.html

    # rewrite sitemap URLs from old .pages.dev domains to consolidated domain
    if [ -f "$SITE/$tool/sitemap.xml" ]; then
        sed -i '' "s|https://[^<]*\.pages\.dev/[^<]*|${DOMAIN}/${tool}/|g" "$SITE/$tool/sitemap.xml"
    fi
done

# ---------- copy homepage ----------
if [ -f "$ROOT/site-homepage/index.html" ]; then
    cp "$ROOT/site-homepage/index.html" "$SITE/index.html"
else
    echo "WARNING: site-homepage/index.html not found -- skipping homepage"
fi

# ---------- root ads.txt ----------
# Use canonical ads.txt content (same across all tools)
cat > "$SITE/ads.txt" <<'ADSTXT'
google.com, pub-3434609691579834, DIRECT, f08c47fec0942fa0
ADSTXT

# ---------- root google verification files ----------
# Copy any google verification files from the first tool that has them
for tool in "${tools[@]}"; do
    for gfile in "$ROOT/$tool"/google*.html; do
        if [ -f "$gfile" ]; then
            base="$(basename "$gfile")"
            # only copy if we haven't already
            if [ ! -f "$SITE/$base" ]; then
                cp "$gfile" "$SITE/$base"
            fi
        fi
    done
    break
done

# ---------- robots.txt ----------
cat > "$SITE/robots.txt" <<ROBOTS
User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
ROBOTS

# ---------- sitemap index ----------
cat > "$SITE/sitemap.xml" <<'HEADER'
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
HEADER

# add homepage URL as a standalone sitemap entry
cat >> "$SITE/sitemap.xml" <<HOMEPAGE
  <sitemap>
    <loc>${DOMAIN}/</loc>
  </sitemap>
HOMEPAGE

for tool in "${tools[@]}"; do
    if [ -f "$SITE/$tool/sitemap.xml" ]; then
        cat >> "$SITE/sitemap.xml" <<ENTRY
  <sitemap>
    <loc>${DOMAIN}/${tool}/sitemap.xml</loc>
  </sitemap>
ENTRY
    fi
done

cat >> "$SITE/sitemap.xml" <<'FOOTER'
</sitemapindex>
FOOTER

echo "Build complete. Output: $SITE"
echo "Tools included: ${#tools[@]}"
