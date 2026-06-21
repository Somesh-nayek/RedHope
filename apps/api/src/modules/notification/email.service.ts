import { Injectable } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

@Injectable()
export class NoopEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    void message;
    await Promise.resolve();
  }
}
