import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Only supervisors can approve/reject reports
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'SUPERVISOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Only supervisors can approve/reject reports' },
        { status: 403 }
      );
    }

    const { messageId } = params;
    const body = await request.json();
    const { approved } = body;

    // Verify the message exists and is a report
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: {
            supervisorId: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (!message.isReport) {
      return NextResponse.json(
        { error: 'Message is not a report' },
        { status: 400 }
      );
    }

    // Verify the supervisor is assigned to this student
    if (message.user.supervisorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You are not the supervisor for this student' },
        { status: 403 }
      );
    }

    // Update the report status
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { approved },
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
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
