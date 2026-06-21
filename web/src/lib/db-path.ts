import fs from "fs";
import path from "path";

const candidates = [
  path.join(process.cwd(), "data", "unis.db"),
  path.join(process.cwd(), "..", "data", "unis.db"),
];

const DB_PATH = candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];

export default DB_PATH;
