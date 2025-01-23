import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pointsEventEmitter } from '@/lib/pointsEventEmitter';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
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
