import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const skip = new Set(["node_modules", ".git", "dist", ".next", ".turbo", ".scout-data"]);
const exts = new Set([".json", ".ts", ".tsx", ".js", ".mjs", ".md", ".css"]);

let fixed = 0;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (exts.has(path.extname(ent.name))) {
      const buf = fs.readFileSync(p);
      const isUtf16 =
        buf.length > 2 &&
        ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] < 0x80 && buf[1] === 0));
      if (isUtf16) {
        const text =
          buf[0] === 0xff ? buf.toString("utf16le").slice(1) : buf.toString("utf16le");
        fs.writeFileSync(p, text.replace(/^\uFEFF/, ""), "utf8");
        fixed++;
        console.log("fixed", p);
      }
    }
  }
}

walk(root);
console.log(`total fixed: ${fixed}`);
