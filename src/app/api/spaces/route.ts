import { NextResponse } from "next/server";
import { spacesStore } from "@/lib/mock/spaces-store";
import type { CreateSpaceRequest } from "@/types/spaces";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");
  return NextResponse.json(spacesStore.listSpaces(limit, offset));
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSpaceRequest;
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const space = spacesStore.createSpace({ name, description: body.description });
  return NextResponse.json(space, { status: 201 });
}
