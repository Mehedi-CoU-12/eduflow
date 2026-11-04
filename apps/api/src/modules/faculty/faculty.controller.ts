import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  createFacultyAssignmentSchema,
  listFacultyAssignmentsQuerySchema,
  uuidSchema,
  type CreateFacultyAssignmentInput,
  type EligibleTeacherDto,
  type FacultyAssignmentDetailDto,
  type ListFacultyAssignmentsQuery,
} from '@eduflow/types';

import type { RequestMeta } from '../../common/http/request-context.js';
import { RequirePermissions } from '../access-control/access-policy.js';
import { CurrentTenant, ReqMeta } from '../access-control/request-decorators.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { FacultyService } from './faculty.service.js';

@Controller('faculty-assignments')
export class FacultyController {
  constructor(private readonly faculty: FacultyService) {}

  @Get()
  @RequirePermissions('academics.view')
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listFacultyAssignmentsQuerySchema }) query: ListFacultyAssignmentsQuery,
  ): Promise<FacultyAssignmentDetailDto[]> {
    return this.faculty.listAssignments(tenant, query);
  }

  @Post()
  @RequirePermissions('academics.manage')
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: createFacultyAssignmentSchema }) input: CreateFacultyAssignmentInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<FacultyAssignmentDetailDto> {
    return this.faculty.createAssignment(tenant, input, meta);
  }

  @Delete(':id')
  @RequirePermissions('academics.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.faculty.deleteAssignment(tenant, id, meta);
  }

  @Get('teachers')
  @RequirePermissions('academics.view')
  listTeachers(@CurrentTenant() tenant: TenantContext): Promise<EligibleTeacherDto[]> {
    return this.faculty.listEligibleTeachers(tenant);
  }
}
