export enum RecycleStatus {
  YES = 'YES',
  NO = 'NO',
  MAYBE = 'MAYBE', // Special handling or specific centers
  UNKNOWN = 'UNKNOWN'
}

export interface CreativeIdea {
  title: string;
  description: string;
}

export interface WasteAnalysis {
  itemName: string;
  status: RecycleStatus;
  category: string;
  explanation: string;
  instructions: string[];
  alternatives?: string[]; // Eco-friendly alternatives
  creativeIdeas: CreativeIdea[]; // Structured DIY/Reuse ideas
  confidenceScore: number; // 0-100
}

export interface RecyclingPlace {
  name: string;
  address?: string;
  uri?: string; // Google Maps Link
  rating?: number;
}

export interface UserStats {
  points: number;
  level: string;
  scans: number;
  plasticSaved: number; // in kg (estimated)
  co2Saved: number; // in kg (estimated)
  badges: string[];
}

export interface AnalysisState {
  isLoading: boolean;
  isGeneratingImage: boolean;
  isLoadingCenters: boolean; // New state for loading maps
  error: string | null;
  result: WasteAnalysis | null;
  imagePreview: string | null;
  generatedIdeaImage: string | null;
  recyclingCenters: RecyclingPlace[]; // Store found centers
}
