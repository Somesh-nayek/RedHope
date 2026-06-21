import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [DonorController],
  providers: [DonorService]
})
export class DonorModule {}
