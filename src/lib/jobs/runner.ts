import { handleIngestSource } from "@/lib/jobs/handlers/ingest-source";
import { jobsStore } from "@/lib/jobs/store";

let started = false;
let ticking = false;

export function ensureRunnerStarted(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    void tickRunner();
  }, 500);
}

export async function tickRunner(): Promise<void> {
  if (ticking) return;
  ticking = true;
  try {
    const job = jobsStore.claimNextPending(Date.now());
    if (!job) return;
    jobsStore.markRunning(job.id, Date.now());
    if (job.job_type === "ingest_source") {
      try {
        await handleIngestSource(job);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        jobsStore.markFailed(job.id, Date.now(), message);
      }
    } else {
      jobsStore.markFailed(job.id, Date.now(), "unknown job_type");
    }
  } finally {
    ticking = false;
  }
}
