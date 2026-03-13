(function () {
    "use strict";

    var inputTokensEl = document.getElementById("input-tokens");
    var outputTokensEl = document.getElementById("output-tokens");
    var inputHintEl = document.getElementById("input-tokens-hint");
    var outputHintEl = document.getElementById("output-tokens-hint");
    var resultsBody = document.getElementById("results-body");
    var sortSelect = document.getElementById("sort-select");
    var barChart = document.getElementById("bar-chart");

    var activeTier = "all";
    var activePreset = null;

    // --- Helpers ---

    function formatTokens(n) {
        if (n >= 1000000000) {
            return (n / 1000000000).toFixed(1) + "B tokens";
        }
        if (n >= 1000000) {
            return (n / 1000000).toFixed(1) + "M tokens";
        }
        if (n >= 1000) {
            return (n / 1000).toFixed(0) + "K tokens";
        }
        return n + " tokens";
    }

    function formatCost(cost) {
        if (cost < 0.01) {
            return "$" + cost.toFixed(4);
        }
        if (cost < 1) {
            return "$" + cost.toFixed(3);
        }
        if (cost < 100) {
            return "$" + cost.toFixed(2);
        }
        return "$" + cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatContext(tokens) {
        if (tokens >= 1000000) {
            return (tokens / 1000000).toFixed(0) + "M";
        }
        return (tokens / 1000).toFixed(0) + "K";
    }

    function formatPrice(price) {
        if (price < 0.10) {
            return "$" + price.toFixed(3);
        }
        return "$" + price.toFixed(2);
    }

    function calcMonthlyCost(model, inputTokens, outputTokens) {
        var inputCost = (inputTokens / 1000000) * model.inputPrice;
        var outputCost = (outputTokens / 1000000) * model.outputPrice;
        return inputCost + outputCost;
    }

    function speedBadge(speed) {
        return '<span class="badge badge-' + speed + '">' + speed + '</span>';
    }

    function tierBadge(tier) {
        return '<span class="badge badge-' + tier + '">' + tier + '</span>';
    }

    // --- Filtering & Sorting ---

    function getFilteredModels() {
        if (activeTier === "all") {
            return MODELS.slice();
        }
        return MODELS.filter(function (m) {
            return m.tier === activeTier;
        });
    }

    function sortModels(models, costs, sortKey) {
        var sorted = models.map(function (m, i) {
            return { model: m, cost: costs[i] };
        });

        switch (sortKey) {
            case "cost-asc":
                sorted.sort(function (a, b) { return a.cost - b.cost; });
                break;
            case "cost-desc":
                sorted.sort(function (a, b) { return b.cost - a.cost; });
                break;
            case "provider":
                sorted.sort(function (a, b) {
                    return a.model.provider.localeCompare(b.model.provider) || a.cost - b.cost;
                });
                break;
            case "context":
                sorted.sort(function (a, b) {
                    return b.model.contextWindow - a.model.contextWindow || a.cost - b.cost;
                });
                break;
        }

        return sorted;
    }

    // --- Render ---

    function render() {
        var inputTokens = parseInt(inputTokensEl.value, 10) || 0;
        var outputTokens = parseInt(outputTokensEl.value, 10) || 0;

        inputHintEl.textContent = formatTokens(inputTokens);
        outputHintEl.textContent = formatTokens(outputTokens);

        var models = getFilteredModels();
        var costs = models.map(function (m) {
            return calcMonthlyCost(m, inputTokens, outputTokens);
        });

        var sorted = sortModels(models, costs, sortSelect.value);

        var minCost = Infinity;
        var maxCost = 0;
        for (var i = 0; i < sorted.length; i++) {
            if (sorted[i].cost < minCost) {
                minCost = sorted[i].cost;
            }
            if (sorted[i].cost > maxCost) {
                maxCost = sorted[i].cost;
            }
        }

        // Table
        var html = "";
        for (var j = 0; j < sorted.length; j++) {
            var m = sorted[j].model;
            var cost = sorted[j].cost;
            var costClass = "";
            if (sorted.length > 1) {
                if (cost === minCost) {
                    costClass = "cheapest";
                } else if (cost === maxCost) {
                    costClass = "expensive";
                }
            }

            html += '<tr>';
            html += '<td>' + m.provider + '</td>';
            html += '<td><strong>' + m.model + '</strong></td>';
            html += '<td>' + formatPrice(m.inputPrice) + '</td>';
            html += '<td>' + formatPrice(m.outputPrice) + '</td>';
            html += '<td class="cost-cell ' + costClass + '">' + formatCost(cost) + '</td>';
            html += '<td>' + formatContext(m.contextWindow) + '</td>';
            html += '<td>' + speedBadge(m.speed) + '</td>';
            html += '<td>' + tierBadge(m.tier) + '</td>';
            html += '<td><a href="' + m.link + '" target="_blank" rel="noopener noreferrer" class="try-link">Sign Up</a></td>';
            html += '</tr>';
        }
        resultsBody.innerHTML = html;

        // Bar chart (top 15)
        var chartItems = sorted.slice(0, 15);
        var chartMax = 0;
        for (var k = 0; k < chartItems.length; k++) {
            if (chartItems[k].cost > chartMax) {
                chartMax = chartItems[k].cost;
            }
        }
        if (chartMax === 0) {
            chartMax = 1;
        }

        var barHtml = "";
        for (var b = 0; b < chartItems.length; b++) {
            var item = chartItems[b];
            var pct = (item.cost / chartMax) * 100;
            barHtml += '<div class="bar-row">';
            barHtml += '<span class="bar-label">' + item.model.provider + ' ' + item.model.model + '</span>';
            barHtml += '<div class="bar-track"><div class="bar-fill" style="width:' + pct.toFixed(1) + '%"></div></div>';
            barHtml += '<span class="bar-value">' + formatCost(item.cost) + '/mo</span>';
            barHtml += '</div>';
        }
        barChart.innerHTML = barHtml;
    }

    // --- Events ---

    inputTokensEl.addEventListener("input", render);
    outputTokensEl.addEventListener("input", render);
    sortSelect.addEventListener("change", render);

    // Preset buttons
    var presetBtns = document.querySelectorAll(".preset-btn");
    for (var p = 0; p < presetBtns.length; p++) {
        presetBtns[p].addEventListener("click", function () {
            var key = this.getAttribute("data-preset");
            var preset = PRESETS[key];
            if (!preset) {
                return;
            }

            inputTokensEl.value = preset.inputTokens;
            outputTokensEl.value = preset.outputTokens;

            // Toggle active
            for (var q = 0; q < presetBtns.length; q++) {
                presetBtns[q].classList.remove("active");
            }
            if (activePreset === key) {
                activePreset = null;
            } else {
                activePreset = key;
                this.classList.add("active");
            }

            render();
        });
    }

    // Filter buttons
    var filterBtns = document.querySelectorAll(".filter-btn");
    for (var f = 0; f < filterBtns.length; f++) {
        filterBtns[f].addEventListener("click", function () {
            activeTier = this.getAttribute("data-tier");

            for (var g = 0; g < filterBtns.length; g++) {
                filterBtns[g].classList.remove("active");
            }
            this.classList.add("active");

            render();
        });
    }

    // Initial render
    render();
})();
