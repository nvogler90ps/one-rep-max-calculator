/**
 * Lightweight YAML parser and serializer.
 * Handles: mappings, sequences, scalars (strings, numbers, booleans, null),
 * quoted strings, multiline strings (literal | and folded >), nested structures,
 * comments, and flow syntax {}/[].
 */
var YAML = (function () {
  "use strict";

  // ── helpers ──────────────────────────────────────────────────────────
  function trimComment(line) {
    var inSingle = false;
    var inDouble = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; }
      else if (ch === '"' && !inSingle) { inDouble = !inDouble; }
      else if (ch === "#" && !inSingle && !inDouble) {
        if (i === 0 || line[i - 1] === " " || line[i - 1] === "\t") {
          return line.substring(0, i).trimEnd();
        }
      }
    }
    return line;
  }

  function indentLevel(line) {
    var count = 0;
    for (var i = 0; i < line.length; i++) {
      if (line[i] === " ") { count++; }
      else { break; }
    }
    return count;
  }

  function parseScalar(val) {
    if (val === "" || val === "~" || val === "null" || val === "Null" || val === "NULL") {
      return null;
    }
    if (val === "true" || val === "True" || val === "TRUE") { return true; }
    if (val === "false" || val === "False" || val === "FALSE") { return false; }
    if (/^-?\d+$/.test(val)) { return parseInt(val, 10); }
    if (/^-?\d+\.\d+$/.test(val)) { return parseFloat(val); }
    if (/^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(val)) { return parseFloat(val); }
    if ((val[0] === '"' && val[val.length - 1] === '"') ||
        (val[0] === "'" && val[val.length - 1] === "'")) {
      return val.substring(1, val.length - 1);
    }
    return val;
  }

  // ── flow parser (inline JSON-like) ──────────────────────────────────
  function parseFlow(str) {
    str = str.trim();
    if (str[0] === "{") { return parseFlowMapping(str); }
    if (str[0] === "[") { return parseFlowSequence(str); }
    return parseScalar(str);
  }

  function parseFlowMapping(str) {
    var obj = {};
    var inner = str.substring(1, str.length - 1).trim();
    if (inner === "") { return obj; }
    var parts = splitFlowItems(inner);
    for (var i = 0; i < parts.length; i++) {
      var colonIdx = parts[i].indexOf(":");
      if (colonIdx === -1) { continue; }
      var k = parts[i].substring(0, colonIdx).trim();
      var v = parts[i].substring(colonIdx + 1).trim();
      k = parseScalar(k);
      obj[k] = parseFlow(v);
    }
    return obj;
  }

  function parseFlowSequence(str) {
    var arr = [];
    var inner = str.substring(1, str.length - 1).trim();
    if (inner === "") { return arr; }
    var parts = splitFlowItems(inner);
    for (var i = 0; i < parts.length; i++) {
      arr.push(parseFlow(parts[i].trim()));
    }
    return arr;
  }

  function splitFlowItems(str) {
    var items = [];
    var depth = 0;
    var start = 0;
    var inSingle = false;
    var inDouble = false;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; }
      else if (ch === '"' && !inSingle) { inDouble = !inDouble; }
      else if (!inSingle && !inDouble) {
        if (ch === "{" || ch === "[") { depth++; }
        else if (ch === "}" || ch === "]") { depth--; }
        else if (ch === "," && depth === 0) {
          items.push(str.substring(start, i));
          start = i + 1;
        }
      }
    }
    items.push(str.substring(start));
    return items;
  }

  // ── block parser ────────────────────────────────────────────────────
  function parse(text) {
    if (typeof text !== "string") {
      throw new Error("YAML.parse expects a string");
    }
    var rawLines = text.split("\n");
    var lines = [];
    for (var i = 0; i < rawLines.length; i++) {
      var line = rawLines[i];
      // skip document markers
      if (/^---\s*$/.test(line) || /^\.\.\.\s*$/.test(line)) { continue; }
      var trimmed = trimComment(line);
      // keep blank lines for multiline block tracking
      lines.push({ raw: line, trimmed: trimmed, indent: indentLevel(line) });
    }
    var ctx = { lines: lines, pos: 0 };
    return parseNode(ctx, -1);
  }

  function parseNode(ctx, parentIndent) {
    skipBlanks(ctx);
    if (ctx.pos >= ctx.lines.length) { return null; }

    var line = ctx.lines[ctx.pos];
    var content = line.trimmed.trim();

    // sequence item at this level
    if (content.indexOf("- ") === 0 || content === "-") {
      return parseSequence(ctx, line.indent);
    }

    // mapping
    if (hasKeyColon(content)) {
      return parseMapping(ctx, line.indent);
    }

    // bare scalar
    ctx.pos++;
    return parseScalar(content);
  }

  function hasKeyColon(content) {
    if (content[0] === "-") { return false; }
    // Check for key: pattern (colon followed by space or end of string)
    var inSingle = false;
    var inDouble = false;
    for (var i = 0; i < content.length; i++) {
      var ch = content[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; }
      else if (ch === '"' && !inSingle) { inDouble = !inDouble; }
      else if (ch === ":" && !inSingle && !inDouble) {
        if (i + 1 === content.length || content[i + 1] === " ") {
          return true;
        }
      }
    }
    return false;
  }

  function parseMapping(ctx, baseIndent) {
    var obj = {};
    while (ctx.pos < ctx.lines.length) {
      skipBlanks(ctx);
      if (ctx.pos >= ctx.lines.length) { break; }
      var line = ctx.lines[ctx.pos];
      if (line.trimmed.trim() === "") { ctx.pos++; continue; }
      if (line.indent < baseIndent) { break; }
      if (line.indent !== baseIndent) { break; }

      var content = line.trimmed.trim();
      // must be a key: line
      if (!hasKeyColon(content)) { break; }

      var colonIdx = findKeyColon(content);
      var key = content.substring(0, colonIdx).trim();
      key = parseScalar(key);
      var valPart = content.substring(colonIdx + 1).trim();

      if (valPart === "" || valPart === "|" || valPart === ">" || valPart === "|-" || valPart === ">-") {
        ctx.pos++;
        if (valPart === "|" || valPart === "|-") {
          obj[key] = parseBlockScalar(ctx, baseIndent, valPart === "|-" ? "strip" : "clip");
        } else if (valPart === ">" || valPart === ">-") {
          obj[key] = parseFoldedScalar(ctx, baseIndent, valPart === ">-" ? "strip" : "clip");
        } else {
          obj[key] = parseNode(ctx, baseIndent);
        }
      } else if (valPart[0] === "{" || valPart[0] === "[") {
        obj[key] = parseFlow(valPart);
        ctx.pos++;
      } else {
        obj[key] = parseScalar(valPart);
        ctx.pos++;
      }
    }
    return obj;
  }

  function parseSequence(ctx, baseIndent) {
    var arr = [];
    while (ctx.pos < ctx.lines.length) {
      skipBlanks(ctx);
      if (ctx.pos >= ctx.lines.length) { break; }
      var line = ctx.lines[ctx.pos];
      if (line.trimmed.trim() === "") { ctx.pos++; continue; }
      if (line.indent < baseIndent) { break; }
      if (line.indent !== baseIndent) { break; }

      var content = line.trimmed.trim();
      if (content.indexOf("- ") !== 0 && content !== "-") { break; }

      var after = content === "-" ? "" : content.substring(2).trim();

      if (after === "" || after === "|" || after === ">" || after === "|-" || after === ">-") {
        ctx.pos++;
        if (after === "|" || after === "|-") {
          arr.push(parseBlockScalar(ctx, baseIndent, after === "|-" ? "strip" : "clip"));
        } else if (after === ">" || after === ">-") {
          arr.push(parseFoldedScalar(ctx, baseIndent, after === ">-" ? "strip" : "clip"));
        } else {
          arr.push(parseNode(ctx, baseIndent));
        }
      } else if (after[0] === "{" || after[0] === "[") {
        arr.push(parseFlow(after));
        ctx.pos++;
      } else if (hasKeyColon(after)) {
        // inline mapping start: - key: value
        // Rewrite the line to be indented as a mapping child
        var mapIndent = line.indent + 2;
        var origTrimmed = ctx.lines[ctx.pos].trimmed;
        ctx.lines[ctx.pos] = {
          raw: ctx.lines[ctx.pos].raw,
          trimmed: spaces(mapIndent) + after,
          indent: mapIndent
        };
        arr.push(parseMapping(ctx, mapIndent));
      } else {
        arr.push(parseScalar(after));
        ctx.pos++;
      }
    }
    return arr;
  }

  function parseBlockScalar(ctx, parentIndent, chomp) {
    var lines = [];
    var blockIndent = -1;
    while (ctx.pos < ctx.lines.length) {
      var line = ctx.lines[ctx.pos];
      var rawTrimmed = line.raw.trimEnd();
      if (rawTrimmed === "") {
        lines.push("");
        ctx.pos++;
        continue;
      }
      var ind = indentLevel(line.raw);
      if (blockIndent === -1) {
        if (ind <= parentIndent) { break; }
        blockIndent = ind;
      }
      if (ind < blockIndent) { break; }
      lines.push(line.raw.substring(blockIndent));
      ctx.pos++;
    }
    // Remove trailing blank lines for strip
    var result = lines.join("\n");
    if (chomp === "strip") {
      result = result.replace(/\n+$/, "");
    } else {
      // clip: single trailing newline
      result = result.replace(/\n+$/, "") + "\n";
    }
    return result;
  }

  function parseFoldedScalar(ctx, parentIndent, chomp) {
    var lines = [];
    var blockIndent = -1;
    while (ctx.pos < ctx.lines.length) {
      var line = ctx.lines[ctx.pos];
      var rawTrimmed = line.raw.trimEnd();
      if (rawTrimmed === "") {
        lines.push("");
        ctx.pos++;
        continue;
      }
      var ind = indentLevel(line.raw);
      if (blockIndent === -1) {
        if (ind <= parentIndent) { break; }
        blockIndent = ind;
      }
      if (ind < blockIndent) { break; }
      lines.push(line.raw.substring(blockIndent));
      ctx.pos++;
    }
    // Fold: join consecutive non-empty lines with spaces, blank lines become \n
    var result = "";
    for (var i = 0; i < lines.length; i++) {
      if (lines[i] === "") {
        result += "\n";
      } else {
        if (result.length > 0 && result[result.length - 1] !== "\n") {
          result += " ";
        }
        result += lines[i];
      }
    }
    if (chomp === "strip") {
      result = result.replace(/\n+$/, "").replace(/ +$/, "");
    } else {
      result = result.replace(/\n+$/, "") + "\n";
    }
    return result;
  }

  function findKeyColon(content) {
    var inSingle = false;
    var inDouble = false;
    for (var i = 0; i < content.length; i++) {
      var ch = content[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; }
      else if (ch === '"' && !inSingle) { inDouble = !inDouble; }
      else if (ch === ":" && !inSingle && !inDouble) {
        if (i + 1 === content.length || content[i + 1] === " ") {
          return i;
        }
      }
    }
    return -1;
  }

  function skipBlanks(ctx) {
    while (ctx.pos < ctx.lines.length && ctx.lines[ctx.pos].trimmed.trim() === "") {
      ctx.pos++;
    }
  }

  function spaces(n) {
    var s = "";
    for (var i = 0; i < n; i++) { s += " "; }
    return s;
  }

  // ── serializer ──────────────────────────────────────────────────────
  function stringify(obj, indent) {
    indent = indent || 2;
    return serializeValue(obj, 0, indent, true).replace(/\n+$/, "") + "\n";
  }

  function serializeValue(val, depth, indent, topLevel) {
    if (val === null || val === undefined) { return "null"; }
    if (typeof val === "boolean") { return val ? "true" : "false"; }
    if (typeof val === "number") { return String(val); }
    if (typeof val === "string") { return serializeString(val); }
    if (Array.isArray(val)) { return serializeArray(val, depth, indent); }
    if (typeof val === "object") { return serializeObject(val, depth, indent, topLevel); }
    return String(val);
  }

  function serializeString(s) {
    if (s === "") { return '""'; }
    if (s === "true" || s === "false" || s === "null" || s === "~" ||
        /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s) || s.indexOf(":") !== -1 ||
        s.indexOf("#") !== -1 || s.indexOf("\n") !== -1 ||
        s[0] === "{" || s[0] === "[" || s[0] === "'" || s[0] === '"' ||
        s[0] === " " || s[s.length - 1] === " " || s.indexOf("&") !== -1 ||
        s.indexOf("*") !== -1 || s.indexOf("!") !== -1 || s.indexOf("%") !== -1 ||
        s.indexOf("@") !== -1 || s.indexOf("`") !== -1 || s.indexOf(",") !== -1) {
      if (s.indexOf('"') === -1) {
        return '"' + s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n") + '"';
      }
      return "'" + s.replace(/'/g, "''") + "'";
    }
    return s;
  }

  function serializeArray(arr, depth, indent) {
    if (arr.length === 0) { return "[]"; }
    var lines = [];
    var prefix = spaces(depth * indent);
    for (var i = 0; i < arr.length; i++) {
      var val = arr[i];
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        var keys = Object.keys(val);
        if (keys.length > 0) {
          var first = true;
          for (var j = 0; j < keys.length; j++) {
            var sv = serializeValue(val[keys[j]], depth + 1, indent, false);
            if (first) {
              if (isScalar(val[keys[j]])) {
                lines.push(prefix + "- " + serializeString(String(keys[j])) + ": " + sv);
              } else {
                lines.push(prefix + "- " + serializeString(String(keys[j])) + ":");
                lines.push(sv);
              }
              first = false;
            } else {
              if (isScalar(val[keys[j]])) {
                lines.push(prefix + "  " + serializeString(String(keys[j])) + ": " + sv);
              } else {
                lines.push(prefix + "  " + serializeString(String(keys[j])) + ":");
                lines.push(sv);
              }
            }
          }
          continue;
        }
      }
      var serialized = serializeValue(val, depth + 1, indent, false);
      if (isScalar(val)) {
        lines.push(prefix + "- " + serialized);
      } else {
        lines.push(prefix + "-");
        lines.push(serialized);
      }
    }
    return lines.join("\n");
  }

  function serializeObject(obj, depth, indent, topLevel) {
    var keys = Object.keys(obj);
    if (keys.length === 0) { return "{}"; }
    var lines = [];
    var prefix = spaces(depth * indent);
    for (var i = 0; i < keys.length; i++) {
      var val = obj[keys[i]];
      var sv = serializeValue(val, depth + 1, indent, false);
      if (isScalar(val)) {
        lines.push(prefix + serializeString(keys[i]) + ": " + sv);
      } else {
        lines.push(prefix + serializeString(keys[i]) + ":");
        lines.push(sv);
      }
    }
    return lines.join("\n");
  }

  function isScalar(val) {
    return val === null || val === undefined || typeof val !== "object";
  }

  return { parse: parse, stringify: stringify };
})();
