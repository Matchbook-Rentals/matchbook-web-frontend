// app/api/ws/route.ts

// Import the Message type from your Prisma schema
import { Message } from '@prisma/client';

// This NextJS edge API route is just a stub for compatibility with the previous SSE implementation
// The actual WebSocket connections are handled directly by the Go server

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamically rendered

export async function GET(request: Request) {
  // Redirect to the actual WebSocket server
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || 'defaultId';
  
  return new Response(JSON.stringify({
    message: 'WebSocket server endpoint has moved',
    wsEndpoint: `${process.env.NEXT_PUBLIC_GO_SERVER_URL}/ws?id=${id}`,
  }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// This is kept for backward compatibility but no longer actually sends messages
// The frontend now connects directly to the WebSocket server
export function sendMessageToConnection(message: Message) {
  console.log('sendMessageToConnection is deprecated. Messages are sent directly to the WebSocket server.');
}