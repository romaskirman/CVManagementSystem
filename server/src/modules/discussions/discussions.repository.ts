import { prisma } from '../../config/db';

export class DiscussionsRepository {
  async findPositionById(positionId: string) {
    return prisma.position.findUnique({
      where: { id: positionId }
    });
  }

  async createPost(params: {
    positionId: string;
    authorUserId: string;
    bodyMarkdown: string;
  }) {
    return prisma.positionDiscussionPost.create({
      data: {
        positionId: params.positionId,
        authorUserId: params.authorUserId,
        bodyMarkdown: params.bodyMarkdown
      },
      include: {
        author: true
      }
    });
  }

  async listPosts(positionId: string, params: { skip: number; take: number }) {
    const where = { positionId };

    const [items, total] = await Promise.all([
      prisma.positionDiscussionPost.findMany({
        where,
        include: {
          author: true
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: params.skip,
        take: params.take
      }),
      prisma.positionDiscussionPost.count({ where })
    ]);

    return { items, total };
  }

  async getLatestPostTimestamp(positionId: string) {
    const post = await prisma.positionDiscussionPost.findFirst({
      where: { positionId },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true
      }
    });

    return post?.createdAt ?? null;
  }
}
