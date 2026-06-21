import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { DonorModule } from './modules/donor/donor.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env"
    }),
    AuthModule,
    HealthModule,
    AdminModule,
    DonorModule,
    HospitalModule,
    NotificationModule
  ]
})
export class AppModule {}
