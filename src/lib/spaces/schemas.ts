import { z } from "zod";

export const createSpaceRequestSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  description: z.string().optional(),
});

export type ParsedCreateSpaceRequest = z.infer<typeof createSpaceRequestSchema>;
