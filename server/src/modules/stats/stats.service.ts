import { RuleOperator } from '@prisma/client';
import { RequestUser } from '../../common/types/request-user.type';
import { isAdmin, isCandidate, isRecruiter } from '../../utils/permissions';
import { StatsRepository } from './stats.repository';

type StatsPosition = Awaited<ReturnType<StatsRepository['getLatestPositions']>>[number];
type CandidateProfile = NonNullable<Awaited<ReturnType<StatsRepository['findProfileByUserId']>>>;

export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getPublicStats() {
    return this.statsRepository.getPublicStats();
  }

  async getLatestPositions(currentUser?: RequestUser) {
    const items = await this.statsRepository.getLatestPositions();
    return this.mapPositionsWithAccess(items, currentUser);
  }

  async getMostPopularPositions(currentUser?: RequestUser) {
    const items = await this.statsRepository.getMostPopularPositions();
    return this.mapPositionsWithAccess(items, currentUser);
  }

  async getTagCloud(currentUser?: RequestUser) {
    if (currentUser && isRecruiter(currentUser.roles)) {
      return this.statsRepository.getCvTagCloud();
    }

    return this.statsRepository.getPositionTagCloud();
  }

  private async mapPositionsWithAccess(items: StatsPosition[], currentUser?: RequestUser) {
    let profile: CandidateProfile | null = null;

    if (currentUser && isCandidate(currentUser.roles) && !isRecruiter(currentUser.roles) && !isAdmin(currentUser.roles)) {
      profile = await this.statsRepository.findProfileByUserId(currentUser.id);
    }

    return items.map((position) => ({
      id: position.id,
      title: position.title,
      shortDescription: position.shortDescription,
      visibilityMode: position.visibilityMode,
      company: position.company,
      level: position.level,
      maxProjects: position.maxProjects,
      submittedCvCount: position.cvs.length,
      updatedAt: position.updatedAt,
      hasAccess: this.resolveHasAccess(position, currentUser, profile)
    }));
  }

  private resolveHasAccess(
    position: StatsPosition,
    currentUser?: RequestUser,
    profile?: CandidateProfile | null
  ) {
    if (position.visibilityMode === 'PUBLIC') {
      return true;
    }

    if (!currentUser) {
      return false;
    }

    if (isRecruiter(currentUser.roles) || isAdmin(currentUser.roles)) {
      return true;
    }

    if (!profile) {
      return false;
    }

    return position.accessRules.every((rule) => {
      const value = profile.attributeValues.find((item) => item.attributeId === rule.attributeId);

      if (!value) {
        return false;
      }

      switch (rule.operator as RuleOperator) {
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
  }
}
