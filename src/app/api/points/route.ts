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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all users with STUDENT role and their total points
    const users = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        points: {
          where: startDate && endDate ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          } : undefined,
          select: {
            points: true,
          },
        },
      },
    });

    // Calculate total points for each user
    const usersWithTotalPoints = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      totalPoints: user.points.reduce((sum, point) => sum + point.points, 0),
    }));

    // Sort by total points in descending order
    const sortedUsers = usersWithTotalPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
