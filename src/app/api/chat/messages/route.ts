import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await prisma.chatMessage.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            imageUrl: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Error fetching messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('POST /api/chat/messages - Starting');
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log('Unauthorized - No user session');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { content, isReport = false, replyToId = null } = body;

    if (!content?.trim()) {
      console.log('Invalid request - Empty content');
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (replyToId) {
      const replyToMessage = await prisma.chatMessage.findUnique({
        where: { id: replyToId },
      });

      if (!replyToMessage) {
        return NextResponse.json(
          { error: 'Reply message not found' },
          { status: 404 }
        );
      }
    }

    const messageData = {
      content: content.trim(),
      isReport,
      userId: session.user.id,
      replyToId,
    };
    console.log('Creating message with data:', messageData);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, username: true },
    });

    if (!user) {
      console.log('User not found. Session user ID:', session.user.id);
      return NextResponse.json(
        { error: 'User not found. Please try signing out and back in.' },
        { status: 404 }
      );
    }

    if (isReport && session.user.role === 'STUDENT') {
      // Award points for submitting a report
      await prisma.point.create({
        data: {
          userId: session.user.id,
          points: 1,
          note: 'Daily Progress Report Submission',
        },
      });

      // Get updated total points
      const totalPoints = await prisma.point.aggregate({
        where: {
          userId: session.user.id,
        },
        _sum: {
          points: true,
        },
      });

      console.log('Points awarded for report. New total:', totalPoints._sum.points);
    }

    const message = await prisma.chatMessage.create({
      data: messageData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            imageUrl: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    console.log('Message created successfully:', message);
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in POST /api/chat/messages:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('PATCH /api/chat/messages - Starting');
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log('Unauthorized - No user session');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { messageId, content } = body;

    if (!content?.trim()) {
      console.log('Invalid request - Empty content');
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const existingMessage = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      console.log('Message not found:', messageId);
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (existingMessage.userId !== session.user.id) {
      console.log('Unauthorized edit attempt. Message user:', existingMessage.userId, 'Session user:', session.user.id);
      return NextResponse.json(
        { error: 'Unauthorized - Can only edit your own messages' },
        { status: 403 }
      );
    }

    console.log('Updating message:', messageId);
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            imageUrl: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    console.log('Message updated successfully:', updatedMessage);
    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error in PATCH /api/chat/messages:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
