import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const { studentId, status } = await request.json();

    const updatedStudent = await prisma.user.update({
      where: {
        id: studentId,
        role: 'STUDENT'
      },
      data: {
        status
      },
      include: {
        course: true
      }
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json(
      { error: 'Failed to update student status' },
      { status: 500 }
    );
  }
}
