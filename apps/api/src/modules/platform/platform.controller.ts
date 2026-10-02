import { Controller, Get, Query } from '@nestjs/common';
import {
  listPlatformSchoolsQuerySchema,
  type ListPlatformSchoolsQuery,
  type PlatformOverviewDto,
  type PlatformSchoolDto,
} from '@shikkhacore/types';

import type { Page } from '../../common/http/page.js';
import { RequirePlatformPermissions } from '../access-control/access-policy.js';
import { PlatformService } from './platform.service.js';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('overview')
  @RequirePlatformPermissions('platform.schools.view')
  overview(): Promise<PlatformOverviewDto> {
    return this.platform.overview();
  }

  @Get('schools')
  @RequirePlatformPermissions('platform.schools.view')
  schools(
    @Query({ schema: listPlatformSchoolsQuerySchema }) query: ListPlatformSchoolsQuery,
  ): Promise<Page<PlatformSchoolDto>> {
    return this.platform.listSchools(query);
  }
}
