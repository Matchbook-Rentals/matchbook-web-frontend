// Socket.IO server implementation for Matchbook
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createAdapter } = require('@socket.io/redis-adapter');
const { Redis } = require('ioredis');

// Environment variables with fallbacks
const PORT = process.env.SOCKET_IO_PORT ? parseInt(process.env.SOCKET_IO_PORT) : 8080;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_MESSAGE_TTL_SECONDS = process.env.REDIS_MESSAGE_TTL_SECONDS ? parseInt(process.env.REDIS_MESSAGE_TTL_SECONDS) : 5; // 5 seconds default TTL for queued messages
const CLIENT_TIMEOUT_MS = 60000; // 60 seconds
const PING_INTERVAL_MS = 25000; // 25 seconds

// Log all environment variables at startup for debugging
console.log('Socket.IO Server Starting');
console.log('Environment variables:');
console.log('SOCKET_IO_PORT:', process.env.SOCKET_IO_PORT || `(not set, using default ${PORT})`);
console.log('REDIS_HOST:', process.env.REDIS_HOST || `(not set, using default ${REDIS_HOST})`);
console.log('REDIS_PORT:', process.env.REDIS_PORT || `(not set, using default ${REDIS_PORT})`);
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '(set)' : '(not set)');
console.log('REDIS_MESSAGE_TTL_SECONDS:', process.env.REDIS_MESSAGE_TTL_SECONDS || `(not set, using default ${REDIS_MESSAGE_TTL_SECONDS})`);
console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('NEXT_PUBLIC_SOCKET_IO_URL:', process.env.NEXT_PUBLIC_GO_SERVER_URL || '(not set)');

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
  // Enhanced stability settings
  path: '/socket.io/', // Explicit path
  serveClient: false, // Don't serve client files
  perMessageDeflate: { // Compression settings
    threshold: 1024, // Only compress messages > 1KB
    zlibDeflateOptions: {
      chunkSize: 16 * 1024 // 16KB
    },
    zlibInflateOptions: {
      windowBits: 15,
      chunkSize: 16 * 1024 // 16KB
    }
  }
});

// Setup Redis clients for adapter and general use
const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  // Add retry strategy for robustness
  retryStrategy: times => Math.min(times * 50, 2000) // Exponential backoff up to 2s
};

const pubClient = new Redis(redisOptions);
const subClient = pubClient.duplicate(); // Duplicate connection for pub/sub
const redisClient = pubClient.duplicate(); // Duplicate connection for general commands (queuing)

// Handle Redis connection errors
pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
redisClient.on('error', (err) => console.error('Redis General Client Error:', err));

// Create Redis adapter
const redisAdapter = createAdapter(pubClient, subClient);

// Attach Redis adapter to Socket.IO server
io.adapter(redisAdapter);

// Map to store connected clients *on this instance*
const clients = new Map();

// Statistics for monitoring
let totalConnections = 0;
let messagesSent = 0;
let messagesReceived = 0;

/**
 * Sends a message to a specific client
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
        // Use io.to for user-specific emits if targeting all sockets of a user
        // Use socket.emit for instance-specific emits
        socket.emit('message', messageObj);
        messagesSent++;
      } catch (err) {
        console.error(`Error sending to client ${id} via socket.emit:`, err);
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
  if (!client) {
    // console.log(`Attempted to close non-existent client: ${clientId}`); // Optional: Log if needed
    return;
  }

  console.log(`[SERVER CLOSE] Explicitly closing client ${clientId}. Reason: ${reason}`);
  
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
    return data.savedMessage;
  } catch (error) {
    console.error('Error persisting message:', error);
    return null;
  }
}

/**
 * Handles direct messages between users
 * @param {object} message The message to process (includes senderId, receiverId, etc.)
 * @returns {object} Delivery result information
 */
