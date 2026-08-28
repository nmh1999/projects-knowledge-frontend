export interface DtoRepository {
  id: string;
  name: string;
  type: 'FRONTEND' | 'BACKEND';
  available: boolean;
  languages: string[];
  frameworks: string[];
  buildTools: string[];
}
