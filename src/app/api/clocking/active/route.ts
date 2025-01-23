import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all users who are either clocked in or on break
    const activeUsers = await prisma.user.findMany({
      where: {
        clockingRecords: {
          some: {
            type: {
              in: ['IN', 'BREAK']
            },
            // Only get records from today
            timestamp: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        clockingRecords: {
          where: {
            timestamp: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 1,
          select: {
            type: true,
            timestamp: true
          }
        }
      }
    });

    // Format the response
    const formattedUsers = activeUsers
      .filter(user => user.clockingRecords.length > 0)
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        status: user.clockingRecords[0].type,
        lastUpdate: user.clockingRecords[0].timestamp
      }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching active users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
