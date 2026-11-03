import { Injectable } from '@nestjs/common';

import { SystemDatabase } from '../../infrastructure/database/system-database.js';

export interface ProvisionedUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly locale: string | null;
}

/**
 * Narrow user provisioning for member invitations.
 * Lives in AuthModule to keep cross-tenant identity access within the auth boundary.
 */
@Injectable()
export class UserProvisioningService {
  constructor(private readonly system: SystemDatabase) {}

  async findOrCreateForInvite(input: { email: string; name: string }): Promise<ProvisionedUser> {
    return this.system.client.user.upsert({
      where: { email: input.email },
      create: { email: input.email, name: input.name },
      update: {},
      select: { id: true, name: true, email: true, locale: true },
    });
  }
}
