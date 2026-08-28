export interface RepositoryInfo {
  id: string;
  name: string;
  type: 'FRONTEND' | 'BACKEND';
  available: boolean;
  languages: string[];
  frameworks: string[];
  buildTools: string[];
}

export interface ProjectOverview {
  frontend: string[];
  backend: string[];
  databases: string[];
  domains: string[];
  integrations: string[];
  messaging: string[];
  scheduledJobs: string[];
}

export interface Project {
  id: string;
  name: string;
  repositories: RepositoryInfo[];
  overview: ProjectOverview;
  overviewUpdatedAt?: string | null;
}
