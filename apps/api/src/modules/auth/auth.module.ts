import { Module } from '@nestjs/common';

import { PlatformModule } from '../platform/platform.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AuthTokenService } from './auth-token.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginThrottleService } from './login-throttle.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';
import { UserProvisioningService } from './user-provisioning.service.js';

@Module({
  imports: [TenancyModule, PlatformModule],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, LoginThrottleService, PasswordService, SessionService, UserProvisioningService],
  exports: [SessionService, PasswordService, UserProvisioningService, AuthTokenService],
})
export class AuthModule {}
