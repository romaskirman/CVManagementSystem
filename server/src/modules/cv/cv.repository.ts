import { CvStatus, Prisma } from '@prisma/client';
import { prisma as db } from '../../config/db';

export class CvRepository {
  async findCvById(cvId: string) {
    return db.cv.findUnique({
      where: { id: cvId },
      include: {
        candidateProfile: {
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
            }
          }
        },
        position: {
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
            }
          }
        },
        likes: true,
        selectedProjects: {
          include: {
            project: {
              include: {
                tagLinks: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    });
  }

  async findCvByCandidateProfileAndPosition(candidateProfileId: string, positionId: string) {
    return db.cv.findUnique({
      where: {
        candidateProfileId_positionId: {
          candidateProfileId,
          positionId
        }
      }
    });
  }

  async findCandidateProfileByUserId(userId: string) {
    return db.candidateProfile.findUnique({
      where: { userId },
      include: {
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
        user: true
      }
    });
  }

  async findPositionById(positionId: string) {
    return db.position.findUnique({
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
          }
        },
        projectTags: {
          include: {
            tag: true
          }
        }
      }
    });
  }

  async createCv(candidateProfileId: string, positionId: string) {
    return db.cv.create({
      data: {
        candidateProfileId,
        positionId,
        status: CvStatus.DRAFT
      }
    });
  }

  async updateCvStatus(cvId: string, status: CvStatus) {
    return db.cv.update({
      where: { id: cvId },
      data: {
        status,
        publishedAt: status === CvStatus.PUBLISHED ? new Date() : null
      }
    });
  }

  async deleteCv(cvId: string) {
    return db.cv.delete({
      where: { id: cvId }
    });
  }

  async listCvs(params: {
    skip: number;
    take: number;
    status?: CvStatus;
    positionId?: string;
    candidateUserId?: string;
  }) {
    const where: Prisma.CvWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.positionId ? { positionId: params.positionId } : {}),
      ...(params.candidateUserId
        ? {
            candidateProfile: {
              userId: params.candidateUserId
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      db.cv.findMany({
        where,
        include: {
          candidateProfile: {
            include: {
              user: true,
              attributeValues: {
                include: {
                  attribute: true,
                  option: true
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
              }
            }
          },
          position: {
            include: {
              attributes: {
                include: {
                  attribute: {
                    include: {
                      options: true
                    }
                  }
                }
              },
              projectTags: {
                include: {
                  tag: true
                }
              },
              accessRules: {
                include: {
                  attribute: true,
                  option: true
                }
              }
            }
          },
          likes: true,
          selectedProjects: {
            include: {
              project: {
                include: {
                  tagLinks: {
                    include: {
                      tag: true
                    }
                  }
                }
              }
            },
            orderBy: {
              sortOrder: 'asc'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: params.skip,
        take: params.take
      }),
      db.cv.count({ where })
    ]);

    return { items, total };
  }

  async findProfileAttributeValue(profileId: string, attributeId: string) {
    return db.profileAttributeValue.findUnique({
      where: {
        profileId_attributeId: {
          profileId,
          attributeId
        }
      },
      include: {
        attribute: {
          include: {
            options: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        option: true
      }
    });
  }

  async upsertProfileAttributeValue(params: {
    profileId: string;
    attributeId: string;
    data: Prisma.ProfileAttributeValueUncheckedCreateInput;
    version?: number;
  }) {
    const existing = await db.profileAttributeValue.findUnique({
      where: {
        profileId_attributeId: {
          profileId: params.profileId,
          attributeId: params.attributeId
        }
      }
    });

    if (!existing) {
      return db.profileAttributeValue.create({
        data: params.data,
        include: {
          attribute: true,
          option: true
        }
      });
    }

    const result = await db.profileAttributeValue.updateMany({
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

    if (result.count === 0) {
      return null;
    }

    return db.profileAttributeValue.findUnique({
      where: { id: existing.id },
      include: {
        attribute: true,
        option: true
      }
    });
  }

  async replaceCvProjects(params: {
    cvId: string;
    version?: number;
    projects: { projectId: string; sortOrder: number }[];
  }) {
    const existing = await db.cv.findUnique({
      where: { id: params.cvId },
      select: { id: true, version: true }
    });

    if (!existing) {
      return false;
    }

    if (typeof params.version === 'number' && existing.version !== params.version) {
      return false;
    }

    await db.cvProject.deleteMany({
      where: { cvId: params.cvId }
    });

    if (params.projects.length === 0) {
      await db.cv.update({
        where: { id: params.cvId },
        data: {
          version: {
            increment: 1
          }
        }
      });

      return true;
    }

    await db.cvProject.createMany({
      data: params.projects.map((item) => ({
        cvId: params.cvId,
        projectId: item.projectId,
        sortOrder: item.sortOrder
      }))
    });

    await db.cv.update({
      where: { id: params.cvId },
      data: {
        version: {
          increment: 1
        }
      }
    });

    return true;
  }
}
