export interface Prompt {
  id: string;
  content: string;
  team?: string;
  owner?: string;
  created_at: string;
  similarity_score?: number;
}