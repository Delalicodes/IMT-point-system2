import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Initialize Prisma Client
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const userId = searchParams.get('userId');

    let whereClause: any = {};

    // Add date filter if 'from' parameter exists
    if (from) {
      whereClause.createdAt = {
        gte: new Date(from)
      };
    }

    // Add user filter if userId is provided or if user is not admin
    if (userId || session.user.role !== 'ADMIN') {
      whereClause.userId = userId || session.user.id;
    }

    const points = await prisma.point.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(points);
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received request body:', body);

    // Validate required fields
    if (!body.userId) {
      console.log('Missing userId');
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    if (typeof body.points !== 'number') {
      console.log('Invalid points value:', body.points);
      return NextResponse.json(
        { error: 'Points must be a number' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      console.log('User not found:', body.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create point
    const point = await prisma.point.create({
      data: {
        points: body.points,
        note: body.note || '',
        userId: body.userId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(point);
  } catch (error) {
    console.error('Error creating point:', error);
    return NextResponse.json(
      { error: 'Failed to create point' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
