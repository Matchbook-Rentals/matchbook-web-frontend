// Socket.IO server implementation for Matchbook
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Environment variables with fallbacks
const PORT = process.env.SOCKET_IO_PORT ? parseInt(process.env.SOCKET_IO_PORT) : 8080;
const CLIENT_TIMEOUT_MS = 60000; // 60 seconds
const PING_INTERVAL_MS = 25000; // 25 seconds

// Log all environment variables at startup for debugging
console.log('Socket.IO Server Starting');
console.log('Environment variables:');
console.log('SOCKET_IO_PORT:', process.env.SOCKET_IO_PORT || '(not set, using default 8080)');
console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('NEXT_PUBLIC_SOCKET_IO_URL:', process.env.NEXT_PUBLIC_GO_SERVER || '(not set)');

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
  pingTimeout: CLIENT_TIMEOUT_MS,
  pingInterval: PING_INTERVAL_MS,
  connectTimeout: 20000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8, // 100MB
});

// Map to store all connected clients
const clients = new Map();

// Statistics for monitoring
let totalConnections = 0;
let messagesSent = 0;
let messagesReceived = 0;

/**
 * Sends a message to a specific client
 * @param {string} clientId The ID of the client to send to
 * @param {object} message The message to send
 * @returns {boolean} true if message was sent, false otherwise
 */
