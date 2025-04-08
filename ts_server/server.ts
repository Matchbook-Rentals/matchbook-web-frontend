// Import types
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
import { 
  ClientsMap, 
  Client, 
  WebSocketMessage, 
  WebSocketConnectionMessage,
  WebSocketResponse,
  WebSocketPingResponse
} from '../src/types/websocket';

// Environment variables with fallbacks
const PORT = process.env.SOCKET_IO_PORT ? parseInt(process.env.SOCKET_IO_PORT) : 8080;
const CLIENT_TIMEOUT_MS = 60000; // 60 seconds
const PING_INTERVAL_MS = 25000; // 25 seconds

// Log all environment variables at startup for debugging
console.log('Socket.IO Server Starting');
console.log('Environment variables:');
console.log('SOCKET_IO_PORT:', process.env.SOCKET_IO_PORT || '(not set, using default 8080)');
console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('NEXT_PUBLIC_GO_SERVER_URL:', process.env.NEXT_PUBLIC_GO_SERVER_URL || '(not set)');

// Create Express app and HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Create Socket.IO server with improved configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Prioritize websocket first
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 20000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8, // 100MB
  parser: require('socket.io-parser')
});

// Map to store all connected clients
const clients: ClientsMap = new Map();

// Statistics for monitoring
let totalConnections = 0;
let messagesSent = 0;
let messagesReceived = 0;

/**
 * Sends a message to a specific client
 * @param clientId The ID of the client to send to
 * @param message The message to send
 * @returns true if message was sent, false otherwise
 */
function sendToClient(clientId: string, message: WebSocketResponse): boolean {
  const client = clients.get(clientId);
  if (!client || client.closed) {
    console.log(`Cannot send to client ${clientId} - not connected or closed`);
    return false;
  }

  try {
    client.send(JSON.stringify(message));
    messagesSent++;
    return true;
  } catch (err) {
    console.error(`Error sending message to client ${clientId}:`, err);
    return false;
  }
}

/**
 * Sends a message to all clients except the sender
 * @param message The message to broadcast
 * @param senderId The ID of the sender to exclude
 */
function broadcast(message: WebSocketResponse, senderId?: string): void {
  clients.forEach((client, id) => {
    if (id !== senderId && !client.closed) {
      try {
        client.send(JSON.stringify(message));
        messagesSent++;
      } catch (err) {
        console.error(`Error broadcasting to client ${id}:`, err);
      }
    }
  });
}

/**
 * Creates a new client instance
 * @param id Client ID
 * @param userId User ID
 * @param socket Socket.IO connection
 * @returns Client object
 */
function createClient(id: string, userId: string, socket: any): Client {
  return {
    id,
    userId,
    socket,
    closed: false,
    send: (message: any) => {
      try {
        if (!socket || !socket.connected) return;
        
        // If the message is a string, parse it to an object
        const messageObj = typeof message === 'string' ? JSON.parse(message) : message;
        
        // Make sure it has the basic required fields
        if (messageObj && (!messageObj.type && messageObj.content)) {
          messageObj.type = 'message';
        }
        
        // Add timestamp if missing
        if (!messageObj.timestamp) {
          messageObj.timestamp = new Date().toISOString();
        }
        
        console.log(`Socket.IO emitting message to client ${id}:`, messageObj);
        socket.emit('message', messageObj);
        messagesSent++;
      } catch (err) {
        console.error(`Error sending to client ${id}:`, err);
      }
    }
  };
}

/**
 * Closes a client connection
 * @param clientId The ID of the client to close
 * @param reason Reason for closing
 */
function closeClient(clientId: string, reason: string): void {
  const client = clients.get(clientId);
  if (!client) return;

  console.log(`Closing client ${clientId}: ${reason}`);
  
  try {
    client.closed = true;
    client.socket.disconnect(true);
  } catch (err) {
    console.error(`Error closing client ${clientId}:`, err);
  } finally {
    clients.delete(clientId);
  }
}

/**
 * Handles direct messages between users
 * @param message The message to process
 */
