import { randomUUID } from "node:crypto";
import { chunks } from "@/db/schema/chunks";
import type { ChunkRecord, IngestPipelineCtx } from "./types";

export type ChunkSpan = {
  content: string;
  char_start: number;
  char_end: number;
};

function getParagraphSpans(text: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  const re = /\n\n+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ start: lastIndex, end: match.index });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    spans.push({ start: lastIndex, end: text.length });
  }
  return spans;
}

export function chunkParagraphs(
  text: string,
  opts: { targetSize?: number; overlap?: number } = {},
): ChunkSpan[] {
  const targetSize = opts.targetSize ?? 3000;
  const overlap = opts.overlap ?? 200;
  const paragraphs = getParagraphSpans(text);
  if (paragraphs.length === 0) return [];

  const result: ChunkSpan[] = [];
  let paraIdx = 0;
  let nextStart: number | null = null;

  while (paraIdx < paragraphs.length) {
    const chunkStart = nextStart ?? paragraphs[paraIdx].start;
    let chunkEnd = paragraphs[paraIdx].end;
    if (nextStart === null) paraIdx++;

    while (paraIdx < paragraphs.length) {
      const candidateEnd = paragraphs[paraIdx].end;
      if (text.slice(chunkStart, candidateEnd).length > targetSize && chunkEnd > chunkStart) {
        break;
      }
      chunkEnd = candidateEnd;
      paraIdx++;
    }

    result.push({
      content: text.slice(chunkStart, chunkEnd),
      char_start: chunkStart,
      char_end: chunkEnd,
    });

    if (paraIdx < paragraphs.length) {
      nextStart = Math.max(0, chunkEnd - overlap);
      while (paraIdx < paragraphs.length && paragraphs[paraIdx].end <= nextStart) {
        paraIdx++;
      }
    } else {
      nextStart = null;
    }
  }

  return result;
}

export async function persistChunks(
  ctx: IngestPipelineCtx,
  spans: ChunkSpan[],
): Promise<ChunkRecord[]> {
  const now = Date.now();
  const rows: ChunkRecord[] = spans.map((span, ordinal) => ({
    id: randomUUID(),
    space_id: ctx.spaceId,
    source_id: ctx.sourceId,
    ingest_run_id: ctx.ingestRunId,
    ordinal,
    page: null,
    char_start: span.char_start,
    char_end: span.char_end,
    content: span.content,
    token_count: null,
    created_at: now,
  }));

  if (rows.length > 0) {
    ctx.db.insert(chunks).values(rows).run();
  }

  return rows;
}
