import { ProjectsRepository } from './projects.repository';

export class TagsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async getOrCreateTagIds(tagNames: string[]): Promise<string[]> {
    const uniqueNames = Array.from(
      new Set(tagNames.map((tag) => tag.trim()).filter(Boolean))
    );

    const tags = [];

    for (const name of uniqueNames) {
      const tag = await this.projectsRepository.upsertTagByName(name);
      tags.push(tag);
    }

    return tags.map((tag) => tag.id);
  }

  async suggestTags(query: string) {
    return this.projectsRepository.findTagsByPrefix(query);
  }
}
