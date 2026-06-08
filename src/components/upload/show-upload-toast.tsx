"use client";

import { toast } from "sonner";
import type { MockUpload } from "@/hooks/use-mock-upload";
import { UploadProgressToast } from "./upload-progress-toast";

export function showUploadToast(upload: MockUpload) {
  return toast.custom(
    () => <UploadProgressToast upload={upload} />,
    {
      id: upload.id,
      duration: Infinity,
      position: "bottom-center",
    },
  );
}
