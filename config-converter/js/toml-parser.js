/**
 * Lightweight TOML parser and serializer.
 * Handles: key/value pairs, tables, arrays of tables, inline tables/arrays,
 * basic/literal strings, multiline strings, integers, floats, booleans, dates.
 */
var TOML = (function () {
  "use strict";

  // ── parser ──────────────────────────────────────────────────────────
  function parse(text) {
    if (typeof text !== "string") {
      throw new Error("TOML.parse expects a string");
    }
    var result = {};
    var lines = text.split("\n");
    var current = result;
    var currentPath = [];
    var arrayTables = {}; // track paths that are arrays of tables

    for (var i = 0; i < lines.length; i++) {
      var line = stripComment(lines[i]).trim();
      if (line === "") { continue; }

      // Array of tables: [[path]]
      if (line.indexOf("[[") === 0 && line.lastIndexOf("]]") === line.length - 2) {
        var arrPath = line.substring(2, line.length - 2).trim();
        var arrKeys = parsePath(arrPath);
        var pathStr = arrKeys.join(".");
        arrayTables[pathStr] = true;
        current = ensureArrayTable(result, arrKeys);
        currentPath = arrKeys;
        continue;
      }

      // Table: [path]
      if (line[0] === "[" && line[line.length - 1] === "]") {
        var tablePath = line.substring(1, line.length - 1).trim();
        var tableKeys = parsePath(tablePath);
        current = ensureTable(result, tableKeys, arrayTables);
        currentPath = tableKeys;
        continue;
      }

      // Key = Value
      var eqIdx = findEquals(line);
      if (eqIdx === -1) {
        throw new Error("Invalid TOML at line " + (i + 1) + ": " + line);
      }
      var key = line.substring(0, eqIdx).trim();
      var valStr = line.substring(eqIdx + 1).trim();

      // Handle multiline basic strings
      if (valStr.indexOf('"""') === 0) {
        if (valStr.length > 3 && valStr.lastIndexOf('"""') > 0 && valStr.lastIndexOf('"""') === valStr.length - 3) {
          // Single line triple-quoted
          var inner = valStr.substring(3, valStr.length - 3);
          setNestedKey(current, parsePath(key), inner);
        } else {
          var mlLines = [valStr.substring(3)];
          while (++i < lines.length) {
            var mlLine = lines[i];
            var endIdx = mlLine.indexOf('"""');
            if (endIdx !== -1) {
              mlLines.push(mlLine.substring(0, endIdx));
              break;
            }
            mlLines.push(mlLine);
          }
          var mlResult = mlLines.join("\n");
          if (mlResult[0] === "\n") { mlResult = mlResult.substring(1); }
          setNestedKey(current, parsePath(key), mlResult);
        }
        continue;
      }

      // Handle multiline literal strings
      if (valStr.indexOf("'''") === 0) {
        if (valStr.length > 3 && valStr.lastIndexOf("'''") > 0 && valStr.lastIndexOf("'''") === valStr.length - 3) {
          var litInner = valStr.substring(3, valStr.length - 3);
          setNestedKey(current, parsePath(key), litInner);
        } else {
          var litLines = [valStr.substring(3)];
          while (++i < lines.length) {
            var litLine = lines[i];
            var litEnd = litLine.indexOf("'''");
            if (litEnd !== -1) {
              litLines.push(litLine.substring(0, litEnd));
              break;
            }
            litLines.push(litLine);
          }
          var litResult = litLines.join("\n");
          if (litResult[0] === "\n") { litResult = litResult.substring(1); }
          setNestedKey(current, parsePath(key), litResult);
        }
        continue;
      }

      var parsedVal = parseValue(valStr);
      setNestedKey(current, parsePath(key), parsedVal);
    }

    return result;
  }

  function stripComment(line) {
    var inBasic = false;
    var inLiteral = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"' && !inLiteral) { inBasic = !inBasic; }
      else if (ch === "'" && !inBasic) { inLiteral = !inLiteral; }
      else if (ch === "#" && !inBasic && !inLiteral) {
        return line.substring(0, i);
      }
    }
    return line;
  }

  function parsePath(path) {
    var keys = [];
    var current = "";
    var inQuote = false;
    var quoteChar = "";
    for (var i = 0; i < path.length; i++) {
      var ch = path[i];
      if (inQuote) {
        if (ch === quoteChar) { inQuote = false; }
        else { current += ch; }
      } else if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === ".") {
        keys.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim() !== "") { keys.push(current.trim()); }
    return keys;
  }

  function findEquals(line) {
    var inQuote = false;
    var quoteChar = "";
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuote) {
        if (ch === quoteChar) { inQuote = false; }
      } else if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === "=") {
        return i;
      }
    }
    return -1;
  }

  function parseValue(str) {
    str = str.trim();
    if (str === "true") { return true; }
    if (str === "false") { return false; }

    // String
    if (str[0] === '"' && str[str.length - 1] === '"') {
      return str.substring(1, str.length - 1)
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\")
        .replace(/\\"/g, '"');
    }
    if (str[0] === "'" && str[str.length - 1] === "'") {
      return str.substring(1, str.length - 1);
    }

    // Array
    if (str[0] === "[") {
      return parseInlineArray(str);
    }

    // Inline table
    if (str[0] === "{") {
      return parseInlineTable(str);
    }

    // Date/datetime (basic detection)
    if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(str)) {
      return str;
    }

    // Number
    if (/^[+-]?(\d+_)*\d+$/.test(str)) {
      return parseInt(str.replace(/_/g, ""), 10);
    }
    if (/^[+-]?(\d+_)*\d+\.(\d+_)*\d+([eE][+-]?\d+)?$/.test(str)) {
      return parseFloat(str.replace(/_/g, ""));
    }
    if (/^[+-]?\d+[eE][+-]?\d+$/.test(str)) {
      return parseFloat(str);
    }
    if (str === "inf" || str === "+inf") { return Infinity; }
    if (str === "-inf") { return -Infinity; }
    if (str === "nan" || str === "+nan" || str === "-nan") { return NaN; }

    return str;
  }

  function parseInlineArray(str) {
    var inner = str.substring(1, str.length - 1).trim();
    if (inner === "") { return []; }
    var items = splitTopLevel(inner, ",");
    var arr = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i].trim();
      if (item === "") { continue; }
      arr.push(parseValue(item));
    }
    return arr;
  }

  function parseInlineTable(str) {
    var inner = str.substring(1, str.length - 1).trim();
    if (inner === "") { return {}; }
    var items = splitTopLevel(inner, ",");
    var obj = {};
    for (var i = 0; i < items.length; i++) {
      var item = items[i].trim();
      if (item === "") { continue; }
      var eq = findEquals(item);
      if (eq === -1) { continue; }
      var k = item.substring(0, eq).trim();
      var v = item.substring(eq + 1).trim();
      obj[k] = parseValue(v);
    }
    return obj;
  }

  function splitTopLevel(str, delim) {
    var parts = [];
    var depth = 0;
    var inStr = false;
    var strChar = "";
    var start = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (inStr) {
        if (ch === strChar && str[i - 1] !== "\\") { inStr = false; }
      } else if (ch === '"' || ch === "'") {
        inStr = true;
        strChar = ch;
      } else if (ch === "[" || ch === "{") {
        depth++;
      } else if (ch === "]" || ch === "}") {
        depth--;
      } else if (ch === delim && depth === 0) {
        parts.push(str.substring(start, i));
        start = i + 1;
      }
    }
    parts.push(str.substring(start));
    return parts;
  }

  function ensureTable(root, keys, arrayTables) {
    var obj = root;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var subPath = keys.slice(0, i + 1).join(".");
      if (obj[k] === undefined) {
        obj[k] = {};
      }
      if (Array.isArray(obj[k])) {
        obj = obj[k][obj[k].length - 1];
      } else {
        obj = obj[k];
      }
    }
    return obj;
  }

  function ensureArrayTable(root, keys) {
    var obj = root;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = keys[i];
      if (obj[k] === undefined) { obj[k] = {}; }
      if (Array.isArray(obj[k])) {
        obj = obj[k][obj[k].length - 1];
      } else {
        obj = obj[k];
      }
    }
    var lastKey = keys[keys.length - 1];
    if (obj[lastKey] === undefined) {
      obj[lastKey] = [];
    }
    var newEntry = {};
    obj[lastKey].push(newEntry);
    return newEntry;
  }

  function setNestedKey(obj, keys, value) {
    for (var i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] === undefined) { obj[keys[i]] = {}; }
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }

  // ── serializer ──────────────────────────────────────────────────────
  function stringify(obj) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      throw new Error("TOML.stringify expects an object");
    }
    var lines = [];
    serializeTable(obj, [], lines);
    return lines.join("\n") + "\n";
  }

  function serializeTable(obj, path, lines) {
    var keys = Object.keys(obj);
    var simpleKeys = [];
    var tableKeys = [];
    var arrayTableKeys = [];

    for (var i = 0; i < keys.length; i++) {
      var val = obj[keys[i]];
      if (val === null || val === undefined || typeof val !== "object") {
        simpleKeys.push(keys[i]);
      } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && !Array.isArray(val[0])) {
        arrayTableKeys.push(keys[i]);
      } else if (Array.isArray(val)) {
        simpleKeys.push(keys[i]);
      } else {
        tableKeys.push(keys[i]);
      }
    }

    // Write simple key/values
    for (var j = 0; j < simpleKeys.length; j++) {
      var k = simpleKeys[j];
      lines.push(serializeKey(k) + " = " + serializeVal(obj[k]));
    }

    // Write sub-tables
    for (var t = 0; t < tableKeys.length; t++) {
      var tk = tableKeys[t];
      var subPath = path.concat([tk]);
      if (lines.length > 0) { lines.push(""); }
      lines.push("[" + subPath.map(serializeKey).join(".") + "]");
      serializeTable(obj[tk], subPath, lines);
    }

    // Write array of tables
    for (var a = 0; a < arrayTableKeys.length; a++) {
      var ak = arrayTableKeys[a];
      var arrPath = path.concat([ak]);
      var arr = obj[ak];
      for (var ai = 0; ai < arr.length; ai++) {
        if (lines.length > 0) { lines.push(""); }
        lines.push("[[" + arrPath.map(serializeKey).join(".") + "]]");
        serializeTable(arr[ai], arrPath, lines);
      }
    }
  }

  function serializeKey(key) {
    if (/^[a-zA-Z0-9_-]+$/.test(key)) { return key; }
    return '"' + escapeString(key) + '"';
  }

  function serializeVal(val) {
    if (val === null || val === undefined) { return '""'; }
    if (typeof val === "boolean") { return val ? "true" : "false"; }
    if (typeof val === "number") {
      if (Number.isInteger(val)) { return String(val); }
      return String(val);
    }
    if (typeof val === "string") {
      // Check if it looks like a date
      if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(val)) {
        return val;
      }
      return '"' + escapeString(val) + '"';
    }
    if (Array.isArray(val)) {
      var items = [];
      for (var i = 0; i < val.length; i++) {
        items.push(serializeVal(val[i]));
      }
      return "[" + items.join(", ") + "]";
    }
    if (typeof val === "object") {
      var pairs = [];
      var keys = Object.keys(val);
      for (var j = 0; j < keys.length; j++) {
        pairs.push(serializeKey(keys[j]) + " = " + serializeVal(val[keys[j]]));
      }
      return "{" + pairs.join(", ") + "}";
    }
    return String(val);
  }

  function escapeString(s) {
    return s.replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t")
            .replace(/\r/g, "\\r");
  }

  return { parse: parse, stringify: stringify };
})();
