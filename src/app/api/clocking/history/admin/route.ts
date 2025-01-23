export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Build the where clause
    const where: any = {};
    if (startDate) {
      where.timestamp = {
        ...where.timestamp,
        gte: new Date(startDate)
      };
    }
    if (endDate) {
      where.timestamp = {
        ...where.timestamp,
        lte: new Date(endDate)
      };
    }
    if (userId) {
      where.userId = userId;
    }

    // Get total count for pagination
    const total = await prisma.clockingRecord.count({ where });

    // Get records with pagination
    const records = await prisma.clockingRecord.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format the response
    const formattedRecords = records.map(record => ({
      id: record.id,
      userName: `${record.user.firstName} ${record.user.lastName}`,
      email: record.user.email,
      role: record.user.role,
      type: record.type,
      timestamp: record.timestamp,
      totalHours: record.totalHours
    }));

    return NextResponse.json({
      records: formattedRecords,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching clocking history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
