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

# ---------- unit-converter (Python-based) ----------
generate_unit_converter() {
    local tool="unit-converter"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

for item in data:
    slug = item["slug"]
    html = template
    html = html.replace("{{slug}}", slug)
    html = html.replace("{{from_value}}", str(item.get("from_value", 1)))
    html = html.replace("{{to_value}}", str(item.get("to_value", "")))
    html = html.replace("{{from_label}}", item.get("from_label", ""))
    html = html.replace("{{to_label}}", item.get("to_label", ""))
    html = html.replace("{{formula}}", item.get("formula", ""))

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

# ---------- word-counter (Python-based) ----------
generate_word_counter() {
    local tool="word-counter"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

for item in data:
    slug = item["slug"]
    html = template
    html = html.replace("{{slug}}", slug)
    html = html.replace("{{title}}", item.get("title", ""))
    html = html.replace("{{question}}", item.get("question", ""))
    html = html.replace("{{answer}}", item.get("answer", ""))
    html = html.replace("{{details_section}}", "")

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

# ---------- salary-calculator (Python-based) ----------
generate_salary_calculator() {
    local tool="salary-calculator"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

for item in data:
    t = item["type"]
    if t == "salary_to_hourly":
        salary = item["salary"]
        hourly = round(salary / 2080, 2)
        monthly = round(salary / 12, 2)
        biweekly = round(salary / 26, 2)
        weekly = round(salary / 52, 2)
        daily = round(salary / 260, 2)
        salary_fmt = f"${salary:,.0f}"
        hourly_fmt = f"${hourly:,.2f}"
        slug = f"{salary}k-salary-per-hour" if salary >= 1000 else f"{salary}-salary-per-hour"
        slug = f"{int(salary/1000)}k-salary-per-hour" if salary >= 1000 else f"{salary}-salary-per-hour"
        title = f"{salary_fmt} Salary Per Hour - Salary Calculator"
        desc = f"A {salary_fmt} annual salary equals {hourly_fmt} per hour based on 2,080 work hours per year."
        answer = hourly_fmt + "/hour"
        breakdown_title = f"How Much Is {salary_fmt} a Year Per Hour?"
        steps = '<div class="step"><span class="step-num">1</span><span>Annual salary: <code>' + salary_fmt + '</code></span></div>\n<div class="step"><span class="step-num">2</span><span>Divide by 2,080 hours: <code>' + salary_fmt + ' / 2,080 = <span class="highlight">' + hourly_fmt + '/hr</span></code></span></div>'
    else:
        hourly = item["hourly"]
        salary = round(hourly * 2080, 2)
        monthly = round(salary / 12, 2)
        biweekly = round(salary / 26, 2)
        weekly = round(hourly * 40, 2)
        daily = round(hourly * 8, 2)
        salary_fmt = f"${salary:,.0f}"
        hourly_fmt = f"${hourly:,.2f}" if hourly != int(hourly) else f"${int(hourly)}"
        slug = f"{hourly}-an-hour-annual-salary"
        if hourly == int(hourly):
            slug = f"{int(hourly)}-an-hour-annual-salary"
        title = f"{hourly_fmt}/Hour Annual Salary - Salary Calculator"
        desc = f"{hourly_fmt} per hour equals {salary_fmt} per year based on 2,080 work hours."
        answer = salary_fmt + "/year"
        breakdown_title = f"How Much Is {hourly_fmt}/Hour Per Year?"
        steps = '<div class="step"><span class="step-num">1</span><span>Hourly rate: <code>' + hourly_fmt + '/hr</code></span></div>\n<div class="step"><span class="step-num">2</span><span>Multiply by 2,080 hours: <code>' + hourly_fmt + ' x 2,080 = <span class="highlight">' + salary_fmt + '/yr</span></code></span></div>'

    canonical = f"{domain}/{tool}/{slug}/"

    # Related links
    links = []
    for other in data:
        if len(links) >= 8:
            break
        if other.get("salary") == item.get("salary") and other.get("hourly") == item.get("hourly") and other["type"] == item["type"]:
            continue
        if other["type"] == "salary_to_hourly":
            s = other["salary"]
            h = round(s / 2080, 2)
            os_slug = f"{int(s/1000)}k-salary-per-hour" if s >= 1000 else f"{s}-salary-per-hour"
            links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">${s:,.0f}/yr = ${h:,.2f}/hr</a>')
        else:
            h = other["hourly"]
            s = round(h * 2080)
            os_slug = f"{h}-an-hour-annual-salary"
            if h == int(h):
                os_slug = f"{int(h)}-an-hour-annual-salary"
            links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">${h:g}/hr = ${s:,}/yr</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{ANSWER}}", answer)
    html = html.replace("{{BREAKDOWN_TITLE}}", breakdown_title)
    html = html.replace("{{STEPS}}", steps)
    html = html.replace("{{SALARY_FORMATTED}}", salary_fmt)
    html = html.replace("{{HOURLY}}", f"${hourly:,.2f}" if hourly != int(hourly) else f"${int(hourly)}")
    html = html.replace("{{MONTHLY}}", f"${monthly:,.2f}")
    html = html.replace("{{BIWEEKLY}}", f"${biweekly:,.2f}")
    html = html.replace("{{WEEKLY}}", f"${weekly:,.2f}")
    html = html.replace("{{DAILY}}", f"${daily:,.2f}")
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

# ---------- credit-score (Python-based) ----------
generate_credit_score() {
    local tool="credit-score"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

def get_rating(score):
    if score >= 800: return ("Exceptional", "#00c853")
    if score >= 740: return ("Very Good", "#64dd17")
    if score >= 670: return ("Good", "#6c63ff")
    if score >= 580: return ("Fair", "#ffa726")
    return ("Poor", "#ef5350")

def get_aprs(score):
    if score >= 800: return ("5.5-6.5%", "3.5-5.0%", "15-20%")
    if score >= 740: return ("6.0-7.0%", "4.0-6.0%", "17-22%")
    if score >= 670: return ("6.5-7.5%", "5.0-8.0%", "20-25%")
    if score >= 580: return ("7.5-9.0%", "8.0-14.0%", "24-29%")
    return ("9.0%+ or denied", "14.0-20.0%", "28-36%")

for item in data:
    score = item["score"]
    rating, color = get_rating(score)
    rating_lower = rating.lower()
    mortgage_apr, auto_apr, card_apr = get_aprs(score)
    slug = f"is-{score}-a-good-credit-score"
    title = f"Is {score} a Good Credit Score? ({rating})"
    desc = f"A {score} credit score is rated {rating}. See what APRs you qualify for and how to improve."
    canonical = f"{domain}/{tool}/{slug}/"

    links = []
    for other in data:
        if other["score"] != score and len(links) < 8:
            s = other["score"]
            r, _ = get_rating(s)
            links.append(f'<a href="/{tool}/is-{s}-a-good-credit-score/" class="related-link">{s} Credit Score ({r})</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{SCORE}}", str(score))
    html = html.replace("{{RATING}}", rating)
    html = html.replace("{{RATING_LOWER}}", rating_lower)
    html = html.replace("{{COLOR}}", color)
    html = html.replace("{{CATEGORY_COLOR}}", color)
    html = html.replace("{{MORTGAGE_APR}}", mortgage_apr)
    html = html.replace("{{AUTO_APR}}", auto_apr)
    html = html.replace("{{CARD_APR}}", card_apr)
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

# ---------- tip-calculator (Python-based) ----------
generate_tip_calculator() {
    local tool="tip-calculator"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

def fmt(v):
    return f"{v:,.2f}"

for item in data:
    bill = item["bill"]
    tip_pct = item["tip_pct"]
    split = item.get("split", 0)
    tip_amount = round(bill * tip_pct / 100, 2)
    total = round(bill + tip_amount, 2)
    decimal = round(tip_pct / 100, 2)

    if split > 0:
        slug = f"{tip_pct}-percent-tip-on-{bill}-split-{split}"
        title = f"{tip_pct}% Tip on ${bill} Split {split} Ways"
        per_person = round(total / split, 2)
        desc = f"A {tip_pct}% tip on a ${bill} bill is ${fmt(tip_amount)}. Total: ${fmt(total)}. Split {split} ways: ${fmt(per_person)} each."
    else:
        slug = f"{tip_pct}-percent-tip-on-{bill}"
        title = f"{tip_pct}% Tip on ${bill}"
        desc = f"A {tip_pct}% tip on a ${bill} bill is ${fmt(tip_amount)}. Total with tip: ${fmt(total)}."

    canonical = f"{domain}/{tool}/{slug}/"

    # Comparison rows: same bill at different tip percentages
    compare_rows = ""
    for pct in [15, 18, 20, 22, 25]:
        t = round(bill * pct / 100, 2)
        tot = round(bill + t, 2)
        highlight = ' style="background:#6c63ff22"' if pct == tip_pct else ""
        compare_rows += f'<tr{highlight}><td>{pct}%</td><td>${fmt(t)}</td><td>${fmt(tot)}</td></tr>\n'

    # Related links
    links = []
    for other in data:
        if len(links) >= 8:
            break
        ob, op = other["bill"], other["tip_pct"]
        if ob == bill and op == tip_pct and other.get("split", 0) == split:
            continue
        if other.get("split", 0) > 0:
            continue
        ot = round(ob * op / 100, 2)
        os_slug = f"{op}-percent-tip-on-{ob}"
        links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">{op}% tip on ${ob} = ${fmt(ot)}</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{BILL}}", str(bill))
    html = html.replace("{{TIP_PCT}}", str(tip_pct))
    html = html.replace("{{TIP_AMOUNT}}", fmt(tip_amount))
    html = html.replace("{{TOTAL}}", fmt(total))
    html = html.replace("{{DECIMAL}}", str(decimal))
    html = html.replace("{{COMPARE_ROWS}}", compare_rows)
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

# ---------- bmi-calculator (Python-based) ----------
generate_bmi_calculator() {
    local tool="bmi-calculator"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

def get_category(bmi):
    if bmi < 18.5: return ("Underweight", "#ffa726")
    if bmi < 25: return ("Normal weight", "#00c853")
    if bmi < 30: return ("Overweight", "#ffa726")
    return ("Obese", "#ef5350")

for item in data:
    hft = item["height_ft"]
    hin = item["height_in"]
    wlbs = item["weight_lbs"]
    total_in = hft * 12 + hin
    bmi = round(wlbs * 703 / (total_in * total_in), 1)
    category, cat_color = get_category(bmi)
    height_display = str(hft) + "'" + str(hin) + '"'
    height_sq = total_in * total_in
    weight_x_703 = round(wlbs * 703, 1)
    healthy_low = round(18.5 * height_sq / 703, 0)
    healthy_high = round(24.9 * height_sq / 703, 0)

    slug = f"bmi-{hft}-{hin}-{wlbs}lbs"
    title = f"BMI for {height_display} {wlbs} lbs - {bmi} ({category})"
    desc = f"At {height_display} and {wlbs} lbs, your BMI is {bmi} ({category}). Healthy weight for this height: {int(healthy_low)}-{int(healthy_high)} lbs."
    canonical = f"{domain}/{tool}/{slug}/"

    # Related links
    links = []
    # Same height, different weights
    for other in data:
        if len(links) >= 4:
            break
        if other["height_ft"] == hft and other["height_in"] == hin and other["weight_lbs"] != wlbs:
            ow = other["weight_lbs"]
            otin = hft * 12 + hin
            ob = round(ow * 703 / (otin * otin), 1)
            links.append(f'<a href="/{tool}/bmi-{hft}-{hin}-{ow}lbs/" class="related-link">{height_display} {ow} lbs = {ob}</a>')
    # Different heights, same weight
    for other in data:
        if len(links) >= 8:
            break
        if other["weight_lbs"] == wlbs and (other["height_ft"] != hft or other["height_in"] != hin):
            ohft, ohin = other["height_ft"], other["height_in"]
            otin = ohft * 12 + ohin
            ob = round(wlbs * 703 / (otin * otin), 1)
            links.append('<a href="/' + tool + '/bmi-' + str(ohft) + '-' + str(ohin) + '-' + str(wlbs) + 'lbs/" class="related-link">' + str(ohft) + "'" + str(ohin) + '" ' + str(wlbs) + ' lbs = ' + str(ob) + '</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{HEIGHT_FT}}", str(hft))
    html = html.replace("{{HEIGHT_IN}}", str(hin))
    html = html.replace("{{HEIGHT_DISPLAY}}", height_display)
    html = html.replace("{{WEIGHT_LBS}}", str(wlbs))
    html = html.replace("{{BMI}}", str(bmi))
    html = html.replace("{{CATEGORY}}", category)
    html = html.replace("{{CATEGORY_COLOR}}", cat_color)
    html = html.replace("{{HEIGHT_TOTAL_IN}}", str(total_in))
    html = html.replace("{{HEIGHT_SQ}}", str(height_sq))
    html = html.replace("{{WEIGHT_X_703}}", str(weight_x_703))
    html = html.replace("{{HEALTHY_LOW}}", str(int(healthy_low)))
    html = html.replace("{{HEALTHY_HIGH}}", str(int(healthy_high)))
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

# ---------- mortgage-calc pSEO (Python-based) ----------
generate_mortgage_calc() {
    local tool="mortgage-calc"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os, math

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

def calc_mortgage(principal, annual_rate, years):
    r = annual_rate / 100 / 12
    n = years * 12
    if r == 0:
        return principal / n
    return principal * (r * (1 + r)**n) / ((1 + r)**n - 1)

def fmt(v):
    return f"{v:,.0f}"

for item in data:
    amount = item["amount"]
    rate = item["rate"]
    term = item["term"]
    monthly = calc_mortgage(amount, rate, term)
    total_cost = monthly * term * 12
    total_interest = total_cost - amount

    # First year breakdown
    r = rate / 100 / 12
    first_year_interest = 0
    balance = amount
    for m in range(12):
        mi = balance * r
        first_year_interest += mi
        balance -= (monthly - mi)
    first_year_principal = monthly * 12 - first_year_interest
    interest_pct = round(first_year_interest / (monthly * 12) * 100)
    principal_pct = 100 - interest_pct

    rate_str = f"{rate:g}"
    slug = f"mortgage-{amount}-at-{rate_str}-{term}yr"
    amount_fmt = fmt(amount)
    title = f"Mortgage Payment on ${amount_fmt} at {rate_str}% for {term} Years"
    desc = f"Monthly payment on a ${amount_fmt} mortgage at {rate_str}% for {term} years is ${fmt(monthly)}. Total interest: ${fmt(total_interest)}."
    canonical = f"{domain}/{tool}/{slug}/"

    # Comparison rows: same amount and term at different rates
    compare_rows = ""
    for cr in [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0]:
        cm = calc_mortgage(amount, cr, term)
        ct = cm * term * 12 - amount
        cr_str = f"{cr:g}"
        highlight = ' style="background:#6c63ff22"' if cr == rate else ""
        compare_rows += f'<tr{highlight}><td>{cr_str}%</td><td>${fmt(cm)}</td><td>${fmt(ct)}</td><td>${fmt(cm * term * 12)}</td></tr>\n'

    # Related links
    links = []
    for other in data:
        if len(links) >= 8:
            break
        oa, orr, ot = other["amount"], other["rate"], other["term"]
        if oa == amount and orr == rate and ot == term:
            continue
        om = calc_mortgage(oa, orr, ot)
        or_str = f"{orr:g}"
        os_slug = f"mortgage-{oa}-at-{or_str}-{ot}yr"
        links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">${fmt(oa)} at {or_str}% {ot}yr = ${fmt(om)}/mo</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{AMOUNT_FORMATTED}}", amount_fmt)
    html = html.replace("{{RATE}}", rate_str)
    html = html.replace("{{TERM}}", str(term))
    html = html.replace("{{MONTHLY_PAYMENT}}", fmt(monthly))
    html = html.replace("{{TOTAL_INTEREST}}", fmt(total_interest))
    html = html.replace("{{TOTAL_COST}}", fmt(total_cost))
    html = html.replace("{{FIRST_YEAR_INTEREST}}", fmt(first_year_interest))
    html = html.replace("{{FIRST_YEAR_PRINCIPAL}}", fmt(first_year_principal))
    html = html.replace("{{INTEREST_PERCENT}}", str(interest_pct))
    html = html.replace("{{PRINCIPAL_PERCENT}}", str(principal_pct))
    html = html.replace("{{COMPARISON_ROWS}}", compare_rows)
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

# ---------- auto-loan-calc pSEO (Python-based) ----------
generate_auto_loan_calc() {
    local tool="auto-loan-calc"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

def calc_payment(principal, annual_rate, months):
    r = annual_rate / 100 / 12
    if r == 0:
        return principal / months
    return principal * (r * (1 + r)**months) / ((1 + r)**months - 1)

def fmt(v):
    return f"{v:,.0f}"

for item in data:
    amount = item["amount"]
    rate = item["rate"]
    term = item["term"]  # months
    monthly = calc_payment(amount, rate, term)
    total_cost = monthly * term
    total_interest = total_cost - amount

    rate_str = f"{rate:g}"
    slug = f"car-payment-{amount}-at-{rate_str}-{term}mo"
    amount_fmt = fmt(amount)
    title = f"Car Payment on ${amount_fmt} at {rate_str}% for {term} Months"
    desc = f"Monthly car payment on a ${amount_fmt} loan at {rate_str}% for {term} months is ${fmt(monthly)}. Total interest: ${fmt(total_interest)}."
    canonical = f"{domain}/{tool}/{slug}/"

    # Comparison rows: same amount and rate at different terms
    compare_rows = ""
    for ct in [36, 48, 60, 72]:
        cm = calc_payment(amount, rate, ct)
        ci = cm * ct - amount
        highlight = ' style="background:#6c63ff22"' if ct == term else ""
        compare_rows += f'<tr{highlight}><td>{ct} months</td><td>${fmt(cm)}</td><td>${fmt(ci)}</td><td>${fmt(cm * ct)}</td></tr>\n'

    # Related links
    links = []
    for other in data:
        if len(links) >= 8:
            break
        oa, orr, ot = other["amount"], other["rate"], other["term"]
        if oa == amount and orr == rate and ot == term:
            continue
        om = calc_payment(oa, orr, ot)
        or_str = f"{orr:g}"
        os_slug = f"car-payment-{oa}-at-{or_str}-{ot}mo"
        links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">${fmt(oa)} at {or_str}% {ot}mo = ${fmt(om)}/mo</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{AMOUNT_FORMATTED}}", amount_fmt)
    html = html.replace("{{RATE}}", rate_str)
    html = html.replace("{{TERM}}", str(term))
    html = html.replace("{{MONTHLY_PAYMENT}}", fmt(monthly))
    html = html.replace("{{TOTAL_INTEREST}}", fmt(total_interest))
    html = html.replace("{{TOTAL_COST}}", fmt(total_cost))
    html = html.replace("{{COMPARISON_ROWS}}", compare_rows)
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

# ---------- interest-calculator pSEO (Python-based) ----------
generate_interest_calculator() {
    local tool="interest-calculator"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

def fmt(v):
    return f"{v:,.0f}"

for item in data:
    principal = item["principal"]
    rate = item["rate"]
    years = item["years"]
    compound = item.get("compound", "monthly")
    n = 12  # monthly compounding
    rate_decimal = round(rate / 100, 4)
    monthly_rate = round(rate_decimal / 12, 6)
    total_periods = years * 12

    final_balance = principal * (1 + rate_decimal / n) ** (n * years)
    total_interest = final_balance - principal

    rate_str = f"{rate:g}"
    slug = f"compound-interest-{principal}-at-{rate_str}-for-{years}yr"
    principal_fmt = fmt(principal)
    title = f"${principal_fmt} at {rate_str}% for {years} Years - Compound Interest"
    desc = f"${principal_fmt} invested at {rate_str}% compounded monthly for {years} years grows to ${fmt(final_balance)}. Total interest: ${fmt(total_interest)}."
    canonical = f"{domain}/{tool}/{slug}/"

    # Year rows: show years 1-5 and last year
    year_rows = ""
    show_years = list(range(1, min(6, years + 1)))
    if years > 5:
        show_years.append(years)
    for y in show_years:
        bal = principal * (1 + rate_decimal / n) ** (n * y)
        prev_bal = principal * (1 + rate_decimal / n) ** (n * (y - 1))
        yr_interest = bal - prev_bal
        total_int_so_far = bal - principal
        year_rows += f'<tr><td>{y}</td><td>${fmt(bal)}</td><td>${fmt(yr_interest)}</td><td>${fmt(total_int_so_far)}</td></tr>\n'
    if years > 5:
        # Add ellipsis row
        year_rows = year_rows.replace(f'<tr><td>{years}</td>', f'<tr><td colspan="4" style="text-align:center;color:#9aa0b0">...</td></tr>\n<tr><td>{years}</td>')

    # Related links
    links = []
    for other in data:
        if len(links) >= 8:
            break
        op, orr, oy = other["principal"], other["rate"], other["years"]
        if op == principal and orr == rate and oy == years:
            continue
        of = op * (1 + orr / 100 / 12) ** (12 * oy)
        or_str = f"{orr:g}"
        os_slug = f"compound-interest-{op}-at-{or_str}-for-{oy}yr"
        links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">${fmt(op)} at {or_str}% for {oy}yr = ${fmt(of)}</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{PRINCIPAL}}", str(principal))
    html = html.replace("{{PRINCIPAL_FORMATTED}}", principal_fmt)
    html = html.replace("{{RATE}}", rate_str)
    html = html.replace("{{YEARS}}", str(years))
    html = html.replace("{{FINAL_BALANCE}}", fmt(final_balance))
    html = html.replace("{{TOTAL_INTEREST}}", fmt(total_interest))
    html = html.replace("{{RATE_DECIMAL}}", str(rate_decimal))
    html = html.replace("{{MONTHLY_RATE}}", str(monthly_rate))
    html = html.replace("{{TOTAL_PERIODS}}", str(total_periods))
    html = html.replace("{{YEAR_ROWS}}", year_rows)
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

# ---------- home-affordability pSEO (Python-based) ----------
generate_home_affordability() {
    local tool="home-affordability"
    local dir="$ROOT/$tool/pseo"
    local outdir="$dir/pages"
    local template="$dir/template.html"
    local data="$dir/data.json"

    [ -f "$data" ] || return 0
    [ -f "$template" ] || return 0

    rm -rf "$outdir"
    mkdir -p "$outdir"

    local count
    count=$(DATA_FILE="$data" TEMPLATE_FILE="$template" OUT_DIR="$outdir" TOOL="$tool" DOMAIN="$DOMAIN" python3 << 'PYEOF'
import json, os

tool = os.environ["TOOL"]
domain = os.environ["DOMAIN"]
data = json.load(open(os.environ["DATA_FILE"]))
template = open(os.environ["TEMPLATE_FILE"]).read()
outdir = os.environ["OUT_DIR"]
count = 0

def fmt(v):
    return f"{v:,.0f}"

def calc_mortgage(principal, annual_rate, years):
    r = annual_rate / 100 / 12
    n = years * 12
    if r == 0:
        return principal / n
    return principal * (r * (1 + r)**n) / ((1 + r)**n - 1)

# Assumptions
RATE = 7.0
DOWN_PCT = 0.20
TAX_RATE = 0.012
INSURANCE = 1200
TERM = 30

for item in data:
    income = item["income"]
    monthly_debt = item.get("monthly_debt", 0)
    gross_monthly = income / 12

    # 28/36 rule
    front_end_max = gross_monthly * 0.28
    back_end_max = gross_monthly * 0.36
    back_end_housing = back_end_max - monthly_debt

    # Use the lesser of front-end and back-end
    max_monthly = min(front_end_max, back_end_housing)
    if max_monthly < 0:
        max_monthly = 0

    # Subtract tax and insurance estimate
    # Tax and insurance depend on home price, so we iterate
    # Start with estimate and converge
    home_price = max_monthly * 180  # rough estimate
    for _ in range(10):
        monthly_tax = home_price * TAX_RATE / 12
        monthly_ins = INSURANCE / 12
        max_pi = max_monthly - monthly_tax - monthly_ins
        if max_pi <= 0:
            home_price = 0
            break
        # Back-calculate loan from P&I
        r = RATE / 100 / 12
        n = TERM * 12
        max_loan = max_pi * ((1 + r)**n - 1) / (r * (1 + r)**n)
        home_price = max_loan / (1 - DOWN_PCT)

    max_loan = home_price * (1 - DOWN_PCT) if home_price > 0 else 0
    down_payment = home_price * DOWN_PCT if home_price > 0 else 0
    monthly_tax_ins = (home_price * TAX_RATE / 12 + INSURANCE / 12) if home_price > 0 else 0
    max_pi_final = max_monthly - monthly_tax_ins if max_monthly > monthly_tax_ins else 0

    income_k = int(income / 1000) if income >= 1000 else income
    if monthly_debt > 0:
        slug = f"afford-house-{income_k}k-{monthly_debt}debt"
        title = f"How Much House Can I Afford Making ${fmt(income)} with ${fmt(monthly_debt)}/mo Debt?"
        desc = f"Making ${fmt(income)}/year with ${fmt(monthly_debt)}/mo in debt, you can afford a home up to ${fmt(home_price)} using the 28/36 rule."
    else:
        slug = f"afford-house-{income_k}k"
        title = f"How Much House Can I Afford Making ${fmt(income)}?"
        desc = f"Making ${fmt(income)}/year, you can afford a home up to ${fmt(home_price)} using the 28/36 rule at 7% interest."
    canonical = f"{domain}/{tool}/{slug}/"

    # Related links
    links = []
    for other in data:
        if len(links) >= 8:
            break
        oi, od = other["income"], other.get("monthly_debt", 0)
        if oi == income and od == monthly_debt:
            continue
        oik = int(oi / 1000)
        if od > 0:
            os_slug = f"afford-house-{oik}k-{od}debt"
            links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">${fmt(oi)}/yr, ${fmt(od)}/mo debt</a>')
        else:
            os_slug = f"afford-house-{oik}k"
            links.append(f'<a href="/{tool}/{os_slug}/" class="related-link">${fmt(oi)}/yr, no debt</a>')
    related = "\n".join(links[:8])

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", desc)
    html = html.replace("{{CANONICAL}}", canonical)
    html = html.replace("{{INCOME_FORMATTED}}", f"${fmt(income)}")
    html = html.replace("{{MONTHLY_DEBT}}", fmt(monthly_debt))
    html = html.replace("{{MAX_PRICE_FORMATTED}}", f"${fmt(home_price)}")
    html = html.replace("{{MAX_MONTHLY}}", fmt(max_monthly))
    html = html.replace("{{GROSS_MONTHLY}}", fmt(gross_monthly))
    html = html.replace("{{FRONT_END_MAX}}", fmt(front_end_max))
    html = html.replace("{{BACK_END_MAX}}", fmt(back_end_max))
    html = html.replace("{{BACK_END_HOUSING}}", fmt(back_end_housing))
    html = html.replace("{{MONTHLY_TAX_INS}}", fmt(monthly_tax_ins))
    html = html.replace("{{MAX_PI}}", fmt(max_pi_final))
    html = html.replace("{{MAX_LOAN}}", fmt(max_loan))
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

# ---------- run generators ----------
echo "Generating pSEO pages..."

for tool in "${PSEO_TOOLS[@]}"; do
    case "$tool" in
        percentage-calc) generate_percentage_calc ;;
        age-calculator) generate_age_calculator ;;
        vbucks-calc) generate_vbucks_calc ;;
        date-calculator) generate_date_calculator ;;
        tdee-calculator) generate_tdee_calculator ;;
        unit-converter) generate_unit_converter ;;
        word-counter) generate_word_counter ;;
        salary-calculator) generate_salary_calculator ;;
        credit-score) generate_credit_score ;;
        tip-calculator) generate_tip_calculator ;;
        bmi-calculator) generate_bmi_calculator ;;
        mortgage-calc) generate_mortgage_calc ;;
        auto-loan-calc) generate_auto_loan_calc ;;
        interest-calculator) generate_interest_calculator ;;
        home-affordability) generate_home_affordability ;;
        *) echo "  $tool: no generator configured, skipping" ;;
    esac
done

echo "pSEO generation complete. Total pages: $TOTAL_PAGES"
