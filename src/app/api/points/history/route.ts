export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authConfig } from '../../auth/auth.config';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate start date
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Get points grouped by date
    const points = await prisma.point.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        user: {
          role: 'STUDENT'
        }
      },
      _sum: {
        points: true
      }
    });

    // Create a map of dates to points
    const pointsByDate = points.reduce((acc, point) => {
      const date = point.createdAt.toISOString().split('T')[0];
      acc[date] = point._sum.points || 0;
      return acc;
    }, {} as Record<string, number>);

    // Fill in missing dates with 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        points: pointsByDate[dateStr] || 0
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching points history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
