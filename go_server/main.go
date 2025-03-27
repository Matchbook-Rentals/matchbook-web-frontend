package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"runtime/debug"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID      string
	Conn    *websocket.Conn
	Send    chan []byte
	Lock    sync.Mutex
}

type Message struct {
	ID             string    `json:"id,omitempty"`
	ConversationID string    `json:"conversationId,omitempty"`
	SenderID       string    `json:"senderId,omitempty"`
	ReceiverID     string    `json:"receiverId"`
	Content        string    `json:"content"`
	SenderRole     string    `json:"senderRole,omitempty"`
	ImgUrl         string    `json:"imgUrl,omitempty"`
	CreatedAt      time.Time `json:"createdAt,omitempty"`
	UpdatedAt      time.Time `json:"updatedAt,omitempty"`
}

var (
	clients = make(map[string]*Client)
	mutex   = &sync.Mutex{}
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			// Allow all connections - modify as needed for production
			return true
		},
	}
)

// setupErrorHandling sets up a recovery middleware to catch panics
func setupErrorHandling(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				stackTrace := debug.Stack()
				log.Printf("PANIC RECOVERED: %v\nStack Trace:\n%s", err, stackTrace)
				
				// Don't crash the server, just return an error to the client
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()
		handler(w, r)
	}
}

// setupLogging creates a middleware that logs all incoming requests
func setupLogging(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("REQUEST: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		
		handler(w, r)
		
		duration := time.Since(start)
		log.Printf("COMPLETED: %s %s in %v", r.Method, r.URL.Path, duration)
	}
}

func main() {
	// Configure log output with timestamps
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)
	log.Printf("Server starting...")
	
	// Set up handlers with error recovery and logging
	http.HandleFunc("/ws", setupLogging(setupErrorHandling(handleWebSocket)))
	http.HandleFunc("/send-message", setupLogging(setupErrorHandling(handleSendMessage)))

	// Start the client monitor
	startClientMonitor()

	port := 3000
	log.Printf("WebSocket server running on port %d\n", port)

	// Create server with graceful shutdown capability
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      nil, // Use default mux
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Set up graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Add health check endpoint with recovery
	http.HandleFunc("/health-check", setupErrorHandling(func(w http.ResponseWriter, r *http.Request) {
		mutex.Lock()
		clientCount := len(clients)
		mutex.Unlock()
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "OK",
			"time": time.Now().Format(time.RFC3339),
			"connections": clientCount,
		})
	}))

	// Auto-restart mechanism
	restartServer := make(chan struct{})
	
	// Main server goroutine
	go func() {
		for {
			log.Printf("Starting server on port %d", port)
			
			if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				log.Printf("SERVER ERROR: %v", err)
				log.Printf("Server will attempt to restart in 3 seconds...")
				
				// Clear client map on error
				mutex.Lock()
				for _, client := range clients {
					client.Conn.Close()
					close(client.Send)
				}
				clients = make(map[string]*Client)
				mutex.Unlock()
				
				time.Sleep(3 * time.Second)
				restartServer <- struct{}{}
			} else {
				// Normal shutdown
				break
			}
		}
	}()

	// Health check goroutine - restart if server becomes unresponsive
	go func() {
		healthCheckTicker := time.NewTicker(10 * time.Second)
		defer healthCheckTicker.Stop()
		
		healthCheckFailCount := 0
		maxFailCount := 3 // Restart after 3 consecutive failures
		
		for {
			select {
			case <-healthCheckTicker.C:
				client := http.Client{
					Timeout: 2 * time.Second,
				}
				
				_, err := client.Get(fmt.Sprintf("http://localhost:%d/health-check", port))
				if err != nil {
					healthCheckFailCount++
					log.Printf("HEALTH CHECK FAILED (%d/%d): %v", healthCheckFailCount, maxFailCount, err)
					
					if healthCheckFailCount >= maxFailCount {
						log.Printf("CRITICAL: Server health check failed %d times, forcing restart", maxFailCount)
						// Clear client map
						mutex.Lock()
						for _, client := range clients {
							client.Conn.Close()
							close(client.Send)
						}
						clients = make(map[string]*Client)
						mutex.Unlock()
						
						// Trigger restart
						select {
						case restartServer <- struct{}{}:
							log.Printf("Restart signal sent")
						default:
							log.Printf("Restart already in progress")
						}
						
						healthCheckFailCount = 0
					}
				} else {
					// Reset failure count on success
					if healthCheckFailCount > 0 {
						log.Printf("Health check recovered after %d failures", healthCheckFailCount)
						healthCheckFailCount = 0
					}
				}
			case <-stop:
				return
			}
		}
	}()

	select {
	case <-stop:
		log.Println("Received shutdown signal")
	case <-restartServer:
		log.Println("Restart triggered")
	}
	
	log.Println("Shutting down server gracefully...")
	
	// Create a timeout context for shutdown
	shutdownTimeout := 5 * time.Second
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	
	// Attempt to gracefully shut down the server
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Error during server shutdown: %v", err)
	}

	// Clear all clients on shutdown
	log.Printf("Closing %d client connections...", len(clients))
	mutex.Lock()
	for id, client := range clients {
		// Notify clients about shutdown and close connections
		shutdownMsg, _ := json.Marshal(map[string]interface{}{
			"type": "connection",
			"status": "server_shutdown",
		})
		client.Conn.WriteMessage(websocket.TextMessage, shutdownMsg)
		client.Conn.Close()
		close(client.Send)
		delete(clients, id)
	}
	mutex.Unlock()
	
	log.Println("Server shutdown complete")
}

