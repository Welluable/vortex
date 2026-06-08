"use client";

import { BlankMain } from "@/components/shell/blank-main";
import { UploadDropZone } from "@/components/upload/upload-drop-zone";
import { FieldDescription } from "@/components/ui/field";

export default function SourcesPage() {
  function onFilesSelected(files: File[]) {
    // Slice 3 will wire mock uploads; no-op for Slice 2 checkpoint
    console.debug("files selected", files.map((f) => f.name));
  }

  return (
    <BlankMain>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <UploadDropZone onFilesSelected={onFilesSelected} />
        <aside className="space-y-1">
          <FieldDescription>Supported: PDF, PNG, JPG, JPEG, GIF, WebP, plain text (.txt, .md)</FieldDescription>
          <FieldDescription>Max size: 50 MB per file (provisional)</FieldDescription>
          <FieldDescription>You can add more files while uploads are in progress</FieldDescription>
        </aside>
      </div>
    </BlankMain>
  );
}
