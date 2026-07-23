import { RequestUser } from '../../common/types/request-user.type';
import { isRecruiter } from '../../utils/permissions';
import { StatsRepository } from './stats.repository';

export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getPublicStats() {
    return this.statsRepository.getPublicStats();
  }

  async getLatestPositions() {
    const items = await this.statsRepository.getLatestPositions();

    return items.map((position) => ({
      id: position.id,
      title: position.title,
      shortDescription: position.shortDescription,
      visibilityMode: position.visibilityMode,
      company: position.company,
      level: position.level,
      maxProjects: position.maxProjects,
      submittedCvCount: position.cvs.length,
      updatedAt: position.updatedAt
    }));
  }

  async getMostPopularPositions() {
    const items = await this.statsRepository.getMostPopularPositions();

    return items.map((position) => ({
      id: position.id,
      title: position.title,
      shortDescription: position.shortDescription,
      visibilityMode: position.visibilityMode,
      company: position.company,
      level: position.level,
      maxProjects: position.maxProjects,
      submittedCvCount: position.cvs.length,
      updatedAt: position.updatedAt
    }));
  }

  async getTagCloud(currentUser?: RequestUser) {
    if (currentUser && isRecruiter(currentUser.roles)) {
      return this.statsRepository.getCvTagCloud();
    }

    return this.statsRepository.getPositionTagCloud();
  }
}
