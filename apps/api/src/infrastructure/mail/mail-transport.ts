import { Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  /** Template name, kept for logs and tests. */
  readonly template: string;
}

/** Delivery provider abstraction. Add SES, Postmark, etc. by implementing this interface. */
export interface MailTransport {
  send(message: MailMessage): Promise<void>;
}

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

export class SmtpMailTransport implements MailTransport {
  private readonly transporter: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    this.transporter = createTransport(smtpUrl);
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}

/** Development fallback: logs that a message would be sent, never its body (tokens). */
export class LogMailTransport implements MailTransport {
  private readonly logger = new Logger('Mail');

  send(message: MailMessage): Promise<void> {
    this.logger.log({ to: message.to, template: message.template }, `Email "${message.subject}" (not sent)`);
    return Promise.resolve();
  }
}

/** Test transport: keeps messages in memory so tests can read links out of them. */
export class MemoryMailTransport implements MailTransport {
  readonly messages: MailMessage[] = [];

  send(message: MailMessage): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }

  /** Waits until a message matching `predicate` has been delivered. */
  async waitFor(predicate: (message: MailMessage) => boolean, timeoutMs = 10_000): Promise<MailMessage> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const found = this.messages.find(predicate);
      if (found) return found;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error('Timed out waiting for an email');
  }
}
