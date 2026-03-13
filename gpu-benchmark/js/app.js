document.addEventListener("DOMContentLoaded", function () {
  initComparison();
  initCanItRun();
  initRankings();
  initFilterTable();
});

// ---------------------------------------------------------------------------
// GPU Comparison
// ---------------------------------------------------------------------------

function initComparison() {
  var selA = document.getElementById("gpu-select-a");
  var selB = document.getElementById("gpu-select-b");
  if (!selA || !selB) {
    return;
  }

  GPU_DATABASE.forEach(function (gpu, i) {
    var optA = document.createElement("option");
    optA.value = i;
    optA.textContent = gpu.name;
    selA.appendChild(optA);

    var optB = document.createElement("option");
    optB.value = i;
    optB.textContent = gpu.name;
    selB.appendChild(optB);
  });

  selA.selectedIndex = 0;
  selB.selectedIndex = 0;

  selA.addEventListener("change", renderComparison);
  selB.addEventListener("change", renderComparison);

  // default selection
  if (GPU_DATABASE.length >= 2) {
    selA.value = "0";
    selB.value = "1";
  }
  renderComparison();
}

function renderComparison() {
  var selA = document.getElementById("gpu-select-a");
  var selB = document.getElementById("gpu-select-b");
  var container = document.getElementById("comparison-result");
  if (!container) {
    return;
  }

  var a = GPU_DATABASE[selA.value];
  var b = GPU_DATABASE[selB.value];
  if (!a || !b) {
    container.innerHTML = "<p>Select two GPUs to compare.</p>";
    return;
  }

  var specs = [
    { label: "VRAM", key: "vram", unit: " GB", higher: true },
    { label: "FP32", key: "fp32", unit: " TFLOPS", higher: true },
    { label: "FP16", key: "fp16", unit: " TFLOPS", higher: true },
    { label: "Memory Bandwidth", key: "memBandwidth", unit: " GB/s", higher: true },
    { label: "TDP", key: "tdp", unit: " W", higher: false },
    { label: "Price", key: "price", unit: "", higher: false, prefix: "$" },
    { label: "Release Year", key: "year", unit: "", higher: true }
  ];

  var html = '<div class="comparison-grid">';
  html += '<div class="comparison-header">';
  html += '<div class="comp-label"></div>';
  html += '<div class="comp-gpu-name">' + escHtml(a.name) + "</div>";
  html += '<div class="comp-gpu-name">' + escHtml(b.name) + "</div>";
  html += "</div>";

  specs.forEach(function (spec) {
    var valA = a[spec.key];
    var valB = b[spec.key];
    var clsA = "";
    var clsB = "";
    if (valA !== valB) {
      if (spec.higher) {
        clsA = valA > valB ? "winner" : "loser";
        clsB = valB > valA ? "winner" : "loser";
      } else {
        clsA = valA < valB ? "winner" : "loser";
        clsB = valB < valA ? "winner" : "loser";
      }
    }
    var prefix = spec.prefix || "";
    html += '<div class="comparison-row">';
    html += '<div class="comp-label">' + spec.label + "</div>";
    html += '<div class="comp-value ' + clsA + '">' + prefix + formatNum(valA) + spec.unit + "</div>";
    html += '<div class="comp-value ' + clsB + '">' + prefix + formatNum(valB) + spec.unit + "</div>";
    html += "</div>";
  });

  // perf per dollar
  var ppdA = a.price > 0 ? (a.fp16 / a.price * 1000).toFixed(1) : "N/A";
  var ppdB = b.price > 0 ? (b.fp16 / b.price * 1000).toFixed(1) : "N/A";
  var ppdClsA = "";
  var ppdClsB = "";
  if (ppdA !== "N/A" && ppdB !== "N/A") {
    var nA = parseFloat(ppdA);
    var nB = parseFloat(ppdB);
    if (nA !== nB) {
      ppdClsA = nA > nB ? "winner" : "loser";
      ppdClsB = nB > nA ? "winner" : "loser";
    }
  }
  html += '<div class="comparison-row highlight-row">';
  html += '<div class="comp-label">FP16 TFLOPS / $1000</div>';
  html += '<div class="comp-value ' + ppdClsA + '">' + ppdA + "</div>";
  html += '<div class="comp-value ' + ppdClsB + '">' + ppdB + "</div>";
  html += "</div>";

  html += "</div>";

  // affiliate links
  html += '<div class="affiliate-links-row">';
  html += '<div></div>';
  html += buildAffiliateLinks(a);
  html += buildAffiliateLinks(b);
  html += "</div>";

  container.innerHTML = html;
}

