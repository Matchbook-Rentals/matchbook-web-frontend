# SSE to WebSocket Migration

This document outlines the migration from Server-Sent Events (SSE) to WebSockets for real-time messaging in the Matchbook application.

## Overview

The application previously used Server-Sent Events (SSE) for one-way real-time messaging from the server to the client. This implementation has been replaced with WebSockets for several reasons:

1. **Bi-directional communication**: WebSockets provide full-duplex communication, allowing both the server and client to send messages at any time.
2. **Better connection management**: WebSockets have built-in ping/pong mechanisms to keep connections alive.
3. **Reduced overhead**: WebSockets have less header overhead after the initial handshake.
4. **Better browser support**: WebSockets are widely supported in all modern browsers.
5. **Better handling of reconnections**: Our new implementation includes robust reconnection logic.

## Implementation Details

### Server-Side (Go)

The Go server has been updated to use the Gorilla WebSocket library:

1. **Connection Handling**: 
   - The `/events` endpoint for SSE has been replaced with `/ws` for WebSockets.
   - Each client maintains a persistent WebSocket connection.
   - Clients are identified by the `id` query parameter.

2. **Message Delivery**:
   - Messages are delivered through the WebSocket connection instead of SSE.
   - The `/send-message` endpoint remains unchanged for backward compatibility.

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
   - Messages are received through the WebSocket's `onmessage` handler.
   - The message processing logic remains largely the same.

3. **UI Improvements**:
   - Added connection status indicator.
   - Enhanced testing tools for WebSocket diagnostics.

## API Changes

1. The endpoint for real-time connections changed from `/events?id={userId}` to `/ws?id={userId}`.
2. The API for sending messages (`/send-message`) remains unchanged for compatibility.

## Backwards Compatibility

For backward compatibility, the old SSE endpoint at `/api/sse/route.ts` returns a JSON response with information about the new WebSocket endpoint. This allows older clients to be informed of the migration without breaking completely.

## Deployment Considerations

When deploying this change:

1. Deploy the Go server changes first.
2. Then deploy the client-side changes.
3. Monitor connection rates and errors during the transition.

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