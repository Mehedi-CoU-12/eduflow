import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
  switchSchoolSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResendVerificationInput,
  type ResetPasswordInput,
  type SessionContextDto,
  type SignupInput,
  type SwitchSchoolInput,
  type VerifyEmailInput,
} from '@shikkhacore/types';
import type { Request, Response } from 'express';

import type { RequestMeta } from '../../common/http/request-context.js';
import { Authenticated, Public } from '../access-control/access-policy.js';
import { CurrentAuth, CurrentHost, ReqMeta } from '../access-control/request-decorators.js';
import type { HostContext } from '../tenancy/tenancy.types.js';
import { AuthService } from './auth.service.js';
import type { AuthContext } from './auth.types.js';
import { SessionService } from './session.service.js';

const MINUTE = 60_000;

/** Generic answer for endpoints that must not reveal whether an email is registered. */
const ACCEPTED = { message: 'If the address can receive email, a message is on its way.' };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60 * MINUTE } })
  async signup(
    @Body({ schema: signupSchema }) input: SignupInput,
    @CurrentHost() host: HostContext,
    @ReqMeta() meta: RequestMeta,
  ): Promise<typeof ACCEPTED> {
    await this.auth.signup(input, host, meta);
    return ACCEPTED;
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: MINUTE } })
  async login(
    @Body({ schema: loginSchema }) input: LoginInput,
    @CurrentHost() host: HostContext,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionContextDto> {
    const { session, auth } = await this.auth.login(input, host, meta);
    // Never keep using a pre-existing session cookie after a fresh sign-in.
    const previous = this.sessions.readToken(req);
    if (previous) await this.sessions.revokeToken(previous, 'replaced');
    this.sessions.setCookie(res, session.token, session.expiresAt);
    return this.auth.sessionContext(auth, host);
  }

  /** Always succeeds and clears the cookie, so signing out can never get stuck. */
  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentHost() host: HostContext,
    @ReqMeta() meta: RequestMeta,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const auth = await this.sessions.authenticate(this.sessions.readToken(req), host.hostname);
    if (auth) await this.auth.logout(auth, meta);
    this.sessions.clearCookie(res);
  }

  @Get('session')
  @Authenticated()
  session(@CurrentAuth() auth: AuthContext, @CurrentHost() host: HostContext): Promise<SessionContextDto> {
    return this.auth.sessionContext(auth, host);
  }

  /** Account host only: choose which school the session works in. */
  @Put('session/school')
  @Authenticated()
  switchSchool(
    @Body({ schema: switchSchoolSchema }) input: SwitchSchoolInput,
    @CurrentAuth() auth: AuthContext,
    @CurrentHost() host: HostContext,
  ): Promise<SessionContextDto> {
    return this.auth.switchSchool(auth, host, input.schoolId);
  }

  @Post('email/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 15 * MINUTE } })
  async verifyEmail(
    @Body({ schema: verifyEmailSchema }) input: VerifyEmailInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<{ verified: true }> {
    await this.auth.verifyEmail(input.token, meta);
    return { verified: true };
  }

  @Post('email/resend')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 15 * MINUTE } })
  async resendVerification(
    @Body({ schema: resendVerificationSchema }) input: ResendVerificationInput,
    @CurrentHost() host: HostContext,
  ): Promise<typeof ACCEPTED> {
    await this.auth.resendVerification(input.email, host);
    return ACCEPTED;
  }

  @Post('password/forgot')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 15 * MINUTE } })
  async forgotPassword(
    @Body({ schema: forgotPasswordSchema }) input: ForgotPasswordInput,
    @CurrentHost() host: HostContext,
    @ReqMeta() meta: RequestMeta,
  ): Promise<typeof ACCEPTED> {
    await this.auth.forgotPassword(input.email, host, meta);
    return ACCEPTED;
  }

  @Post('password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 15 * MINUTE } })
  async resetPassword(
    @Body({ schema: resetPasswordSchema }) input: ResetPasswordInput,
    @ReqMeta() meta: RequestMeta,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ reset: true }> {
    await this.auth.resetPassword(input, meta);
    this.sessions.clearCookie(res);
    return { reset: true };
  }
}
