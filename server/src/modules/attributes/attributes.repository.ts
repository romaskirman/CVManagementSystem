import { Prisma, AttributeCategory, AttributeType } from '@prisma/client';
import { prisma } from '../../config/db';

export class AttributesRepository {
  async findAttributeById(attributeId: string) {
    return prisma.attributeDefinition.findUnique({
      where: { id: attributeId },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async findAttributeByName(name: string) {
    return prisma.attributeDefinition.findUnique({
      where: { name }
    });
  }

  async findAttributes(params: {
    skip: number;
    take: number;
    search?: string;
    prefix?: string;
    category?: AttributeCategory;
    type?: AttributeType;
    recentlyUsedOnly?: boolean;
    userId?: string;
  }) {
    if (params.recentlyUsedOnly && params.userId) {
      const attributeWhere: Prisma.AttributeDefinitionWhereInput = {
        ...(params.category ? { category: params.category } : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(params.search
          ? {
              name: {
                startsWith: params.search,
                mode: 'insensitive'
              }
            }
          : {}),
        ...(params.prefix
          ? {
              name: {
                startsWith: params.prefix,
                mode: 'insensitive'
              }
            }
          : {})
      };

      const recentWhere: Prisma.RecentAttributeUsageWhereInput = {
        userId: params.userId,
        attribute: attributeWhere
      };

      const [recentItems, total] = await Promise.all([
        prisma.recentAttributeUsage.findMany({
          where: recentWhere,
          orderBy: { lastUsedAt: 'desc' },
          skip: params.skip,
          take: params.take,
          include: {
            attribute: {
              include: {
                options: {
                  orderBy: { sortOrder: 'asc' }
                },
                _count: {
                  select: {
                    profileValues: true,
                    positionAttributes: true,
                    accessRules: true
                  }
                },
                recentUsages: {
                  where: {
                    userId: params.userId
                  },
                  take: 1
                }
              }
            }
          }
        }),
        prisma.recentAttributeUsage.count({
          where: recentWhere
        })
      ]);

      return {
        items: recentItems.map((item) => item.attribute),
        total
      };
    }

    const where: Prisma.AttributeDefinitionWhereInput = {
      ...(params.category ? { category: params.category } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.search
        ? {
            name: {
              startsWith: params.search,
              mode: 'insensitive'
            }
          }
        : {}),
      ...(params.prefix
        ? {
            name: {
              startsWith: params.prefix,
              mode: 'insensitive'
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.attributeDefinition.findMany({
        where,
        include: {
          options: {
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: {
              profileValues: true,
              positionAttributes: true,
              accessRules: true
            }
          },
          ...(params.userId
            ? {
                recentUsages: {
                  where: {
                    userId: params.userId
                  },
                  take: 1
                }
              }
            : {})
        },
        orderBy: [{ name: 'asc' }],
        skip: params.skip,
        take: params.take
      }),
      prisma.attributeDefinition.count({ where })
    ]);

    return { items, total };
  }

  async createAttribute(params: {
    category: AttributeCategory;
    name: string;
    description: string;
    type: AttributeType;
    createdById: string;
    options: Array<{ label: string; sortOrder: number }>;
  }) {
    return prisma.attributeDefinition.create({
      data: {
        category: params.category,
        name: params.name,
        description: params.description,
        type: params.type,
        createdById: params.createdById,
        isBuiltIn: false,
        isDeletable: true,
        options: {
          create: params.options
        }
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async updateAttribute(attributeId: string, params: {
    category: AttributeCategory;
    name: string;
    description: string;
    type: AttributeType;
    options: Array<{ label: string; sortOrder: number }>;
  }) {
    await prisma.attributeOption.deleteMany({
      where: {
        attributeId
      }
    });

    return prisma.attributeDefinition.update({
      where: { id: attributeId },
      data: {
        category: params.category,
        name: params.name,
        description: params.description,
        type: params.type,
        options: {
          create: params.options
        }
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async deleteAttribute(attributeId: string) {
    return prisma.attributeDefinition.delete({
      where: { id: attributeId }
    });
  }

  async markAttributeAsRecentlyUsed(userId: string, attributeId: string) {
    await prisma.recentAttributeUsage.upsert({
      where: {
        userId_attributeId: {
          userId,
          attributeId
        }
      },
      update: {
        lastUsedAt: new Date()
      },
      create: {
        userId,
        attributeId,
        lastUsedAt: new Date()
      }
    });

    const outdatedItems = await prisma.recentAttributeUsage.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
      skip: 10,
      select: {
        userId: true,
        attributeId: true
      }
    });

    if (outdatedItems.length > 0) {
      await prisma.recentAttributeUsage.deleteMany({
        where: {
          OR: outdatedItems.map((item) => ({
            userId: item.userId,
            attributeId: item.attributeId
          }))
        }
      });
    }
  }
}
