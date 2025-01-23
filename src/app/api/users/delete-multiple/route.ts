import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const { userIds } = await request.json();

    // Delete multiple users
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });

    return NextResponse.json({ message: 'Users deleted successfully' });
  } catch (error) {
    console.error('Failed to delete users:', error);
    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    );
  }
}
