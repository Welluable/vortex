"use client";

import { useCallback, useState } from "react";
import {
  pollJobUntilTerminal,
  uploadSourceWithProgress,
} from "@/lib/sources/upload-client";

export type SourceUploadPhase = "uploading" | "processing" | "done" | "error";
export type SourceUpload = {
  id: string;
  fileName: string;
  uploadProgress: number;
  phase: SourceUploadPhase;
  errorMessage?: string;
};

export function useSourceUpload(spaceId: string) {
  const [uploads, setUploads] = useState<SourceUpload[]>([]);

  const updateUpload = useCallback(
    (id: string, patch: Partial<SourceUpload>) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      );
    },
    [],
  );

  const startUpload = useCallback(
    (file: File): string => {
      const id = crypto.randomUUID();
      setUploads((prev) => [
        ...prev,
        {
          id,
          fileName: file.name,
          uploadProgress: 0,
          phase: "uploading",
        },
      ]);

      void (async () => {
        try {
          const result = await uploadSourceWithProgress(spaceId, file, (pct) => {
            updateUpload(id, { uploadProgress: pct });
          });
          updateUpload(id, { phase: "processing", uploadProgress: 100 });
          const job = await pollJobUntilTerminal(result.job_id);
          if (job.status === "failed") {
            updateUpload(id, {
              phase: "error",
              errorMessage: job.error_message ?? "Processing failed",
            });
            return;
          }
          updateUpload(id, { phase: "done" });
        } catch (err) {
          updateUpload(id, {
            phase: "error",
            errorMessage: err instanceof Error ? err.message : "Upload failed",
          });
        }
      })();

      return id;
    },
    [spaceId, updateUpload],
  );

  const startUploads = useCallback(
    (files: File[]) => files.map((f) => startUpload(f)),
    [startUpload],
  );

  return { uploads, startUpload, startUploads };
}
