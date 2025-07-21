# APK Build Instructions

## Problem
The app works perfectly in Expo Go but crashes when built as an APK because environment variables from `.env` files are not bundled into APK builds.

## Solution
Use the provided build script that sets environment variables during the build process.

## How to Build APK

### Option 1: Using the Build Script (Recommended)
1. Edit `build-apk.sh` and replace the placeholder values with your actual API keys:
   ```bash
   export EXPO_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here"
   export OPENAI_API_KEY="sk-your_openai_key_here"
   ```

2. Run the build script:
   ```bash
   ./build-apk.sh
   ```

### Option 2: Manual Build with Environment Variables
```bash
# Set environment variables (replace with your actual keys)
export EXPO_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here"
export OPENAI_API_KEY="sk-your_openai_key_here"

# Build the APK
eas build --platform android --profile preview
```

## Getting Your API Keys

### Supabase Keys
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the **Project URL** and **anon public** key

### OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

## What This Fixes
- ✅ APK builds will include the necessary API keys
- ✅ App won't crash on startup in APK builds
- ✅ Real Supabase authentication will work
- ✅ OpenAI API calls will work

## Notes
- The build script contains placeholder values that you need to replace
- These keys are not committed to GitHub for security
- For development, use the `.env` file
- For production APK builds, use the build script with real keys 