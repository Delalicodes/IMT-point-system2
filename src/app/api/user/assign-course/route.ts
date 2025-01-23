import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await request.json();
    console.log('Assigning course:', courseId);

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { subjects: true }
    });

    console.log('Found course:', JSON.stringify(course, null, 2));

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Update the user's course
    const user = await prisma.user.update({
      where: { username: session.user.name },
      data: { courseId },
      include: {
        course: {
          include: { subjects: true }
        }
      }
    });

    console.log('Updated user:', JSON.stringify(user, null, 2));

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        name: course.name,
        subjects: course.subjects
      }
    });
  } catch (error) {
    console.error('Error assigning course to user:', error);
    return NextResponse.json(
      { error: 'Failed to assign course to user' },
      { status: 500 }
    );
  }
}
