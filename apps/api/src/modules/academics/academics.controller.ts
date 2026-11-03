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
  createAcademicYearSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  createTermSchema,
  listAcademicYearsQuerySchema,
  listClassesQuerySchema,
  listSectionsQuerySchema,
  listSubjectsQuerySchema,
  listTermsQuerySchema,
  updateAcademicYearSchema,
  updateClassSchema,
  updateSectionSchema,
  updateSubjectSchema,
  updateTermSchema,
  uuidSchema,
  type AcademicYearDto,
  type ClassDto,
  type CreateAcademicYearInput,
  type CreateClassInput,
  type CreateSectionInput,
  type CreateSubjectInput,
  type CreateTermInput,
  type ListAcademicYearsQuery,
  type ListClassesQuery,
  type ListSectionsQuery,
  type ListSubjectsQuery,
  type ListTermsQuery,
  type SectionDto,
  type SubjectDto,
  type TermDto,
  type UpdateAcademicYearInput,
  type UpdateClassInput,
  type UpdateSectionInput,
  type UpdateSubjectInput,
  type UpdateTermInput,
} from '@eduflow/types';

import type { RequestMeta } from '../../common/http/request-context.js';
import { RequirePermissions } from '../access-control/access-policy.js';
import { CurrentTenant, ReqMeta } from '../access-control/request-decorators.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { AcademicsService } from './academics.service.js';

@Controller('academics')
export class AcademicsController {
  constructor(private readonly academics: AcademicsService) {}

  // ---------------------------------------------------------------------------
  // Academic Years
  // ---------------------------------------------------------------------------

  @Get('years')
  @RequirePermissions('academics.view')
  listAcademicYears(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listAcademicYearsQuerySchema }) query: ListAcademicYearsQuery,
  ): Promise<AcademicYearDto[]> {
    return this.academics.listAcademicYears(tenant, query);
  }

  @Get('years/:id')
  @RequirePermissions('academics.view')
  getAcademicYear(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
  ): Promise<AcademicYearDto> {
    return this.academics.getAcademicYear(tenant, id);
  }

  @Post('years')
  @RequirePermissions('academics.manage')
  createAcademicYear(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: createAcademicYearSchema }) input: CreateAcademicYearInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<AcademicYearDto> {
    return this.academics.createAcademicYear(tenant, input, meta);
  }

  @Patch('years/:id')
  @RequirePermissions('academics.manage')
  updateAcademicYear(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateAcademicYearSchema }) input: UpdateAcademicYearInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<AcademicYearDto> {
    return this.academics.updateAcademicYear(tenant, id, input, meta);
  }

  @Delete('years/:id')
  @RequirePermissions('academics.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAcademicYear(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.academics.deleteAcademicYear(tenant, id, meta);
  }

  // ---------------------------------------------------------------------------
  // Terms
  // ---------------------------------------------------------------------------

  @Get('terms')
  @RequirePermissions('academics.view')
  listTerms(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listTermsQuerySchema }) query: ListTermsQuery,
  ): Promise<TermDto[]> {
    return this.academics.listTerms(tenant, query);
  }

  @Get('terms/:id')
  @RequirePermissions('academics.view')
  getTerm(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
  ): Promise<TermDto> {
    return this.academics.getTerm(tenant, id);
  }

  @Post('terms')
  @RequirePermissions('academics.manage')
  createTerm(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: createTermSchema }) input: CreateTermInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<TermDto> {
    return this.academics.createTerm(tenant, input, meta);
  }

  @Patch('terms/:id')
  @RequirePermissions('academics.manage')
  updateTerm(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateTermSchema }) input: UpdateTermInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<TermDto> {
    return this.academics.updateTerm(tenant, id, input, meta);
  }

  @Delete('terms/:id')
  @RequirePermissions('academics.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTerm(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.academics.deleteTerm(tenant, id, meta);
  }

  // ---------------------------------------------------------------------------
  // Classes
  // ---------------------------------------------------------------------------

  @Get('classes')
  @RequirePermissions('academics.view')
  listClasses(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listClassesQuerySchema }) query: ListClassesQuery,
  ): Promise<ClassDto[]> {
    return this.academics.listClasses(tenant, query);
  }

  @Get('classes/:id')
  @RequirePermissions('academics.view')
  getClass(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
  ): Promise<ClassDto> {
    return this.academics.getClass(tenant, id);
  }

  @Post('classes')
  @RequirePermissions('academics.manage')
  createClass(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: createClassSchema }) input: CreateClassInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<ClassDto> {
    return this.academics.createClass(tenant, input, meta);
  }

  @Patch('classes/:id')
  @RequirePermissions('academics.manage')
  updateClass(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateClassSchema }) input: UpdateClassInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<ClassDto> {
    return this.academics.updateClass(tenant, id, input, meta);
  }

  @Delete('classes/:id')
  @RequirePermissions('academics.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteClass(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.academics.deleteClass(tenant, id, meta);
  }

  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  @Get('sections')
  @RequirePermissions('academics.view')
  listSections(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listSectionsQuerySchema }) query: ListSectionsQuery,
  ): Promise<SectionDto[]> {
    return this.academics.listSections(tenant, query);
  }

  @Get('sections/:id')
  @RequirePermissions('academics.view')
  getSection(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
  ): Promise<SectionDto> {
    return this.academics.getSection(tenant, id);
  }

  @Post('sections')
  @RequirePermissions('academics.manage')
  createSection(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: createSectionSchema }) input: CreateSectionInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<SectionDto> {
    return this.academics.createSection(tenant, input, meta);
  }

  @Patch('sections/:id')
  @RequirePermissions('academics.manage')
  updateSection(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateSectionSchema }) input: UpdateSectionInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<SectionDto> {
    return this.academics.updateSection(tenant, id, input, meta);
  }

  @Delete('sections/:id')
  @RequirePermissions('academics.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSection(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.academics.deleteSection(tenant, id, meta);
  }

  // ---------------------------------------------------------------------------
  // Subjects
  // ---------------------------------------------------------------------------

  @Get('subjects')
  @RequirePermissions('academics.view')
  listSubjects(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listSubjectsQuerySchema }) query: ListSubjectsQuery,
  ): Promise<SubjectDto[]> {
    return this.academics.listSubjects(tenant, query);
  }

  @Get('subjects/:id')
  @RequirePermissions('academics.view')
  getSubject(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
  ): Promise<SubjectDto> {
    return this.academics.getSubject(tenant, id);
  }

  @Post('subjects')
  @RequirePermissions('academics.manage')
  createSubject(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: createSubjectSchema }) input: CreateSubjectInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<SubjectDto> {
    return this.academics.createSubject(tenant, input, meta);
  }

  @Patch('subjects/:id')
  @RequirePermissions('academics.manage')
  updateSubject(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateSubjectSchema }) input: UpdateSubjectInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<SubjectDto> {
    return this.academics.updateSubject(tenant, id, input, meta);
  }

  @Delete('subjects/:id')
  @RequirePermissions('academics.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSubject(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', { schema: uuidSchema }) id: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.academics.deleteSubject(tenant, id, meta);
  }
}
