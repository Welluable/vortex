export type ApiErrorCode = "validation_error" | "conflict" | "not_found";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type ErrorResponse = { error: ApiError };

export function toErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return { error: { code, message, ...(details ? { details } : {}) } };
}
