You are structuring a source document for a knowledge graph ingest pipeline.

Source filename: {{filename}}

The following text chunks are the only valid citation targets. Each chunk has an `id` you must use in `chunk_id` fields.

{{chunks}}

Return structured JSON with:
- `summary`: 2–8 sentence overview of the source
- `mentions`: notable entities or concepts with `text`, `suggested_type`, `chunk_id`, `confidence` (0–1)
- `candidate_facts`: subject–predicate–value facts with exactly one of `value_text`, `value_number`, or `value_date`
- `decision_candidates`: decisions with `title`, `body`, `chunk_id`, `entity_mentions`, `confidence` (0–1)

Rules:
- Cite only `chunk_id` values from the chunks above
- Use confidence scores between 0 and 1
- Prefer recall over precision for mentions
- Do not include link_proposals
