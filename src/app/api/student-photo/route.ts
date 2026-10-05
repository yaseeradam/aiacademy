import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing student id', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('ai_academy');
    const student = await db.collection('students').findOne(
      { id },
      { projection: { photo: 1 } }
    );

    if (!student || !student.photo) {
      return new NextResponse('Photo not found', { status: 404 });
    }

    const rawPhoto = student.photo.trim();

    if (rawPhoto.startsWith('data:')) {
      const match = rawPhoto.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1] || 'image/jpeg';
        const buffer = Buffer.from(match[2], 'base64');
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
          },
        });
      }
    }

    if (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') || rawPhoto.startsWith('/')) {
      return NextResponse.redirect(new URL(rawPhoto, request.url));
    }

    return new NextResponse('Invalid photo format', { status: 400 });
  } catch (error) {
    console.error('Error serving student photo:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
