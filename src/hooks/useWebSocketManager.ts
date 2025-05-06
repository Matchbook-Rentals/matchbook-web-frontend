import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Define AttachmentData for clarity, similar to the one in message-interface.tsx
interface AttachmentData {
  url: string; // url from uploadthing or similar
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  fileSize?: number;
}

// Define MessageData based on its usage in message-interface.tsx
// Ensure this matches or is compatible with the type used there.
export interface MessageData {
  content: string;
  senderRole: 'Host' | 'Tenant';
  conversationId: string;
  receiverId: string;
  senderId?: string;
  id?: string; // Message ID (can be client-generated initially)
  clientId?: string; // Optional: If needed for optimistic updates before server ID
  type?: 'message' | 'file' | 'typing' | 'read_receipt'; // Add other relevant types
  attachments?: AttachmentData[]; // Added for multiple attachments
  isTyping?: boolean;
  timestamp?: string; // ISO string usually
  messageIds?: string[]; // For read receipts
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveredAt?: string; // ISO string
  confirmedDeliveryAt?: string; // For server confirmation echo
  pending?: boolean; // For optimistic UI
  failed?: boolean; // For optimistic UI
}


// Props for the hook
export interface UseWebSocketManagerProps {
  socketUrl: string;
  userId: string | null; // User ID for authentication/query
  onMessageReceived: (message: any) => void; // Callback for incoming messages
  onTypingReceived: (typingData: any) => void; // Callback for typing indicators
  onReadReceiptReceived: (receiptData: any) => void; // Callback for read receipts
  onConnectionStatusChange?: (status: { isConnected: boolean; circuitOpen: boolean }) => void; // Optional status callback
  // Allow overriding constants for testing if needed
  MAX_FAILURES?: number;
  CIRCUIT_RESET_DELAY?: number;
  MAX_RETRIES?: number;
  INITIAL_DELAY?: number;
  MAX_DELAY?: number;
  SOCKET_TIMEOUT?: number;
}

// Return type of the hook
export interface WebSocketManager {
  isConnected: boolean;
  circuitOpen: boolean;
  sendMessage: (messageData: MessageData, ackTimeout?: number) => Promise<any>; // Send message with ack
  sendTyping: (typingData: any) => void; // Send typing status
  sendReadReceipt: (receiptData: any) => void; // Send read receipt
  retryConnection: () => void; // Manually trigger connection attempt
}

// Default constants (can be overridden by props)
const DEFAULT_MAX_FAILURES = 3;
const DEFAULT_CIRCUIT_RESET_DELAY = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_INITIAL_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 30000; // 30 seconds
const DEFAULT_SOCKET_TIMEOUT = 5000; // 5 seconds for acknowledgment

