(function () {
  "use strict";

  // State
  const selected = new Set();
  let activeStack = null;

  // DOM refs
  const categoriesEl = document.getElementById("categories");
  const stacksGridEl = document.getElementById("stacks-grid");
  const searchEl = document.getElementById("search");
  const previewEl = document.getElementById("preview");
  const previewInfoEl = document.getElementById("preview-info");
  const btnCopy = document.getElementById("btn-copy");
  const btnDownload = document.getElementById("btn-download");
  const warningsEl = document.getElementById("warnings");
  const warningListEl = document.getElementById("warning-list");

  // ===== Build Category Picker =====
  function buildCategories() {
    const grouped = {};
    for (const t of TEMPLATES) {
      if (!grouped[t.category]) {
        grouped[t.category] = [];
      }
      grouped[t.category].push(t);
    }

    for (const cat of CATEGORY_ORDER) {
      if (!grouped[cat]) {
        continue;
      }
      const items = grouped[cat];
      const catEl = document.createElement("div");
      catEl.className = "category";
      catEl.dataset.category = cat;

      const header = document.createElement("div");
      header.className = "category-header";
      header.innerHTML = `<span>${cat}</span><span class="category-toggle">&#9660;</span>`;
      header.addEventListener("click", function () {
        catEl.classList.toggle("collapsed");
      });

      const itemsWrap = document.createElement("div");
      itemsWrap.className = "category-items";

      const emptyMsg = document.createElement("div");
      emptyMsg.className = "category-empty";
      emptyMsg.textContent = "No matches";

      for (const item of items) {
        const label = document.createElement("label");
        label.className = "item-check";
        label.dataset.id = item.id;
        label.dataset.name = item.name.toLowerCase();

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = item.id;
        checkbox.addEventListener("change", function () {
          if (this.checked) {
            selected.add(item.id);
          } else {
            selected.delete(item.id);
          }
          activeStack = null;
          updateStackButtons();
          updatePreview();
          updateWarnings();
        });

        const span = document.createElement("span");
        span.textContent = item.name;

        label.appendChild(checkbox);
        label.appendChild(span);
        itemsWrap.appendChild(label);
      }

      catEl.appendChild(header);
      catEl.appendChild(itemsWrap);
      catEl.appendChild(emptyMsg);
      categoriesEl.appendChild(catEl);
    }
  }

  // ===== Build Stack Buttons =====
  function buildStacks() {
    for (const stack of STACKS) {
      const btn = document.createElement("button");
      btn.className = "stack-btn";
      btn.textContent = stack.name;
      btn.addEventListener("click", function () {
        if (activeStack === stack.name) {
          // Deselect
          activeStack = null;
          selected.clear();
        } else {
          activeStack = stack.name;
          selected.clear();
          for (const id of stack.items) {
            selected.add(id);
          }
        }
        syncCheckboxes();
        updateStackButtons();
        updatePreview();
        updateWarnings();
      });
      stacksGridEl.appendChild(btn);
    }
  }

  function updateStackButtons() {
    const btns = stacksGridEl.querySelectorAll(".stack-btn");
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("active", STACKS[i].name === activeStack);
    }
  }

  function syncCheckboxes() {
    const checkboxes = categoriesEl.querySelectorAll('input[type="checkbox"]');
    for (const cb of checkboxes) {
      cb.checked = selected.has(cb.value);
    }
  }

  // ===== Search / Filter =====
  searchEl.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();
    const categories = categoriesEl.querySelectorAll(".category");

    for (const catEl of categories) {
      const labels = catEl.querySelectorAll(".item-check");
      let visibleCount = 0;

      for (const label of labels) {
        const name = label.dataset.name;
        const id = label.dataset.id;
        const match = !query || name.includes(query) || id.includes(query);
        label.classList.toggle("hidden", !match);
        if (match) {
          visibleCount++;
        }
      }

      catEl.classList.toggle("all-hidden", visibleCount === 0 && query.length > 0);

      // Auto-expand categories with matches, collapse empty ones during search
      if (query.length > 0) {
        if (visibleCount > 0) {
          catEl.classList.remove("collapsed");
        } else {
          catEl.classList.add("collapsed");
        }
      }
    }
  });

  // ===== Generate Preview =====
  function generateGitignore() {
    if (selected.size === 0) {
      return "";
    }

    const parts = [];
    parts.push("# ============================================");
    parts.push("# .gitignore - Generated by gitignore-gen");
    parts.push("# ============================================");
    parts.push("");

    // Collect selected templates in category order
    for (const cat of CATEGORY_ORDER) {
      const catTemplates = TEMPLATES.filter(function (t) {
        return t.category === cat && selected.has(t.id);
      });

      if (catTemplates.length === 0) {
        continue;
      }

      parts.push("# ────────────────────────────────────────────");
      parts.push("# " + cat);
      parts.push("# ────────────────────────────────────────────");
      parts.push("");

      for (const t of catTemplates) {
        parts.push("### " + t.name + " ###");
        parts.push(t.patterns.trim());
        parts.push("");
      }
    }

    return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function updatePreview() {
    const content = generateGitignore();
    if (!content) {
      previewEl.hidden = true;
      previewInfoEl.hidden = false;
      return;
    }
    previewEl.hidden = false;
    previewInfoEl.hidden = true;
    previewEl.textContent = content;
  }

  // ===== Warnings =====
  function updateWarnings() {
    const allWarnings = [];
    for (const id of selected) {
      if (WARNINGS[id]) {
        for (const w of WARNINGS[id]) {
          allWarnings.push(w);
        }
      }
    }

    if (allWarnings.length === 0) {
      warningsEl.hidden = true;
      return;
    }

    warningsEl.hidden = false;
    warningListEl.innerHTML = "";
    for (const w of allWarnings) {
      const li = document.createElement("li");
      li.textContent = w;
      warningListEl.appendChild(li);
    }
  }

  // ===== Copy =====
  btnCopy.addEventListener("click", function () {
    const content = generateGitignore();
    if (!content) {
      return;
    }

    navigator.clipboard.writeText(content).then(function () {
      btnCopy.textContent = "Copied!";
      btnCopy.classList.add("copied");
      setTimeout(function () {
        btnCopy.textContent = "Copy";
        btnCopy.classList.remove("copied");
      }, 2000);
    }).catch(function () {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      btnCopy.textContent = "Copied!";
      btnCopy.classList.add("copied");
      setTimeout(function () {
        btnCopy.textContent = "Copy";
        btnCopy.classList.remove("copied");
      }, 2000);
    });
  });

  // ===== Download =====
  btnDownload.addEventListener("click", function () {
    const content = generateGitignore();
    if (!content) {
      return;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".gitignore";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ===== Init =====
  buildCategories();
  buildStacks();
})();
