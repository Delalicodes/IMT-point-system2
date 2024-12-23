import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    const { userId, points, note } = await request.json();

    const newPoint = await prisma.point.create({
      data: {
        userId,
        points,
        note,
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

    return NextResponse.json(newPoint);
  } catch (error) {
    console.error('Error creating point:', error);
    return NextResponse.json(
      { error: 'Failed to create point' },
      { status: 500 }
    );
  }
}
