import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNAPPROVED_HOSPITAL_KEY = 'allowUnapprovedHospital';
export const AllowUnapprovedHospital = () => SetMetadata(ALLOW_UNAPPROVED_HOSPITAL_KEY, true);
