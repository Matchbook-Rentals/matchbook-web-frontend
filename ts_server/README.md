# TypeScript WebSocket Server

This is a replacement for the Go WebSocket server, implemented in TypeScript for better integration with the Next.js frontend.

## Features

- Real-time messaging between users
- Typing indicators
- Read receipts
- File sharing support
- Automatic reconnection handling
- Connection status monitoring
- Health and status endpoints

## Getting Started

### Installation

All required dependencies are already in your package.json:
- `ws`: WebSocket library for Node.js
- `express`: HTTP server framework
- `cors`: CORS middleware
- `ts-node`: TypeScript execution environment

### Running the Server

Development mode:
```bash
npm run ws:dev
```

Production:
```bash
npm run ws:build
npm run ws:start
```

## Environment Variables

- `WS_PORT`: Port to run the WebSocket server on (default: 8080)
- `NEXT_PUBLIC_WS_SERVER_URL`: WebSocket server URL (default: 'ws://localhost:8080')

## API Endpoints

### WebSocket Connection
Connect to `ws://localhost:8080?id={userId}` where `userId` is the ID of the user.

### HTTP Endpoints

- `GET /health`: Check server health
- `GET /stats`: Get server statistics

## Message Types

The WebSocket server handles these message types:

- `message`: Regular chat messages
- `typing`: Typing indicator updates
- `read_receipt`: Read receipt notifications
- `ping`: Connection keep-alive messages (handled automatically)

## Client Integration

The WebSocket client is integrated with your React frontend using the custom `useWebSocket` hook:

```tsx
// Import the hook
import useWebSocket from '@/hooks/use-websocket';

// In your component
const ws = useWebSocket(
  'ws://localhost:8080',
  userId,
  {
    onMessage: handleMessage,
    onError: handleError,
    onClose: handleClose,
    onOpen: handleOpen
  }
);

// Send a message
ws.send({
  type: 'message',
  conversationId: 'conversation-123',
  receiverId: 'user-456',
  content: 'Hello world'
});
```

## Architecture

- `server.ts`: Main WebSocket server implementation
- `client.ts`: Client-side WebSocket library
- `use-websocket.ts`: React hook for WebSocket integration

## Error Handling

The server includes several error handling mechanisms:

- Connection timeouts
- Automatic reconnection with exponential backoff
- Graceful shutdown
- Error logging

## Monitoring

Monitor server status using the `/health` and `/stats` endpoints.

## Message Flow

1. Client connects to the WebSocket server with their user ID
2. Server assigns a unique client ID 
3. Client sends messages with receiver ID
4. Server delivers messages to all connected clients of the receiver
5. Client receives messages and updates UI accordingly

## Performance Considerations

- The server can handle multiple connections per user ID
- Message broadcasting is optimized to only send to relevant recipients
- Ping/pong mechanism keeps connections alive and detects disconnects