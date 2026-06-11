import { createOpenAI } from "@ai-sdk/openai";
import type { LlmConfig } from "./config";

export function createOpenAiProvider(config: LlmConfig) {
  if (config.modelId === "mock") {
    throw new Error("createOpenAiProvider called with mock config");
  }
  return createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  }).languageModel(config.modelId);
}
