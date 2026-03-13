(function () {
    "use strict";

    // === Tab Switching ===
    var tabs = document.querySelectorAll(".tab");
    var tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            var target = tab.getAttribute("data-tab");
            tabs.forEach(function (t) { t.classList.remove("active"); });
            tabContents.forEach(function (tc) { tc.classList.remove("active"); });
            tab.classList.add("active");
            document.getElementById("tab-" + target).classList.add("active");
        });
    });

    // === Toast ===
    var toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add("visible");
        setTimeout(function () {
            toastEl.classList.remove("visible");
        }, 2000);
    }

    // === URL Decode Detection ===
    function maybeDecodeURL(str) {
        str = str.trim();
        if (str.indexOf("%7B") !== -1 || str.indexOf("%5B") !== -1 ||
            str.indexOf("%22") !== -1 || str.indexOf("%7b") !== -1) {
            try {
                var decoded = decodeURIComponent(str);
                JSON.parse(decoded);
                return decoded;
            } catch (e) {
                // not valid after decoding, return original
            }
        }
        return str;
    }

    // === Syntax Highlighting ===
    function syntaxHighlight(json) {
        json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                var cls = "json-number";
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = "json-key";
                        // remove trailing colon from the span, add it outside
                        return '<span class="' + cls + '">' + match.slice(0, -1) + '</span>:';
                    } else {
                        cls = "json-string";
                    }
                } else if (/true|false/.test(match)) {
                    cls = "json-boolean";
                } else if (/null/.test(match)) {
                    cls = "json-null";
                }
                return '<span class="' + cls + '">' + match + '</span>';
            }
        );
    }

    // === Get Indent ===
    function getIndent() {
        var sel = document.getElementById("indent-select").value;
        if (sel === "tab") {
            return "\t";
        }
        return parseInt(sel, 10);
    }

    // === FORMAT TAB ===
    var formatInput = document.getElementById("format-input");
    var formatOutput = document.getElementById("format-output");

    document.getElementById("btn-format").addEventListener("click", function () {
        var raw = maybeDecodeURL(formatInput.value);
        if (!raw) {
            formatOutput.innerHTML = '<span class="json-null">Paste some JSON to format.</span>';
            return;
        }
        try {
            var parsed = JSON.parse(raw);
            var formatted = JSON.stringify(parsed, null, getIndent());
            formatOutput.innerHTML = syntaxHighlight(formatted);
        } catch (e) {
            formatOutput.innerHTML = '<span style="color:var(--error)">Error: ' +
                escapeHtml(e.message) + '</span>';
        }
    });

    document.getElementById("btn-minify").addEventListener("click", function () {
        var raw = maybeDecodeURL(formatInput.value);
        if (!raw) {
            return;
        }
        try {
            var parsed = JSON.parse(raw);
            var minified = JSON.stringify(parsed);
            formatOutput.innerHTML = syntaxHighlight(minified);
        } catch (e) {
            formatOutput.innerHTML = '<span style="color:var(--error)">Error: ' +
                escapeHtml(e.message) + '</span>';
        }
    });

    document.getElementById("btn-clear-format").addEventListener("click", function () {
        formatInput.value = "";
        formatOutput.innerHTML = "";
    });

    document.getElementById("btn-copy-format").addEventListener("click", function () {
        var text = formatOutput.textContent;
        if (!text) {
            return;
        }
        navigator.clipboard.writeText(text).then(function () {
            showToast("Copied to clipboard");
        });
    });

    document.getElementById("btn-download-format").addEventListener("click", function () {
        var text = formatOutput.textContent;
        if (!text) {
            return;
        }
        var blob = new Blob([text], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "formatted.json";
        a.click();
        URL.revokeObjectURL(url);
        showToast("Downloaded formatted.json");
    });

    // === VALIDATE TAB ===
    var validateInput = document.getElementById("validate-input");
    var validateResult = document.getElementById("validate-result");

    document.getElementById("btn-validate").addEventListener("click", function () {
        doValidate();
    });

    validateInput.addEventListener("input", function () {
        if (validateInput.value.trim()) {
            doValidate();
        } else {
            validateResult.className = "validate-result";
            validateResult.innerHTML = "";
        }
    });

    function doValidate() {
        var raw = maybeDecodeURL(validateInput.value);
        if (!raw) {
            validateResult.className = "validate-result";
            validateResult.innerHTML = "";
            return;
        }
        try {
            JSON.parse(raw);
            validateResult.className = "validate-result valid";
            validateResult.innerHTML = "&#10003; Valid JSON";
        } catch (e) {
            var msg = e.message;
            var lineInfo = getErrorLineInfo(raw, msg);
            validateResult.className = "validate-result invalid";
            validateResult.innerHTML = "&#10007; Invalid JSON: " + escapeHtml(msg);
            if (lineInfo) {
                validateResult.innerHTML += '<div class="error-line">' + escapeHtml(lineInfo) + '</div>';
            }
        }
    }

    function getErrorLineInfo(raw, errorMsg) {
        // Try to extract position from error message
        var posMatch = errorMsg.match(/position\s+(\d+)/i);
        if (!posMatch) {
            return null;
        }
        var pos = parseInt(posMatch[1], 10);
        var lines = raw.substring(0, pos).split("\n");
        var lineNum = lines.length;
        var colNum = lines[lines.length - 1].length + 1;
        var allLines = raw.split("\n");
        var contextLine = allLines[lineNum - 1] || "";
        return "Line " + lineNum + ", Column " + colNum + ":\n" + contextLine + "\n" +
            new Array(colNum).join(" ") + "^";
    }

    document.getElementById("btn-clear-validate").addEventListener("click", function () {
        validateInput.value = "";
        validateResult.className = "validate-result";
        validateResult.innerHTML = "";
    });

    // === DIFF TAB ===
    var diffLeft = document.getElementById("diff-left");
    var diffRight = document.getElementById("diff-right");
    var diffOutput = document.getElementById("diff-output");

    document.getElementById("btn-diff").addEventListener("click", function () {
        var rawLeft = maybeDecodeURL(diffLeft.value);
        var rawRight = maybeDecodeURL(diffRight.value);

        if (!rawLeft || !rawRight) {
            diffOutput.classList.remove("visible");
            return;
        }

        var left, right;
        try {
            left = JSON.parse(rawLeft);
        } catch (e) {
            diffOutput.classList.add("visible");
            diffOutput.innerHTML = '<span style="color:var(--error)">Left JSON error: ' +
                escapeHtml(e.message) + '</span>';
            return;
        }
        try {
            right = JSON.parse(rawRight);
        } catch (e) {
            diffOutput.classList.add("visible");
            diffOutput.innerHTML = '<span style="color:var(--error)">Right JSON error: ' +
                escapeHtml(e.message) + '</span>';
            return;
        }

        var diffs = diffJSON(left, right, "");
        if (diffs.length === 0) {
            diffOutput.classList.add("visible");
            diffOutput.innerHTML = '<span class="diff-same">No differences found. The JSON objects are identical.</span>';
            return;
        }

        var html = '<div class="diff-header">Found ' + diffs.length + ' difference(s):</div>\n';
        diffs.forEach(function (d) {
            if (d.type === "added") {
                html += '<div class="diff-line diff-add">+ ' + escapeHtml(d.path) +
                    ': ' + escapeHtml(formatValue(d.value)) + '</div>';
            } else if (d.type === "removed") {
                html += '<div class="diff-line diff-remove">- ' + escapeHtml(d.path) +
                    ': ' + escapeHtml(formatValue(d.value)) + '</div>';
            } else if (d.type === "changed") {
                html += '<div class="diff-line diff-remove">- ' + escapeHtml(d.path) +
                    ': ' + escapeHtml(formatValue(d.oldValue)) + '</div>';
                html += '<div class="diff-line diff-add">+ ' + escapeHtml(d.path) +
                    ': ' + escapeHtml(formatValue(d.newValue)) + '</div>';
            }
        });

        diffOutput.classList.add("visible");
        diffOutput.innerHTML = html;
    });

    function diffJSON(a, b, path) {
        var diffs = [];

        if (a === b) {
            return diffs;
        }

        if (a === null || b === null || typeof a !== typeof b ||
            Array.isArray(a) !== Array.isArray(b)) {
            diffs.push({ type: "changed", path: path || "(root)", oldValue: a, newValue: b });
            return diffs;
        }

        if (typeof a !== "object") {
            diffs.push({ type: "changed", path: path || "(root)", oldValue: a, newValue: b });
            return diffs;
        }

        if (Array.isArray(a)) {
            var maxLen = Math.max(a.length, b.length);
            for (var i = 0; i < maxLen; i++) {
                var itemPath = path + "[" + i + "]";
                if (i >= a.length) {
                    diffs.push({ type: "added", path: itemPath, value: b[i] });
                } else if (i >= b.length) {
                    diffs.push({ type: "removed", path: itemPath, value: a[i] });
                } else {
                    diffs = diffs.concat(diffJSON(a[i], b[i], itemPath));
                }
            }
            return diffs;
        }

        var allKeys = {};
        Object.keys(a).forEach(function (k) { allKeys[k] = true; });
        Object.keys(b).forEach(function (k) { allKeys[k] = true; });

        Object.keys(allKeys).sort().forEach(function (key) {
            var keyPath = path ? path + "." + key : key;
            if (!(key in a)) {
                diffs.push({ type: "added", path: keyPath, value: b[key] });
            } else if (!(key in b)) {
                diffs.push({ type: "removed", path: keyPath, value: a[key] });
            } else {
                diffs = diffs.concat(diffJSON(a[key], b[key], keyPath));
            }
        });

        return diffs;
    }

    function formatValue(val) {
        if (val === null) {
            return "null";
        }
        if (typeof val === "string") {
            return '"' + val + '"';
        }
        if (typeof val === "object") {
            try {
                return JSON.stringify(val);
            } catch (e) {
                return String(val);
            }
        }
        return String(val);
    }

    document.getElementById("btn-clear-diff").addEventListener("click", function () {
        diffLeft.value = "";
        diffRight.value = "";
        diffOutput.classList.remove("visible");
        diffOutput.innerHTML = "";
    });

    // === TREE VIEW TAB ===
    var treeInput = document.getElementById("tree-input");
    var treeOutput = document.getElementById("tree-output");

    document.getElementById("btn-tree").addEventListener("click", function () {
        var raw = maybeDecodeURL(treeInput.value);
        if (!raw) {
            treeOutput.innerHTML = "";
            return;
        }
        try {
            var parsed = JSON.parse(raw);
            treeOutput.innerHTML = "";
            treeOutput.appendChild(buildTreeNode(null, parsed, true));
        } catch (e) {
            treeOutput.innerHTML = '<span style="color:var(--error)">Error: ' +
                escapeHtml(e.message) + '</span>';
        }
    });

    function buildTreeNode(key, value, isRoot) {
        var container = document.createElement("div");
        container.className = isRoot ? "tree-node-root" : "tree-node";

        if (value !== null && typeof value === "object") {
            var isArray = Array.isArray(value);
            var keys = Object.keys(value);
            var openBracket = isArray ? "[" : "{";
            var closeBracket = isArray ? "]" : "}";

            // Header line with toggle
            var headerLine = document.createElement("div");

            var toggle = document.createElement("span");
            toggle.className = "tree-toggle";
            toggle.textContent = "\u25BC";
            headerLine.appendChild(toggle);

            if (key !== null) {
                var keySpan = document.createElement("span");
                keySpan.className = "tree-key";
                keySpan.textContent = '"' + key + '"';
                headerLine.appendChild(keySpan);

                var colon = document.createElement("span");
                colon.className = "tree-colon";
                colon.textContent = ": ";
                headerLine.appendChild(colon);
            }

            var bracket = document.createElement("span");
            bracket.className = "tree-bracket";
            bracket.textContent = openBracket;
            headerLine.appendChild(bracket);

            var count = document.createElement("span");
            count.className = "tree-count";
            count.textContent = " " + keys.length + (keys.length === 1 ? " item" : " items");
            headerLine.appendChild(count);

            container.appendChild(headerLine);

            // Children container
            var childrenDiv = document.createElement("div");
            childrenDiv.className = "tree-children";

            keys.forEach(function (childKey) {
                var childNode = buildTreeNode(isArray ? parseInt(childKey, 10) : childKey, value[childKey], false);
                childrenDiv.appendChild(childNode);
            });

            container.appendChild(childrenDiv);

            // Closing bracket
            var closeLine = document.createElement("div");
            closeLine.style.paddingLeft = "16px";
            var closeBracketSpan = document.createElement("span");
            closeBracketSpan.className = "tree-bracket";
            closeBracketSpan.textContent = closeBracket;
            closeLine.appendChild(closeBracketSpan);
            container.appendChild(closeLine);

            // Toggle behavior
            toggle.addEventListener("click", function () {
                var isCollapsed = childrenDiv.classList.toggle("collapsed");
                toggle.textContent = isCollapsed ? "\u25B6" : "\u25BC";
                count.textContent = isCollapsed
                    ? (" " + keys.length + (keys.length === 1 ? " item" : " items") + " ...")
                    : (" " + keys.length + (keys.length === 1 ? " item" : " items"));
                closeLine.style.display = isCollapsed ? "none" : "";
            });
        } else {
            // Leaf node
            var line = document.createElement("div");

            // Spacer for alignment (no toggle on leaf nodes)
            var spacer = document.createElement("span");
            spacer.style.display = "inline-block";
            spacer.style.width = "16px";
            line.appendChild(spacer);

            if (key !== null) {
                var keySpan2 = document.createElement("span");
                keySpan2.className = "tree-key";
                keySpan2.textContent = typeof key === "number" ? key : '"' + key + '"';
                line.appendChild(keySpan2);

                var colon2 = document.createElement("span");
                colon2.className = "tree-colon";
                colon2.textContent = ": ";
                line.appendChild(colon2);
            }

            var valSpan = document.createElement("span");
            if (value === null) {
                valSpan.className = "tree-value-null";
                valSpan.textContent = "null";
            } else if (typeof value === "string") {
                valSpan.className = "tree-value-string";
                valSpan.textContent = '"' + value + '"';
            } else if (typeof value === "number") {
                valSpan.className = "tree-value-number";
                valSpan.textContent = value;
            } else if (typeof value === "boolean") {
                valSpan.className = "tree-value-boolean";
                valSpan.textContent = value;
            }
            line.appendChild(valSpan);

            container.appendChild(line);
        }

        return container;
    }

    document.getElementById("btn-expand-all").addEventListener("click", function () {
        treeOutput.querySelectorAll(".tree-children.collapsed").forEach(function (el) {
            el.classList.remove("collapsed");
        });
        treeOutput.querySelectorAll(".tree-toggle").forEach(function (el) {
            el.textContent = "\u25BC";
        });
        treeOutput.querySelectorAll(".tree-node-root > div:last-child, .tree-node > div:last-child").forEach(function (el) {
            el.style.display = "";
        });
    });

    document.getElementById("btn-collapse-all").addEventListener("click", function () {
        treeOutput.querySelectorAll(".tree-children").forEach(function (el) {
            el.classList.add("collapsed");
        });
        treeOutput.querySelectorAll(".tree-toggle").forEach(function (el) {
            el.textContent = "\u25B6";
        });
    });

    document.getElementById("btn-clear-tree").addEventListener("click", function () {
        treeInput.value = "";
        treeOutput.innerHTML = "";
    });

    // === Utility ===
    function escapeHtml(str) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
})();