function sendToClient(clientId, message) {
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
 * @param {object} message The message to broadcast
 * @param {string} senderId The ID of the sender to exclude
 */
function broadcast(message, senderId) {
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
 * @param {string} id Client ID
 * @param {string} userId User ID
 * @param {object} socket Socket.IO connection
 * @returns {object} Client object
 */
function createClient(id, userId, socket) {
  return {
    id,
    userId,
    socket,
    closed: false,
    send: (message) => {
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
 * @param {string} clientId The ID of the client to close
 * @param {string} reason Reason for closing
 */
function closeClient(clientId, reason) {
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
 * Persists a message to the database via the API
 * @param {object} message The message to save
 * @returns {Promise<object|null>} The saved message or null if failed
 */
async function persistMessage(message) {
  // Skip persisting typing events or read receipts
  if (message.type === 'typing' || message.type === 'read_receipt') {
    return null;
  }

  try {
    // Make a POST request to the message save API
    const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/messages/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to persist message: ${response.status} ${response.statusText}`, errorData);
      return null;
    }

    const data = await response.json();
    console.log('Message successfully persisted:', data.savedMessage.id);
    return data.savedMessage;
  } catch (error) {
    console.error('Error persisting message:', error);
    return null;
  }
}

/**
 * Handles direct messages between users
 * @param {object} message The message to process
 */
async function handleDirectMessage(message) {
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
  } else {
    console.log(`Found ${receiversConnections.length} connections for receiverId ${message.receiverId}`);
  }

  // For regular messages (not typing or read receipts), persist to database first
  let savedMessage = null;
  if (message.type === 'message') {
    savedMessage = await persistMessage(message);
    
    // If successfully saved and message has a clientId, update with database ID and delivery status
    if (savedMessage && message.clientId) {
      message.id = savedMessage.id;
      message.deliveryStatus = 'delivered';
      
      // Also send a delivery confirmation to the sender
      const senderConnections = Array.from(clients.entries())
        .filter(([_, client]) => client.userId === message.senderId)
        .map(([id, client]) => ({ id, client }));
      
      for (const { id, client } of senderConnections) {
        try {
          // Create a delivery confirmation message that matches the original
          // but with added database ID and updated delivery status
          const deliveryConfirmation = {
            ...message,
            type: 'message',
            deliveryStatus: 'delivered',
            id: savedMessage.id,
            clientId: message.clientId, // Keep clientId for matching
          };
          
          console.log(`Sending delivery confirmation to sender ${id}:`, deliveryConfirmation);
          sendToClient(id, deliveryConfirmation);
        } catch (err) {
          console.error(`Error sending delivery confirmation to sender ${id}:`, err);
        }
      }
    }
  }

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
  if (receiversConnections.length > 0) {
    if (deliverySuccessful) {
      console.log(`Message successfully delivered to at least one client for user ${message.receiverId}`);
    } else {
      console.error(`Failed to deliver message to any clients for user ${message.receiverId}`);
    }
  }
}

/**
 * Handle Socket.IO connection
 */
io.on('connection', (socket) => {
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
  
  // Limit connections per user (prevent connection leaks)
  const MAX_CONNECTIONS_PER_USER = 3;
  if (userConnections >= MAX_CONNECTIONS_PER_USER) {
    console.warn(`Too many connections for user ${userId} (${userConnections}). Closing oldest connections.`);
    
    // Find connections for this user and sort by creation time
    const userConnectionList = [...clients.entries()]
      .filter(([_, client]) => client.userId === userId)
      .sort((a, b) => {
        const idA = a[0].split('-')[1] || '0'; // Extract timestamp from clientId
        const idB = b[0].split('-')[1] || '0';
        return Number(idA) - Number(idB); // Sort ascending (oldest first)
      });
    
    // Close all but the most recent connections
    const connectionsToClose = userConnectionList.slice(0, userConnectionList.length - (MAX_CONNECTIONS_PER_USER - 1));
    connectionsToClose.forEach(([clientId]) => {
      closeClient(clientId, 'Too many connections for this user');
    });
  }

  // Generate a unique client ID
  const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  totalConnections++;
  
  // Create client and add to clients map
  const client = createClient(clientId, userId, socket);
  clients.set(clientId, client);

  console.log(`New connection: Client ${clientId} for user ${userId}. Total clients: ${clients.size}`);

  // Send connection confirmation
  const connectionMessage = {
    type: 'connection',
    status: 'connected',
    clientId
  };
  client.send(connectionMessage);

  // Handle message events
  socket.on('message', async (message) => {
    messagesReceived++;
    
    // Enhanced message reception logging
    console.log(`[MESSAGE RECEIVED] Socket ID: ${socket.id}, User: ${userId}, Client: ${clientId}, Time: ${new Date().toISOString()}`);
    console.log(`Message content:`, message);
    
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
      await handleDirectMessage(message);
    } else {
      console.warn(`Message missing receiverId - cannot route:`, message);
    }
  });
  
  // Handle typing events
  socket.on('typing', (message) => {
    messagesReceived++;
    
    // Enhanced typing event logging
    console.log(`[TYPING RECEIVED] Socket ID: ${socket.id}, User: ${userId}, Client: ${clientId}, Time: ${new Date().toISOString()}`);
    console.log(`Typing event details:`, message);
    
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
  socket.on('read_receipt', (message) => {
    messagesReceived++;
    
    // Enhanced read receipt logging
    console.log(`[READ_RECEIPT RECEIVED] Socket ID: ${socket.id}, User: ${userId}, Client: ${clientId}, Time: ${new Date().toISOString()}`);
    console.log(`Read receipt details:`, message);
    
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
  socket.on('disconnect', (reason) => {
    console.log(`Client ${clientId} disconnected: ${reason}. Removing from clients list.`);
    closeClient(clientId, `Socket disconnected: ${reason}`);
  });

  // Handle errors
  socket.on('error', (err) => {
    console.error(`Error with client ${clientId}:`, err);
    closeClient(clientId, `Socket error: ${err.message}`);
  });

  // Set a timeout to auto-close idle connections
  const timeout = setTimeout(() => {
    closeClient(clientId, 'Connection timeout');
  }, CLIENT_TIMEOUT_MS);

  // Clear timeout when the socket disconnects
  socket.on('disconnect', () => {
    clearTimeout(timeout);
  });
});

// API endpoints for server status and stats
app.get('/health', (_, res) => {
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

app.get('/stats', (_, res) => {
  const activeUsers = new Set(Array.from(clients.values()).map(client => client.userId)).size;
  
  // Get more detailed user connection stats
  const userConnections = {};
  clients.forEach(client => {
    if (!userConnections[client.userId]) {
      userConnections[client.userId] = 0;
    }
    userConnections[client.userId]++;
  });
  
  // Get most active users (users with most connections)
  const usersWithMultipleConnections = Object.entries(userConnections)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Show top 10
  
  res.status(200).json({
    connections: clients.size,
    activeUsers,
    totalConnections,
    messagesSent,
    messagesReceived,
    detailedStats: {
      usersWithMultipleConnections,
      connectionsByUser: userConnections,
    }
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
  
  clients.forEach((client) => {
    try {
      client.send({
        type: 'connection',
        status: 'server_shutdown'
      });
    } catch (err) {
      console.error(`Error sending shutdown notice to client ${client.id}:`, err);
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
