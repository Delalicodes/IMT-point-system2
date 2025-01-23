import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { name, courseId } = await request.json();

    if (!name || !courseId) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Create supervisor user with SUPERVISOR role
    const supervisor = await prisma.user.create({
      data: {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        username: name.toLowerCase().replace(/\s+/g, '.'),
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@supervisor.imt`,
        password: 'changeme123', // Default password that should be changed on first login
        role: 'SUPERVISOR',
        courseId,
      },
      include: {
        course: true,
      },
    });

    return new NextResponse(
      JSON.stringify(supervisor),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating supervisor:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
      },
      include: {
        course: true,
      },
    });

    return new NextResponse(
      JSON.stringify(supervisors),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
