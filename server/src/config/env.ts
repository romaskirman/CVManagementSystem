import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  SERVER_PORT: z.coerce.number().int().positive().default(4000),
  SERVER_URL: z.string().url(),
  CLIENT_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  SESSION_SECRET: z.string().min(10),
  SESSION_NAME: z.string().min(1).default('cvms.sid'),

  GOOGLE_CLIENT_ID: z.string().min(1).optional().or(z.literal('')),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional().or(z.literal('')),
  GOOGLE_CALLBACK_URL: z.string().url().optional().or(z.literal('')),

  FACEBOOK_CLIENT_ID: z.string().min(1).optional().or(z.literal('')),
  FACEBOOK_CLIENT_SECRET: z.string().min(1).optional().or(z.literal('')),
  FACEBOOK_CALLBACK_URL: z.string().url().optional().or(z.literal('')),

  ADMIN_EMAIL: z.string().email().optional().or(z.literal('')),
  ADMIN_PASSWORD: z.string().min(8).optional().or(z.literal('')),

  CLOUDINARY_CLOUD_NAME: z.string().optional().or(z.literal('')),
  CLOUDINARY_API_KEY: z.string().optional().or(z.literal('')),
  CLOUDINARY_API_SECRET: z.string().optional().or(z.literal(''))
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  IS_PRODUCTION: parsedEnv.data.NODE_ENV === 'production'
};
