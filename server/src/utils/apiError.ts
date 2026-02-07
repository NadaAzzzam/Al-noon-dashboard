/**
 * API error with optional translation key.
 * - code: i18n key (e.g. "errors.auth.invalid_credentials") for backend translation and FE fallback.
 * - message: fallback message if key is missing; also used before translation in errorHandler.
 */
export class ApiError extends Error {
  statusCode: number;
  /** i18n key for translation */
  code?: string;
  /** Interpolation params for the translation */
  params?: Record<string, string | number>;

  constructor(
    statusCode: number,
    message: string,
    options?: { code?: string; params?: Record<string, string | number> }
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = options?.code;
    this.params = options?.params;
  }
}
