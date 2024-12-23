import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

export async function GET() {
  try {
    const points = await prisma.point.findMany({
      include: {
        user: {
          select: {
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

    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId }
    });

    if (!user) {
      console.log('User not found:', body.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Creating point for user:', user.firstName, user.lastName);

    const newPoint = await prisma.point.create({
      data: {
        userId: body.userId,
        points: body.points,
        note: body.note || '',
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

    console.log('Created point:', newPoint);
    return NextResponse.json(newPoint);
  } catch (error) {
    console.error('Error creating point:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create point' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
