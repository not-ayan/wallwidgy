-- Create the function to create the wallpapers table
CREATE OR REPLACE FUNCTION create_wallpapers_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.wallpapers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Add any necessary indexes
  CREATE INDEX IF NOT EXISTS wallpapers_created_at_idx ON public.wallpapers (created_at);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_wallpapers_table() TO authenticated;
GRANT EXECUTE ON FUNCTION create_wallpapers_table() TO service_role;

