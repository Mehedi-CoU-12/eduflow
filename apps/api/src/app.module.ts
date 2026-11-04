import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AllExceptionsFilter } from './common/http/exception.filter.js';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor.js';
import { SchemaValidationPipe } from './common/validation/schema-validation.pipe.js';
import { ConfigModule } from './config/config.module.js';
import type { AppConfig } from './config/env.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { LoggingModule } from './infrastructure/logging/logging.module.js';
import { MailModule } from './infrastructure/mail/mail.module.js';
import { QueueModule } from './infrastructure/queue/queue.module.js';
import { RateLimitModule } from './infrastructure/rate-limit/rate-limit.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { AccessControlModule } from './modules/access-control/access-control.module.js';
import { AcademicsModule } from './modules/academics/academics.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MembershipsModule } from './modules/memberships/memberships.module.js';
import { PlatformModule } from './modules/platform/platform.module.js';
import { SchoolsModule } from './modules/schools/schools.module.js';
import { TenancyModule } from './modules/tenancy/tenancy.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({})
export class AppModule {
  /** The configuration is validated before the module graph is built (see main.ts). */
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // Infrastructure. RateLimitModule comes before AccessControlModule so the
        // throttling guard runs before any database work.
        ConfigModule.forRoot(config),
        LoggingModule,
        DatabaseModule,
        RedisModule,
        RateLimitModule,
        QueueModule,
        MailModule,
        // Domain
        AuditModule,
        TenancyModule,
        PlatformModule,
        AuthModule,
        AccessControlModule,
        SchoolsModule,
        UsersModule,
        MembershipsModule,
        AcademicsModule,
        DashboardModule,
        HealthModule,
      ],
      providers: [
        { provide: APP_PIPE, useClass: SchemaValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    };
  }
}
