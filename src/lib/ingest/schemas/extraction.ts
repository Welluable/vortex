import { z } from "zod";

const mentionSchema = z.object({
  text: z.string(),
  suggested_type: z.string(),
  chunk_id: z.string(),
  confidence: z.number().min(0).max(1),
});

const candidateFactSchema = z
  .object({
    subject_mention: z.string(),
    predicate: z.string(),
    value_text: z.string().optional(),
    value_number: z.number().optional(),
    value_date: z.string().optional(),
    chunk_id: z.string(),
    confidence: z.number().min(0).max(1),
  })
  .refine(
    (fact) => {
      const valueFields = [fact.value_text, fact.value_number, fact.value_date].filter(
        (v) => v !== undefined,
      );
      return valueFields.length === 1;
    },
    { message: "candidate_facts must have exactly one value field" },
  );

const decisionCandidateSchema = z.object({
  title: z.string(),
  body: z.string(),
  chunk_id: z.string(),
  entity_mentions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const extractionSchema = z.object({
  summary: z.string(),
  mentions: z.array(mentionSchema),
  candidate_facts: z.array(candidateFactSchema),
  decision_candidates: z.array(decisionCandidateSchema),
});

export type Extraction = z.infer<typeof extractionSchema>;
