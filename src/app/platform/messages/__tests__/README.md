# Messaging Interface Tests

This directory contains tests for the messaging interface components.

## Test Files

- `message-interface.test.tsx` - Tests for the main MessageInterface component
- `message-area.test.tsx` - Tests for the MessageArea component
- `conversation-list.test.tsx` - Tests for the ConversationList component
- `websocket-hook.test.tsx` - Tests for the useWebSocket hook
- `mock-go-server.ts` - Mock implementation of the Go WebSocket server

## Mock Go Server

The `mock-go-server.ts` file provides a simulation of the Go WebSocket server. It implements:

- Connection management
- Message routing
- Typing indicators
- Read receipts
- Ping/pong
- Connection status events
- Message persistence simulation

## Running Tests

```bash
npm test -- src/app/platform/messages/__tests__
```

## Test Coverage

These tests verify:

1. **Message Interface**
   - Rendering conversations
   - Selecting conversations
   - Sending/receiving messages
   - WebSocket connection handling
   - Reconnection logic
   - Fallback to REST API

2. **Message Area**
   - Message display
   - Sending text messages
   - File uploads
   - Typing indicators
   - Read receipts

3. **Conversation List**
   - Rendering conversations
   - Filtering by role/tab
   - Searching conversations
   - Unread message indicators

4. **WebSocket Hook**
   - Connection establishment
   - Message sending
   - Error handling
   - Automatic reconnection
   - Connection status tracking

## Adding New Tests

When adding new tests, consider using the mock server to simulate different WebSocket scenarios. You can use these helper functions:

- `registerConnection(userId, sendCallback)` - Register a new WebSocket connection
- `processMessage(message)` - Process an incoming message
- `simulateIncomingMessage(message)` - Simulate a message from a user
- `simulateServerShutdown()` - Simulate server disconnection