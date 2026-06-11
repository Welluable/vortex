import type { Job } from "@/types/jobs";
import type { UploadSourceResponse } from "@/types/sources";

export function uploadSourceWithProgress(
  spaceId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<UploadSourceResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/spaces/${spaceId}/sources`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 202) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadSourceResponse);
        } catch {
          reject(new Error("Invalid response"));
        }
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText) as { error?: { message?: string } };
        reject(new Error(body.error?.message ?? `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

export async function pollJobUntilTerminal(
  jobId: string,
  intervalMs = 1000,
): Promise<Job> {
  for (;;) {
    const res = await fetch(`/api/jobs/${jobId}`);
    const job = (await res.json()) as Job;
    if (job.status === "complete" || job.status === "failed") {
      return job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
