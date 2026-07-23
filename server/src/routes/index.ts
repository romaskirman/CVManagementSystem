import { Router } from 'express';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { preferencesRouter } from './preferences.routes';
import { profileRouter } from './profile.routes';
import { projectsRouter } from './projects.routes';
import { attributesRouter } from './attributes.routes';
import { positionsRouter } from './positions.routes';
import { cvRouter } from './cv.routes';
import { discussionsRouter } from './discussions.routes';
import { likesRouter } from './likes.routes';
import { statsRouter } from './stats.routes';
import { searchRouter } from './search.routes';
import { adminRouter } from './admin.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    name: 'CV Management System API',
    version: '1.0.0',
    status: 'ok'
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/preferences', preferencesRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/attributes', attributesRouter);
apiRouter.use('/positions', positionsRouter);
apiRouter.use('/cv', cvRouter);
apiRouter.use('/discussion', discussionsRouter);
apiRouter.use('/likes', likesRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/admin', adminRouter);
