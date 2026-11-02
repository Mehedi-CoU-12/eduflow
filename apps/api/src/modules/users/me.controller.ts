import { Controller, Get } from '@nestjs/common';
import type { MyMembershipDto } from '@eduflow/types';

import { Authenticated } from '../access-control/access-policy.js';
import { CurrentAuth } from '../access-control/request-decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import { MeService } from './me.service.js';

@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get('schools')
  @Authenticated()
  schools(@CurrentAuth() auth: AuthContext): Promise<MyMembershipDto[]> {
    return this.me.schools(auth);
  }
}
