"use client";

import { toast } from "sonner";
import type { SourceUpload } from "@/hooks/use-source-upload";
import { UploadProgressToast } from "./upload-progress-toast";

export function showUploadToast(upload: SourceUpload) {
  return toast.custom(() => <UploadProgressToast upload={upload} />, {
    id: upload.id,
    duration: Infinity,
    position: "bottom-center",
  });
}
