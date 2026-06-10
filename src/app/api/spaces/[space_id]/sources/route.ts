import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { ensureRunnerStarted } from "@/lib/jobs/runner";
import { parseSpaceIdParam } from "@/lib/spaces/schemas";
import { spacesStore } from "@/lib/spaces/store";
import { sourcesStore } from "@/lib/sources/store";
import { validateUploadFile } from "@/lib/sources/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ space_id: string }> },
) {
  const parsedId = await parseSpaceIdParam(params);
  if (!parsedId.ok) {
    return NextResponse.json(toErrorResponse("not_found", "Space not found"), {
      status: 404,
    });
  }
  if (!spacesStore.getSpace(parsedId.spaceId)) {
    return NextResponse.json(toErrorResponse("not_found", "Space not found"), {
      status: 404,
    });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      toErrorResponse("validation_error", "file is required"),
      { status: 400 },
    );
  }

  const validation = validateUploadFile({
    type: file.type,
    size: file.size,
    name: file.name,
  });
  if (!validation.ok) {
    return NextResponse.json(
      toErrorResponse("validation_error", validation.message),
      { status: 400 },
    );
  }

  const result = await sourcesStore.uploadSource(parsedId.spaceId, file);
  ensureRunnerStarted();
  return NextResponse.json(result, { status: 202 });
}
