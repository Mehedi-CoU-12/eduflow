import { Injectable } from '@nestjs/common';

import { SystemDatabase } from '../../infrastructure/database/system-database.js';

export interface ProvisionedUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly locale: string | null;
  readonly hasCredential: boolean;
}

/**
 * Narrow user provisioning for member invitations.
 * Lives in AuthModule to keep cross-tenant identity access within the auth boundary.
 */
@Injectable()
export class UserProvisioningService {
  constructor(private readonly system: SystemDatabase) {}

  async findOrCreateForInvite(input: { email: string; name: string }): Promise<ProvisionedUser> {
    const user = await this.system.client.user.upsert({
      where: { email: input.email },
      create: { email: input.email, name: input.name },
      update: {},
      select: {
        id: true,
        name: true,
        email: true,
        locale: true,
        credential: { select: { userId: true } },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      locale: user.locale,
      hasCredential: Boolean(user.credential),
    };
  }
}
