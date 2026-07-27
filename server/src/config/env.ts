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

  GITHUB_CLIENT_ID: z.string().min(1).optional().or(z.literal('')),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional().or(z.literal('')),
  GITHUB_CALLBACK_URL: z.string().url().optional().or(z.literal('')),

  ADMIN_EMAIL: z.string().email().optional().or(z.literal('')),
  ADMIN_PASSWORD: z.string().min(8).optional().or(z.literal('')),

  RESEND_FROM: z.string().email().optional().or(z.literal('')),

  CLOUDINARY_CLOUD_NAME: z.string().optional().or(z.literal('')),
  CLOUDINARY_API_KEY: z.string().optional().or(z.literal('')),
  CLOUDINARY_API_SECRET: z.string().optional().or(z.literal(''))
});

type ResendTarget = {
  index: number;
  apiKey: string;
  to: string;
};

function collectResendTargets(source: NodeJS.ProcessEnv): ResendTarget[] {
  const indexes = new Set<number>();

  for (const key of Object.keys(source)) {
    const apiKeyMatch = key.match(/^RESEND_API_KEY_(\d+)$/);
    const toMatch = key.match(/^RESEND_TO_(\d+)$/);

    if (apiKeyMatch) {
      indexes.add(Number(apiKeyMatch[1]));
    }

    if (toMatch) {
      indexes.add(Number(toMatch[1]));
    }
  }

  const targets = Array.from(indexes)
    .sort((a, b) => a - b)
    .map((index) => {
      const apiKey = source[`RESEND_API_KEY_${index}`]?.trim() ?? '';
      const to = source[`RESEND_TO_${index}`]?.trim() ?? '';

      if (!apiKey || !to) {
        throw new Error(
          `Incomplete Resend pair for index ${index}. Expected RESEND_API_KEY_${index} and RESEND_TO_${index}.`
        );
      }

      const emailCheck = z.string().email().safeParse(to);

      if (!emailCheck.success) {
        throw new Error(`Invalid RESEND_TO_${index}: must be a valid email address.`);
      }

      return {
        index,
        apiKey,
        to
      };
    });

  return targets;
}

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

let resendTargets: ResendTarget[] = [];

try {
  resendTargets = collectResendTargets(process.env);
} catch (error) {
  console.error(
    'Invalid Resend indexed environment variables:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}

if (resendTargets.length > 0 && !parsedEnv.data.RESEND_FROM) {
  console.error('RESEND_FROM is required when indexed Resend targets are configured.');
  process.exit(1);
}

console.log('[env] RESEND configuration loaded', {
  resendFrom: parsedEnv.data.RESEND_FROM || null,
  resendTargets: resendTargets.map((target) => ({
    index: target.index,
    to: target.to,
    apiKeyMasked:
      target.apiKey.length <= 12
        ? target.apiKey
        : `${target.apiKey.slice(0, 8)}...${target.apiKey.slice(-4)}`
  }))
});

export const env = {
  ...parsedEnv.data,
  RESEND_TARGETS: resendTargets,
  IS_PRODUCTION: parsedEnv.data.NODE_ENV === 'production'
};
