import { test, expect } from "@playwright/test";

const SEED_SPACE_ID = "00000000-0000-4000-8000-000000000001";
const SEED_SPACE_2_ID = "00000000-0000-4000-8000-000000000002";

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

  test("PATCH renames seed space", async ({ request }) => {
    const res = await request.patch(`/api/spaces/${SEED_SPACE_ID}`, {
      headers: { "Content-Type": "application/json" },
      data: { name: "Acme Renamed" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Acme Renamed");
  });

  test("PATCH duplicate name returns 409 conflict", async ({ request }) => {
    const res = await request.patch(`/api/spaces/${SEED_SPACE_ID}`, {
      headers: { "Content-Type": "application/json" },
      data: { name: "Side Project" },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("conflict");
  });

  test('PATCH empty name returns 400 validation_error', async ({ request }) => {
    const res = await request.patch(`/api/spaces/${SEED_SPACE_ID}`, {
      headers: { "Content-Type": "application/json" },
      data: { name: "" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe("validation_error");
  });

  test("PATCH invalid JSON returns 400", async ({ request }) => {
    const res = await request.patch(`/api/spaces/${SEED_SPACE_ID}`, {
      headers: { "Content-Type": "application/json" },
      data: "not-json",
    });
    expect(res.status()).toBe(400);
  });

  test("PATCH unknown id returns 404 not_found", async ({ request }) => {
    const res = await request.patch(
      "/api/spaces/00000000-0000-4000-8000-000000000099",
      {
        headers: { "Content-Type": "application/json" },
        data: { name: "Ghost" },
      },
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe("not_found");
  });

  test("PATCH empty object bumps updated_at only", async ({ request }) => {
    const before = await (
      await request.get(`/api/spaces/${SEED_SPACE_2_ID}`)
    ).json();
    await new Promise((r) => setTimeout(r, 5));
    const res = await request.patch(`/api/spaces/${SEED_SPACE_2_ID}`, {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe(before.name);
    expect(body.description).toBe(before.description);
    expect(body.updated_at).toBeGreaterThan(before.updated_at);
  });
});
