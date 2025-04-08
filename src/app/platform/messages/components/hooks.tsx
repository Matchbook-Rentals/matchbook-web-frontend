'use client';
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage WebSocket connection
 */
export const useWebSocket = (url: string, options: {
  onMessage: (message: any) => void;
  onError: (error: Event) => void;
  onClose: (event: CloseEvent) => void;
  onOpen: (event: Event) => void;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const connectWebSocket = () => {
    const MAX_RECONNECT_ATTEMPTS = 10;
    const BASE_RECONNECT_DELAY = 2000;
    const PING_INTERVAL = 20000;

    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`[WebSocket] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Waiting 30s before trying again.`);
      setTimeout(() => {
        setConnectionAttempts(0);
        connectWebSocket();
      }, 30000);
      return;
    }

    if (wsRef.current) {
      console.log('[WebSocket] Closing existing connection');
      console.log('URL', url);
      wsRef.current.close();
    }
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    console.log(`[WebSocket] Attempting connection to ${url} (attempt ${connectionAttempts + 1})`);
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = (event) => {
      console.log(`[WebSocket] Connection opened to ${url}`);
      setIsConnected(true);
      setConnectionAttempts(0);
      options.onOpen(event);
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('[WebSocket] Sending ping');
          wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, PING_INTERVAL);
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== 'ping') options.onMessage(message);
    };

    wsRef.current.onerror = (error) => {
      setIsConnected(false);
      options.onError(error);
    };

    wsRef.current.onclose = (event) => {
      console.log(`[WebSocket] Connection closed: code=${event.code}, reason=${event.reason || 'No reason'}, wasClean=${event.wasClean}`);
      setIsConnected(false);
      options.onClose(event);
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
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

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
