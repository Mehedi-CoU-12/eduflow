import { Controller, Get, Query } from '@nestjs/common';
import {
  guardianDashboardQuerySchema,
  type AdminDashboardDto,
  type TeacherDashboardDto,
  type StudentDashboardDto,
  type GuardianDashboardDto,
  type AccountantDashboardDto,
  type PlannedModuleDto,
  type UserWorkspacesDto,
  type GuardianDashboardQuery,
} from '@eduflow/types';

import { RequirePermissions, TenantMember } from '../access-control/access-policy.js';
import { CurrentTenant } from '../access-control/request-decorators.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /**
   * Returns all authorized workspace types for the current authenticated member.
   */
  @Get('workspaces')
  @TenantMember()
  getAvailableWorkspaces(@CurrentTenant() tenant: TenantContext): UserWorkspacesDto {
    return this.dashboard.getAvailableWorkspaces(tenant);
  }

  /**
   * School Owner & Administrator Dashboard.
   * Requires school.view permission.
   */
  @Get('admin')
  @RequirePermissions('school.view')
  getAdminDashboard(@CurrentTenant() tenant: TenantContext): Promise<AdminDashboardDto> {
    return this.dashboard.getAdminDashboard(tenant);
  }

  /**
   * Teacher Dashboard.
   * Scoped to the teacher's assigned classes and sections.
   * Requires academics.view permission.
   */
  @Get('teacher')
  @RequirePermissions('academics.view')
  getTeacherDashboard(@CurrentTenant() tenant: TenantContext): Promise<TeacherDashboardDto> {
    return this.dashboard.getTeacherDashboard(tenant);
  }

  /**
   * Student Dashboard.
   * Scoped strictly to the student's own enrolled profile.
   * Requires academics.view permission.
   */
  @Get('student')
  @RequirePermissions('academics.view')
  getStudentDashboard(@CurrentTenant() tenant: TenantContext): Promise<StudentDashboardDto> {
    return this.dashboard.getStudentDashboard(tenant);
  }

  /**
   * Guardian / Parent Dashboard.
   * Scoped strictly to the guardian's explicitly linked children.
   * Validates studentId parameter to prevent unauthorized child access.
   * Requires academics.view permission.
   */
  @Get('guardian')
  @RequirePermissions('academics.view')
  getGuardianDashboard(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: guardianDashboardQuerySchema }) query: GuardianDashboardQuery,
  ): Promise<GuardianDashboardDto> {
    return this.dashboard.getGuardianDashboard(tenant, query);
  }

  /**
   * Accountant Dashboard.
   * Requires fees.view permission.
   */
  @Get('accountant')
  @RequirePermissions('fees.view')
  getAccountantDashboard(@CurrentTenant() tenant: TenantContext): Promise<AccountantDashboardDto> {
    return this.dashboard.getAccountantDashboard(tenant);
  }

  /**
   * Librarian Workspace Summary.
   * Requires school.view permission.
   */
  @Get('librarian')
  @RequirePermissions('school.view')
  getLibrarianDashboard(@CurrentTenant() tenant: TenantContext): PlannedModuleDto {
    return this.dashboard.getLibrarianDashboard(tenant);
  }

  /**
   * HR Staff Workspace Summary.
   * Requires users.view permission.
   */
  @Get('hr')
  @RequirePermissions('users.view')
  getHrDashboard(@CurrentTenant() tenant: TenantContext): Promise<PlannedModuleDto> {
    return this.dashboard.getHrDashboard(tenant);
  }
}