// WebSocket handler
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	clientID := r.URL.Query().Get("id")
	if clientID == "" {
		logWithConnCount("Error: Client attempted to connect without an ID")
		http.Error(w, "Client ID is required", http.StatusBadRequest)
		return
	}

	// Normalize the client ID to avoid inconsistencies
	clientID = strings.TrimSpace(clientID)
	log.Printf("Processing WebSocket connection for client ID: %s", clientID)

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}

	// Create a new client with a send channel for outgoing messages
	client := &Client{
		ID:   clientID,
		Conn: conn,
		Send: make(chan []byte, 256), // Buffer for outgoing messages
	}

	// Use a timeout for mutex operations to prevent deadlocks
	lockTimeout := time.NewTimer(5 * time.Second)
	mutexAcquired := make(chan bool, 1)
	
	go func() {
		mutex.Lock()
		mutexAcquired <- true
	}()
	
	select {
	case <-mutexAcquired:
		// Got the lock, continue
		lockTimeout.Stop()
	case <-lockTimeout.C:
		// Failed to acquire lock in reasonable time
		log.Printf("WARNING: Mutex lock timeout for client: %s - possible deadlock", clientID)
		conn.Close()
		return
	}
	
	// Now we have the lock
	// Handle existing connection more gracefully
	if oldClient, exists := clients[clientID]; exists {
		logWithConnCount(fmt.Sprintf("Replacing existing connection for client: %s", clientID))
		// Close the old connection
		closeMsg, _ := json.Marshal(map[string]interface{}{
			"type": "connection",
			"status": "replaced",
		})
		oldClient.Conn.WriteMessage(websocket.TextMessage, closeMsg)
		oldClient.Conn.Close()
		close(oldClient.Send)
	}
	clients[clientID] = client
	clientCount := len(clients)
	mutex.Unlock()

	logWithConnCount(fmt.Sprintf("New client connected: %s (total: %d)", clientID, clientCount))

	// Start goroutines for reading and writing messages
	go client.writePump()
	go client.readPump()

	// Send an initial message to confirm connection
	connectionMsg, _ := json.Marshal(map[string]interface{}{
		"type": "connection",
		"status": "connected",
		"clientId": clientID,
	})
	client.Send <- connectionMsg
}

// readPump handles incoming messages from the client
func (c *Client) readPump() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in readPump for client %s: %v\n%s", c.ID, r, debug.Stack())
		}
		
		// Close connection on exit
		c.Conn.Close()
		
		// Remove client from map
		mutex.Lock()
		delete(clients, c.ID)
		remainingClients := len(clients)
		mutex.Unlock()
		
		logWithConnCount(fmt.Sprintf("Client disconnected: %s (remaining: %d)", c.ID, remainingClients))
	}()

	// Configure connection parameters
	c.Conn.SetReadLimit(512 * 1024) // 512KB max message size
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Read messages from the client
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, 
				websocket.CloseGoingAway, 
				websocket.CloseAbnormalClosure,
				websocket.CloseNormalClosure) {
				log.Printf("WebSocket error for client %s: %v", c.ID, err)
			}
			break
		}
		
		// Process incoming messages (if needed)
		// For now, we're just logging them
		log.Printf("Received message from client %s: %s", c.ID, string(message))
	}
}

// writePump handles outgoing messages to the client
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in writePump for client %s: %v\n%s", c.ID, r, debug.Stack())
		}
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Channel was closed
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.Lock.Lock()
			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			c.Lock.Unlock()
			
			if err != nil {
				log.Printf("Error writing to client %s: %v", c.ID, err)
				return
			}
			
		case <-ticker.C:
			// Send ping message
			c.Lock.Lock()
			err := c.Conn.WriteMessage(websocket.PingMessage, nil)
			c.Lock.Unlock()
			
			if err != nil {
				log.Printf("Error sending ping to client %s: %v", c.ID, err)
				return
			}
		}
	}
}

