"use client";

import { Check, Loader2, XIcon } from "lucide-react";
import type { MockUpload } from "@/hooks/use-mock-upload";
import { dismissUploadToast } from "@/components/upload/upload-toast-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type UploadProgressToastProps = {
  upload: MockUpload;
};

export function UploadProgressToast({ upload }: UploadProgressToastProps) {
  const done = upload.status === "done";
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
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
            aria-label="Dismiss upload"
            onClick={() => dismissUploadToast(upload.id)}
          >
            <XIcon />
          </Button>
        ) : (
          <span aria-hidden className="size-6" />
        )}
      </div>
      {!done ? (
        <Progress
          className="w-full gap-0"
          value={upload.progress}
          aria-label="Upload progress"
        />
      ) : null}
    </div>
  );
}
