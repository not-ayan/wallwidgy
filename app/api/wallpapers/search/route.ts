import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Make sure this is always dynamically evaluated

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    
    if (!term) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    // Fetch all wallpapers from the index
    const response = await fetch("https://raw.githubusercontent.com/not-ayan/storage/refs/heads/main/index.json");
    if (!response.ok) {
      throw new Error("Failed to fetch wallpapers");
    }
    
    const data = await response.json();
    
    // Search through the data field for matches
    const matchedWallpapers = data
      .filter((item: any) => {
        if (!item.data) return false;
        
        // Convert query and data fields to lowercase for case-insensitive search
        const queryLower = term.toLowerCase();
        
        // Fields to search in
        const searchableFields = [
          item.file_name || '',
          item.data.art_style || '',
          item.data.series || '',
          item.data.category || '',
          item.data.mood || '',
          item.data.technique || '',
          item.data.color_palette || ''
        ];
        
        // Check array fields
        const arrays = [
          item.data.character_names || [],
          item.data.primary_colors || [],
          item.data.secondary_colors || [],
          item.data.tags || []
        ];
        
        // Check if any field contains the query
        return searchableFields.some(field => field.toLowerCase().includes(queryLower)) ||
               arrays.some(arr => arr.some((val: string) => val.toLowerCase().includes(queryLower)));
      })
      .map((item: any) => {
        // Convert to Wallpaper interface
        const mainFileName = item.file_main_name || `${item.file_name}.png`;
        const cacheFileName = item.file_cache_name || `${item.file_name}.webp`;
        
        return {
          sha: item.file_name,
          name: mainFileName,
          download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${mainFileName}`,
          preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${cacheFileName}`,
          resolution: item.resolution || `${item.width}x${item.height}`,
          platform: item.orientation === "Mobile" ? "Mobile" : "Desktop",
          width: item.width,
          height: item.height,
        };
      });

    return NextResponse.json(matchedWallpapers);
  } catch (error) {
    console.error('Error processing search:', error);
    return NextResponse.json({ error: 'Failed to process search' }, { status: 500 });
  }
}
