import { Module } from '@nestjs/common';

import { PlatformAccessService } from './platform-access.service.js';
import { PlatformController } from './platform.controller.js';
import { PlatformService } from './platform.service.js';

@Module({
  controllers: [PlatformController],
  providers: [PlatformAccessService, PlatformService],
  exports: [PlatformAccessService],
})
export class PlatformModule {}
