"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { validateUploadFile } from "@/lib/sources/validation";
import { cn } from "@/lib/utils";

export type UploadDropZoneProps = {
  onFilesSelected: (files: File[]) => void;
  onValidationError?: (message: string) => void;
  accept?: string;
  disabled?: boolean;
};

export function UploadDropZone({
  onFilesSelected,
  onValidationError,
  accept = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,image/*,application/pdf,text/plain,text/markdown",
  disabled = false,
}: UploadDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const pickFiles = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length || disabled) return;
      const accepted: File[] = [];
      for (const file of Array.from(fileList)) {
        const result = validateUploadFile({
          type: file.type,
          size: file.size,
          name: file.name,
        });
        if (!result.ok) {
          onValidationError?.(result.message);
        } else {
          accepted.push(file);
        }
      }
      if (accepted.length) onFilesSelected(accepted);
    },
    [disabled, onFilesSelected, onValidationError],
  );

  return (
    <div
      data-testid="upload-drop-zone"
      role="region"
      aria-label="Upload drop zone"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      className="flex flex-1 flex-col"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        data-testid="upload-file-input"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={pickFiles}
        className={cn(
          "flex flex-1 min-h-[16rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Upload className="size-10 text-muted-foreground" aria-hidden />
        <span className="text-base font-medium">Drop files here or click to browse</span>
      </button>
    </div>
  );
}
