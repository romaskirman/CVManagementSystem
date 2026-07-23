import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { RequestUser } from '../../common/types/request-user.type';
import { getPagination } from '../../utils/pagination';
import { isAdmin, isRecruiter } from '../../utils/permissions';
import { GlobalSearchQuery } from './search.types';
import { SearchRepository } from './search.repository';

export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async globalSearch(query: GlobalSearchQuery, currentUser?: RequestUser) {
    const pagination = getPagination(query);
    const scope = query.scope ?? 'ALL';

    if (scope === 'USERS' && !currentUser) {
      throw new ForbiddenError('Authentication required for user search');
    }

    if (scope === 'USERS' && currentUser && !isAdmin(currentUser.roles)) {
      throw new ForbiddenError('Only administrators can search users');
    }

    if (scope === 'CVS' && !currentUser) {
      throw new ForbiddenError('Authentication required for CV search');
    }

    const response: {
      positions?: unknown;
      cvs?: unknown;
      users?: unknown;
    } = {};

    if (scope === 'ALL' || scope === 'POSITIONS') {
      const result = await this.searchRepository.searchPositions({
        query: query.q,
        skip: pagination.skip,
        take: pagination.pageSize
      });

      let items = result.items;

      if (!currentUser) {
        items = items.filter((item) => item.visibilityMode === 'PUBLIC');
      }

      response.positions = {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          shortDescription: item.shortDescription,
          visibilityMode: item.visibilityMode,
          company: item.company,
          level: item.level,
          submittedCvCount: item.submittedCvCount,
          updatedAt: item.updatedAt,
          rank: item.rank
        })),
        total: !currentUser ? items.length : result.total,
        page: pagination.page,
        pageSize: pagination.pageSize
      };
    }

    if ((scope === 'ALL' || scope === 'CVS') && currentUser) {
      const result = await this.searchRepository.searchCvs({
        query: query.q,
        skip: pagination.skip,
        take: pagination.pageSize
      });

      let items = result.items;

      if (isRecruiter(currentUser.roles)) {
        items = items.filter((item) => item.status === 'PUBLISHED');
      } else if (!isAdmin(currentUser.roles)) {
        items = items.filter((item) => item.candidateUserId === currentUser.id);
      }

      response.cvs = {
        items: items.map((item) => ({
          id: item.id,
          status: item.status,
          publishedAt: item.publishedAt,
          updatedAt: item.updatedAt,
          position: {
            id: item.positionId,
            title: item.positionTitle
          },
          candidate: {
            userId: item.candidateUserId,
            email: item.candidateEmail
          },
          likesCount: item.likesCount,
          rank: item.rank
        })),
        total: items.length,
        page: pagination.page,
        pageSize: pagination.pageSize
      };
    }

    if ((scope === 'ALL' || scope === 'USERS') && currentUser && isAdmin(currentUser.roles)) {
      const result = await this.searchRepository.searchUsers({
        query: query.q,
        skip: pagination.skip,
        take: pagination.pageSize
      });

      response.users = {
        items: result.items.map((item) => ({
          id: item.id,
          email: item.email,
          isBlocked: item.isBlocked,
          createdAt: item.createdAt,
          rank: item.rank
        })),
        total: result.total,
        page: pagination.page,
        pageSize: pagination.pageSize
      };
    }

    return response;
  }
}
