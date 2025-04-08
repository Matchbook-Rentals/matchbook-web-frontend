package main

import (
	"bytes"
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

// Client represents a connected WebSocket client.
type Client struct {
	ID      string          // Unique client identifier
	UserID  string          // Associated user ID (may differ from ID)
	Conn    *websocket.Conn // WebSocket connection
	Send    chan []byte     // Channel for outgoing messages
	Lock    sync.Mutex      // Protects per-client operations
	closed  bool            // Indicates if the client is closed
}

// Message represents a message exchanged between clients.
type Message struct {
	ID             string    `json:"id,omitempty"`
	ConversationID string    `json:"conversationId,omitempty"`
	SenderID       string    `json:"senderId,omitempty"`
	ReceiverID     string    `json:"receiverId"`
	Content        string    `json:"content"`
	SenderRole     string    `json:"senderRole,omitempty"`
	ImgUrl         string    `json:"imgUrl,omitempty"`
	FileName       string    `json:"fileName,omitempty"`
	FileKey        string    `json:"fileKey,omitempty"`
	FileType       string    `json:"fileType,omitempty"`
	CreatedAt      time.Time `json:"createdAt,omitempty"`
	UpdatedAt      time.Time `json:"updatedAt,omitempty"`
	ClientID       string    `json:"clientId,omitempty"`
	Type           string    `json:"type,omitempty"`
	IsTyping       bool      `json:"isTyping,omitempty"`
	IsRead         bool      `json:"isRead,omitempty"`
	MessageIDs     []string  `json:"messageIds,omitempty"`
	Timestamp      string    `json:"timestamp,omitempty"`
}

// TimedRWMutex wraps sync.RWMutex to log long-held locks.
type TimedRWMutex struct {
	mu sync.RWMutex
}

func (m *TimedRWMutex) Lock() {
	start := time.Now()
	m.mu.Lock()
	if duration := time.Since(start); duration > 100*time.Millisecond {
		log.Printf("WARNING: Lock held for %v", duration)
	}
}

func (m *TimedRWMutex) Unlock() {
	m.mu.Unlock()
}

func (m *TimedRWMutex) RLock() {
	start := time.Now()
	m.mu.RLock()
	if duration := time.Since(start); duration > 100*time.Millisecond {
		log.Printf("WARNING: RLock held for %v", duration)
	}
}

func (m *TimedRWMutex) RUnlock() {
	m.mu.RUnlock()
}

var (
	clients          = make(map[string]*Client) // Map of connected clients
	mutex            = &TimedRWMutex{}          // Global mutex for clients map
	mainServerAPIURL = os.Getenv("MAIN_SERVER_API_URL")
	upgrader         = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // Adjust for production
		},
	}
)

func init() {
	if mainServerAPIURL == "" {
		mainServerAPIURL = "http://localhost:3000/api/messages/save"
	}
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)
}

// Middleware for error recovery.
func setupErrorHandling(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("PANIC RECOVERED: %v\nStack Trace:\n%s", err, debug.Stack())
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()
		handler(w, r)
	}
}

// Middleware for request logging.
func setupLogging(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("REQUEST: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		handler(w, r)
		log.Printf("COMPLETED: %s %s in %v", r.Method, r.URL.Path, time.Since(start))
	}
}

