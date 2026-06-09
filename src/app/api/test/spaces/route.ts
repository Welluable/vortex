import { NextResponse } from "next/server";
import {
  resetSpacesForTest,
  restoreSeedSpacesForTest,
} from "@/lib/spaces/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await request.json()) as { action?: string };
  if (body.action === "reset") {
    resetSpacesForTest();
    return NextResponse.json({ ok: true });
  }
  if (body.action === "restore") {
    restoreSeedSpacesForTest();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
