import { z } from "zod";

export const createSpaceRequestSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  description: z.string().optional(),
});

export type ParsedCreateSpaceRequest = z.infer<typeof createSpaceRequestSchema>;

export const spaceIdParamSchema = z.string().uuid();

export type ParseSpaceIdResult =
  | { ok: true; spaceId: string }
  | { ok: false };

export async function parseSpaceIdParam(
  params: Promise<{ space_id: string }>,
): Promise<ParseSpaceIdResult> {
  const { space_id } = await params;
  const parsed = spaceIdParamSchema.safeParse(space_id);
  if (!parsed.success) return { ok: false };
  return { ok: true, spaceId: parsed.data };
}
