export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authConfig } from '../../auth/auth.config';

export async function GET(request: Request) {
  try {
    console.log('Prisma instance:', !!prisma);
    
    const session = await getServerSession(authConfig);
    console.log('Session:', session);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the start and end dates from the URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Query params:', { startDate, endDate });

    if (!startDate || !endDate) {
      return new NextResponse('Start date and end date are required', { status: 400 });
    }

    // Get all students (users with role STUDENT)
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log('Found students:', students.length);

    // Get all points awarded within the date range
    const weeklyPoints = await prisma.point.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('Found points:', weeklyPoints.length);

    // Initialize points for all students (even those with 0 points)
    const studentPoints = students.reduce((acc, student) => {
      acc[student.id] = {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        points: 0
      };
      return acc;
    }, {} as Record<string, { id: string; firstName: string; lastName: string; points: number; }>);

    // Add points from the weekly points
    weeklyPoints.forEach(point => {
      const studentId = point.userId;  
      if (studentPoints[studentId]) {
        studentPoints[studentId].points += point.points;  
      }
    });

    // Calculate total points for the week
    const totalPoints = weeklyPoints.reduce((sum, point) => sum + point.points, 0);  

    const response = {
      totalPoints,
      students: Object.values(studentPoints)
    };

    console.log('Sending response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in weekly points API:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
