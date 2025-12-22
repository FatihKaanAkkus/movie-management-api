export interface IJwtPayload {
  // Subject (user ID)
  sub: string;
  // User role
  role: string;
  // Session ID
  sid: string;
}
