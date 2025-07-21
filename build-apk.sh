#!/bin/bash

# Build script for APK with environment variables
echo "Setting up environment variables for APK build..."

# IMPORTANT: Replace these with your actual API keys before building
# You can get these from your .env file or Supabase/OpenAI dashboards
export EXPO_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

echo "Building APK with EAS..."
eas build --platform android --profile preview

echo "Build completed!" 