func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	reqID := fmt.Sprintf("req-%d", time.Now().UnixNano())
	
	log.Printf("[%s] Message delivery request from %s", reqID, r.RemoteAddr)
	
	if r.Method != http.MethodPost {
		log.Printf("[%s] Method not allowed: %s", reqID, r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight OPTIONS request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Set a deadline for reading the request body
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	r = r.WithContext(ctx)

	var msg Message
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields() // Stricter parsing
	
	if err := decoder.Decode(&msg); err != nil {
		log.Printf("[%s] ERROR: Failed to decode message: %v", reqID, err)
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	// Basic validation
	if msg.ReceiverID == "" {
		log.Printf("[%s] ERROR: Missing receiver ID", reqID)
		http.Error(w, "Receiver ID is required", http.StatusBadRequest)
		return
	}

	// Truncate content for logging
	contentPreview := msg.Content
	if len(contentPreview) > 50 {
		contentPreview = contentPreview[:47] + "..."
	}
	
	log.Printf("[%s] Processing message for recipient %s: %s", 
		reqID, msg.ReceiverID, contentPreview)

	// Use a timeout for mutex operations to prevent deadlocks
	lockTimeout := time.NewTimer(5 * time.Second)
	mutexAcquired := make(chan bool, 1)
	
	go func() {
		mutex.Lock()
		select {
		case mutexAcquired <- true:
			// Successfully sent the signal
		default:
			// Channel buffer is full, shouldn't happen but just in case
		}
	}()
	
	select {
	case <-mutexAcquired:
		// Got the lock, continue
		lockTimeout.Stop()
	case <-lockTimeout.C:
		// Failed to acquire lock in reasonable time
		log.Printf("[%s] CRITICAL: Mutex lock timeout - possible deadlock", reqID)
		http.Error(w, "Server busy, try again later", http.StatusServiceUnavailable)
		return
	}
	
	// Now that we have the lock, process the message

	// Log all connected client IDs to help diagnose issues
	clientCount := len(clients)
	log.Printf("[%s] Current connected clients: %d", reqID, clientCount)
	
	// Find all clients that match this user ID
	targetId := msg.ReceiverID
	var matchingClients []*Client
	var connectedIds []string
	
	// Only collect all IDs for logging if we have a reasonable number of clients
	if clientCount <= 100 {
		for id := range clients {
			connectedIds = append(connectedIds, id)
		}
		log.Printf("[%s] Connected client IDs: %v", reqID, connectedIds)
	}
	
	// First, try exact matches
	if client, exactExists := clients[targetId]; exactExists {
		matchingClients = append(matchingClients, client)
		log.Printf("[%s] Found exact match for %s", reqID, targetId)
	}
	
	// Then look for all other instances of this user (multiple devices)
	matchSearchLimit := 100 // Limit search to prevent infinite loops
	searchCount := 0
	
	for id, c := range clients {
		searchCount++
		if searchCount > matchSearchLimit {
			log.Printf("[%s] WARNING: Client search limit reached (%d)", reqID, matchSearchLimit)
			break
		}
		
		// Skip if this is already the exact match we found or if ID is empty
		if id == targetId || id == "" {
			continue
		}
		
		// Case insensitive comparison
		if strings.EqualFold(id, targetId) {
			matchingClients = append(matchingClients, c)
			log.Printf("[%s] Found case-insensitive match for %s: %s", reqID, targetId, id)
			continue
		}

		// Check if one is a prefix/suffix of the other (for truncated IDs)
		if strings.HasPrefix(id, targetId) || strings.HasPrefix(targetId, id) ||
			strings.HasSuffix(id, targetId) || strings.HasSuffix(targetId, id) {
			matchingClients = append(matchingClients, c)
			log.Printf("[%s] Found prefix/suffix match for %s: %s", reqID, targetId, id)
			continue
		}
	}
	
	// Release the lock as soon as possible
	mutex.Unlock()

	matchCount := len(matchingClients)
	log.Printf("[%s] Found %d matching client(s) for receiver ID: %s", reqID, matchCount, msg.ReceiverID)

	if matchCount == 0 {
		log.Printf("[%s] Warning: Receiver not connected: %s", reqID, msg.ReceiverID)
		// Don't return an error, just acknowledge that we received the message
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "Message received, but recipient not connected",
			"delivered": false,
		})
		return
	}

	// Prepare the message to send - do this outside the lock
	messageJSON, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[%s] Error marshaling message: %v", reqID, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Set up delivery tracking
	successCount := 0
	errorMessages := make([]string, 0)
	
	// Send the message to all instances of this user
	for i, client := range matchingClients {
		// Try to send with timeout
		sendOk := make(chan bool, 1)
		
		go func(c *Client, idx int) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[%s] PANIC in message send to client %d: %v", reqID, idx, r)
					// Don't block the channel
					select {
					case sendOk <- false:
					default:
					}
				}
			}()
			
			// Send the message through the client's send channel
			select {
			case c.Send <- messageJSON:
				select {
				case sendOk <- true:
				default:
				}
			default:
				// Client's send buffer is full
				log.Printf("[%s] Error: Client %d send buffer full", reqID, idx)
				select {
				case sendOk <- false:
				default:
				}
			}
		}(client, i)
		
		// Wait with timeout
		select {
		case success := <-sendOk:
			if success {
				successCount++
			} else {
				errorMessages = append(errorMessages, fmt.Sprintf("Failed to send to client %d", i))
			}
		case <-time.After(2 * time.Second):
			log.Printf("[%s] Timeout sending to client %d", reqID, i)
			errorMessages = append(errorMessages, fmt.Sprintf("Timeout sending to client %d", i))
		}
	}

	processingTime := time.Since(startTime)
	log.Printf("[%s] Message delivery complete. Success: %d/%d in %v", 
		reqID, successCount, matchCount, processingTime)

	// Return appropriate response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	
	if successCount > 0 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": fmt.Sprintf("Message sent to %d/%d recipients", successCount, matchCount),
			"delivered": true,
			"successCount": successCount,
			"totalCount": matchCount,
			"processingTimeMs": processingTime.Milliseconds(),
		})
	} else {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "Failed to deliver message to any recipients",
			"delivered": false,
			"errors": errorMessages,
			"processingTimeMs": processingTime.Milliseconds(),
		})
	}
}

