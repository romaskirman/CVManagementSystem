import cors from 'cors';
import { env } from './env';

export const corsMiddleware = cors({
  origin: env.CLIENT_URL,
  credentials: true
});
