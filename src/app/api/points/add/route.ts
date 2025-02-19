import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authConfig as authOptions } from '@/lib/auth.config';
import { pointsEventEmitter } from '@/lib/pointsEventEmitter';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all points
    const points = await prisma.point.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(points);
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, points, reason } = await request.json();

    const pointsRecord = await prisma.point.create({
      data: {
        points,
        userId,
        note: reason,
      },
      include: {
        user: true
      }
    });

    // Emit points update event
    pointsEventEmitter.emitPointsUpdate(userId, {
      type: 'POINTS_ADDED',
      points: pointsRecord.points,
      timestamp: pointsRecord.createdAt
    });

    return NextResponse.json(pointsRecord);
  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
