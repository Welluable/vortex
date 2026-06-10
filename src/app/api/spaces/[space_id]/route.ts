import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/spaces/errors";
import { parseSpaceIdParam } from "@/lib/spaces/schemas";
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
