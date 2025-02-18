import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        course: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    return NextResponse.json(supervisors);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supervisors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ message: 'User ID is required' }),
        { status: 400 }
      );
    }

    // Check if user exists and is a supervisor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    if (user.role !== 'SUPERVISOR') {
      return new NextResponse(
        JSON.stringify({ message: 'Selected user is not a supervisor' }),
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Supervisor added successfully' });
  } catch (error) {
    console.error('Error creating supervisor:', error);
    return NextResponse.json(
      { message: 'Failed to create supervisor' },
      { status: 500 }
    );
  }
}
