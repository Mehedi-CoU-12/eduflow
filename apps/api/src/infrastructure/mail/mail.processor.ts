import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import type { Job } from 'bullmq';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { MAIL_TRANSPORT, type MailMessage, type MailTransport } from './mail-transport.js';
import { MAIL_QUEUE } from './mail.service.js';

/**
 * Delivers queued email. The worker starts only when WORKER_ENABLED=true, so the API
 * can run without consuming jobs while `dist/worker.js` processes them elsewhere.
 */
@Processor(MAIL_QUEUE, { autorun: false })
export class MailProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    super();
  }

  onApplicationBootstrap(): void {
    if (!this.config.queue.workerEnabled) return;
    this.worker.run().catch((error: unknown) => this.logger.error({ err: error }, 'Mail worker stopped'));
  }

  async process(job: Job<MailMessage>): Promise<void> {
    await this.transport.send(job.data);
    this.logger.log({ jobId: job.id, template: job.data.template }, 'Email delivered');
  }
}
