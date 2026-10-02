import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { renderMail, type MailTemplateName } from './mail-templates.js';
import type { MailMessage } from './mail-transport.js';

export const MAIL_QUEUE = 'mail';

export interface SendMailInput {
  readonly to: string;
  readonly template: MailTemplateName;
  readonly locale: string | null | undefined;
  readonly name: string;
  readonly url: string;
}

/**
 * Renders a message and enqueues it; MailProcessor delivers it in the background.
 * Completed jobs are removed straight away because the payload may contain a
 * single-use token.
 */
@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue<MailMessage>) {}

  async send(input: SendMailInput): Promise<void> {
    const rendered = renderMail(input.template, input.locale, { name: input.name, url: input.url });
    await this.queue.add(
      input.template,
      { to: input.to, template: input.template, ...rendered },
      { removeOnComplete: true },
    );
  }
}