function buildAffiliateLinks(gpu) {
  if (!gpu.affiliateLinks) {
    return "<div></div>";
  }
  var html = '<div class="affiliate-links">';
  html += '<span class="affiliate-label">Buy:</span> ';
  html += '<a href="' + gpu.affiliateLinks.amazon + '" target="_blank" rel="noopener sponsored">Amazon</a> ';
  html += '<a href="' + gpu.affiliateLinks.bh + '" target="_blank" rel="noopener sponsored">B&H</a> ';
  html += '<a href="' + gpu.affiliateLinks.newegg + '" target="_blank" rel="noopener sponsored">Newegg</a>';
  html += "</div>";
  return html;
}

// ---------------------------------------------------------------------------
// "Can it run?" Calculator
// ---------------------------------------------------------------------------

function initCanItRun() {
  var sel = document.getElementById("model-select");
  if (!sel) {
    return;
  }
  ML_MODELS.forEach(function (m, i) {
    var opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m.name;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", renderCanItRun);
  sel.value = "0";
  renderCanItRun();
}

function renderCanItRun() {
  var sel = document.getElementById("model-select");
  var container = document.getElementById("can-it-run-result");
  if (!container) {
    return;
  }
  var model = ML_MODELS[sel.value];
  if (!model) {
    container.innerHTML = "";
    return;
  }

  var reqs = model.requirements;
  var hasQuantized = reqs.fp16 !== reqs.int8 || reqs.int8 !== reqs.int4;

  var html = '<div class="model-requirements">';
  html += "<h4>VRAM Requirements for " + escHtml(model.name) + "</h4>";
  html += '<div class="req-badges">';
  html += '<span class="badge badge-fp16">FP16: ' + reqs.fp16 + " GB</span>";
  if (hasQuantized) {
    html += '<span class="badge badge-int8">INT8: ' + reqs.int8 + " GB</span>";
    html += '<span class="badge badge-int4">INT4: ' + reqs.int4 + " GB</span>";
  }
  html += "</div></div>";

  html += '<table class="data-table can-run-table"><thead><tr>';
  html += "<th>GPU</th><th>VRAM</th><th>FP16</th>";
  if (hasQuantized) {
    html += "<th>INT8</th><th>INT4</th>";
  }
  html += "</tr></thead><tbody>";

  GPU_DATABASE.forEach(function (gpu) {
    var fp16Ok = gpu.vram >= reqs.fp16;
    var int8Ok = gpu.vram >= reqs.int8;
    var int4Ok = gpu.vram >= reqs.int4;
    html += "<tr>";
    html += "<td>" + escHtml(gpu.name) + "</td>";
    html += "<td>" + gpu.vram + " GB</td>";
    html += "<td>" + statusIcon(fp16Ok) + "</td>";
    if (hasQuantized) {
      html += "<td>" + statusIcon(int8Ok) + "</td>";
      html += "<td>" + statusIcon(int4Ok) + "</td>";
    }
    html += "</tr>";
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

function statusIcon(ok) {
  if (ok) {
    return '<span class="status-yes">Yes</span>';
  }
  return '<span class="status-no">No</span>';
}

// ---------------------------------------------------------------------------
// Price/Performance Rankings
// ---------------------------------------------------------------------------

function initRankings() {
  var sel = document.getElementById("ranking-metric");
  var container = document.getElementById("ranking-result");
  if (!sel || !container) {
    return;
  }
  sel.addEventListener("change", renderRankings);
  renderRankings();
}

function renderRankings() {
  var sel = document.getElementById("ranking-metric");
  var container = document.getElementById("ranking-result");
  var metric = sel.value;

  var items = GPU_DATABASE.map(function (gpu) {
    var score = 0;
    if (metric === "fp16-per-dollar") {
      score = gpu.price > 0 ? gpu.fp16 / gpu.price * 1000 : 0;
    } else if (metric === "fp32-per-dollar") {
      score = gpu.price > 0 ? gpu.fp32 / gpu.price * 1000 : 0;
    } else if (metric === "vram-per-dollar") {
      score = gpu.price > 0 ? gpu.vram / gpu.price * 1000 : 0;
    } else if (metric === "bandwidth-per-dollar") {
      score = gpu.price > 0 ? gpu.memBandwidth / gpu.price * 1000 : 0;
    }
    return { gpu: gpu, score: score };
  });

  items.sort(function (a, b) {
    return b.score - a.score;
  });

  var labels = {
    "fp16-per-dollar": "FP16 TFLOPS / $1000",
    "fp32-per-dollar": "FP32 TFLOPS / $1000",
    "vram-per-dollar": "VRAM (GB) / $1000",
    "bandwidth-per-dollar": "Bandwidth (GB/s) / $1000"
  };

  var maxScore = items[0] ? items[0].score : 1;

  var html = '<table class="data-table"><thead><tr>';
  html += "<th>#</th><th>GPU</th><th>" + (labels[metric] || metric) + "</th><th>Bar</th>";
  html += "</tr></thead><tbody>";

  items.forEach(function (item, i) {
    var pct = maxScore > 0 ? (item.score / maxScore * 100).toFixed(0) : 0;
    html += "<tr>";
    html += "<td>" + (i + 1) + "</td>";
    html += "<td>" + escHtml(item.gpu.name) + "</td>";
    html += "<td>" + item.score.toFixed(1) + "</td>";
    html += '<td><div class="bar-cell"><div class="bar" style="width:' + pct + '%"></div></div></td>';
    html += "</tr>";
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Filterable GPU Table
// ---------------------------------------------------------------------------

function initFilterTable() {
  var vramMin = document.getElementById("filter-vram-min");
  var priceMax = document.getElementById("filter-price-max");
  var typeFilter = document.getElementById("filter-type");
  var sortBy = document.getElementById("filter-sort");
  var container = document.getElementById("filter-table-result");
  if (!container) {
    return;
  }

  function render() {
    renderFilterTable(container, vramMin, priceMax, typeFilter, sortBy);
  }
  [vramMin, priceMax, typeFilter, sortBy].forEach(function (el) {
    if (el) {
      el.addEventListener("change", render);
      el.addEventListener("input", render);
    }
  });
  render();
}

function renderFilterTable(container, vramMin, priceMax, typeFilter, sortBy) {
  var minV = parseFloat(vramMin.value) || 0;
  var maxP = parseFloat(priceMax.value) || Infinity;
  var typeVal = typeFilter.value;
  var sort = sortBy.value;

  var items = GPU_DATABASE.filter(function (gpu) {
    if (gpu.vram < minV) {
      return false;
    }
    if (gpu.price > maxP && maxP > 0) {
      return false;
    }
    if (typeVal && typeVal !== "all" && gpu.type !== typeVal) {
      return false;
    }
    return true;
  });

  items.sort(function (a, b) {
    if (sort === "vram") {
      return b.vram - a.vram;
    }
    if (sort === "fp16") {
      return b.fp16 - a.fp16;
    }
    if (sort === "fp32") {
      return b.fp32 - a.fp32;
    }
    if (sort === "price-asc") {
      return a.price - b.price;
    }
    if (sort === "price-desc") {
      return b.price - a.price;
    }
    if (sort === "bandwidth") {
      return b.memBandwidth - a.memBandwidth;
    }
    return 0;
  });

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-state">No GPUs match your filters.</p>';
    return;
  }

  var html = '<table class="data-table"><thead><tr>';
  html += "<th>GPU</th><th>Type</th><th>VRAM</th><th>FP32</th><th>FP16</th><th>BW</th><th>TDP</th><th>Price</th><th>Year</th>";
  html += "</tr></thead><tbody>";

  items.forEach(function (gpu) {
    var typeLabel = gpu.type.charAt(0).toUpperCase() + gpu.type.slice(1);
    html += "<tr>";
    html += "<td>" + escHtml(gpu.name) + "</td>";
    html += '<td><span class="type-badge type-' + gpu.type + '">' + typeLabel + "</span></td>";
    html += "<td>" + gpu.vram + " GB</td>";
    html += "<td>" + gpu.fp32 + "</td>";
    html += "<td>" + gpu.fp16 + "</td>";
    html += "<td>" + gpu.memBandwidth + "</td>";
    html += "<td>" + gpu.tdp + " W</td>";
    html += "<td>$" + formatNum(gpu.price) + "</td>";
    html += "<td>" + gpu.year + "</td>";
    html += "</tr>";
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatNum(n) {
  return n.toLocaleString();
}
