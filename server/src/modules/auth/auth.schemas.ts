import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6)
    .max(6)
    .regex(/^\d{6}$/, 'Verification code must contain 6 digits')
});

export const resendVerificationCodeSchema = z.object({
  email: z.string().email().optional()
});
