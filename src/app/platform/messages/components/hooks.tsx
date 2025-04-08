'use client';
import { useState, useEffect, useRef } from 'react';

// Extended WebSocket interface to include our custom properties
interface ExtendedWebSocket extends WebSocket {
  openTime?: number;
}

/**
 * Custom hook to manage WebSocket connection
 */
export const useWebSocket = (
  url: string,
  options: {
    onMessage: (message: any) => void;
    onError: (error: Event) => void;
    onClose: (event: CloseEvent) => void;
    onOpen: (event: Event) => void;
  }
) => {
  const wsRef = useRef<ExtendedWebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  // Add a ref to track if we're already connecting
  const isConnectingRef = useRef(false);

  const connectWebSocket = () => {
    const MAX_RECONNECT_ATTEMPTS = 10;
    const BASE_RECONNECT_DELAY = 2000;
    // Increase ping interval to reduce overhead (server sends pings every 15s)
    const PING_INTERVAL = 30000;

    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('[WebSocket] Already connecting, skipping duplicate attempt');
      return;
    }

    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`[WebSocket] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Waiting 30s before trying again.`);
      setTimeout(() => {
        setConnectionAttempts(0);
        connectWebSocket();
      }, 30000);
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      console.log('[WebSocket] Closing existing connection');
      wsRef.current.close();
    }
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    console.log(`[WebSocket] Attempting connection to ${url} (attempt ${connectionAttempts + 1})`);
    isConnectingRef.current = true;
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = (event) => {
      console.log(`[WebSocket] Connection opened to ${url}`);
      // Add timestamp to track connection duration
      wsRef.current.openTime = Date.now();
      setIsConnected(true);
      setConnectionAttempts(0);
      isConnectingRef.current = false;
      options.onOpen(event);
      
      // Reduced ping frequency to avoid potential issues
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('[WebSocket] Sending ping');
          wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now().toString() }));
        }
      }, PING_INTERVAL);
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== 'ping') options.onMessage(message);
    };

    wsRef.current.onerror = (error) => {
      console.log(`[WebSocket] Error occurred:`, error);
      console.log(`[WebSocket] ReadyState at error: ${wsRef.current?.readyState}`);
      // Try to extract more info about the error
      if (error && (error as any).target) {
        const target = (error as any).target;
        console.log(`[WebSocket] Error target:`, target);
        if (target.readyState) {
          console.log(`[WebSocket] Target readyState: ${target.readyState}`);
        }
      }
      setIsConnected(false);
      isConnectingRef.current = false;
      options.onError(error);
    };

    wsRef.current.onclose = (event) => {
      console.log(`[WebSocket] Connection closed: code=${event.code}, reason=${event.reason || 'No reason'}, wasClean=${event.wasClean}`);
      // Log browser-specific details to help diagnose the issue
      console.log(`[WebSocket] Browser details: ${navigator.userAgent}`);
      console.log(`[WebSocket] Connection URL: ${url}`);
      console.log(`[WebSocket] Connection duration: ${(Date.now() - wsRef.current?.openTime || 0) / 1000}s`);
      
      setIsConnected(false);
      isConnectingRef.current = false;
      options.onClose(event);
      
      // Analysis of close code 1006 (abnormal closure)
      if (event.code === 1006) {
        console.log("[WebSocket] Close code 1006 indicates an abnormal closure - possible causes:");
        console.log("- Network interruption");
        console.log("- Proxy/firewall termination");
        console.log("- Server process terminated");
        console.log("- Timeout occurred");
      }
      
      if (!event.wasClean) {
        const delay = BASE_RECONNECT_DELAY * Math.pow(1.5, connectionAttempts);
        console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${connectionAttempts + 1})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionAttempts((prev) => prev + 1);
          connectWebSocket();
        }, delay);
      }
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      // Cleanup on unmount with proper closing sequence
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        // Attempt a clean close
        try {
          console.log('[WebSocket] Closing connection cleanly on unmount');
          
          // Send a close frame with a normal closure code
          wsRef.current.close(1000, 'Component unmounting');
          
          // Give it a bit of time to send the close frame before cleaning up
          setTimeout(() => {
            wsRef.current = null;
            isConnectingRef.current = false;
          }, 300);
        } catch (e) {
          console.error('[WebSocket] Error during clean close:', e);
          wsRef.current = null;
          isConnectingRef.current = false;
        }
      } else {
        isConnectingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Still depends on url changes

  const send = (data: any) => {
    if (wsRef.current && isConnected) {
      console.log('SEND', data)
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { ws: wsRef.current, isConnected, connectionAttempts, send };
};

/**
 * Custom hook to detect mobile devices
 */
export const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = () => setIsMobile(window.innerWidth < 768);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
