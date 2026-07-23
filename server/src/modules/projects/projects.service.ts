import { ConflictError } from '../../common/errors/ConflictError';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { isAdmin } from '../../utils/permissions';
import { ProjectsRepository } from './projects.repository';
import { TagsService } from './tags.service';
import { CreateProjectInput, UpdateProjectInput } from './projects.types';

type ProjectListItem = Awaited<ReturnType<ProjectsRepository['findProjectsByProfileId']>>[number];

export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly tagsService: TagsService
  ) {}

  async listMyProjects(currentUserId: string) {
    const profile = await this.projectsRepository.findProfileByUserId(currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    const projects = await this.projectsRepository.findProjectsByProfileId(profile.id);
    return projects.map((project) => this.mapProject(project));
  }

  async createMyProject(currentUserId: string, input: CreateProjectInput) {
    const profile = await this.projectsRepository.findProfileByUserId(currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    this.validateDates(input.periodStart ?? null, input.periodEnd ?? null);

    const project = await this.projectsRepository.createProject({
      profileId: profile.id,
      name: input.name,
      periodStart: input.periodStart ? new Date(input.periodStart) : null,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
      descriptionMarkdown: input.descriptionMarkdown
    });

    const tagIds = await this.tagsService.getOrCreateTagIds(input.tags);
    const updated = await this.projectsRepository.replaceProjectTags(project.id, tagIds);

    if (!updated) {
      throw new NotFoundError('Project not found after creation');
    }

    return this.mapProject(updated as ProjectListItem);
  }

  async updateMyProject(currentUserId: string, inputProjectId: string, input: UpdateProjectInput) {
    const project = await this.projectsRepository.findProjectById(inputProjectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.profile.userId !== currentUserId) {
      throw new ForbiddenError('You cannot edit this project');
    }

    this.validateDates(input.periodStart ?? null, input.periodEnd ?? null);

    const updated = await this.projectsRepository.updateProject(project.id, input.version, {
      name: input.name,
      periodStart: input.periodStart ? new Date(input.periodStart) : null,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
      descriptionMarkdown: input.descriptionMarkdown
    });

    if (!updated) {
      throw new ConflictError('Project version conflict detected');
    }

    const tagIds = await this.tagsService.getOrCreateTagIds(input.tags);
    const withTags = await this.projectsRepository.replaceProjectTags(updated.id, tagIds);

    if (!withTags) {
      throw new NotFoundError('Project not found after tag update');
    }

    return this.mapProject(withTags as ProjectListItem);
  }

  async deleteMyProject(currentUserId: string, projectId: string) {
    const project = await this.projectsRepository.findProjectById(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.profile.userId !== currentUserId) {
      throw new ForbiddenError('You cannot delete this project');
    }

    await this.projectsRepository.deleteProject(projectId);

    return {
      success: true
    };
  }

  async listProjectsForUser(targetUserId: string, currentUserId: string, currentUserRoles: string[]) {
    if (targetUserId !== currentUserId && !isAdmin(currentUserRoles)) {
      throw new ForbiddenError('You cannot access these projects');
    }

    const profile = await this.projectsRepository.findProfileByUserId(targetUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    const projects = await this.projectsRepository.findProjectsByProfileId(profile.id);
    return projects.map((project) => this.mapProject(project));
  }

  async suggestTags(query: string) {
    return this.tagsService.suggestTags(query);
  }

  private validateDates(start: string | null, end: string | null) {
    if (start && end && new Date(start) > new Date(end)) {
      throw new ValidationError('Project period start cannot be greater than period end');
    }
  }

  private mapProject = (project: ProjectListItem) => {
    return {
      id: project.id,
      profileId: project.profileId,
      name: project.name,
      periodStart: project.periodStart,
      periodEnd: project.periodEnd,
      descriptionMarkdown: project.descriptionMarkdown,
      version: project.version,
      tags: project.tagLinks.map((link) => ({
        id: link.tag.id,
        name: link.tag.name
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  };
}
