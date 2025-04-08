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
const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080;
const CLIENT_TIMEOUT_MS = 30000; // 30 seconds
const PING_INTERVAL_MS = 20000; // 20 seconds

// Create Express app and HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
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
        socket.emit('message', typeof message === 'string' ? JSON.parse(message) : message);
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
    .map(([id]) => id);

  if (receiversConnections.length === 0) {
    console.log(`No connected clients for receiverId ${message.receiverId}`);
    return;
  }

  // Send to all client connections of this user
  receiversConnections.forEach(clientId => {
    sendToClient(clientId, message);
  });
}

/**
 * Handle Socket.IO connection
 */
io.on('connection', (socket: any) => {
  const userId = socket.handshake.query.userId;
  
  if (!userId) {
    console.error('Connection rejected: No user ID provided');
    socket.disconnect(true);
    return;
  }

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

  // Handle message events
  socket.on('message', (message: WebSocketMessage) => {
    messagesReceived++;
    
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }

    console.log(`Received message from user ${userId} (client ${clientId})`);

    // Handle direct messages between users
    if (message.receiverId) {
      handleDirectMessage(message);
    }
  });
  
  // Handle typing events
  socket.on('typing', (message: WebSocketMessage) => {
    messagesReceived++;
    message.type = 'typing';
    
    console.log(`Received typing from user ${userId} (client ${clientId})`);
    
    if (message.receiverId) {
      handleDirectMessage(message);
    }
  });
  
  // Handle read receipt events
  socket.on('read_receipt', (message: WebSocketMessage) => {
    messagesReceived++;
    message.type = 'read_receipt';
    
    console.log(`Received read receipt from user ${userId} (client ${clientId})`);
    
    if (message.receiverId) {
      handleDirectMessage(message);
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