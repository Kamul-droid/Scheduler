export interface Skill {
  id: string;
  name: string;
  category?: string;
  certification?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

