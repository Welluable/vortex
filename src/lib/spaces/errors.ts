export type ApiErrorCode = "validation_error" | "conflict";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type ErrorResponse = { error: ApiError };

export class SpaceConflictError extends Error {
  readonly code = "conflict" as const;
  constructor(message = "A space with this name already exists") {
    super(message);
    this.name = "SpaceConflictError";
  }
}

export function toErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return { error: { code, message, ...(details ? { details } : {}) } };
}
