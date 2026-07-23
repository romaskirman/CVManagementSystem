import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { env } from './env';

const PgStore = connectPgSimple(session);

const pool = new Pool({
  connectionString: env.DATABASE_URL
});

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  name: env.SESSION_NAME,
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: env.IS_PRODUCTION ? 'none' : 'lax',
    secure: env.IS_PRODUCTION,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
});
