import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { studentId, role } = await request.json();

    if (!studentId || !role || !['STUDENT', 'SUPERVISOR'].includes(role)) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid request data' }),
        { status: 400 }
      );
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { role },
      include: {
        course: true,
      },
    });

    return new NextResponse(
      JSON.stringify(updatedStudent),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating student role:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
