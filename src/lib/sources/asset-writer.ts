import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import type { RequestLog } from "@/lib/api/request-log";
import {
  assetDir,
  deriveExtension,
  manifestPath,
  originalPath,
  type AssetManifest,
} from "./paths";

export async function writeSourceAsset(args: {
  dataDir: string;
  spaceId: string;
  sourceId: string;
  file: File | (Blob & { stream(): ReadableStream });
  mimeType: string;
  originalFilename: string;
  log?: RequestLog;
}): Promise<{ sha256: string; asset_path: string; manifest: AssetManifest }> {
  const { dataDir, spaceId, sourceId, file, mimeType, originalFilename, log } = args;
  const ext = deriveExtension(originalFilename);
  const dir = assetDir(dataDir, spaceId, sourceId);
  fs.mkdirSync(dir, { recursive: true });

  const originalFilePath = originalPath(dataDir, spaceId, sourceId, ext);
  const hash = createHash("sha256");
  let byteSize = 0;

  const hashTransform = new Transform({
    transform(chunk, _encoding, callback) {
      byteSize += chunk.length;
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  log?.step("asset pipeline starting", { path: originalFilePath });
  await pipeline(
    Readable.fromWeb(file.stream() as import("stream/web").ReadableStream),
    hashTransform,
    fs.createWriteStream(originalFilePath),
  );
  log?.step("asset pipeline complete", { byteSize });

  const uploadedAt = Date.now();
  const manifest: AssetManifest = {
    sha256: hash.digest("hex"),
    mime_type: mimeType,
    byte_size: byteSize,
    uploaded_at: uploadedAt,
  };

  fs.writeFileSync(manifestPath(dataDir, spaceId, sourceId), JSON.stringify(manifest));

  const asset_path = path.relative(dataDir, originalFilePath).split(path.sep).join("/");
  return { sha256: manifest.sha256, asset_path, manifest };
}
