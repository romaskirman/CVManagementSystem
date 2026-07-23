import { Prisma, PositionLevel, PositionVisibilityMode, RuleOperator } from '@prisma/client';
import { prisma } from '../../config/db';

type PositionWithRelations = Awaited<ReturnType<PositionsRepository['findPositionById']>>;

export class PositionsRepository {
  async findPositionById(positionId: string) {
    return prisma.position.findUnique({
      where: { id: positionId },
      include: {
        attributes: {
          include: {
            attribute: {
              include: {
                options: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          },
          orderBy: {
            sortOrder: 'asc'
          }
        },
        accessRules: {
          include: {
            attribute: true,
            option: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        },
        projectTags: {
          include: {
            tag: true
          }
        },
        cvs: true
      }
    });
  }

  async findPositions(params: {
    skip: number;
    take: number;
    search?: string;
    visibilityMode?: PositionVisibilityMode;
    company?: string;
    level?: PositionLevel;
  }) {
    const where: Prisma.PositionWhereInput = {
      ...(params.search
        ? {
            OR: [
              {
                title: {
                  contains: params.search,
                  mode: 'insensitive'
                }
              },
              {
                shortDescription: {
                  contains: params.search,
                  mode: 'insensitive'
                }
              }
            ]
          }
        : {}),
      ...(params.visibilityMode ? { visibilityMode: params.visibilityMode } : {}),
      ...(params.company
        ? {
            company: {
              contains: params.company,
              mode: 'insensitive'
            }
          }
        : {}),
      ...(params.level ? { level: params.level } : {})
    };

    const [items, total] = await Promise.all([
      prisma.position.findMany({
        where,
        include: {
          attributes: {
            include: {
              attribute: {
                include: {
                  options: {
                    orderBy: { sortOrder: 'asc' }
                  }
                }
              }
            },
            orderBy: {
              sortOrder: 'asc'
            }
          },
          accessRules: {
            include: {
              attribute: true,
              option: true
            },
            orderBy: {
              sortOrder: 'asc'
            }
          },
          projectTags: {
            include: {
              tag: true
            }
          },
          cvs: true
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: params.skip,
        take: params.take
      }),
      prisma.position.count({ where })
    ]);

    return { items, total };
  }

  async createPosition(params: {
    title: string;
    shortDescription: string;
    visibilityMode: PositionVisibilityMode;
    company?: string | null;
    level?: PositionLevel | null;
    maxProjects: number;
    createdById: string;
    updatedById: string;
  }) {
    return prisma.position.create({
      data: {
        title: params.title,
        shortDescription: params.shortDescription,
        visibilityMode: params.visibilityMode,
        company: params.company ?? null,
        level: params.level ?? null,
        maxProjects: params.maxProjects,
        createdById: params.createdById,
        updatedById: params.updatedById
      }
    });
  }

  async updatePosition(
    positionId: string,
    version: number,
    params: {
      title: string;
      shortDescription: string;
      visibilityMode: PositionVisibilityMode;
      company?: string | null;
      level?: PositionLevel | null;
      maxProjects: number;
      updatedById: string;
    }
  ) {
    const result = await prisma.position.updateMany({
      where: {
        id: positionId,
        version
      },
      data: {
        title: params.title,
        shortDescription: params.shortDescription,
        visibilityMode: params.visibilityMode,
        company: params.company ?? null,
        level: params.level ?? null,
        maxProjects: params.maxProjects,
        updatedById: params.updatedById,
        version: {
          increment: 1
        }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findPositionById(positionId);
  }

  async deletePosition(positionId: string) {
    return prisma.position.delete({
      where: { id: positionId }
    });
  }

  async duplicatePosition(sourcePosition: NonNullable<PositionWithRelations>, currentUserId: string) {
    return prisma.position.create({
      data: {
        title: `${sourcePosition.title} (Copy)`,
        shortDescription: sourcePosition.shortDescription,
        visibilityMode: sourcePosition.visibilityMode,
        company: sourcePosition.company,
        level: sourcePosition.level,
        maxProjects: sourcePosition.maxProjects,
        createdById: currentUserId,
        updatedById: currentUserId,
        attributes: {
          create: sourcePosition.attributes.map((item) => ({
            attributeId: item.attributeId,
            sortOrder: item.sortOrder,
            isRequired: item.isRequired
          }))
        },
        accessRules: {
          create: sourcePosition.accessRules.map((rule) => ({
            attributeId: rule.attributeId,
            operator: rule.operator,
            stringValue: rule.stringValue,
            numberValue: rule.numberValue,
            booleanValue: rule.booleanValue,
            dateValue: rule.dateValue,
            secondDateValue: rule.secondDateValue,
            optionId: rule.optionId,
            sortOrder: rule.sortOrder
          }))
        },
        projectTags: {
          create: sourcePosition.projectTags.map((tagLink) => ({
            tagId: tagLink.tagId
          }))
        }
      }
    });
  }

  async replacePositionAttributes(
    positionId: string,
    attributes: Array<{
      attributeId: string;
      sortOrder: number;
      isRequired: boolean;
    }>
  ) {
    await prisma.positionAttribute.deleteMany({
      where: { positionId }
    });

    if (attributes.length > 0) {
      await prisma.positionAttribute.createMany({
        data: attributes.map((item) => ({
          positionId,
          attributeId: item.attributeId,
          sortOrder: item.sortOrder,
          isRequired: item.isRequired
        }))
      });
    }
  }

  async replaceAccessRules(
    positionId: string,
    rules: Array<{
      attributeId: string;
      operator: RuleOperator;
      stringValue?: string | null;
      numberValue?: Prisma.Decimal | null;
      booleanValue?: boolean | null;
      dateValue?: Date | null;
      secondDateValue?: Date | null;
      optionId?: string | null;
      sortOrder: number;
    }>
  ) {
    await prisma.positionAccessRule.deleteMany({
      where: { positionId }
    });

    if (rules.length > 0) {
      await prisma.positionAccessRule.createMany({
        data: rules.map((rule) => ({
          positionId,
          attributeId: rule.attributeId,
          operator: rule.operator,
          stringValue: rule.stringValue ?? null,
          numberValue: rule.numberValue ?? null,
          booleanValue: typeof rule.booleanValue === 'boolean' ? rule.booleanValue : null,
          dateValue: rule.dateValue ?? null,
          secondDateValue: rule.secondDateValue ?? null,
          optionId: rule.optionId ?? null,
          sortOrder: rule.sortOrder
        }))
      });
    }
  }

  async replaceProjectTags(positionId: string, tagIds: string[]) {
    await prisma.positionProjectTag.deleteMany({
      where: { positionId }
    });

    if (tagIds.length > 0) {
      await prisma.positionProjectTag.createMany({
        data: tagIds.map((tagId) => ({
          positionId,
          tagId
        }))
      });
    }
  }

  async findProfileByUserId(userId: string) {
    return prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        attributeValues: {
          include: {
            attribute: true,
            option: true
          }
        }
      }
    });
  }

  async findAttributeById(attributeId: string) {
    return prisma.attributeDefinition.findUnique({
      where: { id: attributeId },
      include: {
        options: true
      }
    });
  }

  async upsertTagByName(name: string) {
    return prisma.technologyTag.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
}
