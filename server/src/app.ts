import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './config/passport';
import { corsMiddleware } from './config/cors';
import { sessionMiddleware } from './config/session';
import { apiRouter } from './routes';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

export const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'cv-management-system-api'
  });
});

app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

app.use(errorMiddleware);
