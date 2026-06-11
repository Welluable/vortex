"use client";

import { toast } from "sonner";
import type { MockUpload } from "@/hooks/use-mock-upload";
import {
  isUploadToastDismissed,
  markUploadToastDismissed,
  UPLOAD_TOAST_AUTO_DISMISS_MS,
} from "@/components/upload/upload-toast-state";
import { UploadProgressToast } from "./upload-progress-toast";

export function showUploadToast(upload: MockUpload) {
  if (isUploadToastDismissed(upload.id)) return;

  const done = upload.status === "done";

  return toast.custom(
    () => <UploadProgressToast upload={upload} />,
    {
      id: upload.id,
      duration: done ? UPLOAD_TOAST_AUTO_DISMISS_MS : Infinity,
      position: "bottom-right",
      classNames: {
        toast: "cn-toast cn-upload-toast",
      },
      onAutoClose: () => markUploadToastDismissed(upload.id),
      onDismiss: () => markUploadToastDismissed(upload.id),
    },
  );
}
