/* ========================================
   Docker Compose Generator - App Logic
   ======================================== */

(function () {
  "use strict";

  // ---- State ----
  const state = {
    selected: new Set(),
    configs: {},   // serviceId -> { tag, hostPort, persist, env }
    activePreset: null,
  };

  // ---- DOM refs ----
  const pickerEl = document.getElementById("service-picker");
  const presetsEl = document.getElementById("presets");
  const configEl = document.getElementById("service-configs");
  const yamlEl = document.getElementById("yaml-output");
  const countEl = document.getElementById("service-count");
  const copyBtn = document.getElementById("btn-copy");
  const downloadBtn = document.getElementById("btn-download");
  const copyFeedback = document.getElementById("copy-feedback");

  // ---- Init ----
  function init() {
    renderPresets();
    renderPicker();
    bindActions();
    regenerate();
  }

  // ---- Presets ----
  function renderPresets() {
    Object.keys(PRESETS).forEach(function (name) {
      var btn = document.createElement("button");
      btn.className = "preset-btn";
      btn.textContent = name;
      btn.addEventListener("click", function () {
        applyPreset(name);
      });
      presetsEl.appendChild(btn);
    });
  }

  function applyPreset(name) {
    // Toggle off if already active
    if (state.activePreset === name) {
      state.selected.clear();
      state.activePreset = null;
    } else {
      state.selected.clear();
      PRESETS[name].forEach(function (id) {
        state.selected.add(id);
        // Add companions
        var svc = SERVICE_DB[id];
        if (svc && svc.companion && SERVICE_DB[svc.companion]) {
          state.selected.add(svc.companion);
        }
      });
      state.activePreset = name;
    }
    syncCheckboxes();
    renderConfigs();
    regenerate();
    updatePresetButtons();
  }

  function updatePresetButtons() {
    presetsEl.querySelectorAll(".preset-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.textContent === state.activePreset);
    });
  }

  // ---- Service Picker ----
  function renderPicker() {
    CATEGORY_ORDER.forEach(function (cat) {
      var services = Object.keys(SERVICE_DB).filter(function (id) {
        return SERVICE_DB[id].category === cat && !SERVICE_DB[id].hidden;
      });
      if (services.length === 0) {
        return;
      }

      var group = document.createElement("div");
      group.className = "category";

      var label = document.createElement("div");
      label.className = "category-label";
      label.textContent = cat;
      group.appendChild(label);

      var grid = document.createElement("div");
      grid.className = "service-grid";

      services.forEach(function (id) {
        var svc = SERVICE_DB[id];
        var card = document.createElement("label");
        card.className = "service-card";
        card.dataset.serviceId = id;

        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = id;
        cb.addEventListener("change", function () {
          toggleService(id, cb.checked);
        });

        var span = document.createElement("span");
        span.textContent = svc.name;

        card.appendChild(cb);
        card.appendChild(span);
        grid.appendChild(card);
      });

      group.appendChild(grid);
      pickerEl.appendChild(group);
    });
  }

  function toggleService(id, checked) {
    if (checked) {
      state.selected.add(id);
      // Add companion (e.g. Kafka needs Zookeeper)
      var svc = SERVICE_DB[id];
      if (svc && svc.companion && SERVICE_DB[svc.companion]) {
        state.selected.add(svc.companion);
      }
    } else {
      state.selected.delete(id);
      // Remove companion if nothing else needs it
      var svc = SERVICE_DB[id];
      if (svc && svc.companion) {
        var needed = false;
        state.selected.forEach(function (sid) {
          if (SERVICE_DB[sid] && SERVICE_DB[sid].companion === svc.companion) {
            needed = true;
          }
        });
        if (!needed) {
          state.selected.delete(svc.companion);
        }
      }
    }
    state.activePreset = null;
    updatePresetButtons();
    syncCheckboxes();
    renderConfigs();
    regenerate();
  }

  function syncCheckboxes() {
    pickerEl.querySelectorAll(".service-card").forEach(function (card) {
      var id = card.dataset.serviceId;
      var cb = card.querySelector("input");
      cb.checked = state.selected.has(id);
      card.classList.toggle("selected", cb.checked);
    });
  }

  // ---- Service Configuration ----
  function getConfig(id) {
    if (!state.configs[id]) {
      var svc = SERVICE_DB[id];
      var env = {};
      Object.keys(svc.env).forEach(function (k) {
        env[k] = svc.env[k];
      });
      state.configs[id] = {
        tag: svc.defaultTag,
        hostPort: svc.hostPort,
        persist: svc.persistDefault,
        env: env,
      };
    }
    return state.configs[id];
  }

  function renderConfigs() {
    configEl.innerHTML = "";
    var ids = [];
    state.selected.forEach(function (id) {
      ids.push(id);
    });
    // Sort by category order then name
    ids.sort(function (a, b) {
      var catA = CATEGORY_ORDER.indexOf(SERVICE_DB[a].category);
      var catB = CATEGORY_ORDER.indexOf(SERVICE_DB[b].category);
      if (catA !== catB) {
        return catA - catB;
      }
      return SERVICE_DB[a].name.localeCompare(SERVICE_DB[b].name);
    });

    if (ids.length === 0) {
      configEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Select services above to configure them.</p>';
      return;
    }

    ids.forEach(function (id) {
      var svc = SERVICE_DB[id];
      var cfg = getConfig(id);

      var item = document.createElement("div");
      item.className = "config-item";

      // Header
      var header = document.createElement("div");
      header.className = "config-item-header";
      var h4 = document.createElement("h4");
      h4.textContent = svc.name;
      var toggle = document.createElement("span");
      toggle.className = "toggle-icon";
      toggle.textContent = "\u25BC";
      header.appendChild(h4);
      header.appendChild(toggle);

      // Fields
      var fields = document.createElement("div");
      fields.className = "config-fields";

      header.addEventListener("click", function () {
        fields.classList.toggle("open");
        toggle.classList.toggle("open");
      });

      // Tag selector
      var row1 = document.createElement("div");
      row1.className = "config-row";

      var tagField = createSelectField("Version", svc.tags, cfg.tag, function (val) {
        cfg.tag = val;
        regenerate();
      });

      var portField = createInputField("Host Port", cfg.hostPort, "number", function (val) {
        cfg.hostPort = parseInt(val, 10) || svc.hostPort;
        regenerate();
      });

      row1.appendChild(tagField);
      row1.appendChild(portField);
      fields.appendChild(row1);

      // Persist toggle (only if service has volumes)
      if (svc.volumes.length > 0 && Object.keys(svc.volumeDefs).length > 0) {
        var persistRow = document.createElement("div");
        persistRow.className = "config-toggle";
        var pcb = document.createElement("input");
        pcb.type = "checkbox";
        pcb.checked = cfg.persist;
        pcb.id = "persist-" + id;
        pcb.addEventListener("change", function () {
          cfg.persist = pcb.checked;
          regenerate();
        });
        var plabel = document.createElement("label");
        plabel.htmlFor = "persist-" + id;
        plabel.textContent = "Persistent volume";
        persistRow.appendChild(pcb);
        persistRow.appendChild(plabel);
        fields.appendChild(persistRow);
      }

      // Env vars
      var envKeys = Object.keys(svc.env);
      if (envKeys.length > 0) {
        var envLabel = document.createElement("div");
        envLabel.style.cssText = "font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:10px;margin-bottom:6px;";
        envLabel.textContent = "Environment Variables";
        fields.appendChild(envLabel);

        envKeys.forEach(function (key) {
          var envRow = document.createElement("div");
          envRow.className = "config-row full";
          var envField = createInputField(key, cfg.env[key], "text", function (val) {
            cfg.env[key] = val;
            regenerate();
          });
          envRow.appendChild(envField);
          fields.appendChild(envRow);
        });
      }

      item.appendChild(header);
      item.appendChild(fields);
      configEl.appendChild(item);
    });

    // Update count badge
    countEl.textContent = ids.length;
    countEl.style.display = ids.length > 0 ? "inline" : "none";
  }

  function createSelectField(label, options, selected, onChange) {
    var div = document.createElement("div");
    div.className = "config-field";
    var lbl = document.createElement("label");
    lbl.textContent = label;
    var sel = document.createElement("select");
    options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (opt === selected) {
        o.selected = true;
      }
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () {
      onChange(sel.value);
    });
    div.appendChild(lbl);
    div.appendChild(sel);
    return div;
  }

  function createInputField(label, value, type, onChange) {
    var div = document.createElement("div");
    div.className = "config-field";
    var lbl = document.createElement("label");
    lbl.textContent = label;
    var inp = document.createElement("input");
    inp.type = type;
    inp.value = value;
    inp.addEventListener("input", function () {
      onChange(inp.value);
    });
    div.appendChild(lbl);
    div.appendChild(inp);
    return div;
  }

  // ---- YAML Generation ----
  function regenerate() {
    var ids = [];
    state.selected.forEach(function (id) {
      ids.push(id);
    });

    if (ids.length === 0) {
      yamlEl.innerHTML = '<div class="empty-state">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '<p>Select services to generate your docker-compose.yml</p></div>';
      countEl.style.display = "none";
      return;
    }

    countEl.textContent = ids.length;
    countEl.style.display = "inline";

    var yaml = buildYaml(ids);
    yamlEl.innerHTML = highlightYaml(yaml);
  }

  function buildYaml(ids) {
    var lines = [];
    var allVolumes = {};

    lines.push("services:");

    // Sort: put dependencies first
    ids.sort(function (a, b) {
      var svcA = SERVICE_DB[a];
      var svcB = SERVICE_DB[b];
      // Hidden (companion) services first
      if (svcA.hidden && !svcB.hidden) {
        return -1;
      }
      if (!svcA.hidden && svcB.hidden) {
        return 1;
      }
      // Then by category order
      var catA = CATEGORY_ORDER.indexOf(svcA.category);
      var catB = CATEGORY_ORDER.indexOf(svcB.category);
      if (catA !== catB) {
        return catA - catB;
      }
      return svcA.name.localeCompare(svcB.name);
    });

    ids.forEach(function (id) {
      var svc = SERVICE_DB[id];
      var cfg = getConfig(id);
      var indent = "  ";
      var indent2 = "    ";
      var indent3 = "      ";

      lines.push("");
      lines.push(indent + id + ":");
      lines.push(indent2 + "image: " + svc.image + ":" + cfg.tag);
      lines.push(indent2 + "container_name: " + id);

      // Command
      if (svc.command) {
        lines.push(indent2 + "command: " + svc.command);
      }

      // Working dir
      if (svc.working_dir) {
        lines.push(indent2 + "working_dir: " + svc.working_dir);
      }

      // Environment
      var envKeys = Object.keys(cfg.env);
      if (envKeys.length > 0) {
        lines.push(indent2 + "environment:");
        envKeys.forEach(function (key) {
          lines.push(indent3 + key + ": " + quoteEnvVal(cfg.env[key]));
        });
      }

      // Ports
      var ports = [];
      ports.push(cfg.hostPort + ":" + svc.containerPort);
      if (svc.extraPorts) {
        svc.extraPorts.forEach(function (p) {
          ports.push(p);
        });
      }
      lines.push(indent2 + "ports:");
      ports.forEach(function (p) {
        lines.push(indent3 + '- "' + p + '"');
      });

      // Volumes
      var svcVolumes = [];
      if (cfg.persist && svc.volumes.length > 0) {
        svc.volumes.forEach(function (v) {
          svcVolumes.push(v);
        });
      } else {
        // Include bind mounts (start with ./) but not named volumes
        svc.volumes.forEach(function (v) {
          if (v.indexOf("./") === 0 || v.indexOf("/") === 0) {
            svcVolumes.push(v);
          }
        });
      }
      if (svcVolumes.length > 0) {
        lines.push(indent2 + "volumes:");
        svcVolumes.forEach(function (v) {
          lines.push(indent3 + "- " + v);
        });
      }

      // Collect named volumes
      if (cfg.persist && svc.volumeDefs) {
        Object.keys(svc.volumeDefs).forEach(function (vn) {
          allVolumes[vn] = true;
        });
      }

      // depends_on
      if (svc.depends_on && svc.depends_on.length > 0) {
        var activeDeps = svc.depends_on.filter(function (d) {
          return ids.indexOf(d) !== -1;
        });
        if (activeDeps.length > 0) {
          lines.push(indent2 + "depends_on:");
          activeDeps.forEach(function (d) {
            lines.push(indent3 + d + ":");
            lines.push(indent3 + "  condition: service_healthy");
          });
        }
      }

      // Health check
      if (svc.healthcheck) {
        lines.push(indent2 + "healthcheck:");
        lines.push(indent3 + "test: " + svc.healthcheck.test);
        lines.push(indent3 + "interval: " + svc.healthcheck.interval);
        lines.push(indent3 + "timeout: " + svc.healthcheck.timeout);
        lines.push(indent3 + "retries: " + svc.healthcheck.retries);
      }

      // Networks
      lines.push(indent2 + "networks:");
      lines.push(indent3 + "- app-network");

      // Restart
      lines.push(indent2 + "restart: unless-stopped");
    });

    // Networks
    lines.push("");
    lines.push("networks:");
    lines.push("  app-network:");
    lines.push("    driver: bridge");

    // Named volumes
    var volNames = Object.keys(allVolumes);
    if (volNames.length > 0) {
      lines.push("");
      lines.push("volumes:");
      volNames.forEach(function (vn) {
        lines.push("  " + vn + ":");
        lines.push("    driver: local");
      });
    }

    return lines.join("\n") + "\n";
  }

  function quoteEnvVal(val) {
    if (val === "" || val === null || val === undefined) {
      return '""';
    }
    var str = String(val);
    // Quote if contains special chars or looks like a number/bool
    if (/[:#{}[\],&*?|>!%@`]/.test(str) || str === "true" || str === "false" || str === "null" || /^\d+$/.test(str)) {
      return '"' + str.replace(/"/g, '\\"') + '"';
    }
    return '"' + str + '"';
  }

  // ---- Syntax Highlighting ----
  function highlightYaml(yaml) {
    var escaped = yaml
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    var lines = escaped.split("\n");
    var result = [];

    lines.forEach(function (line) {
      // Comments
      if (/^\s*#/.test(line)) {
        result.push('<span class="y-comment">' + line + "</span>");
        return;
      }

      // Key: value lines
      var match = line.match(/^(\s*)([\w.\-/]+)(\s*:\s*)(.*)/);
      if (match) {
        var indent = match[1];
        var key = match[2];
        var colon = match[3];
        var val = match[4];

        var highlighted = indent + '<span class="y-key">' + key + "</span>" + colon;

        if (val) {
          highlighted += colorizeValue(val);
        }
        result.push(highlighted);
        return;
      }

      // List items
      var listMatch = line.match(/^(\s*-\s*)(.*)/);
      if (listMatch) {
        result.push(listMatch[1] + colorizeValue(listMatch[2]));
        return;
      }

      result.push(line);
    });

    return result.join("\n");
  }

  function colorizeValue(val) {
    var trimmed = val.trim();
    if (trimmed === "true" || trimmed === "false") {
      return '<span class="y-bool">' + val + "</span>";
    }
    if (trimmed === "null" || trimmed === "~") {
      return '<span class="y-null">' + val + "</span>";
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return '<span class="y-num">' + val + "</span>";
    }
    if (/^".*"$/.test(trimmed) || /^'.*'$/.test(trimmed)) {
      return '<span class="y-str">' + val + "</span>";
    }
    // Color strings that look like paths, image refs, etc.
    if (trimmed.length > 0) {
      return '<span class="y-str">' + val + "</span>";
    }
    return val;
  }

  // ---- Actions ----
  function bindActions() {
    copyBtn.addEventListener("click", function () {
      var text = getPlainYaml();
      if (!text) {
        return;
      }
      navigator.clipboard.writeText(text).then(function () {
        showCopyFeedback();
      });
    });

    downloadBtn.addEventListener("click", function () {
      var text = getPlainYaml();
      if (!text) {
        return;
      }
      var blob = new Blob([text], { type: "text/yaml" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "docker-compose.yml";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  function getPlainYaml() {
    var ids = [];
    state.selected.forEach(function (id) {
      ids.push(id);
    });
    if (ids.length === 0) {
      return "";
    }
    return buildYaml(ids);
  }

  function showCopyFeedback() {
    copyFeedback.classList.add("show");
    setTimeout(function () {
      copyFeedback.classList.remove("show");
    }, 2000);
  }

  // ---- Start ----
  init();
})();
