/**
 * WebSocket Client API for TypeScript
 * Provides a cleaner interface to the WebSocket server from client code
 */

// Define NodeJS.Timeout interface if needed
declare namespace NodeJS {
  interface Timeout {}
}
import { WebSocketMessage } from "../src/types/websocket";

/**
 * WebSocket client connection options
 */
export interface WebSocketClientOptions {
  /** Handler for received messages */
  onMessage?: (message: any) => void;
  /** Handler for connection open events */
  onOpen?: (event: Event) => void;
  /** Handler for connection close events */
  onClose?: (event: CloseEvent) => void;
  /** Handler for errors */
  onError?: (event: Event) => void;
  /** Auto-reconnect configuration */
  reconnect?: {
    /** Enable auto-reconnect (default: true) */
    enabled: boolean;
    /** Max reconnection attempts (default: 10) */
    maxAttempts: number;
    /** Base delay in ms between attempts (default: 2000) */
    baseDelay: number;
    /** Exponential backoff factor (default: 1.5) */
    backoffFactor: number;
  };
  /** Ping interval in ms (default: 20000) */
  pingInterval?: number;
}

/**
 * WebSocket client connection status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

/**
 * WebSocket Client API
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketClientOptions;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private userId: string;
  private clientId?: string;

  /**
   * Create a new WebSocket client
   * @param url WebSocket server URL
   * @param userId User ID to connect with
   * @param options Configuration options
   */
  constructor(url: string, userId: string, options: Partial<WebSocketClientOptions> = {}) {
    this.url = url.includes('?') ? `${url}&id=${userId}` : `${url}?id=${userId}`;
    this.userId = userId;
    
    // Default options
    this.options = {
      onMessage: () => {},
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      reconnect: {
        enabled: true,
        maxAttempts: 10,
        baseDelay: 2000,
        backoffFactor: 1.5
      },
      pingInterval: 20000,
      ...options
    };
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.status = 'connecting';
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = (event: Event) => {
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.startPingInterval();
        if (this.options.onOpen) this.options.onOpen(event);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        
        // Handle connection message to capture clientId
        if (data.type === 'connection' && data.status === 'connected' && data.clientId) {
          this.clientId = data.clientId;
        }
        
        // Skip ping messages from UI handling
        if (data.type !== 'ping' && this.options.onMessage) {
          this.options.onMessage(data);
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.stopPingInterval();
        this.status = 'disconnected';
        
        if (this.options.onClose) this.options.onClose(event);
        
        if (this.options.reconnect?.enabled && this.reconnectAttempts < (this.options.reconnect?.maxAttempts || 10)) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= (this.options.reconnect?.maxAttempts || 10)) {
          this.status = 'failed';
          console.log('Max reconnection attempts reached, giving up');
        }
      };

      this.ws.onerror = (event: Event) => {
        if (this.options.onError) this.options.onError(event);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.status = 'disconnected';
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.stopPingInterval();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.status = 'disconnected';
  }

  /**
   * Send a message to the WebSocket server
   * @param data Message to send
   * @returns Boolean indicating if send was successful
   */
  public send(data: Partial<WebSocketMessage>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, WebSocket not connected');
      return false;
    }

    try {
      // Add senderId and clientId if available
      const message: Partial<WebSocketMessage> = {
        ...data,
        senderId: this.userId
      };
      
      // Only add clientId if it exists
      if (this.clientId) {
        message.clientId = this.clientId;
      }

      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get client ID (available after successful connection)
   */
  public getClientId(): string | undefined {
    return this.clientId || undefined;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.status = 'reconnecting';
    this.reconnectAttempts += 1;
    
    const delay = this.options.reconnect?.baseDelay || 2000 * 
      Math.pow(this.options.reconnect?.backoffFactor || 1.5, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      } else {
        this.stopPingInterval();
      }
    }, this.options.pingInterval || 20000);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

/**
 * Create a WebSocket client connection
 * @param url WebSocket server URL
 * @param userId User ID for the connection
 * @param options Configuration options
 * @returns WebSocketClient instance
 */
export function createWebSocketClient(
  url: string, 
  userId: string,
  options: Partial<WebSocketClientOptions> = {}
): WebSocketClient {
  const client = new WebSocketClient(url, userId, options);
  client.connect();
  return client;
}