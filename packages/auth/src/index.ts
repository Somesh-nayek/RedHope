import jwt, { type SignOptions } from 'jsonwebtoken';
import { UserRole, type AuthUser } from '@red-hope/types';

export { UserRole };

export enum Permission {
  ManageUsers = 'manage:users',
  ManageDonations = 'manage:donations',
  ReadReports = 'read:reports',
  ReadOwnProfile = 'read:own-profile'
}

export type JwtPayload = AuthUser & {
  sub: string;
};

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.Admin]: [
    Permission.ManageUsers,
    Permission.ManageDonations,
    Permission.ReadReports,
    Permission.ReadOwnProfile
  ],
  [UserRole.Manager]: [
    Permission.ManageDonations,
    Permission.ReadReports,
    Permission.ReadOwnProfile
  ],
  [UserRole.Volunteer]: [Permission.ReadReports, Permission.ReadOwnProfile],
  [UserRole.Viewer]: [Permission.ReadOwnProfile]
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function signJwt(
  payload: AuthUser,
  secret: string,
  expiresIn: SignOptions['expiresIn'] = '2h',
): string {
  return jwt.sign(payload, secret, {
    subject: payload.id,
    expiresIn
  });
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const payload = jwt.verify(token, secret) as JwtPayload;

  return {
    id: String(payload.id),
    sub: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role
  };
}
