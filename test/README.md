# Matchbook WebSocket Server and Message Interface Tests

This directory contains tests for the WebSocket server and message interface components of the Matchbook application.

## Overview

The tests are organized as follows:

- `server/` - Tests for the WebSocket server and client
- `components/messages/` - Tests for the message interface component
- `integration.test.ts` - Basic integration test between client and server

## Key Components Tested

1. **WebSocket Server (`ts_server/server.js`)**:
   - Socket.IO server for real-time messaging
   - Message routing and delivery
   - Client connection management

2. **WebSocket Client (`ts_server/client.ts`)**:
   - Client-side connection to WebSocket server
   - Message sending and receiving
   - Connection lifecycle management

3. **Message Interface (`src/app/platform/messages/message-interface.tsx`)**:
   - React component that provides the UI for messaging
   - Uses the WebSocket client to connect to the server
   - Handles message display, sending, and notifications

## Running Tests

```bash
# Run all tests
npm test

# Run server tests only
npm run test:server

# Run UI component tests only
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

## Integration Testing

The integration between the server and client happens through WebSockets:

1. The client connects to the server via WebSocket
2. The client can send messages to the server
3. The server processes messages and routes them to the correct recipients
4. Recipients receive messages via their WebSocket connections

In a real environment, this would require both server and client to be running. Our tests use mocks to simulate this interaction.

## Future Test Improvements

- Add more comprehensive integration tests with actual server/client connections
- Add tests for edge cases like reconnection, message delivery failures
- Add performance and load testing for concurrent connections