import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth.config';
import prisma from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Current session:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Create unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${session.user.id}-${Date.now()}.${file.type.split('/')[1]}`;
    const filepath = join(process.cwd(), 'public', 'uploads', filename);

    // Save file
    await writeFile(filepath, buffer);

    // Update user profile with new image URL
    const imageUrl = `/uploads/${filename}`;
    console.log('Updating user with imageUrl:', imageUrl);
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { imageUrl },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        imageUrl: true,
      },
    });

    console.log('Updated user:', updatedUser);

    return NextResponse.json({ 
      imageUrl: updatedUser.imageUrl,
      user: updatedUser,
      message: 'Profile picture updated successfully' 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}
