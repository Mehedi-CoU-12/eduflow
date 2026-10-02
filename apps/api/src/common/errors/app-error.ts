import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode, ValidationIssue } from '@shikkhacore/types';

export type AppErrorDetails = ValidationIssue[] | Record<string, unknown>;

/**
 * The one exception type services throw. It carries a stable machine-readable `code`;
 * the global exception filter turns it into `{ success: false, error: { code, message } }`.
 */
export class AppError extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: AppErrorDetails,
  ) {
    super({ code, message, details }, status);
  }

  static validation(details: ValidationIssue[]): AppError {
    return new AppError('VALIDATION_FAILED', 'The request is invalid', HttpStatus.BAD_REQUEST, details);
  }

  static badRequest(code: ErrorCode, message: string, details?: AppErrorDetails): AppError {
    return new AppError(code, message, HttpStatus.BAD_REQUEST, details);
  }

  static unauthenticated(code: ErrorCode = 'UNAUTHENTICATED', message = 'Sign in to continue'): AppError {
    return new AppError(code, message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(code: ErrorCode, message: string, details?: AppErrorDetails): AppError {
    return new AppError(code, message, HttpStatus.FORBIDDEN, details);
  }

  static notFound(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, HttpStatus.NOT_FOUND);
  }

  static conflict(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, HttpStatus.CONFLICT);
  }

  static tooManyRequests(code: ErrorCode, message: string, details?: AppErrorDetails): AppError {
    return new AppError(code, message, HttpStatus.TOO_MANY_REQUESTS, details);
  }
}
