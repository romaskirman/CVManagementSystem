import { prisma } from '../../config/db';

export class ProjectsRepository {
  async findProfileByUserId(userId: string) {
    return prisma.candidateProfile.findUnique({
      where: { userId }
    });
  }

  async findProjectById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tagLinks: {
          include: {
            tag: true
          }
        },
        profile: true
      }
    });
  }

  async createProject(params: {
    profileId: string;
    name: string;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    descriptionMarkdown: string;
  }) {
    return prisma.project.create({
      data: {
        profileId: params.profileId,
        name: params.name,
        periodStart: params.periodStart ?? null,
        periodEnd: params.periodEnd ?? null,
        descriptionMarkdown: params.descriptionMarkdown
      }
    });
  }

  async updateProject(projectId: string, version: number, params: {
    name: string;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    descriptionMarkdown: string;
  }) {
    const result = await prisma.project.updateMany({
      where: {
        id: projectId,
        version
      },
      data: {
        name: params.name,
        periodStart: params.periodStart ?? null,
        periodEnd: params.periodEnd ?? null,
        descriptionMarkdown: params.descriptionMarkdown,
        version: {
          increment: 1
        }
      }
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tagLinks: {
          include: {
            tag: true
          }
        },
        profile: true
      }
    });
  }

  async deleteProject(projectId: string) {
    return prisma.project.delete({
      where: { id: projectId }
    });
  }

  async replaceProjectTags(projectId: string, tagIds: string[]) {
    await prisma.projectTechnologyTag.deleteMany({
      where: { projectId }
    });

    if (tagIds.length > 0) {
      await prisma.projectTechnologyTag.createMany({
        data: tagIds.map((tagId) => ({
          projectId,
          tagId
        }))
      });
    }

    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tagLinks: {
          include: {
            tag: true
          }
        },
        profile: true
      }
    });
  }

  async findProjectsByProfileId(profileId: string) {
    return prisma.project.findMany({
      where: { profileId },
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
    });
  }

  async findTagsByPrefix(query: string) {
    return prisma.technologyTag.findMany({
      where: {
        name: {
          startsWith: query,
          mode: 'insensitive'
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 10
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
