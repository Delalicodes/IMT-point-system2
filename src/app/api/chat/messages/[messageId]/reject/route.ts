import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "SUPERVISOR") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const messageId = params.messageId;

    // Get the message first to check if it exists
    const existingMessage = await prisma.chatMessage.findUnique({
      where: {
        id: messageId,
        isReport: true,
      },
      include: {
        tasks: true,
        user: true,
      },
    });

    if (!existingMessage) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Update the message
    const message = await prisma.chatMessage.update({
      where: {
        id: messageId,
      },
      data: {
        approved: false,
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
    console.error("[MESSAGE_REJECT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
