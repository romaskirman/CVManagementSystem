import { AttributesRepository } from './attributes.repository';

export class RecentAttributesService {
  constructor(private readonly attributesRepository: AttributesRepository) {}

  async markAsUsed(userId: string, attributeId: string): Promise<void> {
    await this.attributesRepository.markAttributeAsRecentlyUsed(userId, attributeId);
  }
}
