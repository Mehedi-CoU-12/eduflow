import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

import { Access } from './access-policy.js';

/**
 * Fails application startup when any route handler lacks an access policy
 * (@Public, @Authenticated, @TenantMember, @RequirePermissions or
 * @RequirePlatformPermissions), so an unprotected endpoint can never ship by accident.
 */
@Injectable()
export class RoutePolicyCheck implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    const missing: string[] = [];
    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;
      const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;
      for (const name of this.scanner.getAllMethodNames(prototype)) {
        const handler = prototype[name];
        if (typeof handler !== 'function' || !Reflect.hasMetadata(PATH_METADATA, handler)) continue;
        if (!this.reflector.getAllAndOverride(Access, [handler, metatype])) missing.push(`${metatype.name}.${name}`);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Routes without an access policy: ${missing.join(', ')}`);
    }
  }
}
