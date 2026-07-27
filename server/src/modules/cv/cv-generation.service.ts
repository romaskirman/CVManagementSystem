import { ValidationError } from '../../common/errors/ValidationError';
import { CvRepository } from './cv.repository';

type CvDetails = Awaited<ReturnType<CvRepository['findCvById']>>;
type CvListItem = Awaited<ReturnType<CvRepository['listCvs']>>['items'][number];

function isBlankString(value?: string | null) {
  return value === null || value === undefined || value.trim().length === 0;
}

export class CvGenerationService {
  constructor(private readonly cvRepository: CvRepository) {}

  generateCvView(cv: CvDetails | CvListItem | null) {
    if (!cv) {
      return null;
    }

    const positionAttributeIds = new Set(cv.position.attributes.map((item) => item.attributeId));
    const projectTagNames = new Set(cv.position.projectTags.map((item) => item.tag.name.toLowerCase()));

    const attributes = cv.position.attributes.map((positionAttribute) => {
      const value = cv.candidateProfile.attributeValues.find(
        (item) => item.attributeId === positionAttribute.attributeId
      );

      const isEmpty =
        !value ||
        (
          isBlankString(value.stringValue) &&
          isBlankString(value.textValue) &&
          value.numberValue === null &&
          value.booleanValue === null &&
          value.dateValue === null &&
          value.periodStart === null &&
          value.periodEnd === null &&
          isBlankString(value.imageUrl) &&
          value.optionId === null
        );

      return {
        attributeId: positionAttribute.attributeId,
        attributeName: positionAttribute.attribute.name,
        attributeType: positionAttribute.attribute.type,
        category: positionAttribute.attribute.category,
        isRequired: positionAttribute.isRequired,
        version: value?.version ?? null,
        value: value
          ? {
              stringValue: value.stringValue,
              textValue: value.textValue,
              numberValue: value.numberValue === null ? null : Number(value.numberValue),
              booleanValue: value.booleanValue,
              dateValue: value.dateValue,
              periodStart: value.periodStart,
              periodEnd: value.periodEnd,
              imageUrl: value.imageUrl,
              optionId: value.optionId,
              optionLabel: value.option?.label ?? null
            }
          : null,
        isEmpty,
        options: positionAttribute.attribute.options.map((option) => ({
          id: option.id,
          label: option.label,
          sortOrder: option.sortOrder
        }))
      };
    });

    const selectedCvProjects =
      cv.selectedProjects?.map((selectedProject) => selectedProject.project).filter(Boolean) ?? [];

    const filteredProjects =
      selectedCvProjects.length > 0
        ? selectedCvProjects
            .slice(0, cv.position.maxProjects)
            .map((project) => ({
              id: project.id,
              name: project.name,
              periodStart: project.periodStart,
              periodEnd: project.periodEnd,
              descriptionMarkdown: project.descriptionMarkdown,
              tags: project.tagLinks.map((tagLink) => ({
                id: tagLink.tag.id,
                name: tagLink.tag.name
              }))
            }))
        : cv.candidateProfile.projects
            .filter((project) => {
              if (projectTagNames.size === 0) {
                return true;
              }

              return project.tagLinks.some((tagLink) =>
                projectTagNames.has(tagLink.tag.name.toLowerCase())
              );
            })
            .slice(0, cv.position.maxProjects)
            .map((project) => ({
              id: project.id,
              name: project.name,
              periodStart: project.periodStart,
              periodEnd: project.periodEnd,
              descriptionMarkdown: project.descriptionMarkdown,
              tags: project.tagLinks.map((tagLink) => ({
                id: tagLink.tag.id,
                name: tagLink.tag.name
              }))
            }));

    const getBuiltInValue = (attributeName: string) => {
      const attributeValue = cv.candidateProfile.attributeValues.find(
        (item) => item.attribute.isBuiltIn && item.attribute.name === attributeName
      );

      if (!attributeValue) {
        return null;
      }

      return attributeValue.stringValue?.trim() || attributeValue.imageUrl?.trim() || null;
    };

    const builtInFields = {
      firstName: getBuiltInValue('First Name'),
      lastName: getBuiltInValue('Last Name'),
      location: getBuiltInValue('Location'),
      photoUrl: getBuiltInValue('Personal Photo')
    };

    return {
      id: cv.id,
      status: cv.status,
      version: cv.version,
      publishedAt: cv.publishedAt,
      likesCount: cv.likes.length,
      candidate: {
        userId: cv.candidateProfile.user.id,
        email: cv.candidateProfile.user.email
      },
      builtInFields,
      position: {
        id: cv.position.id,
        title: cv.position.title,
        shortDescription: cv.position.shortDescription,
        company: cv.position.company,
        level: cv.position.level,
        requiredAttributeIds: Array.from(positionAttributeIds)
      },
      attributes,
      projects: filteredProjects,
      createdAt: cv.createdAt,
      updatedAt: cv.updatedAt
    };
  }

  ensureCanPublish(cvView: ReturnType<CvGenerationService['generateCvView']>) {
    if (!cvView) {
      throw new ValidationError('CV view is empty');
    }

    const hasEmptyRequiredAttributes = cvView.attributes.some(
      (attribute) => attribute.isRequired && attribute.isEmpty
    );

    if (hasEmptyRequiredAttributes) {
      throw new ValidationError('All required CV attributes must be filled before publishing');
    }
  }
}
