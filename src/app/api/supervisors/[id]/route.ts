import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if the supervisor exists
    const supervisor = await prisma.user.findUnique({
      where: { id, role: 'SUPERVISOR' },
    });

    if (!supervisor) {
      return new NextResponse(
        JSON.stringify({ message: 'Supervisor not found' }),
        { status: 404 }
      );
    }

    // Delete the supervisor
    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting supervisor:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