func logWithConnCount(format string, args ...interface{}) {
	// Use a timeout to avoid deadlock
	done := make(chan bool, 1)
	var count int
	
	go func() {
		mutex.Lock()
		count = len(clients)
		mutex.Unlock()
		done <- true
	}()
	
	// Wait with timeout
	select {
	case <-done:
		// Mutex operation completed
	case <-time.After(1 * time.Second):
		log.Printf("WARNING: Mutex timeout in logWithConnCount - possible deadlock")
		count = -1 // Indicate unknown count
	}
	
	// Format message with count
	message := fmt.Sprintf(format, args...)
	log.Printf("[Active Connections: %d] %s", count, message)
}

// Function to periodically log the state of all connected clients
func startClientMonitor() {
	// More frequent at first to help with debugging
	initialInterval := 30 * time.Second
	normalInterval := 2 * time.Minute
	
	ticker := time.NewTicker(initialInterval)
	startTime := time.Now()
	
	go func() {
		iteration := 0
		
		for {
			<-ticker.C
			iteration++
			
			// Switch to normal interval after first 5 minutes
			if time.Since(startTime) > 5*time.Minute {
				ticker.Stop()
				ticker = time.NewTicker(normalInterval)
				log.Printf("Switching client monitor to normal interval of %v", normalInterval)
			}
			
			// Use a timeout for this mutex operation
			mutexAcquired := make(chan bool, 1)
			var clientCount int
			var clientIds []string
			
			go func() {
				mutex.Lock()
				defer mutex.Unlock()
				
				clientCount = len(clients)
				
				// Only collect all IDs if we have a reasonable number of clients
				if clientCount <= 100 && clientCount > 0 {
					for id := range clients {
						if len(id) > 0 {
							clientIds = append(clientIds, id)
						}
					}
				}
				
				mutexAcquired <- true
			}()
			
			// Wait with timeout
			select {
			case <-mutexAcquired:
				// Successfully got client data
				if clientCount > 0 {
					if len(clientIds) > 0 {
						log.Printf("[CLIENT MONITOR #%d] Connected clients (%d): %v", 
							iteration, clientCount, clientIds)
					} else {
						log.Printf("[CLIENT MONITOR #%d] Connected clients: %d (too many to list)", 
							iteration, clientCount)
					}
				} else {
					log.Printf("[CLIENT MONITOR #%d] No connected clients", iteration)
				}
				
			case <-time.After(3 * time.Second):
				log.Printf("[CLIENT MONITOR #%d] CRITICAL: Mutex timeout - possible deadlock", iteration)
			}
			
			// Add memory stats every 10 iterations
			if iteration%10 == 0 {
				var memStats runtime.MemStats
				runtime.ReadMemStats(&memStats)
				
				log.Printf("[SERVER STATS] Memory: Alloc=%v MiB, Sys=%v MiB, NumGC=%v",
					memStats.Alloc/1024/1024, 
					memStats.Sys/1024/1024, 
					memStats.NumGC)
			}
		}
	}()
}