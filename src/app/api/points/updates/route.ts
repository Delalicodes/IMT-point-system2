import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { pointsEventEmitter } from '@/lib/pointsEventEmitter';

export async function GET(request: Request) {
  const headersList = headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial message
      controller.enqueue(encoder.encode('event: connected\ndata: Connected to points updates\n\n'));

      // Listen for points updates for this user
      const listener = (data: any) => {
        const eventData = `event: message\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(eventData));
      };

      pointsEventEmitter.on(`points-update-${userId}`, listener);

      // Clean up listener when the connection closes
      request.signal.addEventListener('abort', () => {
        pointsEventEmitter.off(`points-update-${userId}`, listener);
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
