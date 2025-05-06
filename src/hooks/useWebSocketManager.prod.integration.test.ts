import { renderHook, act } from '@testing-library/react';
import { vi, describe, expect, test, beforeEach, afterEach } from 'vitest';
import { useWebSocketManager, UseWebSocketManagerProps, MessageData } from './useWebSocketManager';

// --- Configuration ---
// IMPORTANT: These tests run against the PRODUCTION WebSocket server.
// Configure the SOCKET_URL to point to your PRODUCTION WebSocket server.
const SOCKET_URL = process.env.NEXT_PUBLIC_GO_PROD_SERVER_URL || 'https://sse-server-mk1d.onrender.com';

// Helper function to delay execution, useful for async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('useWebSocketManager - Production Integration Tests', () => {
  let mockCallbacks: {
    onMessageReceived: ReturnType<typeof vi.fn>;
    onTypingReceived: ReturnType<typeof vi.fn>;
    onReadReceiptReceived: ReturnType<typeof vi.fn>;
    onConnectionStatusChange: ReturnType<typeof vi.fn>;
  };

  const uniqueUserId = () => `prod-test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  beforeEach(() => {
    mockCallbacks = {
      onMessageReceived: vi.fn(),
      onTypingReceived: vi.fn(),
      onReadReceiptReceived: vi.fn(),
      onConnectionStatusChange: vi.fn(),
    };
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  const renderTestHook = (userId: string | null = uniqueUserId()) => {
    const props: UseWebSocketManagerProps = {
      socketUrl: SOCKET_URL,
      userId: userId,
      onMessageReceived: mockCallbacks.onMessageReceived,
      onTypingReceived: mockCallbacks.onTypingReceived,
      onReadReceiptReceived: mockCallbacks.onReadReceiptReceived,
      onConnectionStatusChange: mockCallbacks.onConnectionStatusChange,
    };
    return renderHook(() => useWebSocketManager(props));
  };

  test('should establish a basic connection to the PRODUCTION WebSocket server', async () => {
    const currentUserId = uniqueUserId();
    const { result, unmount } = renderTestHook(currentUserId);

    await act(async () => {
      await delay(2000); // Adjust delay as needed, production might be slower
    });

    expect(result.current.isConnected).toBe(true);
    expect(mockCallbacks.onConnectionStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ isConnected: true, circuitOpen: false })
    );

    unmount();
    await act(async () => {
      await delay(500);
    });
  }, 15000); // Increase timeout for production integration test

  test('should send a message and confirm server receipt on PRODUCTION server', async () => {
    const currentUserId = uniqueUserId();
    const { result, unmount } = renderTestHook(currentUserId);

    await act(async () => {
      await delay(2000);
    });
    if (!result.current.isConnected) {
      throw new Error('Prerequisite failed: PRODUCTION WebSocket not connected for sending message.');
    }

    const messageData: MessageData = {
      id: `prod-msg-${Date.now()}`,
      content: 'Hello PRODUCTION Server from Integration Test!',
      senderId: currentUserId,
      receiverId: 'prod-test-receiver',
      conversationId: 'prod-test-conversation',
      senderRole: 'Host',
      type: 'message',
      timestamp: new Date().toISOString(),
    };

    let ackResponse: any;
    await act(async () => {
      ackResponse = await result.current.sendMessage(messageData);
    });

    expect(ackResponse).toBeDefined();
    expect(ackResponse.received).toBe(true);

    unmount();
    await act(async () => {
      await delay(500);
    });
  }, 15000);

  test('should receive a message broadcast from the PRODUCTION server', async () => {
    const currentUserId = uniqueUserId();
    const { unmount } = renderTestHook(currentUserId);

    await act(async () => {
      await delay(2000);
    });

    // TODO: Implement logic to trigger a message from the PRODUCTION server to this client.
    // This is highly dependent on your production server's capabilities and test strategy.
    // For example, if the server sends a welcome message or an echo upon connection.

    console.warn("Placeholder: Test for receiving broadcast messages on PRODUCTION needs server-side interaction or a second client configured for production.");

    unmount();
    await act(async () => {
      await delay(500);
    });
  }, 15000);

  // --- Additional Notes for Production Testing ---
  // - Be EXTREMELY CAREFUL running tests against a live production environment.
  // - Ensure tests do not disrupt real users or corrupt production data.
  // - Use unique, identifiable test data that can be easily cleaned up or is isolated.
  // - These tests might be slower and more prone to flakiness due to real-world network conditions.
  // - Consider running these tests sparingly and monitor their impact.
});

// Dummy export to make the file a module
export {};
