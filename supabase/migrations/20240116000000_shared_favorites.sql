CREATE TABLE IF NOT EXISTS public.shared_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  favorites JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for token lookups
CREATE INDEX IF NOT EXISTS shared_favorites_token_idx ON public.shared_favorites (token);

