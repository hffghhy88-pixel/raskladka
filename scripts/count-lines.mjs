import fs from "node:fs";
import path from "node:path";

const roots = ["src", "electron", "rust/src", "rust/tests", "scripts"];
const allow = new Set([".ts", ".tsx", ".rs", ".css", ".mjs"]);
const skipDir = new Set(["node_modules", "target", "dist", "dist-electron"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDir.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (allow.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

let total = 0;
const rows = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/).length;
    total += lines;
    rows.push({ file, lines });
  }
}
rows.sort((a, b) => b.lines - a.lines);
for (const row of rows) {
  console.log(`${String(row.lines).padStart(5)}  ${row.file}`);
}
console.log(`TOTAL ${total}`);
