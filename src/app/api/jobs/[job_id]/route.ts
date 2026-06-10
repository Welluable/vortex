import { NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/api/errors";
import { ensureRunnerStarted } from "@/lib/jobs/runner";
import { jobsStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ job_id: string }> },
) {
  const { job_id } = await params;
  if (!z.string().uuid().safeParse(job_id).success) {
    return NextResponse.json(toErrorResponse("not_found", "Job not found"), {
      status: 404,
    });
  }
  ensureRunnerStarted();
  const job = jobsStore.getJob(job_id);
  if (!job) {
    return NextResponse.json(toErrorResponse("not_found", "Job not found"), {
      status: 404,
    });
  }
  return NextResponse.json(job);
}
