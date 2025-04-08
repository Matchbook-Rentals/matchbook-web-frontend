import { useState, useEffect, useRef } from 'react';
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
  const clientRef = useRef<WebSocketClient | null>(null);

  // Set up WebSocket client
  useEffect(() => {
    if (!url || !userId) {
      console.log('WebSocket: Missing url or userId', { url, userId });
      return;
    }

    console.log('WebSocket: Attempting connection to', url, 'with userId', userId);

    const clientOptions: Partial<WebSocketClientOptions> = {
      onOpen: (event) => {
        console.log('WebSocket: Connected successfully', event);
        setIsConnected(true);
        setConnectionAttempts(0);
        if (options.onOpen) options.onOpen(event);
      },
      onMessage: (message) => {
        console.log('WebSocket: Received message', message);
        if (options.onMessage) options.onMessage(message);
      },
      onError: (error) => {
        console.error('WebSocket: Connection error', error);
        setIsConnected(false);
        if (options.onError) options.onError(error);
      },
      onClose: (event) => {
        console.log('WebSocket: Connection closed', event.code, event.reason);
        setIsConnected(false);
        if (options.onClose) options.onClose(event);
      },
      reconnect: {
        enabled: true,
        maxAttempts: 5, // Reduced to prevent too many reconnection attempts
        baseDelay: 3000,
        backoffFactor: 1.5
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
  }, [url, userId, options.onMessage, options.onError, options.onClose, options.onOpen]);

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
    send,
    reconnect
  };
}

export default useWebSocket;