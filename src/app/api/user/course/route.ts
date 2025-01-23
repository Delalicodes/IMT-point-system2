export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with course
    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      include: {
        course: {
          include: {
            subjects: true
          }
        }
      }
    });

    console.log('Found user:', JSON.stringify(user, null, 2));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.courseId) {
      return NextResponse.json({ error: 'No course assigned' }, { status: 404 });
    }

    if (!user.course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      course: {
        id: user.course.id,
        name: user.course.name,
        subjects: user.course.subjects
      }
    });
  } catch (error) {
    console.error('Error fetching user course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user course' },
      { status: 500 }
    );
  }
}
