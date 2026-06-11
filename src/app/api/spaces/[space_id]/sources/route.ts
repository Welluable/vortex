import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { createRequestLog } from "@/lib/api/request-log";
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
  const log = createRequestLog("POST /sources");
  log.step("handler entered");

  const parsedId = await parseSpaceIdParam(params);
  log.step("params parsed", { ok: parsedId.ok });
  if (!parsedId.ok) {
    log.done(404);
    return NextResponse.json(toErrorResponse("not_found", "Space not found"), {
      status: 404,
    });
  }

  const space = spacesStore.getSpace(parsedId.spaceId);
  log.step("space lookup", { spaceId: parsedId.spaceId, found: Boolean(space) });
  if (!space) {
    log.done(404);
    return NextResponse.json(toErrorResponse("not_found", "Space not found"), {
      status: 404,
    });
  }

  log.step("awaiting formData (client upload + multipart parse)");
  const form = await request.formData();
  log.step("formData ready");

  const file = form.get("file");
  if (!(file instanceof File)) {
    log.done(400, { reason: "missing file" });
    return NextResponse.json(
      toErrorResponse("validation_error", "file is required"),
      { status: 400 },
    );
  }

  log.step("file received", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  const validation = validateUploadFile({
    type: file.type,
    size: file.size,
    name: file.name,
  });
  if (!validation.ok) {
    log.done(400, { reason: validation.message });
    return NextResponse.json(
      toErrorResponse("validation_error", validation.message),
      { status: 400 },
    );
  }

  log.step("validation passed, starting uploadSource");
  const result = await sourcesStore.uploadSource(parsedId.spaceId, file, log);
  ensureRunnerStarted();
  log.done(202, {
    sourceId: result.source.id,
    jobId: result.job_id,
    ingestRunId: result.ingest_run_id,
  });
  return NextResponse.json(result, { status: 202 });
}
