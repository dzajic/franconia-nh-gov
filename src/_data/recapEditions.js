import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "recaps");

let editions = [];
try {
  editions = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")));
} catch {
  editions = [];
}

editions.sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.edition) - Number(a.edition));

export default editions;
