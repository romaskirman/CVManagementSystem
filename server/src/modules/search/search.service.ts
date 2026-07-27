import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { RequestUser } from '../../common/types/request-user.type';
import { getPagination } from '../../utils/pagination';
import { isAdmin, isCandidate, isRecruiter } from '../../utils/permissions';
import { PositionAccessRulesService } from '../positions/position-access-rules.service';
import { PositionsRepository } from '../positions/positions.repository';
import { GlobalSearchQuery } from './search.types';
import { SearchRepository } from './search.repository';

type SearchPositionItem = Awaited<ReturnType<SearchRepository['searchPositions']>>['items'][number];

export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly positionsRepository = new PositionsRepository(),
    private readonly positionAccessRulesService = new PositionAccessRulesService()
  ) {}

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
      let total = result.total;

      if (!currentUser) {
        items = items.filter((item) => item.visibilityMode === 'PUBLIC');
        total = items.length;
      } else if (isCandidate(currentUser.roles) && !isRecruiter(currentUser.roles) && !isAdmin(currentUser.roles)) {
        items = await this.filterAccessiblePositions(items, currentUser.id);
        total = items.length;
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
        total,
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

  private async filterAccessiblePositions(items: SearchPositionItem[], userId: string) {
    const profile = await this.positionsRepository.findProfileByUserId(userId);

    if (!profile) {
      return items.filter((item) => item.visibilityMode === 'PUBLIC');
    }

    const accessible: SearchPositionItem[] = [];

    for (const item of items) {
      if (item.visibilityMode === 'PUBLIC') {
        accessible.push(item);
        continue;
      }

      const position = await this.positionsRepository.findPositionById(item.id);

      if (!position) {
        continue;
      }

      const canAccess = position.accessRules.every((rule) => {
        const value = profile.attributeValues.find((attributeValue) => attributeValue.attributeId === rule.attributeId);

        if (!value) {
          return false;
        }

        switch (rule.operator) {
          case 'EQUALS':
            if (rule.optionId) {
              return value.optionId === rule.optionId;
            }
            if (rule.stringValue !== null) {
              return value.stringValue === rule.stringValue || value.textValue === rule.stringValue;
            }
            if (rule.numberValue !== null) {
              return Number(value.numberValue) === Number(rule.numberValue);
            }
            if (typeof rule.booleanValue === 'boolean') {
              return value.booleanValue === rule.booleanValue;
            }
            if (rule.dateValue) {
              return value.dateValue?.toISOString() === rule.dateValue.toISOString();
            }
            return false;

          case 'NOT_EQUALS':
            if (rule.optionId) {
              return value.optionId !== rule.optionId;
            }
            if (rule.stringValue !== null) {
              return value.stringValue !== rule.stringValue && value.textValue !== rule.stringValue;
            }
            if (rule.numberValue !== null) {
              return Number(value.numberValue) !== Number(rule.numberValue);
            }
            if (typeof rule.booleanValue === 'boolean') {
              return value.booleanValue !== rule.booleanValue;
            }
            return true;

          case 'CONTAINS':
            return Boolean(
              value.stringValue?.toLowerCase().includes((rule.stringValue ?? '').toLowerCase()) ||
                value.textValue?.toLowerCase().includes((rule.stringValue ?? '').toLowerCase())
            );

          case 'STARTS_WITH':
            return Boolean(
              value.stringValue?.toLowerCase().startsWith((rule.stringValue ?? '').toLowerCase()) ||
                value.textValue?.toLowerCase().startsWith((rule.stringValue ?? '').toLowerCase())
            );

          case 'GREATER_THAN':
            return Number(value.numberValue) > Number(rule.numberValue);

          case 'GREATER_THAN_OR_EQUAL':
            return Number(value.numberValue) >= Number(rule.numberValue);

          case 'LESS_THAN':
            return Number(value.numberValue) < Number(rule.numberValue);

          case 'LESS_THAN_OR_EQUAL':
            return Number(value.numberValue) <= Number(rule.numberValue);

          case 'IS_TRUE':
            return value.booleanValue === true;

          case 'IS_FALSE':
            return value.booleanValue === false;

          case 'BEFORE':
            return Boolean(value.dateValue && rule.dateValue && value.dateValue < rule.dateValue);

          case 'AFTER':
            return Boolean(value.dateValue && rule.dateValue && value.dateValue > rule.dateValue);

          case 'ON':
            return Boolean(
              value.dateValue &&
                rule.dateValue &&
                value.dateValue.toISOString().slice(0, 10) === rule.dateValue.toISOString().slice(0, 10)
            );

          case 'OVERLAPS':
            return Boolean(
              value.periodStart &&
                value.periodEnd &&
                rule.dateValue &&
                rule.secondDateValue &&
                value.periodStart <= rule.secondDateValue &&
                value.periodEnd >= rule.dateValue
            );

          case 'IN_SET':
            return Boolean(rule.optionId && value.optionId === rule.optionId);

          default:
            return false;
        }
      });

      if (canAccess) {
        accessible.push(item);
      }
    }

    return accessible;
  }
}
