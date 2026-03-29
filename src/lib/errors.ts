/**
 * Structured error handling for API routes.
 * Provides AppError class with status codes and a withErrorHandler wrapper.
 */

import { NextRequest, NextResponse } from "next/server";

export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_ERROR,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.details = details;

    // Set default status codes based on error type
    if (statusCode) {
      this.statusCode = statusCode;
    } else {
      switch (type) {
        case ErrorType.VALIDATION_ERROR:
          this.statusCode = 400;
          break;
        case ErrorType.AUTHENTICATION_ERROR:
          this.statusCode = 401;
          break;
        case ErrorType.AUTHORIZATION_ERROR:
          this.statusCode = 403;
          break;
        case ErrorType.NOT_FOUND:
          this.statusCode = 404;
          break;
        case ErrorType.CONFLICT:
          this.statusCode = 409;
          break;
        case ErrorType.RATE_LIMIT:
          this.statusCode = 429;
          break;
        case ErrorType.EXTERNAL_SERVICE_ERROR:
          this.statusCode = 502;
          break;
        case ErrorType.INTERNAL_ERROR:
        default:
          this.statusCode = 500;
          break;
      }
    }
  }

  toJSON() {
    return {
      error: this.message,
      type: this.type,
      ...(this.details && { details: this.details }),
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Wraps an API route handler with error handling.
 * Catches errors and returns proper JSON responses with appropriate status codes.
 */
export function withErrorHandler(
  handler: (
    req: NextRequest,
    context?: unknown
  ) => Promise<NextResponse | Response>
) {
  return async (
    req: NextRequest,
    context?: unknown
  ): Promise<NextResponse> => {
    try {
      const response = await handler(req, context);
      return NextResponse.json(
        await response.json(),
        { status: response.status }
      );
    } catch (error) {
      // Handle AppError
      if (isAppError(error)) {
        return NextResponse.json(error.toJSON(), {
          status: error.statusCode,
        });
      }

      // Handle unknown errors
      console.error("Unhandled error in API route:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";

      return NextResponse.json(
        {
          error: errorMessage,
          type: ErrorType.INTERNAL_ERROR,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a validation error with optional details (e.g., validation errors)
 */
export function createValidationError(
  message: string,
  details?: Record<string, unknown>
) {
  return new AppError(message, ErrorType.VALIDATION_ERROR, 400, details);
}

/**
 * Create an authentication error
 */
export function createAuthError(message: string = "Not authenticated") {
  return new AppError(message, ErrorType.AUTHENTICATION_ERROR, 401);
}

/**
 * Create an authorization error
 */
export function createAuthzError(
  message: string = "Access denied"
): AppError {
  return new AppError(message, ErrorType.AUTHORIZATION_ERROR, 403);
}

/**
 * Create a not found error
 */
export function createNotFoundError(
  message: string = "Resource not found"
): AppError {
  return new AppError(message, ErrorType.NOT_FOUND, 404);
}

/**
 * Create a rate limit error
 */
export function createRateLimitError(
  message: string = "Rate limit exceeded"
): AppError {
  return new AppError(message, ErrorType.RATE_LIMIT, 429);
}

/**
 * Create an external service error
 */
export function createExternalServiceError(message: string): AppError {
  return new AppError(
    message,
    ErrorType.EXTERNAL_SERVICE_ERROR,
    502
  );
}
