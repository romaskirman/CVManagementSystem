// src/types/index.d.ts
import { SessionUserDto } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface User extends SessionUserDto {}

    interface Request {
      requestId?: string;
    }
  }
}

export {};
