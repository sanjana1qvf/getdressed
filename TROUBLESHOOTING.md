# Troubleshooting: Network Request Failed Error

## Problem
You're getting a `[TypeError: Network request failed]` error when trying to upload outfit images to Supabase storage.

## Root Causes
1. **Missing Environment Variables**: Supabase URL or API key not configured
2. **Network Connectivity Issues**: Poor internet connection or firewall blocking
3. **Supabase Configuration**: Storage bucket not set up or RLS policies missing
4. **API Rate Limits**: Too many requests hitting Supabase

## Solutions Implemented

### 1. Enhanced Error Handling
- Added retry logic with exponential backoff
- Better error messages for different failure types
- Network connectivity checks before upload

### 2. Fallback Mechanisms
- Local storage when cloud upload fails
- Graceful degradation of features
- User-friendly error messages

### 3. Configuration Validation
- Debug button (🔧) in app header
- Environment variable validation
- Connection testing utilities

## Quick Fix Steps

### Step 1: Check Configuration
1. Tap the 🔧 icon in the app header
2. Check console logs for missing environment variables
3. Create `.env` file if missing (see `CONFIGURATION.md`)

### Step 2: Verify Supabase Setup
1. Run the SQL script in `supabase-setup.sql`
2. Create storage bucket named `outfit-images`
3. Set up RLS policies (see `SETUP.md`)

### Step 3: Test Connection
1. Check internet connectivity
2. Verify Supabase project is active
3. Test with a simple image upload

## Debug Information

The app now provides detailed logging:
- Configuration status
- Network connectivity tests
- Upload retry attempts
- Error categorization

## Fallback Behavior

When cloud upload fails:
1. AI analysis still works
2. Outfit is saved locally
3. User can view results
4. Data is preserved for later sync

## Common Error Messages

- **"Missing Supabase configuration"**: Check `.env` file
- **"No internet connection"**: Check network settings
- **"Database connection failed"**: Verify Supabase setup
- **"Storage bucket not configured"**: Create bucket in Supabase dashboard

## Still Having Issues?

1. Check the console logs for detailed error information
2. Verify your Supabase project is in the correct region
3. Ensure your API keys have the correct permissions
4. Try uploading a smaller image file
5. Check if your Supabase project has reached its limits

For additional help, refer to:
- `CONFIGURATION.md` for environment setup
- `SETUP.md` for database configuration
- Supabase documentation for project setup 