import { LlmConfigError } from "@/lib/ingest/errors";

export type LlmConfig = {
  apiKey: string;
  baseUrl?: string;
  modelId: string;
};

export function loadLlmConfig(): LlmConfig {
  if (process.env.INGEST_STRUCTURE_MOCK === "1") {
    return { apiKey: "", modelId: "mock" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const modelId = process.env.VORTEX_LLM_MODEL;

  if (!modelId) {
    throw new LlmConfigError("VORTEX_LLM_MODEL is required when INGEST_STRUCTURE_MOCK is not set");
  }
  if (!apiKey) {
    throw new LlmConfigError("OPENAI_API_KEY is required when INGEST_STRUCTURE_MOCK is not set");
  }

  const baseUrl = process.env.OPENAI_BASE_URL;
  return baseUrl ? { apiKey, baseUrl, modelId } : { apiKey, modelId };
}
