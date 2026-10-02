import {
  Injectable,
  StandardSchemaValidationPipe,
  type ArgumentMetadata,
  type StandardSchemaValidationPipeOptions,
} from '@nestjs/common';
import type { ValidationIssue } from '@shikkhacore/types';

import { AppError } from '../errors/app-error.js';

type Issue = Parameters<NonNullable<StandardSchemaValidationPipeOptions['exceptionFactory']>>[0][number];

function toPath(issue: Issue): (string | number)[] {
  return (issue.path ?? []).map((segment) => {
    const key = typeof segment === 'object' ? segment.key : segment;
    return typeof key === 'number' ? key : String(key);
  });
}

/**
 * Global validation pipe. Validates `@Body`, `@Query` and `@Param` against the Zod
 * (Standard Schema) schema attached to the decorator:
 *
 *   create(@Body({ schema: createSchoolSchema }) input: CreateSchoolInput)
 *
 * It fails closed: a body, query or param without a schema is a programming error and
 * the request is rejected rather than passed through unvalidated.
 */
@Injectable()
export class SchemaValidationPipe extends StandardSchemaValidationPipe {
  constructor() {
    super({
      exceptionFactory: (issues) =>
        AppError.validation(
          issues.map((issue): ValidationIssue => ({ path: toPath(issue), message: issue.message })),
        ),
    });
  }

  override async transform<T>(value: T, metadata: ArgumentMetadata): Promise<T> {
    if (metadata.type !== 'custom' && !metadata.schema) {
      throw new Error(
        `Missing validation schema for @${DECORATOR_NAMES[metadata.type]}(${metadata.data ?? ''}); ` +
          'pass { schema } to the decorator',
      );
    }
    return super.transform(value, metadata);
  }
}

const DECORATOR_NAMES = { body: 'Body', query: 'Query', param: 'Param' } as const;
