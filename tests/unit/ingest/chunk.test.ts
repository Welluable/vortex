import { chunkParagraphs } from "@/lib/ingest/chunk";
import { describe, expect, it } from "vitest";

describe("chunkParagraphs", () => {
  it("returns empty array for empty text", () => {
    expect(chunkParagraphs("")).toEqual([]);
  });

  it("assigns monotonic ordinals via char ranges", () => {
    const paragraphs = Array.from({ length: 5 }, (_, i) => `Paragraph ${i + 1}. `.repeat(80));
    const text = paragraphs.join("\n\n");
    const chunks = chunkParagraphs(text, { targetSize: 3000, overlap: 200 });

    expect(chunks.length).toBeGreaterThan(1);
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].char_end).toBeGreaterThan(chunks[i].char_start);
      expect(chunks[i].content).toBe(text.slice(chunks[i].char_start, chunks[i].char_end));
      if (i > 0) {
        expect(chunks[i].char_start).toBeLessThan(chunks[i - 1].char_end);
      }
    }
  });

  it("respects paragraph boundaries and approximate target size", () => {
    const text = `${"a".repeat(1500)}\n\n${"b".repeat(1500)}\n\n${"c".repeat(1500)}`;
    const chunks = chunkParagraphs(text, { targetSize: 3000, overlap: 200 });

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(3200);
    }
  });

  it("preserves overlap continuity between chunks", () => {
    const text = Array.from({ length: 8 }, (_, i) => `Block ${i}: ${"word ".repeat(200)}`).join("\n\n");
    const chunks = chunkParagraphs(text, { targetSize: 3000, overlap: 200 });

    for (let i = 1; i < chunks.length; i++) {
      const prevTail = chunks[i - 1].content.slice(-200);
      expect(chunks[i].content.startsWith(prevTail)).toBe(true);
    }
  });
});
