# Configuration Guide

## Environment Variables Setup

To fix the "Network request failed" error, you need to properly configure your environment variables.

### 1. Create Environment File

Create a `.env` file in the root of your project with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the **Project URL** and **anon public** key

### 3. Get Your OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 4. Example Configuration

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqYjJqY2JqY2JqY2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjUwNjI0MDAsImV4cCI6MTk0MDYzODQwMH0.your_key_here
OPENAI_API_KEY=sk-your_openai_key_here
```

### 5. Restart Your Development Server

After creating the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npx expo start
```

### 6. Verify Configuration

1. Open the app
2. Tap the 🔧 icon in the header
3. Check the console logs for configuration status

### Common Issues

- **"Missing Supabase configuration"**: Check that your `.env` file is in the correct location
- **"Network request failed"**: Verify your Supabase URL and key are correct
- **"Database connection failed"**: Make sure you've run the setup script in Supabase

### Troubleshooting

If you're still getting network errors:

1. Check your internet connection
2. Verify Supabase project is active
3. Ensure storage bucket is created
4. Check RLS policies are set up correctly

For more help, see `SETUP.md` for database setup instructions. 