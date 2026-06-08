import { test, expect } from "@playwright/test";

test("GET /api/health reports db connected", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toMatchObject({
    status: "ok",
    db: "connected",
  });
  expect(typeof body.data_dir).toBe("string");
  expect(body.data_dir.length).toBeGreaterThan(0);
});
