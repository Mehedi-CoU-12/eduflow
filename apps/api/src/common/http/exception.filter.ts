import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { ApiFailure, ErrorCode } from '@shikkhacore/types';
import type { Request, Response } from 'express';

import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../errors/app-error.js';
import { requestMeta } from './request-context.js';

interface ErrorBody {
  status: number;
  code: ErrorCode;
  message: string;
  details?: ApiFailure['error']['details'];
}

const STATUS_CODES: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'PERMISSION_DENIED',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

/**
 * Turns every thrown error into the standard failure envelope:
 * `{ success: false, error: { code, message, details?, requestId } }`.
 * Unexpected errors are logged with their stack and reported as INTERNAL_ERROR without
 * leaking internals to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') throw exception;
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { requestId } = requestMeta(request);

    const body = this.toBody(exception, request);
    if (body.status >= 500) {
      this.logger.error(
        { err: exception, requestId, method: request.method, url: request.originalUrl },
        'Unhandled error',
      );
    }

    if (response.headersSent) return;
    const payload: ApiFailure = {
      success: false,
      error: {
        code: body.code,
        message: body.message,
        ...(body.details === undefined ? {} : { details: body.details }),
        ...(requestId ? { requestId } : {}),
      },
    };
    response.status(body.status).json(payload);
  }

  private toBody(exception: unknown, request: Request): ErrorBody {
    if (exception instanceof AppError) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof ThrottlerException) {
      return { status: HttpStatus.TOO_MANY_REQUESTS, code: 'RATE_LIMITED', message: 'Too many requests' };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === HttpStatus.NOT_FOUND) {
        const path = request.originalUrl.split('?')[0] ?? request.originalUrl;
        return { status, code: 'NOT_FOUND', message: `Cannot ${request.method} ${path}` };
      }
      const code = STATUS_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_FAILED');
      return { status, code, message: status >= 500 ? 'Something went wrong' : exception.message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { status: HttpStatus.CONFLICT, code: 'CONFLICT', message: 'The record already exists' };
      }
      if (exception.code === 'P2025') {
        return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'The record was not found' };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    };
  }
}
