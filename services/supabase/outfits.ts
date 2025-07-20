import { supabase } from '../../config/supabase';
import { Outfit, OutfitAnalysis } from '../../utils/types';

export interface OutfitsResponse {
  outfits: Outfit[] | null;
  error: string | null;
}

export interface OutfitResponse {
  outfit: Outfit | null;
  error: string | null;
}

export const outfitsService = {
  // Get all outfits for a user
  async getUserOutfits(userId: string): Promise<OutfitsResponse> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching outfits:', error);
        return { outfits: null, error: error.message };
      }

      return { outfits: data, error: null };
    } catch (error) {
      console.error('Get outfits error:', error);
      return { outfits: null, error: 'An unexpected error occurred' };
    }
  },

  // Get a single outfit by ID
  async getOutfit(outfitId: string): Promise<OutfitResponse> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', outfitId)
        .single();

      if (error) {
        console.error('Error fetching outfit:', error);
        return { outfit: null, error: error.message };
      }

      return { outfit: data, error: null };
    } catch (error) {
      console.error('Get outfit error:', error);
      return { outfit: null, error: 'An unexpected error occurred' };
    }
  },

  // Create a new outfit
  async createOutfit(
    userId: string,
    imageUrl: string,
    analysis: OutfitAnalysis
  ): Promise<OutfitResponse> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .insert([
          {
            user_id: userId,
            image_url: imageUrl,
            rating: analysis.rating,
            occasion: analysis.occasion,
            suggestions: analysis.suggestions,
            feedback: analysis.feedback,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating outfit:', error);
        return { outfit: null, error: error.message };
      }

      return { outfit: data, error: null };
    } catch (error) {
      console.error('Create outfit error:', error);
      return { outfit: null, error: 'An unexpected error occurred' };
    }
  },

  // Update an outfit
  async updateOutfit(
    outfitId: string,
    updates: Partial<Outfit>
  ): Promise<OutfitResponse> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .update(updates)
        .eq('id', outfitId)
        .select()
        .single();

      if (error) {
        console.error('Error updating outfit:', error);
        return { outfit: null, error: error.message };
      }

      return { outfit: data, error: null };
    } catch (error) {
      console.error('Update outfit error:', error);
      return { outfit: null, error: 'An unexpected error occurred' };
    }
  },

  // Delete an outfit
  async deleteOutfit(outfitId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitId);

      if (error) {
        console.error('Error deleting outfit:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Delete outfit error:', error);
      return { error: 'An unexpected error occurred' };
    }
  },

  // Search outfits by occasion or feedback
  async searchOutfits(
    userId: string,
    query: string
  ): Promise<OutfitsResponse> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .or(`occasion.ilike.%${query}%,feedback.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching outfits:', error);
        return { outfits: null, error: error.message };
      }

      return { outfits: data, error: null };
    } catch (error) {
      console.error('Search outfits error:', error);
      return { outfits: null, error: 'An unexpected error occurred' };
    }
  },

  // Get outfit statistics for a user
  async getUserStats(userId: string): Promise<{
    totalOutfits: number;
    averageRating: number;
    favoriteOccasion: string;
    error: string | null;
  }> {
    try {
      // Get total outfits
      const { count: totalOutfits, error: countError } = await supabase
        .from('outfits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.error('Error counting outfits:', countError);
        return { totalOutfits: 0, averageRating: 0, favoriteOccasion: '', error: countError.message };
      }

      // Get average rating
      const { data: ratingData, error: ratingError } = await supabase
        .from('outfits')
        .select('rating')
        .eq('user_id', userId);

      if (ratingError) {
        console.error('Error getting ratings:', ratingError);
        return { totalOutfits: totalOutfits || 0, averageRating: 0, favoriteOccasion: '', error: ratingError.message };
      }

      const averageRating = ratingData && ratingData.length > 0
        ? ratingData.reduce((sum, outfit) => sum + outfit.rating, 0) / ratingData.length
        : 0;

      // Get favorite occasion
      const { data: occasionData, error: occasionError } = await supabase
        .from('outfits')
        .select('occasion')
        .eq('user_id', userId);

      if (occasionError) {
        console.error('Error getting occasions:', occasionError);
        return { totalOutfits: totalOutfits || 0, averageRating, favoriteOccasion: '', error: occasionError.message };
      }

      const occasionCounts: { [key: string]: number } = {};
      occasionData?.forEach(outfit => {
        occasionCounts[outfit.occasion] = (occasionCounts[outfit.occasion] || 0) + 1;
      });

      const favoriteOccasion = Object.keys(occasionCounts).reduce((a, b) =>
        occasionCounts[a] > occasionCounts[b] ? a : b, ''
      );

      return {
        totalOutfits: totalOutfits || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        favoriteOccasion,
        error: null,
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return { totalOutfits: 0, averageRating: 0, favoriteOccasion: '', error: 'An unexpected error occurred' };
    }
  },
}; 