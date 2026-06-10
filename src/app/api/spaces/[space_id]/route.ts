import { NextResponse } from "next/server";
import { SpaceConflictError, toErrorResponse } from "@/lib/spaces/errors";
import {
  parseSpaceIdParam,
  updateSpaceRequestSchema,
} from "@/lib/spaces/schemas";
import { spacesStore } from "@/lib/spaces/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ space_id: string }> },
) {
  const parsedId = await parseSpaceIdParam(params);
  if (!parsedId.ok) {
    return NextResponse.json(
      toErrorResponse("not_found", "Space not found"),
      { status: 404 },
    );
  }
  const detail = spacesStore.getSpaceDetail(parsedId.spaceId);
  if (!detail) {
    return NextResponse.json(
      toErrorResponse("not_found", "Space not found"),
      { status: 404 },
    );
  }
  return NextResponse.json(detail);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ space_id: string }> },
) {
  const parsedId = await parseSpaceIdParam(params);
  if (!parsedId.ok) {
    return NextResponse.json(
      toErrorResponse("not_found", "Space not found"),
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      toErrorResponse("validation_error", "Invalid JSON body"),
      { status: 400 },
    );
  }

  const parsed = updateSpaceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      toErrorResponse(
        "validation_error",
        parsed.error.errors[0]?.message ?? "validation failed",
        { issues: parsed.error.flatten() },
      ),
      { status: 400 },
    );
  }

  try {
    const space = spacesStore.updateSpace(parsedId.spaceId, parsed.data);
    if (!space) {
      return NextResponse.json(
        toErrorResponse("not_found", "Space not found"),
        { status: 404 },
      );
    }
    return NextResponse.json(space);
  } catch (err) {
    if (err instanceof SpaceConflictError) {
      return NextResponse.json(toErrorResponse("conflict", err.message), {
        status: 409,
      });
    }
    throw err;
  }
}
