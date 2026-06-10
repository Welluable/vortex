import { test, expect } from "@playwright/test";

const SEED_SPACE_ID = "00000000-0000-4000-8000-000000000001";

test.describe("spaces API", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/spaces", {
      headers: { "Content-Type": "application/json" },
      data: { action: "restore" },
    });
  });

  test("GET seed space returns SpaceDetail with zero counts", async ({ request }) => {
    const res = await request.get(`/api/spaces/${SEED_SPACE_ID}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(SEED_SPACE_ID);
    expect(body.name).toBe("Acme Corp");
    expect(body.counts).toEqual({
      sources: 0,
      entities: 0,
      open_conflicts: 0,
      pending_review: 0,
    });
  });

  test("GET unknown UUID returns 404 not_found", async ({ request }) => {
    const res = await request.get(
      "/api/spaces/00000000-0000-4000-8000-000000000099",
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
  });

  test("GET malformed space_id returns 404 not_found", async ({ request }) => {
    const res = await request.get("/api/spaces/not-a-uuid");
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
  });
});