function handleDirectMessage(message: WebSocketMessage): void {
  if (!message.receiverId) {
    console.error('Missing receiverId in direct message');
    return;
  }

  // Find all client connections for this receiver
  const receiversConnections = Array.from(clients.entries())
    .filter(([_, client]) => client.userId === message.receiverId)
    .map(([id, client]) => ({ id, client }));

  if (receiversConnections.length === 0) {
    console.log(`No connected clients for receiverId ${message.receiverId}`);
    return;
  }

  console.log(`Found ${receiversConnections.length} connections for receiverId ${message.receiverId}`);

  // Send to all client connections of this user
  let deliverySuccessful = false;
  for (const { id, client } of receiversConnections) {
    try {
      // Log the actual message being sent
      console.log(`Sending message to client ${id} (userId: ${client.userId}):`, message);
      
      // Send the message
      const success = sendToClient(id, message);
      deliverySuccessful = deliverySuccessful || success;
      
      console.log(`Message delivery to client ${id}: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (err) {
      console.error(`Error delivering message to client ${id}:`, err);
    }
  }

  // Log delivery status
  if (deliverySuccessful) {
    console.log(`Message successfully delivered to at least one client for user ${message.receiverId}`);
  } else {
    console.error(`Failed to deliver message to any clients for user ${message.receiverId}`);
  }
}

/**
 * Handle Socket.IO connection
 */
io.on('connection', (socket: any) => {
  console.log(`New Socket.IO connection: ${socket.id}`);
  console.log('Connection handshake:', socket.handshake.query);
  
  // Try to get userId from different possible locations
  // Handle the "Object: null prototype" issue that can happen with query params
  let handshakeQuery = socket.handshake.query;
  
  // If the query is an Object.create(null), convert it to a regular object
  if (Object.getPrototypeOf(handshakeQuery) === null) {
    console.log('Detected null prototype query object, converting to regular object');
    handshakeQuery = { ...handshakeQuery };
  }
  
  const userId = handshakeQuery.userId || 
                handshakeQuery.id ||
                socket.handshake.auth?.userId;
  
  if (!userId) {
    console.error('Connection rejected: No user ID provided');
    socket.disconnect(true);
    return;
  }
  
  console.log(`Parsed userId from connection: ${userId}`);
  
  // Check if user already has connections
  let userConnections = 0;
  for (const [_, client] of clients.entries()) {
    if (client.userId === userId) {
      userConnections++;
    }
  }
  console.log(`User ${userId} already has ${userConnections} active connections`);
  
  // Generate a unique client ID
  const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  totalConnections++;
  
  // Create client and add to clients map
  const client = createClient(clientId, userId, socket);
  clients.set(clientId, client);

  console.log(`New connection: Client ${clientId} for user ${userId}. Total clients: ${clients.size}`);

  // Send connection confirmation
  const connectionMessage: WebSocketConnectionMessage = {
    type: 'connection',
    status: 'connected',
    clientId
  };
  client.send(connectionMessage);
  
  // Log any socket.io transport change
  socket.conn.on('upgrade', (transport: any) => {
    console.log(`Socket.IO client ${clientId} transport upgraded to: ${transport.name}`);
  });
  
  // Log explicit ping/pong activity (helps with debugging timeout issues)
  socket.conn.on('packet', (packet: any) => {
    if (packet.type === 'ping' || packet.type === 'pong') {
      console.log(`Socket.IO ${packet.type} for client ${clientId}`);
    }
  });

  // Handle message events
  socket.on('message', (message: WebSocketMessage) => {
    messagesReceived++;
    
    console.log(`Received raw message from socket ${socket.id} (user ${userId}, client ${clientId}):`, message);
    
    // Validate message structure
    if (!message) {
      console.error('Received empty message');
      return;
    }
    
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    // Add sender information if missing
    if (!message.senderId) {
      message.senderId = userId;
    }
    
    // Default to text message type if not specified
    if (!message.type && message.content) {
      message.type = 'message';
    }

    console.log(`Processed message from user ${userId} (client ${clientId}):`, message);

    // Handle direct messages between users
    if (message.receiverId) {
      console.log(`Routing message to ${message.receiverId}:`, message);
      handleDirectMessage(message);
    } else {
      console.warn(`Message missing receiverId - cannot route:`, message);
    }
  });
  
  // Handle typing events
  socket.on('typing', (message: WebSocketMessage) => {
    messagesReceived++;
    
    // Ensure message is properly structured
    if (!message) {
      console.error('Received empty typing event');
      return;
    }
    
    message.type = 'typing';
    message.senderId = message.senderId || userId;
    message.timestamp = message.timestamp || new Date().toISOString();
    
    console.log(`Received typing from user ${userId} (client ${clientId}) to ${message.receiverId}`);
    
    if (message.receiverId) {
      handleDirectMessage(message);
    } else {
      console.warn(`Typing event missing receiverId - cannot route`);
    }
  });
  
  // Handle read receipt events
  socket.on('read_receipt', (message: WebSocketMessage) => {
    messagesReceived++;
    
    // Ensure message is properly structured
    if (!message) {
      console.error('Received empty read receipt event');
      return;
    }
    
    message.type = 'read_receipt';
    message.senderId = message.senderId || userId;
    message.timestamp = message.timestamp || new Date().toISOString();
    
    console.log(`Received read receipt from user ${userId} (client ${clientId}) for recipient ${message.receiverId}`);
    
    if (message.receiverId) {
      handleDirectMessage(message);
    } else {
      console.warn(`Read receipt missing receiverId - cannot route`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason: string) => {
    console.log(`Client ${clientId} disconnected: ${reason}. Removing from clients list.`);
    closeClient(clientId, `Socket disconnected: ${reason}`);
  });

  // Handle errors
  socket.on('error', (err: Error) => {
    console.error(`Error with client ${clientId}:`, err);
    closeClient(clientId, `Socket error: ${err.message}`);
  });

  // Set a timeout to auto-close idle connections (Socket.IO has built-in ping/pong)
  const timeout = setTimeout(() => {
    closeClient(clientId, 'Connection timeout');
  }, CLIENT_TIMEOUT_MS);

  // Clear timeout when the socket disconnects
  socket.on('disconnect', () => {
    clearTimeout(timeout);
  });
});

// API endpoints for server status and stats
app.get('/health', (_: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    connections: clients.size,
    stats: {
      totalConnections,
      messagesSent,
      messagesReceived
    }
  });
});

app.get('/stats', (_: express.Request, res: express.Response) => {
  const activeUsers = new Set(Array.from(clients.values()).map(client => client.userId)).size;
  
  res.status(200).json({
    connections: clients.size,
    activeUsers,
    totalConnections,
    messagesSent,
    messagesReceived
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('Shutting down WebSocket server...');
  
  // Notify all clients
  io.emit('disconnect', { reason: 'server_shutdown' });
  
  clients.forEach((client, id) => {
    try {
      client.send({
        type: 'connection',
        status: 'server_shutdown'
      });
    } catch (err) {
      console.error(`Error sending shutdown notice to client ${id}:`, err);
    }
  });
  
  // Close server
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
  
  // Force close after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}