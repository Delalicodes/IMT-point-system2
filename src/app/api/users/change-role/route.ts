import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const { userIds, role } = await request.json();

    // Validate role
    if (!['ADMIN', 'STUDENT'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update multiple users' roles
    await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        role
      }
    });

    return NextResponse.json({ message: 'User roles updated successfully' });
  } catch (error) {
    console.error('Failed to update user roles:', error);
    return NextResponse.json(
      { error: 'Failed to update user roles' },
      { status: 500 }
    );
  }
}
