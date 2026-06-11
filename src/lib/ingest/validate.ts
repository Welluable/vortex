import { InvalidExtractionError } from "./errors";
import type { Extraction } from "./schemas/extraction";

export function validateExtractionCitations(
  extraction: Extraction,
  chunkIds: Set<string>,
): void {
  const cited = [
    ...extraction.mentions.map((m) => m.chunk_id),
    ...extraction.candidate_facts.map((f) => f.chunk_id),
    ...extraction.decision_candidates.map((d) => d.chunk_id),
  ];
  const offenders = [...new Set(cited.filter((id) => !chunkIds.has(id)))];
  if (offenders.length) throw new InvalidExtractionError(offenders);
}
