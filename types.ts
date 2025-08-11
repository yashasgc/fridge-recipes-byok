export type Recipe = {
  title: string;
  ingredients_used: string[];
  missing_items: string[];
  steps: string[];
  estimated_time_min: number;
  difficulty: "easy" | "medium" | "hard";
  notes?: string;
};

export type InferenceResult = {
  detected_items: string[];
  recipes: Recipe[];
};

export type ApiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type UserPreferences = {
  dietaryPreferences: string[];
  dislikes: string[];
  availableTools: string[];
}; 