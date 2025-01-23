import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authConfig } from '../../auth/auth.config';

export async function POST(req: Request) {
  try {
    console.log('Starting clocking record request...');

    const session = await getServerSession(authConfig);
    console.log('Session data:', {
      user: session?.user,
      expires: session?.expires
    });

    if (!session?.user) {
      console.log('No session user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    const { type, subjectId } = body;
    if (!['IN', 'BREAK', 'OUT'].includes(type)) {
      console.log('Invalid clocking type:', type);
      return NextResponse.json({ error: 'Invalid clocking type' }, { status: 400 });
    }

    // Require subjectId when clocking in
    if (type === 'IN' && !subjectId) {
      console.log('Missing subjectId for clock in');
      return NextResponse.json({ error: 'Subject selection is required for clocking in' }, { status: 400 });
    }

    // Find user by username from session
    console.log('Attempting to find user...');
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
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
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

    console.log('Found user:', {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    });

    // Create initial clocking record
    console.log('Creating clocking record...');
    let record = await prisma.clockingRecord.create({
      data: {
        userId: user.id,
        type,
        subjectId,
        timestamp: new Date(),
      },
    });
    console.log('Created clocking record:', record);

    // Calculate total hours if clocking out
    if (type === 'OUT') {
      console.log('Clocking out, calculating total hours...');
      const lastClockIn = await prisma.clockingRecord.findFirst({
        where: {
          userId: user.id,
          type: 'IN',
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (lastClockIn) {
        const totalHours = (record.timestamp.getTime() - lastClockIn.timestamp.getTime()) / (1000 * 60 * 60);
        console.log('Calculated total hours:', totalHours);
        
        // Update record with total hours
        record = await prisma.clockingRecord.update({
          where: { id: record.id },
          data: { totalHours },
        });
        console.log('Updated record with total hours:', record);
      }
    }

    // Get latest status after recording
    const latestRecord = await prisma.clockingRecord.findFirst({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
    });
    console.log('Latest record:', latestRecord);

    return NextResponse.json({
      success: true,
      record,
      currentStatus: latestRecord?.type || 'OUT',
    });
  } catch (error) {
    console.error('Error recording clocking:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });

      // Check for specific Prisma errors
      if ('code' in error && 'meta' in error && error.constructor?.name === 'PrismaClientKnownRequestError') {
        console.error('Prisma error details:', {
          code: error.code,
          meta: error.meta,
          clientVersion: (error as any).clientVersion
        });
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'UnknownError'
    }, { status: 500 });
  }
}
