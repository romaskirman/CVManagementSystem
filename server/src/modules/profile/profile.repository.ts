import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';

export class ProfileRepository {
  async findProfileByUserId(userId: string) {
    return prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        },
        attributeValues: {
          include: {
            attribute: {
              include: {
                options: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            },
            option: true
          },
          orderBy: {
            attribute: {
              name: 'asc'
            }
          }
        },
        projects: {
          include: {
            tagLinks: {
              include: {
                tag: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        cvs: {
          include: {
            position: true,
            likes: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    });
  }

  async findProfileById(profileId: string) {
    return prisma.candidateProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        },
        attributeValues: {
          include: {
            attribute: {
              include: {
                options: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            },
            option: true
          },
          orderBy: {
            attribute: {
              name: 'asc'
            }
          }
        },
        projects: {
          include: {
            tagLinks: {
              include: {
                tag: true
              }
            }
          }
        },
        cvs: {
          include: {
            position: true,
            likes: true
          }
        }
      }
    });
  }

  async findAttributeDefinitionById(attributeId: string) {
    return prisma.attributeDefinition.findUnique({
      where: { id: attributeId },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async updateProfileVersion(profileId: string, version: number) {
    return prisma.candidateProfile.updateMany({
      where: {
        id: profileId,
        version
      },
      data: {
        version: {
          increment: 1
        }
      }
    });
  }

  async findAttributeValue(profileId: string, attributeId: string) {
    return prisma.profileAttributeValue.findUnique({
      where: {
        profileId_attributeId: {
          profileId,
          attributeId
        }
      },
      include: {
        attribute: true,
        option: true
      }
    });
  }

  async upsertAttributeValue(params: {
    profileId: string;
    attributeId: string;
    data: Prisma.ProfileAttributeValueUncheckedCreateInput;
    version?: number;
  }) {
    const existing = await prisma.profileAttributeValue.findUnique({
      where: {
        profileId_attributeId: {
          profileId: params.profileId,
          attributeId: params.attributeId
        }
      }
    });

    if (!existing) {
      return prisma.profileAttributeValue.create({
        data: params.data,
        include: {
          attribute: true,
          option: true
        }
      });
    }

    const updateResult = await prisma.profileAttributeValue.updateMany({
      where: {
        id: existing.id,
        ...(typeof params.version === 'number' ? { version: params.version } : {})
      },
      data: {
        ...params.data,
        version: {
          increment: 1
        }
      }
    });

    if (updateResult.count === 0) {
      return null;
    }

    return prisma.profileAttributeValue.findUnique({
      where: { id: existing.id },
      include: {
        attribute: true,
        option: true
      }
    });
  }

  async deleteAttributeValue(profileId: string, attributeId: string) {
    return prisma.profileAttributeValue.deleteMany({
      where: {
        profileId,
        attributeId
      }
    });
  }
}
