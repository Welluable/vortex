import { NextResponse } from "next/server";
import { resetSourcesForTest } from "@/lib/sources/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await request.json()) as { action?: string };
  if (body.action === "reset") {
    resetSourcesForTest();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
