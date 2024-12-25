import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get all users for debugging
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true },
    });
    console.log('All users in database:', JSON.stringify(allUsers, null, 2));

    const body = await request.json();
    console.log('Request body:', body);

    const { content, isReport = false } = body;

    if (!content?.trim()) {
      console.log('Invalid request - Empty content');
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const messageData = {
      content: content.trim(),
      isReport,
      userId: session.user.id,
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

    const message = await prisma.chatMessage.create({
      data: messageData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
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
