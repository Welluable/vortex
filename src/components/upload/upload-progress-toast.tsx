"use client";

import { AlertCircle, Check, Loader2, XIcon } from "lucide-react";
import type { SourceUpload } from "@/hooks/use-source-upload";
import { dismissUploadToast } from "@/components/upload/upload-toast-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type UploadProgressToastProps = {
  upload: SourceUpload;
};

function ToastDismissButton({ uploadId }: { uploadId: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground"
      aria-label="Dismiss upload"
      onClick={() => dismissUploadToast(uploadId)}
    >
      <XIcon />
    </Button>
  );
}

export function UploadProgressToast({ upload }: UploadProgressToastProps) {
  if (upload.phase === "error") {
    return (
      <div
        className="flex w-full flex-col gap-2.5"
        data-testid={`upload-toast-${upload.id}`}
      >
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <AlertCircle className="size-4 text-destructive" aria-label="Upload error" />
          <span className="truncate text-sm font-medium">{upload.fileName}</span>
          <ToastDismissButton uploadId={upload.id} />
        </div>
        <p className="text-sm text-destructive">{upload.errorMessage}</p>
      </div>
    );
  }

  if (upload.phase === "processing") {
    return (
      <div
        className="flex w-full flex-col gap-2.5"
        data-testid={`upload-toast-${upload.id}`}
      >
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-label="Processing" />
          <span className="truncate text-sm font-medium">{upload.fileName}</span>
          <span aria-hidden className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground">Processing…</p>
      </div>
    );
  }

  const done = upload.phase === "done";

  return (
    <div
      className="flex w-full flex-col gap-2.5"
      data-testid={`upload-toast-${upload.id}`}
    >
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        {done ? (
          <Check className="size-4 text-green-600" aria-label="Upload complete" />
        ) : (
          <Loader2 className="size-4 animate-spin" aria-label="Uploading" />
        )}
        <span className="truncate text-sm font-medium">{upload.fileName}</span>
        {done ? (
          <ToastDismissButton uploadId={upload.id} />
        ) : (
          <span aria-hidden className="size-6" />
        )}
      </div>
      {!done ? (
        <Progress
          className="w-full gap-0"
          value={upload.uploadProgress}
          aria-label="Upload progress"
        />
      ) : null}
    </div>
  );
}
