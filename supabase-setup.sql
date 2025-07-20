-- Supabase Database Setup for AI Outfit Enhancer
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create outfits table
CREATE TABLE IF NOT EXISTS outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  occasion TEXT,
  suggestions TEXT[],
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_created_at ON outfits(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own outfits
CREATE POLICY "Users can view own outfits" ON outfits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own outfits
CREATE POLICY "Users can insert own outfits" ON outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own outfits
CREATE POLICY "Users can update own outfits" ON outfits
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own outfits
CREATE POLICY "Users can delete own outfits" ON outfits
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_outfits_updated_at
  BEFORE UPDATE ON outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage setup (run these in Supabase dashboard)
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket called "outfit-images"
-- 3. Set it to private
-- 4. Add the following storage policy:

-- Storage policy for outfit images
-- CREATE POLICY "Users can upload own outfit images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'outfit-images' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can view own outfit images" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'outfit-images' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can delete own outfit images" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'outfit-images' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   ); 