export const useWebSocketManager = ({
  socketUrl,
  userId,
  onMessageReceived,
  onTypingReceived,
  onReadReceiptReceived,
  onConnectionStatusChange,
  MAX_FAILURES = DEFAULT_MAX_FAILURES,
  CIRCUIT_RESET_DELAY = DEFAULT_CIRCUIT_RESET_DELAY,
  MAX_RETRIES = DEFAULT_MAX_RETRIES,
  INITIAL_DELAY = DEFAULT_INITIAL_DELAY,
  MAX_DELAY = DEFAULT_MAX_DELAY,
  SOCKET_TIMEOUT = DEFAULT_SOCKET_TIMEOUT,
}: UseWebSocketManagerProps): WebSocketManager => {

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const failureCountRef = useRef(0);
  const circuitOpenRef = useRef(false);
  const [isCircuitOpenState, setIsCircuitOpenState] = useState(false);
  const circuitResetTimeoutRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const currentRetryCount = useRef(0);

  const updateStatus = useCallback((connected: boolean, circuitOpen: boolean) => {
    setIsConnected(connected);
    circuitOpenRef.current = circuitOpen; // Keep internal ref in sync
    setIsCircuitOpenState(circuitOpen);
    onConnectionStatusChange?.({ isConnected: connected, circuitOpen: circuitOpen });
  }, [onConnectionStatusChange]);


  const resetCircuitBreaker = useCallback(() => {
    const wasOpen = circuitOpenRef.current; // Capture if it was open before changing it

    if (failureCountRef.current > 0 || wasOpen) {
      console.log(`[WS_HOOK_CIRCUIT_BREAKER] Resetting failure count (${failureCountRef.current}) and closing circuit (wasOpen: ${wasOpen}).`);
    }
    failureCountRef.current = 0;
    circuitOpenRef.current = false; // Always mark circuit as closed internally
    setIsCircuitOpenState(false);   // And for reactive state

    if (wasOpen) {
        // If the circuit was open, it implies we were disconnected or connection attempts were halted.
        // Now that it's closed, we are still effectively disconnected until a new connection attempt succeeds.
        // So, update status to: connected = false, circuitOpen = false.
        updateStatus(false, false);
    }
    // If the circuit was not open (e.g., this was called due to a pong while connected,
    // and failureCountRef.current was > 0 but circuit not yet open),
    // we only reset failureCountRef. The existing isConnected status remains valid.
    // The updateStatus call is only needed if the circuit *was* open and is now being closed.

    if (circuitResetTimeoutRef.current) {
      clearTimeout(circuitResetTimeoutRef.current);
      circuitResetTimeoutRef.current = null;
    }
  }, [updateStatus]); // Removed isConnected from dependencies

  const checkCircuitBreaker = useCallback(() => {
    failureCountRef.current++;
    console.log(`[WS_HOOK_CIRCUIT_BREAKER] Failure count: ${failureCountRef.current}/${MAX_FAILURES}`);
    if (failureCountRef.current > MAX_FAILURES && !circuitOpenRef.current) {
      circuitOpenRef.current = true;
      setIsCircuitOpenState(true);
      updateStatus(false, true); // When circuit opens, connection is effectively lost
      console.warn(`[WS_HOOK_CIRCUIT_BREAKER] Opened after ${failureCountRef.current} consecutive failures. Halting connection attempts for ${CIRCUIT_RESET_DELAY / 1000}s.`);

      if (circuitResetTimeoutRef.current) clearTimeout(circuitResetTimeoutRef.current);
      circuitResetTimeoutRef.current = setTimeout(() => {
        console.log('[WS_HOOK_CIRCUIT_BREAKER] Reset delay elapsed. Attempting to close circuit and reconnect.');
        // circuitOpenRef.current = false; // Reset by resetCircuitBreaker
        // setIsCircuitOpenState(false);
        resetCircuitBreaker(); // This will set circuitOpenRef to false and update status
        currentRetryCount.current = 0; // Reset retry count for fresh attempts
        // Explicitly call connectWithBackoff if userId is still valid
        if (userId) {
            // eslint-disable-next-line
            connectWithBackoff(0); // Start with 0 retries
        }
      }, CIRCUIT_RESET_DELAY);
    }
  }, [MAX_FAILURES, CIRCUIT_RESET_DELAY, updateStatus, userId, resetCircuitBreaker]);


  const connectWithBackoff = useCallback((retryCount: number) => {
    if (!userId) {
        console.log('[WS_HOOK_CONNECT] No userId, skipping connection.');
        return;
    }
    if (socketRef.current && socketRef.current.connected) {
      console.log('[WS_HOOK_CONNECT] Already connected.');
      return;
    }
    if (circuitOpenRef.current) {
      console.log('[WS_HOOK_CONNECT] Circuit breaker is open. Connection attempt halted.');
      return;
    }

    if (retryCount >= MAX_RETRIES) {
      console.log(`[WS_HOOK_CONNECT] Maximum connection attempts (${MAX_RETRIES}) reached, stopping.`);
      checkCircuitBreaker(); // This might open the circuit if not already
      return;
    }

    const delay = Math.min(INITIAL_DELAY * Math.pow(1.5, retryCount), MAX_DELAY);
    const jitter = delay * (Math.random() * 0.3); // Jitter up to 30%
    const jitteredDelay = Math.floor(delay + jitter);

    console.log(`[WS_HOOK_CONNECT_ATTEMPT] Attempt ${retryCount + 1}/${MAX_RETRIES}. Connecting to: ${socketUrl}. Delay before attempt: ${Math.round(jitteredDelay)}ms`);

    // Clear previous timeout if any
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
        // Disconnect existing socket before creating a new one, if any
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        try {
            const socket = io(socketUrl, {
                query: { userId, client: 'web' },
                reconnection: true, // Let socket.io handle some base reconnection attempts
                reconnectionAttempts: 3, // Lower than our MAX_RETRIES to let our backoff take over sooner
                reconnectionDelay: INITIAL_DELAY, // Initial delay for socket.io's internal attempts
                timeout: 20000,
                transports: ['websocket'],
                upgrade: false,
                forceNew: true, // Ensures a new connection, important for query param changes
                autoConnect: true, // Default, but explicit
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                console.log(`[WS_HOOK_SOCKET_EVENT] Connected successfully. Socket ID: ${socket.id}, Transport: ${socket.io.engine.transport.name}`);
                currentRetryCount.current = 0; // Reset our manual retry counter
                resetCircuitBreaker();
                updateStatus(true, false);
            });

            socket.on('disconnect', (reason, description) => {
                console.warn(`[WS_HOOK_SOCKET_EVENT] Disconnected. Reason: "${reason}". Description:`, description || '(none)');
                updateStatus(false, circuitOpenRef.current); // Keep circuit status as is

                const retryableReasons = ['ping timeout', 'transport close', 'transport error', 'io server disconnect'];
                if (retryableReasons.includes(reason) && !circuitOpenRef.current) {
                    console.log(`[WS_HOOK_RECONNECT_LOGIC] Disconnect reason "${reason}" warrants retry. Scheduling attempt.`);
                    // Don't increment currentRetryCount.current here, connectWithBackoff will handle it
                    connectWithBackoff(currentRetryCount.current + 1);
                } else if (reason === 'io client disconnect') {
                    console.log('[WS_HOOK_SOCKET_EVENT] Disconnected locally via socket.disconnect(). No automatic retry from hook.');
                } else {
                     console.log(`[WS_HOOK_SOCKET_EVENT] Disconnect reason "${reason}" does not automatically trigger a retry by the hook.`);
                }
            });

            socket.on('connect_error', (error) => {
                console.error(`[WS_HOOK_SOCKET_EVENT] Connection Error: ${error.message}`, error);
                updateStatus(false, circuitOpenRef.current);
                checkCircuitBreaker(); // Increment failure, potentially open circuit

                if (!circuitOpenRef.current) {
                    currentRetryCount.current = retryCount + 1; // Increment for next attempt
                    connectWithBackoff(currentRetryCount.current);
                }
            });

            socket.on('message', (data: any) => {
                const dataType = data && typeof data.type !== 'undefined' ? data.type : 'N/A';
                console.log(`[WS_HOOK] Message Event Received. Type: "${dataType}". Data:`, JSON.stringify(data, null, 2));
                onMessageReceived(data);
            });

            socket.on('file', (data: any) => {
                const dataType = data && typeof data.type !== 'undefined' ? data.type : 'N/A';
                console.log(`[WS_HOOK] Message Event Received. Type: "${dataType}". Data:`, JSON.stringify(data, null, 2));
                onMessageReceived(data);
            });

            socket.on('typing', (data) => {
                console.log('[WS_HOOK_SOCKET_EVENT] Typing received:', data);
                onTypingReceived(data);
            });

            socket.on('read_receipt', (data) => {
                console.log('[WS_HOOK_SOCKET_EVENT] Read receipt received:', data);
                onReadReceiptReceived(data);
            });

            // For testing, useful to log these
            socket.on('ping', () => console.log('[WS_HOOK_SOCKET_EVENT] Ping received from server'));
            socket.on('pong', (latency) => {
                console.log(`[WS_HOOK_SOCKET_EVENT] Pong received from server. Latency: ${latency}ms`);
                // Successful pong can be a sign of a healthy connection, reset failure count
                // if not fully relying on 'connect' for this.
                if (failureCountRef.current > 0 && !circuitOpenRef.current) {
                    console.log('[WS_HOOK_HEALTH] Pong received, resetting failure count.');
                    failureCountRef.current = 0; // Reset on successful pong if circuit isn't open
                }
            });
            socket.on('reconnect_attempt', (attempt) => console.log(`[WS_HOOK_SOCKET_EVENT] Socket.IO Reconnect attempt #${attempt}`));
            socket.on('reconnect', (attempt) => {
                console.log(`[WS_HOOK_SOCKET_EVENT] Socket.IO Reconnected successfully after ${attempt} attempts.`);
                currentRetryCount.current = 0;
                resetCircuitBreaker();
                updateStatus(true, false);
            });
            socket.on('reconnect_error', (error) => {
                console.error(`[WS_HOOK_SOCKET_EVENT] Socket.IO Reconnection error: ${error.message}`);
                checkCircuitBreaker(); // Count this as a failure
            });
            socket.on('reconnect_failed', () => {
                console.error('[WS_HOOK_SOCKET_EVENT] Socket.IO Reconnection failed after exceeding attempts.');
                checkCircuitBreaker(); // Ensure circuit breaker logic runs
            });


        } catch (error) {
            console.error('[WS_HOOK_CONNECT_ATTEMPT] Failed to create Socket.IO instance:', error);
            checkCircuitBreaker();
            if (!circuitOpenRef.current) {
                currentRetryCount.current = retryCount + 1;
                connectWithBackoff(currentRetryCount.current);
            }
        }
    }, retryCount === 0 ? 0 : jitteredDelay); // No delay for the very first attempt if retryCount is 0
  }, [
    socketUrl, userId, MAX_RETRIES, INITIAL_DELAY, MAX_DELAY,
    onMessageReceived, onTypingReceived, onReadReceiptReceived,
    updateStatus, checkCircuitBreaker, resetCircuitBreaker
  ]);


  useEffect(() => {
    if (userId) {
      console.log('[WS_HOOK_EFFECT] User ID present, initiating connection sequence.');
      // If socket exists and query needs update (e.g. userId changed), disconnect first
      if (socketRef.current && socketRef.current.io.opts.query.userId !== userId) {
          console.log('[WS_HOOK_EFFECT] User ID changed, disconnecting old socket.');
          socketRef.current.disconnect();
          socketRef.current = null; // Ensure new socket is created
          // Reset states for the new connection attempt
          updateStatus(false, false);
          failureCountRef.current = 0;
          currentRetryCount.current = 0;
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          if (circuitResetTimeoutRef.current) clearTimeout(circuitResetTimeoutRef.current);
      }
      // Start connection process if not already connected or attempting
      // connectWithBackoff has its own checks for isConnected and circuitOpen
      connectWithBackoff(currentRetryCount.current); // Start with current retry count (usually 0)
    } else {
      // User ID is null (e.g., logged out)
      console.log('[WS_HOOK_EFFECT] User ID is null, ensuring disconnection.');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      updateStatus(false, false); // Not connected, circuit closed
      failureCountRef.current = 0;
      currentRetryCount.current = 0;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (circuitResetTimeoutRef.current) clearTimeout(circuitResetTimeoutRef.current);
    }

    return () => {
      console.log('[WS_HOOK_EFFECT_CLEANUP] Cleaning up WebSocket manager.');
      if (socketRef.current) {
        console.log('[WS_HOOK_EFFECT_CLEANUP] Disconnecting socket.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (circuitResetTimeoutRef.current) {
        clearTimeout(circuitResetTimeoutRef.current);
        circuitResetTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, socketUrl, connectWithBackoff]); // connectWithBackoff is memoized

  const sendMessage = useCallback(async (messageData: MessageData, ackTimeout: number = SOCKET_TIMEOUT): Promise<any> => {
    if (!socketRef.current || !isConnected || circuitOpenRef.current) {
      const errorMessage = `Socket not connected or circuit open. Connected: ${isConnected}, Circuit: ${circuitOpenRef.current}`;
      console.error(`[WS_HOOK_SEND_MESSAGE] Error: ${errorMessage}`);
      return Promise.reject(new Error('Socket not connected or circuit open'));
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.warn('[WS_HOOK_SEND_MESSAGE] Acknowledgment timeout for message:', messageData.id || messageData.content);
        reject(new Error('Socket.IO acknowledgment timeout'));
      }, ackTimeout);

      socketRef.current!.emit('message', messageData, (ack: any) => {
        clearTimeout(timeoutId);
        if (ack && ack.received) { // Or whatever your server sends for successful ack
          console.log('[WS_HOOK_SEND_MESSAGE] Message acknowledged by server:', ack);
          resolve(ack);
        } else {
          console.error('[WS_HOOK_SEND_MESSAGE] Invalid or no acknowledgment received:', ack);
          reject(new Error('Invalid acknowledgment received' + (ack ? `: ${JSON.stringify(ack)}` : '')));
        }
      });
    });
  }, [isConnected, SOCKET_TIMEOUT]);

  const sendTyping = useCallback((typingData: any) => {
    if (socketRef.current && isConnected && !circuitOpenRef.current) {
      socketRef.current.emit('typing', typingData);
    } else {
      console.warn('[WS_HOOK_SEND_TYPING] Cannot send typing: Socket not connected or circuit open.');
    }
  }, [isConnected]);

  const sendReadReceipt = useCallback((receiptData: any) => {
    if (socketRef.current && isConnected && !circuitOpenRef.current) {
      socketRef.current.emit('read_receipt', receiptData);
    } else {
      console.warn('[WS_HOOK_SEND_READ_RECEIPT] Cannot send read receipt: Socket not connected or circuit open.');
    }
  }, [isConnected]);

  const retryConnection = useCallback(() => {
    if (!isConnected && !circuitOpenRef.current) {
      console.log('[WS_HOOK_RETRY_CONNECTION] Manual retry triggered.');
      currentRetryCount.current = 0; // Reset retry count for manual attempt
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current); // Clear any pending auto-retry
      connectWithBackoff(0);
    } else {
      console.log('[WS_HOOK_RETRY_CONNECTION] Manual retry skipped: Already connected or circuit is open.');
    }
  }, [isConnected, connectWithBackoff]);


  // Return the hook's public interface
  return {
    isConnected,
    circuitOpen: isCircuitOpenState,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    retryConnection,
  };
};
