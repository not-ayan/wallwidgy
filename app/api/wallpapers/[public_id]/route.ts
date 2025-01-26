import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function DELETE(
  request: Request,
  { params }: { params: { public_id: string } }
) {
  try {
    const result = await cloudinary.uploader.destroy(params.public_id);
    
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

