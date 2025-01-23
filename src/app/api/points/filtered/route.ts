export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authConfig } from '../../auth/auth.config';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Received date range:', { startDate, endDate });

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    // Get points within date range first
    const points = await prisma.point.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        user: {
          role: 'STUDENT'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    console.log('Found points:', points.length);

    // Group points by user and calculate totals
    const userPoints = points.reduce((acc, point) => {
      const userId = point.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          firstName: point.user.firstName,
          lastName: point.user.lastName,
          totalPoints: 0
        };
      }
      acc[userId].totalPoints += point.points;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort
    const sortedUsers = Object.values(userPoints).sort((a, b) => b.totalPoints - a.totalPoints);

    console.log('Sorted users:', sortedUsers);
    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error('Error fetching filtered points:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
