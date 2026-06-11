import { toast } from "sonner";

const dismissedUploadIds = new Set<string>();

export const UPLOAD_TOAST_AUTO_DISMISS_MS = 3000;

export function markUploadToastDismissed(uploadId: string) {
  dismissedUploadIds.add(uploadId);
}

export function dismissUploadToast(uploadId: string) {
  markUploadToastDismissed(uploadId);
  toast.dismiss(uploadId);
}

export function isUploadToastDismissed(uploadId: string) {
  return dismissedUploadIds.has(uploadId);
}
