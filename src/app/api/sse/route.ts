// app/api/sse/route.js

// Import the Message type from your Prisma schema
import { Message } from '@prisma/client';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamically rendered

// Store active connections
const connections: Map<string, ReadableStreamController<any>> = new Map();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || 'defaultId';
  console.log('id', id);

  // Set headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Create a response with the correct headers
  const response = new Response(
    new ReadableStream({
      start(controller) {
        // Store the connection
        connections.set(id, controller);

        // Send heartbeat every 3 seconds
        const heartbeatInterval = setInterval(() => {
          if (connections.has(id)) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } else {
            clearInterval(heartbeatInterval);
          }
        }, 3000);

        // Cleanup
        request.signal.onabort = () => {
          connections.delete(id);
          controller.close();
          clearInterval(heartbeatInterval);
        };
      },
      cancel() {
        console.log(`SSE Connection closed for id: ${id}`);
        connections.delete(id);
      },
    }),
    { headers }
  );

  return response;
}


// Updated function to send a message to a specific connection
export function sendMessageToConnection(message: Message) {
  console.log('Sending message to connection', message);
  console.log('Connections', connections);
  const controller = connections.get(message.receiverId);
  if (controller) {
    const messageJSON = JSON.stringify(message);
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${messageJSON}\n\n`));
  }
}