import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = params;

    const views = await prisma.messageView.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    return NextResponse.json(views);
  } catch (error) {
    console.error('Error fetching message views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message views' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = params;

    // Check if message exists
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Create or update view
    const view = await prisma.messageView.upsert({
      where: {
        userId_messageId: {
          userId: session.user.id,
          messageId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        messageId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(view);
  } catch (error) {
    console.error('Error recording message view:', error);
    return NextResponse.json(
      { error: 'Failed to record message view' },
      { status: 500 }
    );
  }
}
