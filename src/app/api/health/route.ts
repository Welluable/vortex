import { NextResponse } from "next/server";
import { pingDatabase } from "@/db";
import type { HealthResponse } from "@/types/health";

export const runtime = "nodejs";

export async function GET() {
  const { dataDir } = pingDatabase();
  return NextResponse.json<HealthResponse>({
    status: "ok",
    data_dir: dataDir,
    db: "connected",
  });
}
