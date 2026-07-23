import { subtractHours } from '../../utils/date';
import { prisma } from '../../config/db';

export class StatsRepository {
  async getPublicStats() {
    const last24Hours = subtractHours(new Date(), 24);

    const [newCvsLast24Hours, totalPositions, totalCandidates, totalRecruiters, totalSubmittedCvs] =
      await Promise.all([
        prisma.cv.count({
          where: {
            createdAt: {
              gte: last24Hours
            }
          }
        }),
        prisma.position.count(),
        prisma.user.count({
          where: {
            roles: {
              some: {
                role: {
                  code: 'CANDIDATE'
                }
              }
            }
          }
        }),
        prisma.user.count({
          where: {
            roles: {
              some: {
                role: {
                  code: 'RECRUITER'
                }
              }
            }
          }
        }),
        prisma.cv.count({
          where: {
            status: 'PUBLISHED'
          }
        })
      ]);

    return {
      newCvsLast24Hours,
      totalPositions,
      totalCandidates,
      totalRecruiters,
      totalSubmittedCvs
    };
  }

  async getLatestPositions(limit = 10) {
    return prisma.position.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      include: {
        cvs: true
      }
    });
  }

  async getMostPopularPositions(limit = 10) {
    return prisma.position.findMany({
      take: limit,
      include: {
        cvs: true,
        projectTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: [{ cvs: { _count: 'desc' } }, { updatedAt: 'desc' }]
    });
  }

  async getPositionTagCloud() {
    const tags = await prisma.positionProjectTag.findMany({
      include: {
        tag: true
      }
    });

    const counts = new Map();

    for (const row of tags) {
      const existing = counts.get(row.tagId);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(row.tagId, {
          id: row.tag.id,
          name: row.tag.name,
          count: 1
        });
      }
    }

    return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  async getCvTagCloud() {
    const tags = await prisma.projectTechnologyTag.findMany({
      include: {
        tag: true
      }
    });

    const counts = new Map();

    for (const row of tags) {
      const existing = counts.get(row.tagId);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(row.tagId, {
          id: row.tag.id,
          name: row.tag.name,
          count: 1
        });
      }
    }

    return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
}
