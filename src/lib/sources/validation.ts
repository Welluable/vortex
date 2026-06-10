import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from "./constants";

export function validateUploadFile(file: {
  type: string;
  size: number;
  name: string;
}):
  | { ok: true }
  | { ok: false; message: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "File exceeds 50 MB limit" };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, message: "Unsupported file type" };
  }
  return { ok: true };
}
