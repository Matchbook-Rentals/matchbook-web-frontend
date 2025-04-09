export interface WebSocketMessage {
  id?: string;
  conversationId?: string;
  senderId?: string;
  receiverId: string;
  content: string;
  senderRole?: string;
  imgUrl?: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  createdAt?: Date;
  updatedAt?: Date;
  clientId?: string;
  type?: string; // Message type (e.g., "ping", "text", "connection", "typing", "read_receipt")
  isTyping?: boolean; // Flag for typing indicators
  isRead?: boolean; // Flag for read receipts
  messageIds?: string[]; // List of message IDs marked as read
  timestamp?: Date; // Timestamp for timestamp-based read receipts
}

export interface WebSocketConnectionMessage {
  type: "connection";
  status: "connected" | "replaced" | "server_shutdown";
  clientId?: string;
}

export interface WebSocketDeliveryStatus {
  type: "delivery_status";
  status: "delivered";
  clientId?: string;
  timestamp: Date;
}

export interface WebSocketPersistenceStatus {
  type: "persistence_status";
  status: "saved";
  clientId?: string;
  timestamp: Date;
}

export interface WebSocketPersistenceError {
  type: "persistence_error";
  originalMessageId?: string;
  clientId?: string;
  message: string;
}

export interface WebSocketErrorMessage {
  type: "error";
  message: string;
}

export interface WebSocketPingResponse {
  type: "ping";
  timestamp: Date; // ms timestamp as string for consistency
  serverTime: string;
}

export type WebSocketResponse = 
  | WebSocketMessage
  | WebSocketConnectionMessage
  | WebSocketDeliveryStatus
  | WebSocketPersistenceStatus
  | WebSocketPersistenceError
  | WebSocketErrorMessage
  | WebSocketPingResponse;

// Server-side types
export interface Client {
  id: string;
  userId: string;
  socket: WebSocket;
  send: (message: any) => void;
  closed: boolean;
}

export type ClientsMap = Map<string, Client>;
