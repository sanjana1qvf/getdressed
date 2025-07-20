export const APP_NAME = 'GetDressed';
export const APP_TAGLINE = 'Enhance Your Look with AI';

export const LOADING_MESSAGES = [
  'Inspecting your drip...',
  'Analyzing your style...',
  'Checking your fashion game...',
  'Evaluating your outfit...',
  'Processing your look...',
  'Fashion analysis in progress...',
];

export const OCCASIONS: { [key: string]: string } = {
  Casual: 'Casual',
  Formal: 'Formal',
  Party: 'Party',
  Gym: 'Gym',
  Business: 'Business',
  Date: 'Date',
  Travel: 'Travel',
};

export const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  USER_PROFILE: 'user_profile',
};

export const API_ENDPOINTS = {
  UPLOAD_IMAGE: '/upload',
  ANALYZE_OUTFIT: '/analyze',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UPLOAD_ERROR: 'Failed to upload image. Please try again.',
  ANALYSIS_ERROR: 'Failed to analyze outfit. Please try again.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  CAMERA_PERMISSION: 'Camera permission is required to take photos.',
  GALLERY_PERMISSION: 'Gallery permission is required to select photos.',
  SUPABASE_CONFIG_ERROR: 'Database configuration error. Please check your setup.',
  STORAGE_BUCKET_ERROR: 'Storage bucket not configured. Please contact support.',
  RETRY_MESSAGE: 'Retrying... Please wait.',
};

export const NETWORK_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  TIMEOUT: 30000, // 30 seconds
};

// Network connectivity check
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
};

// Supabase connection check
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { supabase } = await import('../config/supabase');
    const { data, error } = await supabase.from('outfits').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
}; 