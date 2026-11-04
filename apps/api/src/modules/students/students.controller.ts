import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  admitStudentSchema,
  linkGuardianStudentSchema,
  listStudentsQuerySchema,
  transferStudentsSchema,
  updateStudentProfileSchema,
  uuidSchema,
  type AdmitStudentInput,
  type GuardianLinkDetailDto,
  type LinkGuardianStudentInput,
  type ListStudentsQuery,
  type SectionRosterDto,
  type StudentProfileDto,
  type TransferStudentsInput,
  type UpdateStudentProfileInput,
} from '@eduflow/types';

import type { RequestMeta } from '../../common/http/request-context.js';
import { RequirePermissions } from '../access-control/access-policy.js';
import { CurrentTenant, ReqMeta } from '../access-control/request-decorators.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { StudentsService } from './students.service.js';

@Controller()
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  // ---------------------------------------------------------------------------
  // Admissions & Student Profiles
  // ---------------------------------------------------------------------------

  @Post('students/admit')
  @RequirePermissions('students.create')
  admit(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: admitStudentSchema }) input: AdmitStudentInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<StudentProfileDto> {
    return this.students.admitStudent(tenant, input, meta);
  }

  @Get('students')
  @RequirePermissions('students.view')
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listStudentsQuerySchema }) query: ListStudentsQuery,
  ): Promise<StudentProfileDto[]> {
    return this.students.listStudents(tenant, query);
  }

  @Get('students/:id')
  @RequirePermissions('students.view')
  get(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
  ): Promise<StudentProfileDto> {
    return this.students.getStudent(tenant, id);
  }

  @Patch('students/:id')
  @RequirePermissions('students.update')
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateStudentProfileSchema }) input: UpdateStudentProfileInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<StudentProfileDto> {
    return this.students.updateStudent(tenant, id, input, meta);
  }

  @Get('students/:id/guardians')
  @RequirePermissions('students.view')
  listStudentGuardians(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
  ): Promise<GuardianLinkDetailDto[]> {
    return this.students.listStudentGuardians(tenant, id);
  }

  // ---------------------------------------------------------------------------
  // Section Rostering
  // ---------------------------------------------------------------------------

  @Get('rostering/sections/:sectionId/students')
  @RequirePermissions('academics.view')
  getSectionRoster(
    @CurrentTenant() tenant: TenantContext,
    @Param('sectionId', { schema: uuidSchema }) sectionId: string,
  ): Promise<SectionRosterDto> {
    return this.students.getSectionRoster(tenant, sectionId);
  }

  @Post('rostering/transfer')
  @RequirePermissions('academics.manage')
  transfer(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: transferStudentsSchema }) input: TransferStudentsInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<{ transferredCount: number }> {
    return this.students.transferStudents(tenant, input, meta);
  }

  // ---------------------------------------------------------------------------
  // Guardian Relationship Linking
  // ---------------------------------------------------------------------------

  @Get('guardians/:guardianUserId/students')
  @RequirePermissions('users.view')
  listGuardianStudents(
    @CurrentTenant() tenant: TenantContext,
    @Param('guardianUserId', { schema: uuidSchema }) guardianUserId: string,
  ): Promise<GuardianLinkDetailDto[]> {
    return this.students.listGuardianStudents(tenant, guardianUserId);
  }

  @Post('guardians/:guardianUserId/students')
  @RequirePermissions('users.update')
  linkGuardian(
    @CurrentTenant() tenant: TenantContext,
    @Param('guardianUserId', { schema: uuidSchema }) guardianUserId: string,
    @Body({ schema: linkGuardianStudentSchema }) input: LinkGuardianStudentInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<GuardianLinkDetailDto> {
    return this.students.linkGuardianStudent(tenant, guardianUserId, input, meta);
  }

  @Delete('guardians/:guardianUserId/students/:studentId')
  @RequirePermissions('users.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkGuardian(
    @CurrentTenant() tenant: TenantContext,
    @Param('guardianUserId', { schema: uuidSchema }) guardianUserId: string,
    @Param('studentId', { schema: uuidSchema }) studentId: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.students.unlinkGuardianStudent(tenant, guardianUserId, studentId, meta);
  }
}}