async function handleDirectMessage(message) {
  if (!message.receiverId) {
    console.error('Missing receiverId in direct message:', message);
    return { delivered: false, reason: 'missing_receiver_id' };
  }
  if (!message.senderId) {
    console.error('Missing senderId in direct message:', message);
    return { delivered: false, reason: 'missing_sender_id' };
  }

  // Persist message first (for message/file types)
  let savedMessage = null;
  let persistError = null;
  
  // Track delivery metrics
  const deliveryResult = {
    messageId: message.id, // Use the client-provided ID or generated one
    delivered: false, // Indicates if sent to *any* socket or queued
    queued: false, // Indicates if message was queued for offline delivery
    persistSuccess: false,
    deliveryAttempts: 0, // Will be based on adapter info or 1 (for queueing)
    deliverySuccesses: 0, // Based on adapter info if online
    timestamp: Date.now()
  };
  
  // Persist both regular messages and file messages
  if (message.type === 'message' || message.type === 'file') {
    try {
      savedMessage = await persistMessage(message);
      
      if (savedMessage) {
        deliveryResult.persistSuccess = true;
        
        // If successfully saved, send a delivery confirmation back to *all* sender's connected sockets
        // Use the original message ID provided by the client
        if (message.id && savedMessage && message.id === savedMessage.id) {
          // Create a delivery confirmation message using the original ID
          const deliveryConfirmation = {
            ...message, // Include original message data
            type: 'message', // Ensure type is set
            deliveryStatus: 'delivered', // Confirm delivery (server received and persisted)
            id: message.id, // Use the original client-provided ID
            confirmedDeliveryAt: new Date().toISOString() // Add confirmation timestamp
          };
          // Emit to the room identified by the sender's userId
          io.to(message.senderId).emit('message', deliveryConfirmation);
          console.log(`Sent delivery confirmation for message ${message.id} to sender ${message.senderId}`);
        }
      } else {
        // Persistence might have failed or returned null
        console.warn(`Persistence returned null or failed for message (id: ${message.id})`);
        deliveryResult.persistSuccess = false;
        deliveryResult.persistError = 'null_result_or_failed'; // Indicate potential failure
      }
    } catch (error) {
      persistError = error;
      console.error(`Persistence failed for message (id: ${message.id}):`, error);
      deliveryResult.persistSuccess = false;
      deliveryResult.persistError = error.message;
    }
  } else {
    // Non-message types (typing, read receipts) don't need persistence
    deliveryResult.persistSuccess = true;
    deliveryResult.persistRequired = false; // Indicate persistence wasn't needed for this type
  }

  // If persistence failed for a message/file type, stop here
  if ((message.type === 'message' || message.type === 'file') && !deliveryResult.persistSuccess) {
    console.error(`Cannot deliver message ${message.id} due to persistence failure.`);
    deliveryResult.delivered = false;
    deliveryResult.failureReason = 'persistence_failed';
    return deliveryResult;
  }

  // Check if receiver is online using Redis adapter
  const receiverSockets = await io.in(message.receiverId).allSockets();
  const isReceiverOnline = receiverSockets.size > 0;

  deliveryResult.deliveryAttempts = isReceiverOnline ? receiverSockets.size : 1; // 1 attempt if queuing

  if (isReceiverOnline) {
    // Receiver is online, emit message to their room (adapter handles distribution)
    console.log(`Receiver ${message.receiverId} is online (${receiverSockets.size} sockets). Emitting message ${message.id} via adapter.`);
    io.to(message.receiverId).emit(message.type, message); // Emit using the message type as event name
    deliveryResult.delivered = true;
    deliveryResult.deliverySuccesses = receiverSockets.size; // Assume adapter delivers to all
  } else {
    // Receiver is offline, queue the message in Redis (only for message/file types)
    if (message.type === 'message' || message.type === 'file') {
      const queueKey = `user:${message.receiverId}:messages`;
      try {
        console.log(`Receiver ${message.receiverId} is offline. Queuing message ${message.id} in Redis.`);
        // LPUSH the message and set TTL on the list
        const multi = redisClient.multi();
        multi.lpush(queueKey, JSON.stringify(message));
        multi.expire(queueKey, REDIS_MESSAGE_TTL_SECONDS);
        await multi.exec();

        deliveryResult.delivered = true; // Considered delivered because it's queued
        deliveryResult.queued = true;
        deliveryResult.deliverySuccesses = 1; // Represents successful queuing
      } catch (err) {
        console.error(`Failed to queue message ${message.id} for user ${message.receiverId} in Redis:`, err);
        deliveryResult.delivered = false;
        deliveryResult.failureReason = 'redis_queue_failed';
        deliveryResult.error = err.message;
      }
    } else {
      // Don't queue ephemeral messages like typing or read receipts if user is offline
      console.log(`Receiver ${message.receiverId} is offline. Discarding ephemeral message type: ${message.type}`);
      deliveryResult.delivered = false;
      deliveryResult.failureReason = 'recipient_offline_ephemeral';
    }
  }
  
  return deliveryResult;
}

