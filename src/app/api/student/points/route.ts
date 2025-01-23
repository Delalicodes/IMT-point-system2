export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user);

    // Get user's points directly
    const points = await prisma.point.findMany({
      where: {
        user: {
          email: session.user.email,
          role: "STUDENT"
        }
      },
      include: {
        user: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found points:', points.length);

    if (!points.length) {
      return NextResponse.json({
        total: 0,
        daily: 0,
        weekly: 0,
        leaderboardPosition: 0,
        totalStudents: 0,
        history: [],
        courseData: {},
        points: []
      });
    }

    // Calculate total points
    const total = points.reduce((sum, point) => sum + point.points, 0);
    console.log('Total points:', total);

    // Calculate daily points
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyPoints = points
      .filter(point => {
        const pointDate = new Date(point.createdAt);
        return pointDate >= today;
      })
      .reduce((sum, point) => sum + point.points, 0);
    console.log('Daily points:', dailyPoints);

    // Calculate weekly points
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weeklyPoints = points
      .filter(point => {
        const pointDate = new Date(point.createdAt);
        return pointDate >= weekStart;
      })
      .reduce((sum, point) => sum + point.points, 0);
    console.log('Weekly points:', weeklyPoints);

    // Get all students' points for ranking
    const allStudentPoints = await prisma.point.groupBy({
      by: ['userId'],
      where: {
        user: {
          role: "STUDENT"
        }
      },
      _sum: {
        points: true
      },
      orderBy: {
        _sum: {
          points: 'desc'
        }
      }
    });

    console.log('All student points:', allStudentPoints);

    // Find user's rank
    const userId = points[0]?.userId;
    const userRank = allStudentPoints.findIndex(p => p.userId === userId) + 1;
    console.log('User rank:', userRank);

    // Format points history
    const history = points.map(point => ({
      date: point.createdAt.toISOString().split('T')[0],
      points: point.points,
      course: point.user.course?.name || 'General'
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Group points by course
    const courseData = points.reduce((acc: { [key: string]: number }, point) => {
      const courseName = point.user.course?.name || 'General';
      acc[courseName] = (acc[courseName] || 0) + point.points;
      return acc;
    }, {});

    const response = {
      total,
      daily: dailyPoints,
      weekly: weeklyPoints,
      leaderboardPosition: userRank,
      totalStudents: allStudentPoints.length,
      history,
      courseData,
      points: points.map(point => ({
        id: point.id,
        value: point.points,
        date: point.createdAt,
        courseName: point.user.course?.name || 'General'
      }))
    };

    console.log('Final response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    );
  }
}
