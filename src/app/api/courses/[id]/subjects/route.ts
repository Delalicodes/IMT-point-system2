import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify the user has access to this course
    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      select: { courseId: true }
    });

    if (!user?.courseId) {
      return NextResponse.json({ error: 'No course assigned to user' }, { status: 403 });
    }

    if (user.courseId !== params.id) {
      return NextResponse.json({ error: 'User not authorized for this course' }, { status: 403 });
    }

    // Get the course with subjects
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: { subjects: true }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    console.log('Course subjects data:', {
      courseId: course.id,
      courseName: course.name,
      subjectsCount: course.subjects.length,
      subjects: course.subjects.map(s => ({ id: s.id, name: s.name }))
    });

    if (course.subjects.length === 0) {
      return NextResponse.json({ error: 'No subjects found for this course' }, { status: 404 });
    }

    return NextResponse.json(course.subjects);
  } catch (error) {
    console.error('Error fetching course subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course subjects' },
      { status: 500 }
    );
  }
}
