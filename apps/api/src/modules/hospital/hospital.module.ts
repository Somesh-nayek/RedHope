import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [HospitalController],
  providers: [HospitalService]
})
export class HospitalModule {}
