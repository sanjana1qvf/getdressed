import { useState, useEffect } from 'react';
import { Outfit, OutfitAnalysis } from '../utils/types';
import { outfitsService } from '../services/supabase/outfits';
import { storageService } from '../services/supabase/storage';
import { openaiService } from '../services/ai/openai';

// Mock user for testing without authentication
const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  name: 'Test User',
  age: 25,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useOutfits = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's outfits
  const loadOutfits = async () => {
    setLoading(true);
    setError(null);

    try {
      const { outfits: userOutfits, error: outfitsError } = await outfitsService.getUserOutfits(mockUser.id);
      
      if (outfitsError) {
        // If table doesn't exist, show empty state instead of error
        if (outfitsError.includes('relation "outfits" does not exist') || 
            outfitsError.includes('relation "public.outfits" does not exist')) {
          setOutfits([]);
          setError(null);
        } else {
          setError(outfitsError);
        }
      } else {
        setOutfits(userOutfits || []);
      }
    } catch (err) {
      setError('Failed to load outfits');
    } finally {
      setLoading(false);
    }
  };

  // Analyze and save a new outfit
  const analyzeAndSaveOutfit = async (imageUri: string): Promise<{
    outfit: Outfit | null;
    error: string | null;
  }> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Upload image to storage
      const fileName = `outfit_${Date.now()}.jpg`;
      const { url: imageUrl, error: uploadError } = await storageService.uploadImageFromBase64(
        imageUri,
        fileName,
        mockUser.id
      );

      if (uploadError || !imageUrl) {
        return { outfit: null, error: uploadError || 'Failed to upload image' };
      }

      // Step 2: Analyze outfit with AI
      const { analysis, error: analysisError } = await openaiService.analyzeOutfit(imageUri);

      if (analysisError || !analysis) {
        return { outfit: null, error: analysisError || 'Failed to analyze outfit' };
      }

      // Step 3: Save outfit to database
      const { outfit, error: saveError } = await outfitsService.createOutfit(
        mockUser.id,
        imageUrl,
        analysis
      );

      if (saveError || !outfit) {
        return { outfit: null, error: saveError || 'Failed to save outfit' };
      }

      // Step 4: Update local state
      setOutfits(prev => [outfit, ...prev]);

      return { outfit, error: null };
    } catch (err) {
      console.error('Analyze and save outfit error:', err);
      return { outfit: null, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Delete an outfit
  const deleteOutfit = async (outfitId: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await outfitsService.deleteOutfit(outfitId);
      
      if (error) {
        return { error };
      }

      // Remove from local state
      setOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
      
      return { error: null };
    } catch (err) {
      console.error('Delete outfit error:', err);
      return { error: 'An unexpected error occurred' };
    }
  };

  // Search outfits
  const searchOutfits = async (query: string): Promise<{ outfits: Outfit[] | null; error: string | null }> => {
    try {
      const { outfits: searchResults, error } = await outfitsService.searchOutfits(mockUser.id, query);
      
      if (error) {
        return { outfits: null, error };
      }

      return { outfits: searchResults || [], error: null };
    } catch (err) {
      console.error('Search outfits error:', err);
      return { outfits: null, error: 'An unexpected error occurred' };
    }
  };

  // Get user statistics
  const getUserStats = async () => {
    try {
      return await outfitsService.getUserStats(mockUser.id);
    } catch (err) {
      console.error('Get user stats error:', err);
      return { totalOutfits: 0, averageRating: 0, favoriteOccasion: '', error: 'An unexpected error occurred' };
    }
  };

  // Load outfits when component mounts
  useEffect(() => {
    loadOutfits();
  }, []);

  // Simple upload function for testing without database
  const uploadOutfit = async (imageUri: string): Promise<{
    outfit: Outfit | null;
    error: string | null;
  }> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting AI analysis for image:', imageUri);
      
      // Step 1: Analyze outfit with AI
      const { analysis, error: analysisError } = await openaiService.analyzeOutfit(imageUri);

      if (analysisError || !analysis) {
        console.error('AI analysis failed:', analysisError);
        return { outfit: null, error: analysisError || 'Failed to analyze outfit' };
      }

      console.log('AI analysis successful:', analysis);

      // Step 2: Create a mock outfit for now (without database)
      const mockOutfit: Outfit = {
        id: `mock_${Date.now()}`,
        user_id: mockUser.id,
        image_url: imageUri,
        rating: analysis.rating,
        occasion: analysis.occasion,
        suggestions: analysis.suggestions,
        feedback: analysis.feedback,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Created mock outfit:', mockOutfit);

      // Step 3: Update local state
      setOutfits(prev => [mockOutfit, ...prev]);

      return { outfit: mockOutfit, error: null };
    } catch (err) {
      console.error('Upload outfit error:', err);
      return { outfit: null, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  return {
    outfits,
    loading,
    error,
    loadOutfits,
    analyzeAndSaveOutfit,
    deleteOutfit,
    searchOutfits,
    getUserStats,
    uploadOutfit,
  };
}; 