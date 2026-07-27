import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback as GoogleVerifyCallback
} from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { AuthProvider } from '@prisma/client';
import { prisma } from './db';
import { env } from './env';

type SessionUser = {
  id: string;
  email: string;
  isBlocked: boolean;
  isAuthorized: boolean;
  roles: string[];
};

type PassportDone = (error: Error | null, user?: Express.User | false) => void;

async function buildSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    isBlocked: user.isBlocked,
    isAuthorized: user.isAuthorized,
    roles: user.roles.map((item) => item.role.code)
  };
}

passport.serializeUser((user, done) => {
  done(null, (user as SessionUser).id);
});

passport.deserializeUser(async (userId: string, done: PassportDone) => {
  try {
    const sessionUser = await buildSessionUser(userId);

    if (!sessionUser) {
      done(null, false);
      return;
    }

    done(null, sessionUser as Express.User);
  } catch (error) {
    done(error as Error);
  }
});

async function ensureDefaultCandidateRole(userId: string): Promise<void> {
  const role = await prisma.role.findFirst({
    where: { code: 'CANDIDATE' }
  });

  if (!role) {
    throw new Error('Candidate role is not seeded');
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId,
      roleId: role.id
    }
  });
}

async function ensurePreferenceAndProfile(userId: string): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      theme: 'LIGHT',
      language: 'EN'
    }
  });

  await prisma.candidateProfile.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });
}

async function findOrCreateOAuthUser(params: {
  email: string;
  provider: AuthProvider;
  providerUserId: string;
}): Promise<SessionUser> {
  const normalizedEmail = params.email.trim().toLowerCase();

  const existingOauth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: params.provider,
        providerUserId: params.providerUserId
      }
    }
  });

  if (existingOauth) {
    const oauthUser = await prisma.user.findUnique({
      where: { id: existingOauth.userId }
    });

    if (!oauthUser) {
      throw new Error('OAuth account is linked to a missing user');
    }

    if (!oauthUser.isAuthorized) {
      await prisma.user.update({
        where: { id: oauthUser.id },
        data: {
          isAuthorized: true,
          authorizedAt: new Date()
        }
      });
    }

    const built = await buildSessionUser(oauthUser.id);

    if (!built) {
      throw new Error('Failed to build session user for existing OAuth user');
    }

    return built;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: normalizedEmail,
        isAuthorized: true,
        authorizedAt: new Date()
      }
    }));

  if (existingUser && !existingUser.isAuthorized) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isAuthorized: true,
        authorizedAt: new Date()
      }
    });
  }

  const existingAccount = await prisma.oAuthAccount.findFirst({
    where: {
      userId: user.id,
      provider: params.provider,
      providerUserId: params.providerUserId
    }
  });

  if (!existingAccount) {
    await prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: params.provider,
        providerUserId: params.providerUserId
      }
    });
  }

  await ensureDefaultCandidateRole(user.id);
  await ensurePreferenceAndProfile(user.id);

  const built = await buildSessionUser(user.id);

  if (!built) {
    throw new Error('Failed to build session user after OAuth login');
  }

  return built;
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: GoogleVerifyCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            done(new Error('Google account email is not available'));
            return;
          }

          const user = await findOrCreateOAuthUser({
            email,
            provider: AuthProvider.GOOGLE,
            providerUserId: profile.id
          });

          done(null, user as Express.User);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ['user:email']
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: PassportDone
      ) => {
        try {
          const primaryEmail = profile.emails?.[0]?.value;

          if (!primaryEmail) {
            done(new Error('GitHub account email is not available'));
            return;
          }

          const user = await findOrCreateOAuthUser({
            email: primaryEmail,
            provider: AuthProvider.GITHUB,
            providerUserId: profile.id
          });

          done(null, user as Express.User);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

export { passport };
