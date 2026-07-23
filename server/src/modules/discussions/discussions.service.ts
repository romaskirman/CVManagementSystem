import { NotFoundError } from '../../common/errors/NotFoundError';
import { RequestUser } from '../../common/types/request-user.type';
import { getPagination } from '../../utils/pagination';
import { isAdmin, isRecruiter } from '../../utils/permissions';
import { PositionsService } from '../positions/positions.service';
import { CreateDiscussionPostInput, DiscussionPostsQuery } from './discussions.types';
import { DiscussionsRepository } from './discussions.repository';

export class DiscussionsService {
  constructor(
    private readonly discussionsRepository: DiscussionsRepository,
    private readonly positionsService: PositionsService
  ) {}

  async listPosts(positionId: string, query: DiscussionPostsQuery, currentUser: RequestUser) {
    await this.positionsService.getPositionById(positionId, currentUser);

    const pagination = getPagination(query);
    const result = await this.discussionsRepository.listPosts(positionId, {
      skip: pagination.skip,
      take: pagination.take
    });

    return {
      items: result.items.map((post) => ({
        id: post.id,
        positionId: post.positionId,
        author: {
          id: post.author.id,
          email: post.author.email,
          profileUrl:
            isRecruiter(currentUser.roles) || isAdmin(currentUser.roles)
              ? `/profile/${post.author.id}`
              : null
        },
        bodyMarkdown: post.bodyMarkdown,
        createdAt: post.createdAt
      })),
      total: result.total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  async createPost(positionId: string, input: CreateDiscussionPostInput, currentUser: RequestUser) {
    await this.positionsService.getPositionById(positionId, currentUser);

    const position = await this.discussionsRepository.findPositionById(positionId);

    if (!position) {
      throw new NotFoundError('Position not found');
    }

    const post = await this.discussionsRepository.createPost({
      positionId,
      authorUserId: currentUser.id,
      bodyMarkdown: input.bodyMarkdown
    });

    return {
      id: post.id,
      positionId: post.positionId,
      author: {
        id: post.author.id,
        email: post.author.email
      },
      bodyMarkdown: post.bodyMarkdown,
      createdAt: post.createdAt
    };
  }

  async getLatestActivity(positionId: string, currentUser: RequestUser) {
    await this.positionsService.getPositionById(positionId, currentUser);

    const latestPostAt = await this.discussionsRepository.getLatestPostTimestamp(positionId);

    return {
      positionId,
      latestPostAt
    };
  }
}
