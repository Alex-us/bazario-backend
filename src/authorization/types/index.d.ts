import { UserDTO } from '../../models/types/user';

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
}

export interface LoginResponse {
  token: string;
  user: UserDTO;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  deviceId: string;
  ip: string;
}

export interface RegisterResponse {
  token: string;
  user: UserDTO;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export type credentialsData = {
  email: string;
  password: string;
  deviceId: string;
  ip?: string;
  userAgent?: string;
};

export interface CognitoIdTokenPayload {
  id: string;
  deviceId: string;
}
