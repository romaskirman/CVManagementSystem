import { prisma } from '../../config/db';

export class LikesRepository {
  async findCvById(cvId: string) {
    return prisma.cv.findUnique({
      where: { id: cvId },
      include: {
        candidateProfile: {
          include: {
            user: true
          }
        },
        likes: true
      }
    });
  }

  async findLike(cvId: string, recruiterUserId: string) {
    return prisma.cvLike.findUnique({
      where: {
        cvId_recruiterUserId: {
          cvId,
          recruiterUserId
        }
      }
    });
  }

  async createLike(cvId: string, recruiterUserId: string) {
    return prisma.cvLike.create({
      data: {
        cvId,
        recruiterUserId
      }
    });
  }

  async deleteLike(cvId: string, recruiterUserId: string) {
    return prisma.cvLike.delete({
      where: {
        cvId_recruiterUserId: {
          cvId,
          recruiterUserId
        }
      }
    });
  }

  async countLikes(cvId: string) {
    return prisma.cvLike.count({
      where: { cvId }
    });
  }
}
