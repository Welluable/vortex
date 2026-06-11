import fs from "node:fs";
import { originalPath } from "@/lib/sources/paths";
import { TextTooLargeError } from "./errors";
import type { ExtractResult, IngestPipelineCtx } from "./types";

export async function readSourceText(ctx: IngestPipelineCtx): Promise<ExtractResult> {
  const filePath = originalPath(ctx.dataDir, ctx.spaceId, ctx.sourceId, ctx.assetExt);
  let text: string;
  try {
    text = await fs.promises.readFile(filePath, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`failed to read source file as UTF-8: ${message}`);
  }
  return { text, charLength: text.length };
}

export function assertWithinCharLimit(text: string, max = 48_000): void {
  if (text.length > max) throw new TextTooLargeError(text.length);
}
