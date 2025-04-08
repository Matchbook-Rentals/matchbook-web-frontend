import { useState, useEffect, useRef, useCallback } from 'react';
import { createWebSocketClient, WebSocketClient, WebSocketClientOptions } from '../../ts_server/client';
import { WebSocketMessage } from '../types/websocket';

interface UseWebSocketOptions {
  /** Handler for received messages */
  onMessage: (message: any) => void;
  /** Handler for errors */
  onError?: (error: Event) => void;
  /** Handler for connection close events */
  onClose?: (event: CloseEvent) => void;
  /** Handler for connection open events */
  onOpen?: (event: Event) => void;
  /** Automatically connect on mount (default: true) */
  autoConnect?: boolean;
}

/**
 * A React hook for WebSocket communication
 * 
 * @param url The WebSocket server URL
 * @param userId The user ID for the connection
 * @param options Configuration options
 * @returns WebSocket connection state and send function
 */
export function useWebSocket(url: string, userId: string, options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [connectionDisabled, setConnectionDisabled] = useState(false);
  const clientRef = useRef<WebSocketClient | null>(null);
  const errorCountRef = useRef(0);
  const circuitBreakerTimer = useRef<NodeJS.Timeout | null>(null);

  // Implement circuit breaker pattern to prevent reconnection storms
  const triggerCircuitBreaker = useCallback(() => {
    // If too many errors, disable reconnection temporarily
    setConnectionDisabled(true);
    console.log('WebSocket: Circuit breaker triggered - pausing reconnection attempts for 60 seconds');
    
    // Reset after 60 seconds
    if (circuitBreakerTimer.current) {
      clearTimeout(circuitBreakerTimer.current);
    }
    
    circuitBreakerTimer.current = setTimeout(() => {
      console.log('WebSocket: Circuit breaker reset - reconnection enabled');
      errorCountRef.current = 0;
      setConnectionDisabled(false);
      setConnectionAttempts(0);
    }, 60000); // Wait 1 minute before trying again
  }, []);

  // Set up WebSocket client
  useEffect(() => {
    if (!url || !userId) {
      console.log('WebSocket: Missing url or userId', { url, userId });
      return;
    }
    
    if (connectionDisabled) {
      console.log('WebSocket: Connection attempts temporarily disabled by circuit breaker');
      return;
    }

    console.log('WebSocket: Attempting connection to', url, 'with userId', userId);

    const clientOptions: Partial<WebSocketClientOptions> = {
      onOpen: (event) => {
        console.log('WebSocket: Connected successfully');
        setIsConnected(true);
        setConnectionAttempts(0);
        errorCountRef.current = 0; // Reset error count on successful connection
        if (options.onOpen) options.onOpen(event);
      },
      onMessage: (message) => {
        // Only log non-ping messages to reduce console noise
        if (message.type !== 'ping') {
          console.log('WebSocket: Received message', message);
        }
        if (options.onMessage) options.onMessage(message);
      },
      onError: (error) => {
        errorCountRef.current += 1;
        console.error('WebSocket: Connection error', error);
        setIsConnected(false);
        
        // If we've seen more than 5 errors in quick succession, trigger circuit breaker
        if (errorCountRef.current > 5) {
          triggerCircuitBreaker();
        }
        
        if (options.onError) options.onError(error);
      },
      onClose: (event) => {
        console.log('WebSocket: Connection closed', event.code, event.reason);
        setIsConnected(false);
        if (options.onClose) options.onClose(event);
      },
      reconnect: {
        enabled: !connectionDisabled,
        maxAttempts: 3, // Further reduced to prevent excessive reconnection attempts
        baseDelay: 5000, // Increased base delay
        backoffFactor: 2
      },
      pingInterval: 20000
    };

    // Create WebSocket client
    clientRef.current = createWebSocketClient(url, userId, clientOptions);
    
    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [url, userId, connectionDisabled, options.onMessage, options.onError, options.onClose, options.onOpen]);

  // Track reconnection attempts
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const intervalId = setInterval(() => {
      if (client.getStatus() === 'reconnecting') {
        setConnectionAttempts((prev) => Math.min(prev + 1, 10));
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  /**
   * Send a message over the WebSocket connection
   * @param data Message data to send
   * @returns Boolean indicating if send was successful
   */
  const send = (data: Partial<WebSocketMessage>): boolean => {
    if (clientRef.current && isConnected) {
      // Make sure to include the userId if not already present
      const messageData: Partial<WebSocketMessage> = {
        ...data,
        senderId: data.senderId || userId
      };
      return clientRef.current.send(messageData);
    }
    return false;
  };

  /**
   * Force reconnection to the WebSocket server
   */
  const reconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setTimeout(() => {
        if (clientRef.current) {
          clientRef.current.connect();
        }
      }, 500);
    }
  };

  return { 
    isConnected, 
    connectionAttempts, 
    connectionDisabled,
    send,
    reconnect,
    resetCircuitBreaker: () => {
      if (circuitBreakerTimer.current) {
        clearTimeout(circuitBreakerTimer.current);
      }
      setConnectionDisabled(false);
      errorCountRef.current = 0;
      setConnectionAttempts(0);
    }
  };
}

export default useWebSocket;