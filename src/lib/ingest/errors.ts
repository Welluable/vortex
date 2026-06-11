export class TextTooLargeError extends Error {
  constructor(public charLength: number) {
    super(`extracted text exceeds 48,000 character limit (got ${charLength})`);
    this.name = "TextTooLargeError";
  }
}

export class InvalidExtractionError extends Error {
  constructor(public invalidChunkIds: string[]) {
    super(`invalid chunk_id citations: ${invalidChunkIds.join(", ")}`);
    this.name = "InvalidExtractionError";
  }
}

export class LlmConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmConfigError";
  }
}
