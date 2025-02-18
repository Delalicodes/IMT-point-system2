import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only supervisors and admins can approve reports
    if (session.user.role !== "SUPERVISOR" && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden - Only supervisors and admins can approve reports", { status: 403 });
    }

    const messageId = params.messageId;

    // Get the message first to check if it exists and verify permissions
    const existingMessage = await prisma.chatMessage.findUnique({
      where: {
        id: messageId,
        isReport: true,
      },
      include: {
        tasks: true,
        user: {
          select: {
            id: true,
            supervisorId: true,
            firstName: true,
            lastName: true,
            role: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!existingMessage) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Prevent users from approving their own reports
    if (existingMessage.user.id === session.user.id) {
      return new NextResponse("Forbidden - Cannot approve your own report", { status: 403 });
    }

    // If user is a supervisor, verify they are assigned to the student
    if (session.user.role === "SUPERVISOR" && existingMessage.user.supervisorId !== session.user.id) {
      return new NextResponse("Forbidden - You are not the supervisor for this student", { status: 403 });
    }

    // Update the message
    const message = await prisma.chatMessage.update({
      where: {
        id: messageId,
      },
      data: {
        approved: true,
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
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tasks: true,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGE_APPROVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
