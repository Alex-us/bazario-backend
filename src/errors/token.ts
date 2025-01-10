export class TokenError extends Error {}

export class AccessTokenError extends TokenError {}
export class RefreshTokenError extends TokenError {}
export class ActivationTokenError extends TokenError {}
export class ResetPasswordTokenError extends TokenError {}
