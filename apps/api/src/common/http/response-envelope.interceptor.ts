import {
  HttpStatus,
  Injectable,
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';

import { Page } from './page.js';

/** Wraps every successful JSON response in `{ success: true, data, meta? }`. */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value instanceof StreamableFile) return value;
        const response = context.switchToHttp().getResponse<Response>();
        if (response.statusCode === Number(HttpStatus.NO_CONTENT)) return undefined;
        if (value instanceof Page) return { success: true, data: value.items, meta: value.meta };
        return { success: true, data: value ?? null };
      }),
    );
  }
}
