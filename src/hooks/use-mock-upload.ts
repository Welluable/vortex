"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MockUploadStatus = "idle" | "uploading" | "done" | "error";

export type MockUpload = {
  id: string;
  fileName: string;
  progress: number;
  status: MockUploadStatus;
};

export type UseMockUploadOptions = {
  durationMs?: number;
  tickMs?: number;
};

export function useMockUpload({
  durationMs = 3000,
  tickMs = 100,
}: UseMockUploadOptions = {}) {
  const [uploads, setUploads] = useState<MockUpload[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const startUpload = useCallback(
    (file: File): string => {
      const id = crypto.randomUUID();
      setUploads((prev) => [
        ...prev,
        { id, fileName: file.name, progress: 0, status: "uploading" },
      ]);

      const steps = Math.max(1, Math.floor(durationMs / tickMs));
      let step = 0;
      const timer = setInterval(() => {
        step += 1;
        const progress = Math.min(100, Math.round((step / steps) * 100));
        const done = progress >= 100;
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, progress, status: done ? "done" : "uploading" }
              : u,
          ),
        );
        if (done) {
          clearInterval(timer);
          timersRef.current.delete(id);
        }
      }, tickMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [durationMs, tickMs],
  );

  const startUploads = useCallback(
    (files: File[]) => files.map((f) => startUpload(f)),
    [startUpload],
  );

  useEffect(() => () => {
    timersRef.current.forEach(clearInterval);
    timersRef.current.clear();
  }, []);

  return { uploads, startUpload, startUploads };
}
