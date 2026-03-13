(function () {
    "use strict";

    // === V-Bucks Bundle Data (2026 prices, post-2025 increase) ===
    var BUNDLES = [
        { vbucks: 1000, usd: 7.99 },
        { vbucks: 2800, usd: 19.99 },
        { vbucks: 5000, usd: 31.99 },
        { vbucks: 13500, usd: 79.99 }
    ];

    // === Regional Pricing Data ===
    // Prices are for each bundle tier in local currency
    // Exchange rates are approximate 2026 values
    var REGIONS = [
        {
            code: "US", name: "United States", currency: "USD", symbol: "$",
            rate: 1.0,
            prices: { 1000: 7.99, 2800: 19.99, 5000: 31.99, 13500: 79.99 }
        },
        {
            code: "UK", name: "United Kingdom", currency: "GBP", symbol: "\u00A3",
            rate: 1.27,
            prices: { 1000: 6.49, 2800: 15.99, 5000: 25.99, 13500: 64.99 }
        },
        {
            code: "EU", name: "Europe (EUR)", currency: "EUR", symbol: "\u20AC",
            rate: 1.09,
            prices: { 1000: 7.49, 2800: 18.99, 5000: 29.99, 13500: 74.99 }
        },
        {
            code: "CA", name: "Canada", currency: "CAD", symbol: "CA$",
            rate: 0.74,
            prices: { 1000: 10.99, 2800: 27.49, 5000: 43.49, 13500: 109.99 }
        },
        {
            code: "AU", name: "Australia", currency: "AUD", symbol: "A$",
            rate: 0.65,
            prices: { 1000: 12.49, 2800: 31.49, 5000: 49.99, 13500: 124.99 }
        },
        {
            code: "BR", name: "Brazil", currency: "BRL", symbol: "R$",
            rate: 0.19,
            prices: { 1000: 29.90, 2800: 74.90, 5000: 119.90, 13500: 299.90 }
        },
        {
            code: "JP", name: "Japan", currency: "JPY", symbol: "\u00A5",
            rate: 0.0067,
            prices: { 1000: 1100, 2800: 2900, 5000: 4800, 13500: 11800 }
        },
        {
            code: "TR", name: "Turkey", currency: "TRY", symbol: "\u20BA",
            rate: 0.031,
            prices: { 1000: 149.99, 2800: 379.99, 5000: 599.99, 13500: 1499.99 }
        },
        {
            code: "AR", name: "Argentina", currency: "ARS", symbol: "ARS$",
            rate: 0.00094,
            prices: { 1000: 4499, 2800: 11299, 5000: 17999, 13500: 44999 }
        },
        {
            code: "IN", name: "India", currency: "INR", symbol: "\u20B9",
            rate: 0.012,
            prices: { 1000: 499, 2800: 1249, 5000: 1999, 13500: 4999 }
        }
    ];

    // === DOM Elements ===
    var bundleBody = document.getElementById("bundle-body");
    var regionBundle = document.getElementById("region-bundle");
    var regionBody = document.getElementById("region-body");
    var itemVbucks = document.getElementById("item-vbucks");
    var itemCountry = document.getElementById("item-country");
    var itemBundle = document.getElementById("item-bundle");
    var itemResult = document.getElementById("item-result");
    var savingsCountry = document.getElementById("savings-country");
    var savingsVbucks = document.getElementById("savings-vbucks");
    var savingsResult = document.getElementById("savings-result");

    // === Helpers ===

    function formatUSD(n) {
        return "$" + n.toFixed(2);
    }

    function formatLocal(value, region) {
        if (region.currency === "JPY" || region.currency === "ARS") {
            return region.symbol + Math.round(value).toLocaleString("en-US");
        }
        return region.symbol + value.toFixed(2);
    }

    function formatCostPer(cost) {
        return "$" + cost.toFixed(4);
    }

    function toUSD(localPrice, region) {
        return localPrice * region.rate;
    }

    function getRegionByCode(code) {
        for (var i = 0; i < REGIONS.length; i++) {
            if (REGIONS[i].code === code) {
                return REGIONS[i];
            }
        }
        return REGIONS[0];
    }

    function getBundleByVbucks(vbucks) {
        for (var i = 0; i < BUNDLES.length; i++) {
            if (BUNDLES[i].vbucks === vbucks) {
                return BUNDLES[i];
            }
        }
        return BUNDLES[0];
    }

    // === Populate Country Dropdowns ===

    function populateCountrySelect(selectEl) {
        for (var i = 0; i < REGIONS.length; i++) {
            var opt = document.createElement("option");
            opt.value = REGIONS[i].code;
            opt.textContent = REGIONS[i].name;
            selectEl.appendChild(opt);
        }
    }

    populateCountrySelect(itemCountry);
    populateCountrySelect(savingsCountry);

    // === 1. Bundle Pricing Table ===

    function renderBundleTable() {
        var html = "";
        var costPerList = [];

        for (var i = 0; i < BUNDLES.length; i++) {
            costPerList.push(BUNDLES[i].usd / BUNDLES[i].vbucks);
        }

        var minCostPer = Math.min.apply(null, costPerList);
        var maxCostPer = Math.max.apply(null, costPerList);

        for (var j = 0; j < BUNDLES.length; j++) {
            var b = BUNDLES[j];
            var costPer = b.usd / b.vbucks;
            var valueLabel = "";
            var valueClass = "";

            if (costPer === minCostPer) {
                valueLabel = "Best Value";
                valueClass = "badge-best";
            } else if (costPer === maxCostPer) {
                valueLabel = "Lowest Value";
                valueClass = "badge-low";
            } else if (costPer < (minCostPer + maxCostPer) / 2) {
                valueLabel = "Good Value";
                valueClass = "badge-good";
            } else {
                valueLabel = "OK Value";
                valueClass = "badge-ok";
            }

            html += "<tr>";
            html += "<td><strong>" + b.vbucks.toLocaleString("en-US") + " V-Bucks</strong></td>";
            html += "<td>" + formatUSD(b.usd) + "</td>";
            html += '<td class="cell-bold">' + formatCostPer(costPer) + "</td>";
            html += '<td><span class="badge ' + valueClass + '">' + valueLabel + "</span></td>";
            html += "</tr>";
        }

        bundleBody.innerHTML = html;
    }

    // === 2. Regional Price Comparison ===

    function renderRegionTable() {
        var bundleKey = parseInt(regionBundle.value, 10);
        var usRegion = getRegionByCode("US");
        var usPrice = usRegion.prices[bundleKey];

        // Calculate USD equivalents for sorting
        var regionData = [];
        for (var i = 0; i < REGIONS.length; i++) {
            var r = REGIONS[i];
            var localPrice = r.prices[bundleKey];
            var usdEquiv = toUSD(localPrice, r);
            var costPer = usdEquiv / bundleKey;
            var vsPct = ((usdEquiv - usPrice) / usPrice) * 100;

            regionData.push({
                region: r,
                localPrice: localPrice,
                usdEquiv: usdEquiv,
                costPer: costPer,
                vsPct: vsPct
            });
        }

        // Sort by USD equivalent
        regionData.sort(function (a, b) {
            return a.usdEquiv - b.usdEquiv;
        });

        var minUsd = regionData[0].usdEquiv;
        var maxUsd = regionData[regionData.length - 1].usdEquiv;

        var html = "";
        for (var j = 0; j < regionData.length; j++) {
            var d = regionData[j];
            var vsText = "";
            var vsClass = "";

            if (d.region.code === "US") {
                vsText = "Base";
                vsClass = "";
            } else if (d.vsPct < -1) {
                vsText = d.vsPct.toFixed(1) + "%";
                vsClass = "cell-green";
            } else if (d.vsPct > 1) {
                vsText = "+" + d.vsPct.toFixed(1) + "%";
                vsClass = "cell-red";
            } else {
                vsText = "~Same";
                vsClass = "cell-yellow";
            }

            var rowBadge = "";
            if (d.usdEquiv === minUsd) {
                rowBadge = ' <span class="badge badge-cheapest">Cheapest</span>';
            } else if (d.usdEquiv === maxUsd) {
                rowBadge = ' <span class="badge badge-expensive">Most Expensive</span>';
            }

            html += "<tr>";
            html += "<td><strong>" + d.region.name + "</strong>" + rowBadge + "</td>";
            html += "<td>" + formatLocal(d.localPrice, d.region) + " " + d.region.currency + "</td>";
            html += "<td>" + formatUSD(d.usdEquiv) + "</td>";
            html += '<td class="cell-bold">' + formatCostPer(d.costPer) + "</td>";
            html += '<td class="' + vsClass + '">' + vsText + "</td>";
            html += "</tr>";
        }

        regionBody.innerHTML = html;
    }

    // === 3. Item Cost Calculator ===

    function renderItemResult() {
        var vbucks = parseInt(itemVbucks.value, 10) || 0;
        var region = getRegionByCode(itemCountry.value);
        var bundleKey = parseInt(itemBundle.value, 10);
        var bundleLocalPrice = region.prices[bundleKey];
        var bundleUsd = toUSD(bundleLocalPrice, region);
        var costPerVbuck = bundleUsd / bundleKey;
        var realCostUsd = costPerVbuck * vbucks;
        var realCostLocal = (bundleLocalPrice / bundleKey) * vbucks;

        // Also calculate with smallest bundle for comparison
        var smallLocalPrice = region.prices[1000];
        var smallUsd = toUSD(smallLocalPrice, region);
        var smallCostPer = smallUsd / 1000;
        var smallRealCost = smallCostPer * vbucks;
        var savings = smallRealCost - realCostUsd;

        var html = "";
        html += '<div class="result-main">' + formatUSD(realCostUsd) + "</div>";
        html += '<div class="result-detail">';
        html += "<strong>" + vbucks.toLocaleString("en-US") + " V-Bucks</strong> costs ";
        html += "<strong>" + formatLocal(realCostLocal, region) + " " + region.currency + "</strong>";
        html += " (" + formatUSD(realCostUsd) + " USD)";
        html += " when buying the " + bundleKey.toLocaleString("en-US") + " V-Bucks bundle.";

        if (bundleKey !== 1000 && savings > 0.01) {
            html += "<br>That's <strong style='color:var(--green)'>" + formatUSD(savings) + " cheaper</strong>";
            html += " than buying 1,000 V-Bucks at a time.";
        }

        html += "</div>";
        itemResult.innerHTML = html;
    }

    // === 4. Savings Calculator ===

    function renderSavings() {
        var region = getRegionByCode(savingsCountry.value);
        var vbucksNeeded = parseInt(savingsVbucks.value, 10) || 0;

        // Cost using smallest bundle (1,000)
        var smallLocal = region.prices[1000];
        var smallUsd = toUSD(smallLocal, region);
        var smallCostPer = smallUsd / 1000;
        var smallTotal = smallCostPer * vbucksNeeded;

        // Cost using largest bundle (13,500)
        var largeLocal = region.prices[13500];
        var largeUsd = toUSD(largeLocal, region);
        var largeCostPer = largeUsd / 13500;
        var largeTotal = largeCostPer * vbucksNeeded;

        var totalSavings = smallTotal - largeTotal;
        var savingsPct = (totalSavings / smallTotal) * 100;

        var html = "";

        // Card 1: Small bundle cost
        html += '<div class="savings-card">';
        html += '<div class="savings-label">1,000 Bundle Cost</div>';
        html += '<div class="savings-value savings-red">' + formatUSD(smallTotal) + "</div>";
        html += '<div class="savings-note">' + formatCostPer(smallCostPer) + " per V-Buck</div>";
        html += "</div>";

        // Card 2: Large bundle cost
        html += '<div class="savings-card">';
        html += '<div class="savings-label">13,500 Bundle Cost</div>';
        html += '<div class="savings-value savings-green">' + formatUSD(largeTotal) + "</div>";
        html += '<div class="savings-note">' + formatCostPer(largeCostPer) + " per V-Buck</div>";
        html += "</div>";

        // Card 3: Savings
        html += '<div class="savings-card">';
        html += '<div class="savings-label">You Save</div>';
        html += '<div class="savings-value savings-yellow">' + formatUSD(totalSavings) + "</div>";
        html += '<div class="savings-note">' + savingsPct.toFixed(1) + "% less per V-Buck</div>";
        html += "</div>";

        savingsResult.innerHTML = html;
    }

    // === Event Listeners ===

    regionBundle.addEventListener("change", renderRegionTable);

    itemVbucks.addEventListener("input", renderItemResult);
    itemCountry.addEventListener("change", renderItemResult);
    itemBundle.addEventListener("change", renderItemResult);

    savingsCountry.addEventListener("change", renderSavings);
    savingsVbucks.addEventListener("input", renderSavings);

    // Quick price buttons
    var quickBtns = document.querySelectorAll(".preset-btn[data-vbucks]");
    for (var i = 0; i < quickBtns.length; i++) {
        quickBtns[i].addEventListener("click", function () {
            var vb = parseInt(this.getAttribute("data-vbucks"), 10);
            itemVbucks.value = vb;

            // Toggle active state
            for (var j = 0; j < quickBtns.length; j++) {
                quickBtns[j].classList.remove("active");
            }
            this.classList.add("active");

            renderItemResult();
        });
    }

    // === Initial Render ===
    renderBundleTable();
    renderRegionTable();
    renderItemResult();
    renderSavings();
})();
