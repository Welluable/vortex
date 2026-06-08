import type { CreateSpaceRequest, Space, SpaceListResponse } from "@/types/spaces";

const SEED_SPACES: Space[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Acme Corp",
    description: null,
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_000,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Side Project",
    description: null,
    created_at: 1_700_000_100_000,
    updated_at: 1_700_000_100_000,
  },
];

let spaces: Space[] = [...SEED_SPACES];

export const spacesStore = {
  listSpaces(limit = 50, offset = 0): SpaceListResponse {
    const items = spaces.slice(offset, offset + limit);
    return {
      items,
      pagination: { total: spaces.length, limit, offset },
    };
  },
  getSpace(id: string): Space | null {
    return spaces.find((s) => s.id === id) ?? null;
  },
  createSpace(input: CreateSpaceRequest): Space {
    const now = Date.now();
    const space: Space = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      created_at: now,
      updated_at: now,
    };
    spaces = [...spaces, space];
    return space;
  },
};

export function resetSpacesForTest(): void {
  spaces = [];
}

export function restoreSeedSpacesForTest(): void {
  spaces = [...SEED_SPACES];
}
