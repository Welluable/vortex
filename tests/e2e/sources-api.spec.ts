import { test, expect } from "@playwright/test";

test.describe("sources API", () => {
  test("POST /api/test/sources reset clears seed uploads", async ({ request }) => {
    await request.post("/api/test/spaces", { data: { action: "restore" } });
    const res = await request.post("/api/test/sources", { data: { action: "reset" } });
    expect(res.status()).toBe(200);
  });
});
