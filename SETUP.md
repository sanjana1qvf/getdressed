# Supabase Setup Guide

## Database Setup

### 1. Create Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click **Run** to execute the SQL

This will create:
- `outfits` table with proper schema
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamp updates

### 2. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it: `outfit-images`
4. Set it to **Private**
5. Click **Create bucket**

### 3. Add Storage Policies

After creating the bucket, go to **Storage > Policies** and add these policies:

#### Upload Policy
```sql
CREATE POLICY "Users can upload own outfit images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'outfit-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### View Policy
```sql
CREATE POLICY "Users can view own outfit images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'outfit-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Delete Policy
```sql
CREATE POLICY "Users can delete own outfit images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'outfit-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Environment Variables

Make sure you have these environment variables set in your `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Verification

After setup, you should be able to:
1. Sign up new users
2. Upload outfit images
3. Get AI analysis
4. View outfits in the gallery
5. Delete outfits

## Troubleshooting

### "relation 'public.outfits' does not exist"
- Run the SQL setup script in Supabase SQL Editor

### "bucket 'outfit-images' does not exist"
- Create the storage bucket as described above

### "permission denied"
- Check that RLS policies are enabled
- Verify storage policies are set correctly

### "API key is invalid"
- Check your OpenAI API key in environment variables
- Ensure the key has access to GPT-4 Vision API 