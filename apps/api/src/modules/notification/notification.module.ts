import { Module } from '@nestjs/common';
import { NoopEmailService } from './email.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NoopEmailService],
  exports: [NotificationService]
})
export class NotificationModule {}