func main() {
	log.Printf("Server starting... (version 2.0.1 - mutex fixes)")
	log.Printf("Go version: %s, GOMAXPROCS: %d", runtime.Version(), runtime.GOMAXPROCS(0))
	log.Printf("Main server API URL: %s", mainServerAPIURL)

	http.HandleFunc("/ws", setupLogging(setupErrorHandling(handleWebSocket)))
	http.HandleFunc("/send-message", setupLogging(setupErrorHandling(handleSendMessage)))
	http.HandleFunc("/health-check", setupErrorHandling(func(w http.ResponseWriter, r *http.Request) {
		mutex.RLock()
		clientCount := len(clients)
		mutex.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":      "OK",
			"time":        time.Now().Format(time.RFC3339),
			"connections": clientCount,
		})
	}))

	startClientMonitor()
	port := 3001
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	restartServer := make(chan struct{})

	go func() {
		for {
			log.Printf("Starting server on port %d", port)
			if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				log.Printf("SERVER ERROR: %v", err)
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
				break
			}
		}
	}()

	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		healthCheckFailCount := 0
		maxFailCount := 3

		for {
			select {
			case <-ticker.C:
				client := http.Client{Timeout: 2 * time.Second}
				_, err := client.Get(fmt.Sprintf("http://localhost:%d/health-check", port))
				if err != nil {
					healthCheckFailCount++
					log.Printf("HEALTH CHECK FAILED (%d/%d): %v", healthCheckFailCount, maxFailCount, err)
					if healthCheckFailCount >= maxFailCount {
						log.Printf("CRITICAL: Restarting after %d failures", maxFailCount)
						mutex.Lock()
						for _, client := range clients {
							client.Conn.Close()
							close(client.Send)
						}
						clients = make(map[string]*Client)
						mutex.Unlock()
						restartServer <- struct{}{}
						healthCheckFailCount = 0
					}
				} else {
					healthCheckFailCount = 0
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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Shutdown error: %v", err)
	}

	mutex.Lock()
	for id, client := range clients {
		shutdownMsg, _ := json.Marshal(map[string]interface{}{
			"type":   "connection",
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

// handleWebSocket manages new WebSocket connections.
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	log.Printf("DEBUG: Entered handleWebSocket from %s", r.RemoteAddr)
	
	clientID := strings.TrimSpace(r.URL.Query().Get("id"))
	log.Printf("DEBUG: Client ID extracted: '%s'", clientID)
	
	if clientID == "" {
		logWithConnCount("Error: Client attempted to connect without an ID")
		http.Error(w, "Client ID required", http.StatusBadRequest)
		return
	}

	logWithConnCount(fmt.Sprintf("Connection attempt from client: %s at %s", clientID, r.RemoteAddr))
	
	// Log headers for debugging
	log.Printf("DEBUG: Request headers for client %s:", clientID)
	for name, values := range r.Header {
		log.Printf("  %s: %s", name, values)
	}
	
	log.Printf("DEBUG: Attempting WebSocket upgrade for %s", clientID)
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Upgrade error for client %s: %v", clientID, err)
		return
	}
	log.Printf("DEBUG: Upgrade successful for %s", clientID)

	client := &Client{
		ID:     clientID,
		UserID: clientID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	mutex.Lock()
	if oldClient, exists := clients[clientID]; exists {
		logWithConnCount(fmt.Sprintf("Replacing existing connection for client: %s", clientID))
		closeMsg, _ := json.Marshal(map[string]interface{}{
			"type":   "connection",
			"status": "replaced",
		})
		oldClient.Conn.WriteMessage(websocket.TextMessage, closeMsg)
		oldClient.Conn.Close()
		close(oldClient.Send)
	}
	clients[clientID] = client
	mutex.Unlock()

	logWithConnCount(fmt.Sprintf("New client connected: %s", clientID))
	go client.writePump()
	go client.readPump()

	connectionMsg, _ := json.Marshal(map[string]interface{}{
		"type":     "connection",
		"status":   "connected",
		"clientId": clientID,
	})
	client.Send <- connectionMsg
}

// readPump processes incoming messages from a client.
func (c *Client) readPump() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in readPump for client %s: %v\n%s", c.ID, r, debug.Stack())
		}
		c.cleanup()
	}()

	c.Conn.SetReadLimit(512 * 1024)
	c.Conn.SetReadDeadline(time.Now().Add(120 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(120 * time.Second))
		return nil
	})

	consecutiveErrors := 0
	maxConsecutiveErrors := 5
	lastMessageTime := time.Now()

	for {
		if time.Since(lastMessageTime) > 10*time.Minute {
			log.Printf("No messages from client %s for over 10 minutes", c.ID)
			break
		}

		_, rawMessage, err := c.Conn.ReadMessage()
		if err != nil {
			consecutiveErrors++
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure) {
				log.Printf("WebSocket error for client %s: %v (%d/%d)", c.ID, err, consecutiveErrors, maxConsecutiveErrors)
			}
			if consecutiveErrors >= maxConsecutiveErrors {
				log.Printf("Too many errors for client %s, closing", c.ID)
				break
			}
			time.Sleep(100 * time.Millisecond)
			continue
		}

		consecutiveErrors = 0
		lastMessageTime = time.Now()
		messageData := make([]byte, len(rawMessage))
		copy(messageData, rawMessage)
		go processIncomingMessage(c, messageData)
	}
}

