import { NextResponse } from "next/server";
import { SpaceConflictError, toErrorResponse } from "@/lib/spaces/errors";
import { createSpaceRequestSchema } from "@/lib/spaces/schemas";
import { spacesStore } from "@/lib/spaces/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");
  return NextResponse.json(spacesStore.listSpaces(limit, offset));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      toErrorResponse("validation_error", "Invalid JSON body"),
      { status: 400 },
    );
  }
  const parsed = createSpaceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      toErrorResponse("validation_error", parsed.error.errors[0]?.message ?? "validation failed", {
        issues: parsed.error.flatten(),
      }),
      { status: 400 },
    );
  }
  try {
    const space = spacesStore.createSpace(parsed.data);
    return NextResponse.json(space, { status: 201 });
  } catch (err) {
    if (err instanceof SpaceConflictError) {
      return NextResponse.json(toErrorResponse("conflict", err.message), { status: 409 });
    }
    throw err;
  }
}
