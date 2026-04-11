"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  X,
  CloudUpload,
  CheckCircle2,
} from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadedFile[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: false,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpload = () => {
    setFiles((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading" } : f))
    );

    // Simulate upload completion
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "done" } : f))
      );
    }, 1500);
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Upload Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag and drop files or click to browse. No backend connected yet.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-12 text-center transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input {...getInputProps()} />
              <div
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl transition-colors",
                  isDragActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <CloudUpload className="size-7" />
              </div>
              {isDragActive ? (
                <p className="text-sm font-medium text-primary">
                  Drop your files here...
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium">
                      Drag & drop files here
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      or click to browse from your computer
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">
                    {files.length} file{files.length !== 1 && "s"}
                  </h3>
                  {doneCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {doneCount} uploaded
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {files.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        files.forEach((f) => {
                          if (f.preview) URL.revokeObjectURL(f.preview);
                        });
                        setFiles([]);
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                  {pendingCount > 0 && (
                    <Button size="sm" onClick={handleUpload}>
                      <Upload className="mr-1.5 size-3.5" />
                      Upload {pendingCount}
                    </Button>
                  )}
                </div>
              </div>

              <Separator className="mb-3" />

              <ScrollArea className="max-h-[320px]">
                <div className="space-y-2">
                  {files.map((item) => {
                    const Icon = getFileIcon(item.file.type);
                    return (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                      >
                        {item.preview ? (
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            className="size-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Icon className="size-5 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(item.file.size)}
                          </p>
                        </div>

                        {item.status === "done" ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        ) : item.status === "uploading" ? (
                          <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => removeFile(item.id)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
