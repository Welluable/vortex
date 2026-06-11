import { NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/api/errors";
import { createRequestLog } from "@/lib/api/request-log";
import { ensureRunnerStarted } from "@/lib/jobs/runner";
import { jobsStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ job_id: string }> },
) {
  const log = createRequestLog("GET /jobs");
  log.step("handler entered");

  const { job_id } = await params;
  log.step("params parsed", { jobId: job_id });
  if (!z.string().uuid().safeParse(job_id).success) {
    log.done(404, { reason: "invalid job id" });
    return NextResponse.json(toErrorResponse("not_found", "Job not found"), {
      status: 404,
    });
  }

  ensureRunnerStarted();
  log.step("runner ensured, fetching job");
  const job = jobsStore.getJob(job_id);
  if (!job) {
    log.done(404, { reason: "job not found" });
    return NextResponse.json(toErrorResponse("not_found", "Job not found"), {
      status: 404,
    });
  }

  log.done(200, { jobId: job.id, status: job.status });
  return NextResponse.json(job);
}
