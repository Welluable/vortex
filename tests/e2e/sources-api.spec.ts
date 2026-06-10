import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SEED_SPACE_ID = "00000000-0000-4000-8000-000000000001";
const UNKNOWN_SPACE_ID = "00000000-0000-4000-8000-000000000099";
const FIXTURE_PATH = path.join(__dirname, "fixtures", "sample.txt");

async function resetHarness(request: import("@playwright/test").APIRequestContext) {
  await request.post("/api/test/spaces", { data: { action: "restore" } });
  await request.post("/api/test/sources", { data: { action: "reset" } });
}

test.describe("sources API", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }) => {
    await resetHarness(request);
  });

  test("POST /api/test/sources reset clears seed uploads", async ({ request }) => {
    const res = await request.post("/api/test/sources", { data: { action: "reset" } });
    expect(res.status()).toBe(200);
  });

  test("POST upload returns 202 with source, job_id, ingest_run_id", async ({
    request,
  }) => {
    const res = await request.post(`/api/spaces/${SEED_SPACE_ID}/sources`, {
      multipart: {
        file: {
          name: "sample.txt",
          mimeType: "text/plain",
          buffer: fs.readFileSync(FIXTURE_PATH),
        },
      },
    });
    expect(res.status()).toBe(202);
    const body = await res.json();
    expect(body.source).toMatchObject({
      space_id: SEED_SPACE_ID,
      original_filename: "sample.txt",
      mime_type: "text/plain",
      ingest_status: "pending",
    });
    expect(body.job_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(body.ingest_run_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const health = await (await request.get("/api/health")).json();
    const manifestPath = path.join(
      health.data_dir,
      "spaces",
      SEED_SPACE_ID,
      "assets",
      body.source.id,
      "manifest.json",
    );
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(manifest).toMatchObject({
      sha256: body.source.sha256,
      mime_type: "text/plain",
      byte_size: body.source.byte_size,
    });
  });

  test("POST upload unknown space returns 404", async ({ request }) => {
    const res = await request.post(`/api/spaces/${UNKNOWN_SPACE_ID}/sources`, {
      multipart: {
        file: {
          name: "sample.txt",
          mimeType: "text/plain",
          buffer: fs.readFileSync(FIXTURE_PATH),
        },
      },
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe("not_found");
  });

  test("POST upload oversize file returns 400", async ({ request }) => {
    const oversize = Buffer.alloc(52_428_801, 0x61);
    const res = await request.post(`/api/spaces/${SEED_SPACE_ID}/sources`, {
      multipart: {
        file: {
          name: "big.txt",
          mimeType: "text/plain",
          buffer: oversize,
        },
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe("validation_error");
  });

  test("POST upload unsupported MIME returns 400", async ({ request }) => {
    const res = await request.post(`/api/spaces/${SEED_SPACE_ID}/sources`, {
      multipart: {
        file: {
          name: "data.bin",
          mimeType: "application/octet-stream",
          buffer: Buffer.from("binary"),
        },
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe("validation_error");
  });

  test("upload then poll job completes ingest stub", async ({ request }) => {
    const uploadRes = await request.post(`/api/spaces/${SEED_SPACE_ID}/sources`, {
      multipart: {
        file: {
          name: "sample.txt",
          mimeType: "text/plain",
          buffer: fs.readFileSync(FIXTURE_PATH),
        },
      },
    });
    expect(uploadRes.status()).toBe(202);
    const { job_id } = await uploadRes.json();

    await expect
      .poll(
        async () => {
          const jobRes = await request.get(`/api/jobs/${job_id}`);
          const job = await jobRes.json();
          return job.status;
        },
        { timeout: 10_000 },
      )
      .toBe("complete");

    const job = await (await request.get(`/api/jobs/${job_id}`)).json();
    expect(job.ingest_run.stage).toBe("refresh");
    expect(job.ingest_run.progress_pct).toBe(100);
    expect(job.ingest_run.status).toBe("complete");

    const spaceRes = await request.get(`/api/spaces/${SEED_SPACE_ID}`);
    expect((await spaceRes.json()).counts.sources).toBe(1);
  });
});
