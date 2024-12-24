import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user using the same logic as the record endpoint
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          // Try to match by email if available
          ...(session.user.email ? [{ email: session.user.email }] : []),
          // Try to match by name if available
          ...(session.user.name ? [{
            AND: [
              { firstName: session.user.name.split(' ')[0] },
              { lastName: session.user.name.split(' ')[1] }
            ]
          }] : [])
        ]
      }
    });

    if (!user) {
      console.error('User not found:', { 
        sessionUser: session.user,
        emailSearch: session.user.email,
        nameSearch: session.user.name
      });
      return NextResponse.json({ 
        error: 'User not found',
        details: 'Unable to find user with provided credentials'
      }, { status: 404 });
    }

    // Get clocking history ordered by most recent first
    const history = await prisma.clockingRecord.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching clocking history:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
    }

    // Check for specific Prisma errors
    if (error.constructor.name === 'PrismaClientKnownRequestError') {
      console.error('Prisma error details:', {
        code: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion
      });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error.constructor.name
    }, { status: 500 });
  }
}
