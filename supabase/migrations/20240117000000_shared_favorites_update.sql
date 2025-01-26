-- Drop existing table if it exists
DROP TABLE IF EXISTS public.shared_favorites;

-- Create updated shared_favorites table
CREATE TABLE public.shared_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  favorites JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0
);

-- Add indexes
CREATE INDEX shared_favorites_token_idx ON public.shared_favorites (token);
CREATE INDEX shared_favorites_created_by_idx ON public.shared_favorites (created_by);
CREATE INDEX shared_favorites_created_at_idx ON public.shared_favorites (created_at);

-- Add RLS policies
ALTER TABLE public.shared_favorites ENABLE ROW LEVEL SECURITY;

-- Anyone can view public shares
CREATE POLICY "Public shares are viewable by everyone" ON public.shared_favorites
  FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

-- Users can create shares
CREATE POLICY "Users can create shares" ON public.shared_favorites
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own shares
CREATE POLICY "Users can update own shares" ON public.shared_favorites
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares" ON public.shared_favorites
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count(share_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_favorites
  SET view_count = view_count + 1
  WHERE token = share_token;
END;
$$ LANGUAGE plpgsql;

