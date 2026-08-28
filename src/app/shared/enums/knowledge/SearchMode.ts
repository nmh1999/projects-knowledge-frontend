export const SEARCH_MODES = ['basic', 'advanced', 'workflow', 'database'] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];
