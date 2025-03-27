# SSE to WebSocket Migration

This document outlines the migration from Server-Sent Events (SSE) to WebSockets for real-time messaging in the Matchbook application.

## Overview

The application previously used Server-Sent Events (SSE) for one-way real-time messaging from the server to the client. This implementation has been replaced with WebSockets for several reasons:

1. **Bi-directional communication**: WebSockets provide full-duplex communication, allowing both the server and client to send messages at any time.
2. **Better connection management**: WebSockets have built-in ping/pong mechanisms to keep connections alive.
3. **Reduced overhead**: WebSockets have less header overhead after the initial handshake.
4. **Better browser support**: WebSockets are widely supported in all modern browsers.
5. **Better handling of reconnections**: Our new implementation includes robust reconnection logic.
6. **Improved perceived latency**: Messages appear instantly since they go through WebSockets first.

## Implementation Details

### Architecture

We've implemented a "WebSocket-first" architecture with the following flow:

1. **Client → WebSocket server**: Messages are sent directly from the client to the WebSocket server
2. **WebSocket server → Recipients**: Messages are immediately delivered to all connected recipients  
3. **WebSocket server → Main server**: Messages are persisted asynchronously in the database

This approach offers the best user experience as messages appear instantly regardless of database latency.

### Server-Side (Go)

The Go server has been updated to use the Gorilla WebSocket library:

1. **Connection Handling**: 
   - The `/events` endpoint for SSE has been replaced with `/ws` for WebSockets.
   - Each client maintains a persistent WebSocket connection.
   - Clients are identified by the `id` query parameter.

2. **Message Delivery**:
   - Incoming messages are immediately delivered to connected recipients
   - Messages are asynchronously forwarded to the main API server for persistence
   - The `/send-message` HTTP endpoint remains for backward compatibility

3. **Connection Management**:
   - Each client connection now has read and write goroutines (readPump and writePump).
   - Ping/pong messages are automatically sent to keep connections alive.
   - Proper cleanup on connection close or errors.

### Client-Side (React)

The React client now uses the native WebSocket API:

1. **Connection Setup**:
   - The EventSource object has been replaced with WebSocket.
   - Added reconnection logic with exponential backoff.
   - Connection status is tracked and displayed to users.

2. **Message Handling**:
   - Outgoing messages are sent directly through the WebSocket connection
   - Optimistic UI updates before server confirmation
   - Fallback to REST API if WebSocket connection fails
   - Messages are received through the WebSocket's `onmessage` handler.

3. **UI Improvements**:
   - Added connection status indicator.
   - Enhanced testing tools for WebSocket diagnostics.

### Main API Server (Next.js)

The Next.js server has a new API endpoint:

1. `/api/messages/save`: 
   - Receives messages from the WebSocket server
   - Persists them in the database
   - Updates conversation metadata

## API Changes

1. The endpoint for real-time connections changed from `/events?id={userId}` to `/ws?id={userId}`.
2. The API for sending messages (`/send-message`) remains unchanged for compatibility.
3. New API endpoint for message persistence: `/api/messages/save`

## Backwards Compatibility

For backward compatibility, the old SSE endpoint at `/api/sse/route.ts` returns a JSON response with information about the new WebSocket endpoint. This allows older clients to be informed of the migration without breaking completely.

The REST API message sending endpoint is still supported and serves as a fallback if WebSocket connections aren't available.

## Handling Edge Cases

Several edge cases are handled in this implementation:

1. **WebSocket connection fails**: Client falls back to REST API
2. **Database persistence fails**: WebSocket server notifies client but message is still delivered
3. **Client on multiple devices**: Messages are delivered to all instances of a user
4. **Reconnection after disconnect**: Exponential backoff with maximum retry count
5. **Server restart**: Clean reconnection process with connection status monitoring

## Deployment Considerations

When deploying this change:

1. Deploy the Go server changes first.
2. Deploy the API endpoint for message persistence.
3. Then deploy the client-side changes.
4. Monitor connection rates and errors during the transition.

## Testing

The WebSocket implementation includes enhanced testing tools in the admin panel:

1. Connection status indicator
2. Manual reconnect button
3. Detailed WebSocket event log
4. Connection attempt counter

## Requirements

The Go server now requires the Gorilla WebSocket library:

```bash
go get github.com/gorilla/websocket
```

## Future Improvements

Potential future enhancements:

1. Add authentication tokens to WebSocket connections for better security
2. Implement message delivery receipts
3. Add typing indicators
4. Support for binary message formats (for more efficient file transfers)
5. WebSocket multiplexing for different message types
6. Add a message queue for better handling of database persistence failures