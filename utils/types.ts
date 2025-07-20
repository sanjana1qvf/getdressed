export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  created_at: string;
  updated_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  image_url: string;
  rating: number;
  occasion: string;
  suggestions: string[];
  feedback: string;
  created_at: string;
  updated_at: string;
}

export interface OutfitAnalysis {
  rating: number;
  occasion: string;
  suggestions: string[];
  feedback: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}

export interface UploadState {
  image: string | null;
  loading: boolean;
  error: string | null;
}

export type Occasion = 'Casual' | 'Formal' | 'Party' | 'Gym' | 'Business' | 'Date' | 'Travel';

export interface NavigationProps {
  navigation: any;
  route: any;
} 