// cleanup removes a client from the clients map and closes resources.
func (c *Client) cleanup() {
	c.Lock.Lock()
	c.closed = true
	if c.Conn != nil {
		c.Conn.Close()
	}
	close(c.Send)
	c.Lock.Unlock()

	mutex.Lock()
	if client, exists := clients[c.ID]; exists && client.Conn == c.Conn {
		delete(clients, c.ID)
		logWithConnCount(fmt.Sprintf("Client disconnected: %s", c.ID))
	}
	mutex.Unlock()
}

// processIncomingMessage handles an incoming message.
func processIncomingMessage(c *Client, rawMessage []byte) {
	var msg Message
	if err := json.Unmarshal(rawMessage, &msg); err != nil {
		log.Printf("Parse error from client %s: %v", c.ID, err)
		c.Send <- errorJSON("Invalid message format")
		return
	}

	if msg.Type == "ping" {
		resp, _ := json.Marshal(map[string]interface{}{
			"type":       "ping",
			"timestamp":  time.Now().UnixNano() / int64(time.Millisecond),
			"serverTime": time.Now().Format(time.RFC3339),
		})
		c.Send <- resp
		return
	}

	if msg.SenderID == "" {
		msg.SenderID = c.UserID
	}

	if msg.Type == "typing" || msg.Type == "read_receipt" {
		if msg.ReceiverID == "" || msg.ConversationID == "" {
			c.Send <- errorJSON("Receiver ID and Conversation ID required")
			return
		}
		reqID := fmt.Sprintf("%s-%d", msg.Type, time.Now().UnixNano())
		deliverMessageToClients(reqID, msg)
		if msg.Type == "read_receipt" {
			go sendMessageToMainServer(reqID, msg)
		}
		return
	}

	if msg.ReceiverID == "" || msg.ConversationID == "" {
		c.Send <- errorJSON("Receiver ID and Conversation ID required")
		return
	}

	reqID := fmt.Sprintf("req-%d", time.Now().UnixNano())
	if msg.CreatedAt.IsZero() {
		msg.CreatedAt = time.Now()
	}
	if msg.UpdatedAt.IsZero() {
		msg.UpdatedAt = time.Now()
	}

	deliverySuccess := deliverMessageToClients(reqID, msg)
	if deliverySuccess {
		c.Send <- statusJSON("delivery_status", "delivered", msg.ClientID)
	}

	go func() {
		if sendMessageToMainServer(reqID, msg) {
			c.Send <- statusJSON("persistence_status", "saved", msg.ClientID)
		} else if deliverySuccess {
			log.Printf("[%s] WARNING: Delivered but failed to persist", reqID)
			c.Send <- errorJSONWithID("Message delivered but not saved", msg.ID, msg.ClientID)
		}
	}()
}

// deliverMessageToClients sends a message to matching clients.
func deliverMessageToClients(reqID string, msg Message) bool {
	mutex.RLock()
	var matchingClients []*Client
	targetID := msg.ReceiverID
	for id, client := range clients {
		if strings.EqualFold(id, targetID) {
			matchingClients = append(matchingClients, client)
		}
	}
	mutex.RUnlock()

	if len(matchingClients) == 0 {
		log.Printf("[%s] Receiver not connected: %s", reqID, targetID)
		return false
	}

	messageJSON, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[%s] Marshal error: %v", reqID, err)
		return false
	}

	successCount := 0
	for _, client := range matchingClients {
		client.Lock.Lock()
		if !client.closed {
			select {
			case client.Send <- messageJSON:
				successCount++
			default:
				log.Printf("[%s] Send buffer full for client %s", reqID, client.ID)
			}
		}
		client.Lock.Unlock()
	}

	log.Printf("[%s] Delivered to %d/%d clients", reqID, successCount, len(matchingClients))
	return successCount > 0
}

