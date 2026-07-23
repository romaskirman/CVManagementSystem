export type ProjectTag = {
  id?: string;
  name: string;
};

export type CandidateProject = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  descriptionMarkdown: string;
  tags: ProjectTag[];
  version: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectPayload = {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  descriptionMarkdown: string;
  tags: string[];
  version?: number;
};
