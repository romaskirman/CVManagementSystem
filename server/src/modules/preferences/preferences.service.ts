import { Language, Theme } from '@prisma/client';
import { PreferencesRepository } from './preferences.repository';
import { UpdatePreferencesInput } from './preferences.types';

export class PreferencesService {
  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  async getMyPreferences(userId: string) {
    const prefs = await this.preferencesRepository.getByUserId(userId);

    return (
      prefs ?? {
        userId,
        theme: Theme.LIGHT,
        language: Language.EN
      }
    );
  }

  async updateMyPreferences(userId: string, input: UpdatePreferencesInput) {
    return this.preferencesRepository.upsertByUserId(userId, {
      theme: input.theme as Theme | undefined,
      language: input.language as Language | undefined
    });
  }
}
