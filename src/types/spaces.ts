export type Space = {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type SpaceListResponse = {
  items: Space[];
  pagination: PaginationMeta;
};

export type SpaceCounts = {
  sources?: number;
  entities?: number;
  open_conflicts?: number;
  pending_review?: number;
};

export type SpaceDetail = Space & {
  counts?: SpaceCounts;
};

export type UpdateSpaceRequest = {
  name?: string;
  description?: string | null;
};

export type CreateSpaceRequest = {
  name: string;
  description?: string;
};
