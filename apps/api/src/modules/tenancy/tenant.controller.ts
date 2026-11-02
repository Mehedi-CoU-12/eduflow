import { Controller, Get } from '@nestjs/common';
import { isLocale, type PublicTenantDto } from '@eduflow/types';

import { Public } from '../access-control/access-policy.js';
import { CurrentHost } from '../access-control/request-decorators.js';
import type { HostContext } from './tenancy.types.js';

@Controller('tenant')
export class TenantController {
  /** Public facts about the current host, for branding the sign-in pages. */
  @Get()
  @Public()
  current(@CurrentHost() host: HostContext): PublicTenantDto {
    if (host.kind !== 'school') return { host: host.kind === 'platform' ? 'platform' : 'root', school: null };
    const { school } = host;
    return {
      host: 'school',
      school: {
        id: school.id,
        slug: school.slug,
        name: school.name,
        defaultLocale: isLocale(school.defaultLocale) ? school.defaultLocale : 'en',
      },
    };
  }
}
