import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const dest = path.join(webRoot, "data", "unis.db");
const source = path.join(webRoot, "..", "data", "unis.db");

if (fs.existsSync(dest)) {
  process.exit(0);
}

if (!fs.existsSync(source)) {
  console.error("Missing database: expected web/data/unis.db or ../data/unis.db");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(source, dest);
console.log(`Copied ${source} -> ${dest}`);
