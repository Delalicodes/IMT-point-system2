export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user with their course
    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      include: { course: true }
    });

    if (!user?.course?.id) {
      return NextResponse.json({ error: 'No course found for user' }, { status: 404 });
    }

    // Get all subjects for the user's course
    const subjects = await prisma.subject.findMany({
      where: {
        courseId: user.course.id
      },
      select: {
        id: true,
        name: true,
        courseId: true
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Error fetching user subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}
