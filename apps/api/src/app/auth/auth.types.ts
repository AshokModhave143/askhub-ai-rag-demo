export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}
