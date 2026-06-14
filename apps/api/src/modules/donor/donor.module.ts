import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';

@Module({
  imports: [AuthModule],
  controllers: [DonorController],
  providers: [DonorService]
})
export class DonorModule {}
