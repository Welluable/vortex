"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { SourceUpload } from "@/hooks/use-source-upload";
import { Progress } from "@/components/ui/progress";

export type UploadProgressToastProps = {
  upload: SourceUpload;
};

export function UploadProgressToast({ upload }: UploadProgressToastProps) {
  if (upload.phase === "error") {
    return (
      <div className="flex w-80 flex-col gap-2" data-testid={`upload-toast-${upload.id}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-destructive" aria-label="Upload error" />
          <span className="truncate text-sm font-medium">{upload.fileName}</span>
        </div>
        <p className="text-sm text-destructive">{upload.errorMessage}</p>
      </div>
    );
  }

  if (upload.phase === "processing") {
    return (
      <div className="flex w-80 flex-col gap-2" data-testid={`upload-toast-${upload.id}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-label="Processing" />
          <span className="truncate text-sm font-medium">{upload.fileName}</span>
        </div>
        <p className="text-sm text-muted-foreground">Processing…</p>
      </div>
    );
  }

  if (upload.phase === "done") {
    return (
      <div className="flex w-80 flex-col gap-2" data-testid={`upload-toast-${upload.id}`}>
        <div className="flex items-center gap-2">
          <Check className="size-4 text-green-600" aria-label="Upload complete" />
          <span className="truncate text-sm font-medium">{upload.fileName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col gap-2" data-testid={`upload-toast-${upload.id}`}>
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-label="Uploading" />
        <span className="truncate text-sm font-medium">{upload.fileName}</span>
      </div>
      <Progress value={upload.uploadProgress} aria-label="Upload progress" />
    </div>
  );
}
