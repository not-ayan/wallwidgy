import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET() {
  try {
    // Fetch all resources from the wallpapers folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'wallpapers',
      max_results: 500,
      context: true,
      metadata: true,
    });

    const wallpapers = result.resources.map((resource: any) => {
      // Extract the filename without the path
      const filename = resource.public_id.split('/').pop();
      
      return {
        public_id: resource.public_id,
        filename,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        created_at: resource.created_at,
        tags: resource.tags || [],
        colors: resource.colors || [],
        categories: resource.context?.categories?.split(',') || [],
      };
    });

    return NextResponse.json(wallpapers);
  } catch (error: any) {
    console.error('Error fetching wallpapers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Update resource metadata in Cloudinary
    await cloudinary.api.update(data.public_id, {
      context: {
        categories: data.categories?.join(','),
      },
      tags: data.tags,
    });

    return NextResponse.json({ message: 'Wallpaper updated successfully' });
  } catch (error: any) {
    console.error('Error updating wallpaper:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const public_id = request.url.split('/').pop();

  try {
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok') {
      return NextResponse.json({ message: 'Wallpaper deleted successfully' });
    } else {
      throw new Error('Failed to delete from Cloudinary');
    }
  } catch (error: any) {
    console.error('Error deleting wallpaper:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

