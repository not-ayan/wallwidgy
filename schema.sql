-- Cloudflare D1 SQL Schema for Tracking Wallpaper Downloads
CREATE TABLE IF NOT EXISTS wallpaper_downloads (
  sha TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT,
  category TEXT,
  download_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallpaper_downloads_count ON wallpaper_downloads(download_count DESC);
