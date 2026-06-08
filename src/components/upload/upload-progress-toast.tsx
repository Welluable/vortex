"use client";

import { Check, Loader2 } from "lucide-react";
import type { MockUpload } from "@/hooks/use-mock-upload";
import { Progress } from "@/components/ui/progress";

export type UploadProgressToastProps = {
  upload: MockUpload;
};

export function UploadProgressToast({ upload }: UploadProgressToastProps) {
  const done = upload.status === "done";
  return (
    <div className="flex w-80 flex-col gap-2" data-testid={`upload-toast-${upload.id}`}>
      <div className="flex items-center gap-2">
        {done ? (
          <Check className="size-4 text-green-600" aria-label="Upload complete" />
        ) : (
          <Loader2 className="size-4 animate-spin" aria-label="Uploading" />
        )}
        <span className="truncate text-sm font-medium">{upload.fileName}</span>
      </div>
      <Progress value={upload.progress} aria-label="Upload progress" />
    </div>
  );
}
