#!/usr/bin/env bash
set -euo pipefail

# Programmatic SEO Page Generator
# Reads pseo/data.json + pseo/template.html from each tool directory
# Generates static HTML pages in <tool>/pseo/pages/

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="https://automated-insights.com"
YEAR="$(date +%Y)"
TOTAL_PAGES=0

# Tools that have pSEO configured
PSEO_TOOLS=()
for dir in "$ROOT"/*/pseo/; do
    if [ -f "$dir/data.json" ] && [ -f "$dir/template.html" ]; then
        tool="$(basename "$(dirname "$dir")")"
        PSEO_TOOLS+=("$tool")
    fi
done

if [ ${#PSEO_TOOLS[@]} -eq 0 ]; then
    echo "No pSEO tools found."
    exit 0
fi

echo "Found pSEO tools: ${PSEO_TOOLS[*]}"

# ---------- percentage-calc ----------
generate_percentage_calc() {
    local tool="percentage-calc"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"
    local count=0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    # Parse JSON and generate pages
    local len
    len=$(python3 -c "import json; d=json.load(open('$data')); print(len(d))")

    for i in $(seq 0 $((len - 1))); do
        local vals
        vals=$(python3 -c "
import json, math
d = json.load(open('$data'))[$i]
p = d['p']
of = d['of']
result = round(p * of / 100, 2)
# Format result nicely
if result == int(result):
    result_str = str(int(result))
else:
    result_str = f'{result:g}'
decimal = round(p / 100, 4)
slug = f'what-is-{p}-percent-of-{of}'

# Related: same percent different values, same value different percents
print(f'{p}|{of}|{result_str}|{decimal}|{slug}')
")
        IFS='|' read -r p of result decimal slug <<< "$vals"

        local title="What is ${p}% of ${of}? Answer: ${result}"
        local desc="${p}% of ${of} is ${result}. Free calculator with step-by-step breakdown."
        local canonical="${DOMAIN}/${tool}/${slug}/"
        local pagedir="$outdir/$slug"
        mkdir -p "$pagedir"

        # Generate related links
        local related
        related=$(python3 -c "
import json
d = json.load(open('$data'))
p, of = $p, $of
links = []
# Same percent, different values
for item in d:
    if item['p'] == p and item['of'] != of and len(links) < 4:
        r = round(item['p'] * item['of'] / 100, 2)
        r_str = str(int(r)) if r == int(r) else f'{r:g}'
        slug = f'what-is-{item[\"p\"]}-percent-of-{item[\"of\"]}'
        links.append(f'<a href=\"/${tool}/{slug}/\" class=\"related-link\">{item[\"p\"]}% of {item[\"of\"]} = {r_str}</a>')
# Different percent, same value
for item in d:
    if item['of'] == of and item['p'] != p and len(links) < 8:
        r = round(item['p'] * item['of'] / 100, 2)
        r_str = str(int(r)) if r == int(r) else f'{r:g}'
        slug = f'what-is-{item[\"p\"]}-percent-of-{item[\"of\"]}'
        links.append(f'<a href=\"/${tool}/{slug}/\" class=\"related-link\">{item[\"p\"]}% of {item[\"of\"]} = {r_str}</a>')
print('\\n'.join(links[:8]))
")

        sed -e "s|{{PERCENT}}|${p}|g" \
            -e "s|{{OF}}|${of}|g" \
            -e "s|{{RESULT}}|${result}|g" \
            -e "s|{{DECIMAL}}|${decimal}|g" \
            -e "s|{{TITLE}}|${title}|g" \
            -e "s|{{DESCRIPTION}}|${desc}|g" \
            -e "s|{{CANONICAL}}|${canonical}|g" \
            "$template" | python3 -c "
import sys
html = sys.stdin.read()
related = '''$related'''
html = html.replace('{{RELATED_LINKS}}', related)
print(html)
" > "$pagedir/index.html"

        count=$((count + 1))
    done

    echo "  $tool: generated $count pages"
    TOTAL_PAGES=$((TOTAL_PAGES + count))

    # Generate sitemap for pSEO pages
    generate_sitemap "$tool" "$outdir"
}

# ---------- age-calculator ----------
generate_age_calculator() {
    local tool="age-calculator"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"
    local count=0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local len
    len=$(python3 -c "import json; d=json.load(open('$data')); print(len(d))")

    for i in $(seq 0 $((len - 1))); do
        local vals
        vals=$(python3 -c "
import json
d = json.load(open('$data'))[$i]
by = d['birth_year']
bm = d.get('birth_month', 0)
age_max = 2026 - by
age_min = age_max - 1
# Generation
if by >= 1997: gen = 'Gen Z'
elif by >= 1981: gen = 'Millennial'
elif by >= 1965: gen = 'Gen X'
elif by >= 1946: gen = 'Baby Boomer'
else: gen = 'Silent Generation'
# Chinese zodiac
animals = ['Monkey','Rooster','Dog','Pig','Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat']
zodiac = animals[by % 12]
if bm > 0:
    months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    slug = f'born-in-{months[bm-1].lower()}-{by}'
    title = f'How Old Am I If Born in {months[bm-1]} {by}? Age Calculator'
else:
    slug = f'born-in-{by}'
    title = f'How Old Am I If Born in {by}? Age Calculator'
print(f'{by}|{bm}|{age_min}|{age_max}|{gen}|{zodiac}|{slug}|{title}')
")
        IFS='|' read -r by bm age_min age_max gen zodiac slug title <<< "$vals"

        local desc="If you were born in ${by}, you are ${age_min}-${age_max} years old in 2026. ${gen} generation."
        local canonical="${DOMAIN}/${tool}/${slug}/"
        local pagedir="$outdir/$slug"
        mkdir -p "$pagedir"

        # Related links
        local related
        related=$(python3 -c "
import json
d = json.load(open('$data'))
by = $by
links = []
for item in d:
    if item['birth_year'] != by and 'birth_month' not in item and len(links) < 8:
        y = item['birth_year']
        if abs(y - by) <= 5:
            a_max = 2026 - y
            links.append(f'<a href=\"/${tool}/born-in-{y}/\" class=\"related-link\">Born in {y} ({a_max-1}-{a_max} yrs)</a>')
print('\\n'.join(links[:8]))
" 2>/dev/null || echo "")

        sed -e "s|{{BIRTH_YEAR}}|${by}|g" \
            -e "s|{{AGE_MIN}}|${age_min}|g" \
            -e "s|{{AGE_MAX}}|${age_max}|g" \
            -e "s|{{TITLE}}|${title}|g" \
            -e "s|{{DESCRIPTION}}|${desc}|g" \
            -e "s|{{CANONICAL}}|${canonical}|g" \
            -e "s|{{GENERATION}}|${gen}|g" \
            -e "s|{{ZODIAC}}|${zodiac}|g" \
            "$template" | python3 -c "
import sys
html = sys.stdin.read()
related = '''$related'''
html = html.replace('{{RELATED_LINKS}}', related)
print(html)
" > "$pagedir/index.html"

        count=$((count + 1))
    done

    echo "  $tool: generated $count pages"
    TOTAL_PAGES=$((TOTAL_PAGES + count))
    generate_sitemap "$tool" "$outdir"
}

# ---------- vbucks-calc ----------
generate_vbucks_calc() {
    local tool="vbucks-calc"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"
    local count=0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local len
    len=$(python3 -c "import json; d=json.load(open('$data')); print(len(d))")

    for i in $(seq 0 $((len - 1))); do
        local vals
        vals=$(python3 -c "
import json
d = json.load(open('$data'))[$i]
vb = d['vbucks']
usd = d['usd']
cost_per = round(usd / vb, 5) if vb > 0 else 0
vb_fmt = f'{vb:,}'
slug = f'{vb}-vbucks-to-usd'
# What to buy
if vb >= 2000: buy = 'Legendary skins, bundles, or the Battle Pass + extras'
elif vb >= 1200: buy = 'Epic skins, featured items, or the Battle Pass'
elif vb >= 800: buy = 'Rare skins, emotes, or gliders'
elif vb >= 500: buy = 'Uncommon skins or harvesting tools'
elif vb >= 200: buy = 'Emotes, sprays, or wraps'
else: buy = 'Small cosmetic items'
# Best pack
if vb <= 1000: pack = '1,000 V-Bucks for \$7.99'
elif vb <= 2800: pack = '2,800 V-Bucks for \$19.99'
elif vb <= 5000: pack = '5,000 V-Bucks for \$31.99'
else: pack = '13,500 V-Bucks for \$79.99'
print(f'{vb}|{vb_fmt}|{usd}|{cost_per}|{slug}|{buy}|{pack}')
")
        IFS='|' read -r vb vb_fmt usd cost_per slug buy pack <<< "$vals"

        local title="How Much is ${vb_fmt} V-Bucks? (${usd} USD)"
        local desc="${vb_fmt} V-Bucks costs \$${usd} USD. Cost per V-Buck: \$${cost_per}."
        local canonical="${DOMAIN}/${tool}/${slug}/"
        local pagedir="$outdir/$slug"
        mkdir -p "$pagedir"

        local related
        related=$(python3 -c "
import json
d = json.load(open('$data'))
vb = $vb
links = []
for item in d:
    if item['vbucks'] != vb and len(links) < 8:
        v = item['vbucks']
        u = item['usd']
        links.append(f'<a href=\"/${tool}/{v}-vbucks-to-usd/\" class=\"related-link\">{v:,} V-Bucks = \${u}</a>')
print('\\n'.join(links[:8]))
" 2>/dev/null || echo "")

        sed -e "s|{{VBUCKS}}|${vb}|g" \
            -e "s|{{VBUCKS_FORMATTED}}|${vb_fmt}|g" \
            -e "s|{{USD}}|${usd}|g" \
            -e "s|{{COST_PER}}|${cost_per}|g" \
            -e "s|{{TITLE}}|${title}|g" \
            -e "s|{{DESCRIPTION}}|${desc}|g" \
            -e "s|{{CANONICAL}}|${canonical}|g" \
            -e "s|{{YEAR}}|${YEAR}|g" \
            "$template" | python3 -c "
import sys
html = sys.stdin.read()
related = '''$related'''
buy = '''$buy'''
pack = '''$pack'''
html = html.replace('{{RELATED_LINKS}}', related)
html = html.replace('{{WHAT_TO_BUY}}', buy)
html = html.replace('{{WHAT_TO_BUY_TEXT}}', buy)
html = html.replace('{{BEST_PACK}}', pack)
html = html.replace('{{PACK_RECOMMENDATION}}', pack)
html = html.replace('{{EXACT_PURCHASE_ANSWER}}', '')
print(html)
" > "$pagedir/index.html"

        count=$((count + 1))
    done

    echo "  $tool: generated $count pages"
    TOTAL_PAGES=$((TOTAL_PAGES + count))
    generate_sitemap "$tool" "$outdir"
}

# ---------- date-calculator (uses Python for rendering to avoid pipe issues) ----------
generate_date_calculator() {
    local tool="date-calculator"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" python3 << 'PYEOF'
import json, os

tool = "date-calculator"
domain = "https://automated-insights.com"
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

for item in data:
    t = item["type"]
    slug = item["slug"]
    name = item.get("name", slug.replace("-", " ").title())
    date_val = item.get("date", "")
    days = item.get("days", 0)
    start = item.get("start", "")
    end = item.get("end", "")

    if t == "until_holiday":
        target = date_val
        title = f"How Many Days Until {name}?"
        desc = f"Find out exactly how many days until {name}. Live countdown with weeks and months breakdown."
    elif t == "days_from_now":
        target = str(days)
        title = f"What Date is {days} Days From Today?"
        desc = f"Calculate the exact date {days} days from today. Includes weeks breakdown and day of week."
    elif t == "days_from_date":
        target = f"{start}|{days}"
        title = name
        desc = f"Calculate the date for {name}."
    elif t == "days_between":
        target = f"{start}|{end}"
        title = name
        desc = f"Calculate the number of days for {name}."
    else:
        target = ""
        title = name
        desc = name

    canonical = f"{domain}/{tool}/{slug}/"

    # Related links
    links = []
    for other in data:
        if other["slug"] != slug and len(links) < 8:
            s = other["slug"]
            n = other.get("name", s.replace("-", " ").title())
            links.append(f'<a href="/{tool}/{s}/" class="related-link">{n}</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TYPE}}", t)
    html = html.replace("{{SLUG}}", slug)
    html = html.replace("{{TARGET_NAME}}", name)
    html = html.replace("{{TARGET_DATE}}", target)
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{RELATED_LINKS}}", related)

    pagedir = os.path.join(outdir, slug)
    os.makedirs(pagedir, exist_ok=True)
    with open(os.path.join(pagedir, "index.html"), "w") as f:
        f.write(html)
    count += 1

print(count)
PYEOF
)

    echo "  $tool: generated $count pages"
    TOTAL_PAGES=$((TOTAL_PAGES + count))
    generate_sitemap "$tool" "$outdir"
}

# ---------- tdee-calculator ----------
generate_tdee_calculator() {
    local tool="tdee-calculator"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"
    local count=0

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local len
    len=$(python3 -c "import json; d=json.load(open('$data')); print(len(d))")

    for i in $(seq 0 $((len - 1))); do
        local vals
        vals=$(python3 -c "
import json
d = json.load(open('$data'))[$i]
w = d['weight_lbs']
g = d['gender']
a = d.get('activity', 'moderate')
tdee = d['tdee']
bmr = d['bmr']
gd = g.capitalize()
ad_map = {'sedentary': 'Sedentary', 'moderate': 'Moderately Active', 'active': 'Active'}
ad = ad_map.get(a, a.capitalize())
cut = tdee - 500
bulk = tdee + 500
slug = f'tdee-{w}lb-{g}-{a}'
print(f'{w}|{g}|{gd}|{a}|{ad}|{tdee}|{bmr}|{cut}|{bulk}|{slug}')
")
        IFS='|' read -r w g gd a ad tdee bmr cut bulk slug <<< "$vals"

        local title="TDEE for ${w} lb ${gd} (${ad}) - ${tdee} Calories/Day"
        local gd_lower
        gd_lower=$(echo "$gd" | tr '[:upper:]' '[:lower:]')
        local ad_lower
        ad_lower=$(echo "$ad" | tr '[:upper:]' '[:lower:]')
        local desc="A ${w} lb ${gd_lower} with ${ad_lower} activity burns approximately ${tdee} calories per day. BMR: ${bmr}."
        local canonical="${DOMAIN}/${tool}/${slug}/"
        local pagedir="$outdir/$slug"
        mkdir -p "$pagedir"

        local related
        related=$(python3 -c "
import json
d = json.load(open('$data'))
w, g, a = $w, '$g', '$a'
links = []
for item in d:
    iw, ig, ia = item['weight_lbs'], item['gender'], item.get('activity','moderate')
    if (iw != w or ig != g or ia != a) and len(links) < 8:
        gd = ig.capitalize()
        ad_map = {'sedentary': 'Sedentary', 'moderate': 'Moderate', 'active': 'Active'}
        ad = ad_map.get(ia, ia)
        slug = f'tdee-{iw}lb-{ig}-{ia}'
        links.append(f'<a href=\"/${tool}/{slug}/\" class=\"related-link\">{iw}lb {gd} ({ad}) - {item[\"tdee\"]} cal</a>')
print('\\n'.join(links[:8]))
" 2>/dev/null || echo "")

        sed -e "s|{{WEIGHT_LBS}}|${w}|g" \
            -e "s|{{GENDER}}|${g}|g" \
            -e "s|{{GENDER_DISPLAY}}|${gd}|g" \
            -e "s|{{ACTIVITY}}|${a}|g" \
            -e "s|{{ACTIVITY_DISPLAY}}|${ad}|g" \
            -e "s|{{TDEE}}|${tdee}|g" \
            -e "s|{{BMR}}|${bmr}|g" \
            -e "s|{{CUT_CALORIES}}|${cut}|g" \
            -e "s|{{BULK_CALORIES}}|${bulk}|g" \
            -e "s|{{TITLE}}|${title}|g" \
            -e "s|{{DESCRIPTION}}|${desc}|g" \
            -e "s|{{CANONICAL}}|${canonical}|g" \
            "$template" | python3 -c "
import sys
html = sys.stdin.read()
related = '''$related'''
html = html.replace('{{RELATED_LINKS}}', related)
print(html)
" > "$pagedir/index.html"

        count=$((count + 1))
    done

    echo "  $tool: generated $count pages"
    TOTAL_PAGES=$((TOTAL_PAGES + count))
    generate_sitemap "$tool" "$outdir"
}

# ---------- sitemap generator ----------
generate_sitemap() {
    local tool="$1"
    local outdir="$2"
    local sitemap="$ROOT/$tool/pseo/sitemap-pseo.xml"
    local today
    today=$(date +%Y-%m-%d)

    cat > "$sitemap" <<'HEADER'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
HEADER

    for pagedir in "$outdir"/*/; do
        local slug
        slug="$(basename "$pagedir")"
        cat >> "$sitemap" <<ENTRY
  <url>
    <loc>${DOMAIN}/${tool}/${slug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
ENTRY
    done

    cat >> "$sitemap" <<'FOOTER'
</urlset>
FOOTER
}

# ---------- run generators ----------
echo "Generating pSEO pages..."

for tool in "${PSEO_TOOLS[@]}"; do
    case "$tool" in
        percentage-calc) generate_percentage_calc ;;
        age-calculator) generate_age_calculator ;;
        vbucks-calc) generate_vbucks_calc ;;
        date-calculator) generate_date_calculator ;;
        tdee-calculator) generate_tdee_calculator ;;
        *) echo "  $tool: no generator configured, skipping" ;;
    esac
done

echo "pSEO generation complete. Total pages: $TOTAL_PAGES"
