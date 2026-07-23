import passport, { DoneCallback } from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback as GoogleVerifyCallback
} from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { prisma } from './db';
import { env } from './env';
import { RoleCode, Theme, Language, AuthProvider } from '@prisma/client';

type SessionUser = {
  id: string;
  email: string;
  isBlocked: boolean;
  roles: RoleCode[];
};

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
    roles: user.roles.map((item) => item.role.code)
  };
}

passport.serializeUser((user, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (userId: string, done: DoneCallback) => {
  try {
    const sessionUser = await buildSessionUser(userId);
    done(null, sessionUser || false);
  } catch (error) {
    done(error as Error, false);
  }
});

async function ensureDefaultCandidateRole(userId: string) {
  const role = await prisma.role.findUnique({
    where: { code: RoleCode.CANDIDATE }
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

async function ensurePreferenceAndProfile(userId: string) {
  await prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      theme: Theme.LIGHT,
      language: Language.EN
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
  const existingOauth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: params.provider,
        providerUserId: params.providerUserId
      }
    },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  if (existingOauth) {
    return {
      id: existingOauth.user.id,
      email: existingOauth.user.email,
      isBlocked: existingOauth.user.isBlocked,
      roles: existingOauth.user.roles.map((item) => item.role.code)
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: params.email }
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: params.email
      }
    }));

  await prisma.oAuthAccount.create({
    data: {
      userId: user.id,
      provider: params.provider,
      providerUserId: params.providerUserId
    }
  });

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
            return done(new Error('Google account email is not available'));
          }

          const user = await findOrCreateOAuthUser({
            email,
            provider: AuthProvider.GOOGLE,
            providerUserId: profile.id
          });

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET && env.FACEBOOK_CALLBACK_URL) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
        callbackURL: env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'emails', 'name']
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: FacebookProfile,
        done: DoneCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('Facebook account email is not available'));
          }

          const user = await findOrCreateOAuthUser({
            email,
            provider: AuthProvider.FACEBOOK,
            providerUserId: profile.id
          });

          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

export { passport };
