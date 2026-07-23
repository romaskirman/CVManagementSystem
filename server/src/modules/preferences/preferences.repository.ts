import { prisma } from '../../config/db';
import { Language, Theme } from '@prisma/client';

export class PreferencesRepository {
  async getByUserId(userId: string) {
    return prisma.userPreference.findUnique({
      where: { userId }
    });
  }

  async upsertByUserId(userId: string, input: { theme?: Theme; language?: Language }) {
    return prisma.userPreference.upsert({
      where: { userId },
      update: {
        ...(input.theme ? { theme: input.theme } : {}),
        ...(input.language ? { language: input.language } : {})
      },
      create: {
        userId,
        theme: input.theme ?? Theme.LIGHT,
        language: input.language ?? Language.EN
      }
    });
  }
}
