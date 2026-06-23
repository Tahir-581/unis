import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const dest = path.join(webRoot, "data", "unis.db");
const source = path.join(webRoot, "..", "data", "unis.db");

if (!fs.existsSync(source)) {
  if (!fs.existsSync(dest)) {
    console.error("Missing database: expected web/data/unis.db or ../data/unis.db");
    process.exit(1);
  }
  process.exit(0);
}

const sourceStat = fs.statSync(source);
const destStat = fs.existsSync(dest) ? fs.statSync(dest) : null;
const needsCopy =
  !destStat ||
  destStat.mtimeMs < sourceStat.mtimeMs ||
  destStat.size !== sourceStat.size;

if (needsCopy) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  console.log(`Synced ${source} -> ${dest}`);
}
