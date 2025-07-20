import { supabase } from '../../config/supabase';

export interface UploadResponse {
  url: string | null;
  error: string | null;
}

export const storageService = {
  // Upload an image to Supabase storage
  async uploadImage(
    file: File | Blob,
    fileName: string,
    userId: string
  ): Promise<UploadResponse> {
    try {
      const fileExt = fileName.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Try to upload to outfit-images bucket first, fallback to avatars if it doesn't exist
      let { data, error } = await supabase.storage
        .from('outfit-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      // If outfit-images bucket doesn't exist, try avatars bucket
      if (error && error.message.includes('bucket') && error.message.includes('not found')) {
        console.log('outfit-images bucket not found, trying avatars bucket...');
        const result = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error uploading image:', error);
        return { url: null, error: error.message };
      }

      // Get the public URL (try outfit-images first, then avatars)
      let { data: urlData } = supabase.storage
        .from('outfit-images')
        .getPublicUrl(filePath);

      // If outfit-images bucket doesn't exist, use avatars bucket
      if (!urlData.publicUrl) {
        urlData = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
      }

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('Upload image error:', error);
      return { url: null, error: 'An unexpected error occurred' };
    }
  },

  // Upload image from base64 string (for React Native)
  async uploadImageFromBase64(
    base64Data: string,
    fileName: string,
    userId: string
  ): Promise<UploadResponse> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();

      return this.uploadImage(blob, fileName, userId);
    } catch (error) {
      console.error('Upload base64 image error:', error);
      return { url: null, error: 'An unexpected error occurred' };
    }
  },

  // Delete an image from storage
  async deleteImage(filePath: string): Promise<{ error: string | null }> {
    try {
      let { error } = await supabase.storage
        .from('outfit-images')
        .remove([filePath]);

      // If outfit-images bucket doesn't exist, try avatars bucket
      if (error && error.message.includes('bucket') && error.message.includes('not found')) {
        console.log('outfit-images bucket not found, trying avatars bucket for deletion...');
        const result = await supabase.storage
          .from('avatars')
          .remove([filePath]);
        error = result.error;
      }

      if (error) {
        console.error('Error deleting image:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Delete image error:', error);
      return { error: 'An unexpected error occurred' };
    }
  },

  // Get image URL from file path
  getImageUrl(filePath: string): string {
    let { data } = supabase.storage
      .from('outfit-images')
      .getPublicUrl(filePath);

    // If outfit-images bucket doesn't exist, use avatars bucket
    if (!data.publicUrl) {
      data = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
    }

    return data.publicUrl;
  },

  // List all images for a user
  async listUserImages(userId: string): Promise<{
    files: string[] | null;
    error: string | null;
  }> {
    try {
      let { data, error } = await supabase.storage
        .from('outfit-images')
        .list(userId);

      // If outfit-images bucket doesn't exist, try avatars bucket
      if (error && error.message.includes('bucket') && error.message.includes('not found')) {
        console.log('outfit-images bucket not found, trying avatars bucket for listing...');
        const result = await supabase.storage
          .from('avatars')
          .list(userId);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error listing images:', error);
        return { files: null, error: error.message };
      }

      const files = data?.map(file => `${userId}/${file.name}`) || [];
      return { files, error: null };
    } catch (error) {
      console.error('List images error:', error);
      return { files: null, error: 'An unexpected error occurred' };
    }
  },
}; 