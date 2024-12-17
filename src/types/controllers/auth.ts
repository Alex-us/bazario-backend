import { UserDTO } from '../models/User/types';

export interface LoginRequest {
  email: string;
  password: string;
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

export interface ActivateUserRequest {
  token: string;
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

export interface GeneralSuccessResponse {
  message: string;
}
