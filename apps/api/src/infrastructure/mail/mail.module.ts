import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import {
  LogMailTransport,
  MAIL_TRANSPORT,
  MemoryMailTransport,
  SmtpMailTransport,
  type MailTransport,
} from './mail-transport.js';
import { MailProcessor } from './mail.processor.js';
import { MAIL_QUEUE, MailService } from './mail.service.js';

function createTransport(config: AppConfig): MailTransport {
  switch (config.mail.transport) {
    case 'smtp':
      return new SmtpMailTransport(config.mail.smtpUrl ?? '', config.mail.from);
    case 'memory':
      return new MemoryMailTransport();
    case 'log':
      return new LogMailTransport();
  }
}

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [
    MailService,
    MailProcessor,
    { provide: MAIL_TRANSPORT, inject: [APP_CONFIG], useFactory: createTransport },
  ],
  exports: [MailService, MAIL_TRANSPORT],
})
export class MailModule {}
