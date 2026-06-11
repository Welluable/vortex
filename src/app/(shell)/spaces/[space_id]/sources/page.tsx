"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BlankMain } from "@/components/shell/blank-main";
import { UploadDropZone } from "@/components/upload/upload-drop-zone";
import { showUploadToast } from "@/components/upload/show-upload-toast";
import { FieldDescription } from "@/components/ui/field";
import { useSourceUpload } from "@/hooks/use-source-upload";

export default function SourcesPage() {
  const { space_id } = useParams<{ space_id: string }>();
  const { uploads, startUploads } = useSourceUpload(space_id);

  useEffect(() => {
    uploads.forEach((upload) => showUploadToast(upload));
  }, [uploads]);

  function onFilesSelected(files: File[]) {
    startUploads(files);
  }

  return (
    <BlankMain>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <UploadDropZone
          onFilesSelected={onFilesSelected}
          onValidationError={(message) => toast.error(message)}
        />
        <aside className="space-y-1">
          <FieldDescription>Supported: PDF, PNG, JPG, JPEG, GIF, WebP, plain text (.txt, .md)</FieldDescription>
          <FieldDescription>Max size: 50 MB per file (provisional)</FieldDescription>
          <FieldDescription>You can add more files while uploads are in progress</FieldDescription>
        </aside>
      </div>
    </BlankMain>
  );
}
