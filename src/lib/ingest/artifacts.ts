import fs from "node:fs";
import path from "node:path";
import type { Extraction } from "./schemas/extraction";

export function writeExtraction(dataDir: string, absPath: string, extraction: Extraction): void {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, JSON.stringify(extraction, null, 2), "utf8");
}

export function writeSummary(dataDir: string, absPath: string, summary: string): void {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, `# Source summary\n\n${summary}`, "utf8");
}
