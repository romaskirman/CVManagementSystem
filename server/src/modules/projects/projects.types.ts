export interface CreateProjectInput {
  name: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  descriptionMarkdown: string;
  tags: string[];
}

export interface UpdateProjectInput extends CreateProjectInput {
  version: number;
}
