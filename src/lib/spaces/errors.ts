export type { ApiErrorCode, ApiError, ErrorResponse } from "@/lib/api/errors";
export { toErrorResponse } from "@/lib/api/errors";

export class SpaceConflictError extends Error {
  readonly code = "conflict" as const;
  constructor(message = "A space with this name already exists") {
    super(message);
    this.name = "SpaceConflictError";
  }
}