// sendMessageToMainServer persists a message to the main server.
func sendMessageToMainServer(reqID string, msg Message) bool {
	msgJSON, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[%s] Marshal error: %v", reqID, err)
		return false
	}

	maxRetries := 3
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			time.Sleep(time.Second * time.Duration(attempt))
		}

		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		req, err := http.NewRequestWithContext(ctx, "POST", mainServerAPIURL, bytes.NewBuffer(msgJSON))
		if err != nil {
			log.Printf("[%s] Request creation error: %v", reqID, err)
			continue
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Request-ID", reqID)
		client := &http.Client{Timeout: 20 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[%s] Request error (attempt %d/%d): %v", reqID, attempt+1, maxRetries, err)
			continue
		}

		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
			log.Printf("[%s] Persisted successfully", reqID)
			return true
		}
		log.Printf("[%s] Server error (attempt %d/%d): %d", reqID, attempt+1, maxRetries, resp.StatusCode)
	}
	log.Printf("[%s] Failed to persist after %d attempts", reqID, maxRetries)
	return false
}

// writePump sends outgoing messages to a client.
func (c *Client) writePump() {
	ticker := time.NewTicker(15 * time.Second)
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in writePump for client %s: %v\n%s", c.ID, r, debug.Stack())
		}
		ticker.Stop()
		c.Conn.Close()
	}()

	consecutiveFailures := 0
	maxAllowedFailures := 3

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.Lock.Lock()
			if c.closed {
				c.Lock.Unlock()
				continue
			}
			c.Conn.SetWriteDeadline(time.Now().Add(20 * time.Second))
			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			c.Lock.Unlock()

			if err != nil {
				consecutiveFailures++
				log.Printf("Write error for client %s: %v (%d/%d)", c.ID, err, consecutiveFailures, maxAllowedFailures)
				if consecutiveFailures >= maxAllowedFailures {
					return
				}
			} else {
				consecutiveFailures = 0
			}
		case <-ticker.C:
			c.Lock.Lock()
			if c.closed {
				c.Lock.Unlock()
				continue
			}
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			err := c.Conn.WriteMessage(websocket.PingMessage, nil)
			c.Lock.Unlock()

			if err != nil {
				consecutiveFailures++
				log.Printf("Ping error for client %s: %v (%d/%d)", c.ID, err, consecutiveFailures, maxAllowedFailures)
				if consecutiveFailures >= maxAllowedFailures {
					return
				}
			} else {
				consecutiveFailures = 0
			}
		}
	}
}

// handleSendMessage handles REST API message sending.
func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	reqID := fmt.Sprintf("req-%d", time.Now().UnixNano())
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var msg Message
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		log.Printf("[%s] Decode error: %v", reqID, err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if msg.ReceiverID == "" {
		http.Error(w, "Receiver ID required", http.StatusBadRequest)
		return
	}

	success := deliverMessageToClients(reqID, msg)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "Message " + map[bool]string{true: "delivered", false: "received, recipient not connected"}[success],
		"delivered": success,
	})
}

// Utility functions for common JSON responses.
func errorJSON(message string) []byte {
	data, _ := json.Marshal(map[string]interface{}{
		"type":    "error",
		"message": message,
	})
	return data
}

func errorJSONWithID(message, msgID, clientID string) []byte {
	data, _ := json.Marshal(map[string]interface{}{
		"type":            "persistence_error",
		"originalMessageId": msgID,
		"clientId":        clientID,
		"message":         message,
	})
	return data
}

func statusJSON(statusType, status, clientID string) []byte {
	data, _ := json.Marshal(map[string]interface{}{
		"type":      statusType,
		"status":    status,
		"clientId":  clientID,
		"timestamp": time.Now().Format(time.RFC3339),
	})
	return data
}

func logWithConnCount(format string, args ...interface{}) {
	mutex.RLock()
	count := len(clients)
	mutex.RUnlock()
	message := fmt.Sprintf(format, args...)
	log.Printf("[Active Connections: %d] %s", count, message)
}

func startClientMonitor() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		iteration := 0
		for range ticker.C {
			iteration++
			mutex.RLock()
			count := len(clients)
			mutex.RUnlock()
			log.Printf("[CLIENT MONITOR #%d] Connected clients: %d", iteration, count)
			
			// Log memory stats every 5 iterations
			if iteration%5 == 0 {
				var memStats runtime.MemStats
				runtime.ReadMemStats(&memStats)
				
				log.Printf("[SERVER STATS] Memory: Alloc=%v MiB, Sys=%v MiB, NumGC=%v, Goroutines=%d",
					memStats.Alloc/1024/1024, 
					memStats.Sys/1024/1024, 
					memStats.NumGC,
					runtime.NumGoroutine())
			}
		}
	}()
}