/**
 * Handle heartbeat messages
 */
io.of('/').on('heartbeat', (socket, data, callback) => {
  // Echo back heartbeat with timestamp for latency measurement
  if (typeof callback === 'function') {
    callback({
      received: true,
      originalTimestamp: data.timestamp,
      serverTimestamp: Date.now()
    });
  }
});

/**
 * Handle Socket.IO connection
 */
io.on('connection', async (socket) => { // Add async keyword here
  console.log(`New Socket.IO connection: ${socket.id}`);
  console.log('Connection handshake:', socket.handshake.query);
  console.log('Transport used:', socket.conn.transport.name);
  
  // Track connection quality metrics
  const connectionMetrics = {
    messagesReceived: 0,
    messagesSuccessfullySent: 0,
    errors: 0,
    lastActivity: Date.now(),
    connectedAt: Date.now(),
    transportChanges: [{
      time: Date.now(),
      transport: socket.conn.transport.name
    }]
  };
  
  // Setup transport change monitoring
  socket.conn.on('upgrade', (transport) => {
    console.log(`Transport upgraded for ${socket.id}: ${transport.name}`);
    connectionMetrics.transportChanges.push({
      time: Date.now(),
      transport: transport.name
    });
  });
  
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

  // Join the user-specific room for targeted emits
  socket.join(userId);
  
  // Check if user already has connections *on this instance*
  let instanceUserConnections = 0;
  for (const [_, client] of clients.entries()) {
    if (client.userId === userId) {
      instanceUserConnections++; // Corrected variable name
    }
  }
  console.log(`User ${userId} already has ${instanceUserConnections} active connections on this instance.`); // Corrected variable name and log message
  
  // Limit connections per user *on this instance* (prevent instance overload)
  const MAX_INSTANCE_CONNECTIONS_PER_USER = 3; // Adjust as needed
  if (instanceUserConnections >= MAX_INSTANCE_CONNECTIONS_PER_USER) {
    console.warn(`Too many connections for user ${userId} (${instanceUserConnections}) on this instance. Closing oldest connections on this instance.`);
    
    // Find connections for this user and sort by creation time
    const userConnectionList = [...clients.entries()]
      .filter(([_, client]) => client.userId === userId)
      .sort((a, b) => {
        const idA = a[0].split('-')[1] || '0'; // Extract timestamp from clientId
        const idB = b[0].split('-')[1] || '0';
        return Number(idA) - Number(idB); // Sort ascending (oldest first)
      });
    
    // Close all but the most recent connections *on this instance*
    const connectionsToClose = userConnectionList.slice(0, userConnectionList.length - (MAX_INSTANCE_CONNECTIONS_PER_USER - 1));
    connectionsToClose.forEach(([clientId]) => {
      closeClient(clientId, 'Too many connections for this user on this instance');
    });
  }

  // Generate a unique client ID
  const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  totalConnections++;
  
  // Create client and add to clients map
  const client = createClient(clientId, userId, socket);
  clients.set(clientId, client);

  console.log(`New connection: Client ${clientId} for user ${userId}. Total clients: ${clients.size}`);

  // Handle heartbeat messages for connection health monitoring
  socket.on('heartbeat', (data, callback) => {
    connectionMetrics.lastActivity = Date.now();
    
    // Echo back heartbeat with timestamp for latency measurement
    if (typeof callback === 'function') {
      callback({
        received: true,
        originalTimestamp: data.timestamp,
        serverTimestamp: Date.now()
      });
    }
  });
  
  // Send connection confirmation with server info and client ID
  const connectionMessage = {
    type: 'connection',
    status: 'connected',
    clientId,
    serverInfo: {
      version: '1.1.0',
      transport: socket.conn.transport.name,
      timestamp: Date.now(),
      supportedFeatures: ['message_ack', 'heartbeat', 'typing_indicator', 'read_receipts']
    }
  };
  client.send(connectionMessage); // Send connection confirmation to this specific socket

  // --- Check for and send queued messages ---
  const queueKey = `user:${userId}:messages`;
  try {
    // Retrieve all messages from the list
    const queuedMessages = await redisClient.lrange(queueKey, 0, -1);

    if (queuedMessages && queuedMessages.length > 0) {
      console.log(`Found ${queuedMessages.length} queued messages for user ${userId}. Sending...`);
      // Send messages one by one to the specific socket
      for (const msgString of queuedMessages) {
        try {
          const parsedMessage = JSON.parse(msgString);
          // Emit using the original message type
          socket.emit(parsedMessage.type || 'message', parsedMessage);
          messagesSent++; // Increment stats
        } catch (parseError) {
          console.error(`Error parsing queued message for user ${userId}:`, parseError, msgString);
        }
      }
      // Clear the queue after attempting to send all messages
      await redisClient.del(queueKey);
      console.log(`Cleared message queue ${queueKey}`);
    }
  } catch (redisError) {
    console.error(`Error retrieving queued messages for user ${userId} from Redis:`, redisError);
  }
  // --- End queued message handling ---


  // Handle message events with acknowledgments
  socket.on('message', async (message, callback) => {
    messagesReceived++;
    connectionMetrics.messagesReceived++;
    connectionMetrics.lastActivity = Date.now();
    
    // Enhanced message reception logging
    console.log(`[MESSAGE RECEIVED] Socket ID: ${socket.id}, User: ${userId}, Client: ${clientId}, Time: ${new Date().toISOString()}`);
    console.log(`Message content:`, message);
    
    // First, send immediate acknowledgment to reduce perceived latency
    if (typeof callback === 'function') {
      try {
        callback({
          received: true,
          timestamp: Date.now(),
          status: 'processing'
        });
      } catch (err) {
        console.error(`Error sending acknowledgment to ${clientId}:`, err);
      }
    }
    
    // Validate message structure
    if (!message) {
      console.error('Received empty message');
      connectionMetrics.errors++;
      return;
    }
    
    // Add timestamp if not present or ensure it's ISO format
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    } else if (message.timestamp instanceof Date) {
      // Convert Date objects to ISO strings
      message.timestamp = message.timestamp.toISOString();
    } else if (typeof message.timestamp === 'number') {
      // Convert timestamps in milliseconds to ISO strings
      message.timestamp = new Date(message.timestamp).toISOString();
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

    // Track message with a unique ID if not present
    const messageId = message.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    message.id = messageId;
    try {
      // Handle direct messages (includes queuing logic if offline)
      if (message.receiverId) {
        console.log(`Processing direct message from ${userId} to ${message.receiverId}:`, message);
        const deliveryResult = await handleDirectMessage(message);

        // Update metrics based on delivery result
        if (deliveryResult && (deliveryResult.delivered || deliveryResult.queued)) {
          connectionMetrics.messagesSuccessfullySent++;
        } else {
          console.warn(`Message ${messageId} delivery failed or partial`);
        }
      } else {
        console.warn(`Message missing receiverId - cannot route:`, message);
        connectionMetrics.errors++;
      }
    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error);
      connectionMetrics.errors++;
    }
  });
  
  // Handle typing events (emit via adapter, no queuing)
  socket.on('typing', (message) => {
    messagesReceived++;
    connectionMetrics.messagesReceived++;
    connectionMetrics.lastActivity = Date.now();

    console.log(`[TYPING RECEIVED] Socket ID: ${socket.id}, User: ${userId}, Client: ${clientId}, Time: ${new Date().toISOString()}`);
    console.log(`Typing event details:`, message);

    if (!message || !message.receiverId) {
      console.warn('Invalid typing event received (missing data or receiverId):', message);
      return;
    }

    // Add sender/type if missing and normalize timestamp
    message.type = 'typing';
    message.senderId = message.senderId || userId;
    message.timestamp = message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString();

    // Emit directly to the recipient's room via adapter
    io.to(message.receiverId).emit('typing', message);
    console.log(`Emitted typing event from ${userId} to ${message.receiverId}`);
  });

  // Handle read receipt events (emit via adapter, no queuing)
  socket.on('read_receipt', (message) => {
    messagesReceived++;
    connectionMetrics.messagesReceived++;
    connectionMetrics.lastActivity = Date.now();

    console.log(`[READ_RECEIPT RECEIVED] Socket ID: ${socket.id}, User: ${userId}, Client: ${clientId}, Time: ${new Date().toISOString()}`);
    console.log(`Read receipt details:`, message);

    if (!message || !message.receiverId || !message.messageIds || !message.timestamp) {
       console.warn('Invalid read receipt received (missing data):', message);
       return;
    }

    // Add sender/type if missing and normalize timestamp
    message.type = 'read_receipt';
    message.senderId = message.senderId || userId;
    message.timestamp = new Date(message.timestamp).toISOString(); // Ensure ISO string

    // Emit directly to the recipient's room via adapter
    io.to(message.receiverId).emit('read_receipt', message);
    console.log(`Emitted read receipt from ${userId} to ${message.receiverId}`);
  });

  // Handle disconnection - leave the user room
  socket.on('disconnect', (reason) => {
    // Log the disconnection reason received from Socket.IO
    console.log(`[DISCONNECT EVENT] Client ${clientId} (User: ${userId}) disconnected. Reason: "${reason}".`);
    // Possible reasons: 'client namespace disconnect', 'server namespace disconnect', 'ping timeout', 'transport close', 'transport error'

    // Add specific logging for common reasons
    if (reason === 'ping timeout') {
      console.warn(`[DISCONNECT DETAIL] Ping timeout detected for client ${clientId}. Check client responsiveness and network stability.`);
    } else if (reason === 'transport close') {
      console.log(`[DISCONNECT DETAIL] Transport closed for client ${clientId}. This is often normal (e.g., tab closed) but can indicate network issues.`);
    } else if (reason === 'transport error') {
      console.error(`[DISCONNECT DETAIL] Transport error for client ${clientId}. Investigate potential network or configuration problems.`);
    }

    // Call closeClient to clean up server-side state
    // The reason passed here adds context that the disconnection was detected by the 'disconnect' event handler
    closeClient(clientId, `Socket disconnected event received (Reason: ${reason})`);
  });

  // Handle errors from the underlying engine
  socket.on('error', (err) => {
    console.error(`[SOCKET ERROR] Error received for client ${clientId} (User: ${userId}):`, err);
    connectionMetrics.errors++;
    // Close the client as the socket might be in an unusable state
    closeClient(clientId, `Socket error event received: ${err.message}`);
  });

  // Note: The CLIENT_TIMEOUT_MS is used for the *initial connection* timeout by Socket.IO (`connectTimeout`).
  // The `pingTimeout` setting in the Server constructor handles ongoing connection health checks.
  // We don't need a separate manual timeout here if ping/pong is working correctly.
  // Removing the manual setTimeout to rely on pingTimeout.
  /*
  const timeout = setTimeout(() => {
    closeClient(clientId, 'Manual idle connection timeout'); // Changed reason for clarity
  }, CLIENT_TIMEOUT_MS); // CLIENT_TIMEOUT_MS might be too short for idle timeout, pingTimeout is better
  */
  /*
  // Clear timeout when the socket disconnects
  socket.on('disconnect', () => {
    clearTimeout(timeout);
  });
  */
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

async function shutdown() { // Make shutdown async
  console.log('Shutting down WebSocket server...');

  // Notify all clients via adapter
  io.emit('server_shutdown', { message: 'Server is shutting down' });

  // Close client connections managed by this instance
  clients.forEach((client, clientId) => {
    try {
      // Send a final message if possible
      client.socket.emit('connection', {
        type: 'connection',
        status: 'server_shutdown',
        reason: 'Server is shutting down gracefully.'
      });
      // Disconnect the socket
      client.socket.disconnect(true);
    } catch (err) {
      console.error(`Error during shutdown for client ${clientId}:`, err);
    }
  });

  // Close Redis connections
  try {
    await redisClient.quit();
    await pubClient.quit();
    await subClient.quit();
    console.log('Redis connections closed.');
  } catch (err) {
    console.error('Error closing Redis connections:', err);
  }

  // Close the HTTP server
  server.close((err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
      process.exit(1); // Exit with error code
    } else {
      console.log('WebSocket server closed gracefully.');
      process.exit(0); // Exit successfully
    }
  });

  // Force close after a timeout if graceful shutdown fails
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000); // Increased timeout to 10 seconds
}
