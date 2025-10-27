import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface WallpaperFile {
  name: string;
  path: string;
  category?: string;
  type: 'desktop' | 'mobile' | 'unknown';
}

// Get all available wallpapers
function getAllWallpapers(): WallpaperFile[] {
  try {
    const wallpapersDir = path.join(process.cwd(), 'public', 'wallpapers');
    
    if (!fs.existsSync(wallpapersDir)) {
      return [];
    }

    const files = fs.readdirSync(wallpapersDir);
    
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      })
      .map(file => {
        // Determine type based on filename patterns
        const lowerName = file.toLowerCase();
        let type: 'desktop' | 'mobile' | 'unknown' = 'unknown';
        
        if (lowerName.includes('mobile') || lowerName.includes('phone') || lowerName.includes('m_')) {
          type = 'mobile';
        } else if (lowerName.includes('desktop') || lowerName.includes('pc') || lowerName.includes('d_')) {
          type = 'desktop';
        }

        return {
          name: file,
          path: `/wallpapers/${file}`,
          type,
        };
      });
  } catch (error) {
    console.error('Error reading wallpapers:', error);
    return [];
  }
}

// Get categories from wallpaper names
function getAvailableCategories(): string[] {
  const categoryMap: Record<string, boolean> = {};
  const wallpapers = getAllWallpapers();
  
  wallpapers.forEach(wp => {
    const nameParts = wp.name.toLowerCase().split('_');
    if (nameParts.length > 1) {
      const category = nameParts[0];
      if (category && !category.includes('.')) {
        categoryMap[category] = true;
      }
    }
  });

  return Object.keys(categoryMap);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type')?.toLowerCase() as 'desktop' | 'mobile' | null;
    const category = searchParams.get('category')?.toLowerCase();
    const count = parseInt(searchParams.get('count') || '1', 10);

    // Validate count parameter
    if (isNaN(count) || count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      );
    }

    let wallpapers = getAllWallpapers();

    // Filter by type if specified
    if (type && (type === 'desktop' || type === 'mobile')) {
      wallpapers = wallpapers.filter(wp => wp.type === type);
    }

    // Filter by category if specified
    if (category) {
      wallpapers = wallpapers.filter(wp => 
        wp.name.toLowerCase().includes(category)
      );
    }

    // Check if we have any wallpapers
    if (wallpapers.length === 0) {
      return NextResponse.json(
        { 
          error: 'No wallpapers found matching the criteria',
          availableCategories: getAvailableCategories(),
          availableTypes: ['desktop', 'mobile']
        },
        { status: 404 }
      );
    }

    // Select random wallpapers
    const selectedWallpapers: WallpaperFile[] = [];
    const requestedCount = Math.min(count, wallpapers.length);
    
    for (let i = 0; i < requestedCount; i++) {
      const randomIndex = Math.floor(Math.random() * wallpapers.length);
      selectedWallpapers.push(wallpapers[randomIndex]);
      // Remove to avoid duplicates
      wallpapers.splice(randomIndex, 1);
    }

    return NextResponse.json({
      success: true,
      count: selectedWallpapers.length,
      wallpapers: selectedWallpapers.map(wp => ({
        name: wp.name,
        url: wp.path,
        type: wp.type,
      })),
      metadata: {
        totalAvailable: getAllWallpapers().length,
        availableCategories: getAvailableCategories(),
        availableTypes: ['desktop', 'mobile'],
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
