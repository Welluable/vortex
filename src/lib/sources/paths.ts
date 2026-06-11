import path from "node:path";

export type AssetManifest = {
  sha256: string;
  mime_type: string;
  byte_size: number;
  uploaded_at: number;
};

export function assetDir(dataDir: string, spaceId: string, sourceId: string): string {
  return path.join(dataDir, "spaces", spaceId, "assets", sourceId);
}

export function originalPath(
  dataDir: string,
  spaceId: string,
  sourceId: string,
  ext: string,
): string {
  return path.join(assetDir(dataDir, spaceId, sourceId), `original${ext}`);
}

export function manifestPath(dataDir: string, spaceId: string, sourceId: string): string {
  return path.join(assetDir(dataDir, spaceId, sourceId), "manifest.json");
}

export function spaceAssetsDir(dataDir: string, spaceId: string): string {
  return path.join(dataDir, "spaces", spaceId, "assets");
}

export function deriveExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return ".bin";
  return filename.slice(dot).toLowerCase();
}

export function derivedIngestDir(
  dataDir: string,
  spaceId: string,
  sourceId: string,
  version: number,
): string {
  return path.join(assetDir(dataDir, spaceId, sourceId), "derived", "ingest", `v${version}`);
}

export function extractionArtifactPath(
  dataDir: string,
  spaceId: string,
  sourceId: string,
  version: number,
): string {
  return path.join(derivedIngestDir(dataDir, spaceId, sourceId, version), "extraction.json");
}

export function summaryArtifactPath(
  dataDir: string,
  spaceId: string,
  sourceId: string,
  version: number,
): string {
  return path.join(derivedIngestDir(dataDir, spaceId, sourceId, version), "summary.md");
}

export function toRelativeDataPath(dataDir: string, absPath: string): string {
  return path.relative(dataDir, absPath).split(path.sep).join("/");
}
