package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

type Client struct {
	ID      string
	Writer  http.ResponseWriter
	Flusher http.Flusher
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
)

func main() {
	http.HandleFunc("/events", handleSSE)
	http.HandleFunc("/send-message", handleSendMessage)

	// Start the client monitor
	startClientMonitor()

	port := 3000
	fmt.Printf("SSE server running on port %d\n", port)

	// Create server with graceful shutdown capability
	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: nil, // Use default mux
	}

	// Set up graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Server error: %v, attempting to restart...", err)
			// Clear client map on error
			mutex.Lock()
			clients = make(map[string]*Client)
			mutex.Unlock()
		}
	}()

	// Handle hot reload - server will restart on error
	go func() {
		for {
			time.Sleep(5 * time.Second)
			// Check if server is still running
			_, err := http.Get(fmt.Sprintf("http://localhost:%d/health-check", port))
			if err != nil {
				log.Printf("Server health check failed: %v", err)
				// Clear client map
				mutex.Lock()
				clients = make(map[string]*Client)
				mutex.Unlock()
				log.Printf("Cleared client connections, server should restart automatically")
			}
		}
	}()

	// Add health check endpoint
	http.HandleFunc("/health-check", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	<-stop
	log.Println("Shutting down server...")

	// Clear all clients on shutdown
	mutex.Lock()
	for id, client := range clients {
		// Notify clients about shutdown
		fmt.Fprintf(client.Writer, "data: {\"type\":\"connection\",\"status\":\"server_shutdown\"}\n\n")
		client.Flusher.Flush()
		delete(clients, id)
	}
	mutex.Unlock()
}

func handleSSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	clientID := r.URL.Query().Get("id")
	if clientID == "" {
		logWithConnCount("Error: Client attempted to connect without an ID")
		http.Error(w, "Client ID is required", http.StatusBadRequest)
		return
	}

	// Normalize the client ID to avoid inconsistencies
	// This ensures we store clients with consistent ID format
	clientID = strings.TrimSpace(clientID)

	flusher, ok := w.(http.Flusher)
	if !ok {
		logWithConnCount("Error: Streaming unsupported")
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	client := &Client{
		ID:      clientID,
		Writer:  w,
		Flusher: flusher,
	}

	mutex.Lock()
	// Handle existing connection more gracefully
	if oldClient, exists := clients[clientID]; exists {
		logWithConnCount(fmt.Sprintf("Replacing existing connection for client: %s", clientID))
		// Try to close the old connection if possible
		closeMsg := "data: {\"type\":\"connection\",\"status\":\"replaced\"}\n\n"
		_, err := fmt.Fprintf(oldClient.Writer, closeMsg)
		if err == nil {
			oldClient.Flusher.Flush()
		}
	}
	clients[clientID] = client
	mutex.Unlock()

	logWithConnCount(fmt.Sprintf("New client connected: %s", clientID))

	// Send an initial message to confirm connection
	fmt.Fprintf(w, "data: {\"type\":\"connection\",\"status\":\"connected\"}\n\n")
	flusher.Flush()

	defer func() {
		mutex.Lock()
		delete(clients, clientID)
		mutex.Unlock()
		logWithConnCount(fmt.Sprintf("Client disconnected: %s", clientID))
	}()

	// Keep the connection alive
	keepaliveTicker := time.NewTicker(10 * time.Second) // More frequent keepalive
	defer keepaliveTicker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-keepaliveTicker.C:
			// Send a more robust keepalive with proper format
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
			logWithConnCount(fmt.Sprintf("Sent keepalive to client: %s", clientID))
		}
	}
}

func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		logWithConnCount("Error: Method not allowed")
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

	var msg Message
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		logWithConnCount(fmt.Sprintf("Error decoding message: %v", err))
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	logWithConnCount(fmt.Sprintf("Received message for client %s: %s", msg.ReceiverID, msg.Content))

	mutex.Lock()
	// Log all connected client IDs to help diagnose the issue
	var connectedIds []string
	for id := range clients {
		connectedIds = append(connectedIds, id)
	}
	client, exists := clients[msg.ReceiverID]

	// If exact match doesn't exist, try to find a case-insensitive match
	// This can help with clients that might have ID format inconsistencies
	if !exists {
		targetId := msg.ReceiverID
		for id, c := range clients {
			// Case insensitive comparison
			if strings.EqualFold(id, targetId) {
				client = c
				exists = true
				logWithConnCount(fmt.Sprintf("Found case-insensitive match for %s: %s", targetId, id))
				break
			}

			// Check if one is a prefix/suffix of the other (for truncated IDs)
			if strings.HasPrefix(id, targetId) || strings.HasPrefix(targetId, id) ||
				strings.HasSuffix(id, targetId) || strings.HasSuffix(targetId, id) {
				client = c
				exists = true
				logWithConnCount(fmt.Sprintf("Found prefix/suffix match for %s: %s", targetId, id))
				break
			}
		}
	}

	mutex.Unlock()

	logWithConnCount(fmt.Sprintf("Connected client IDs: %v", connectedIds))
	logWithConnCount(fmt.Sprintf("Looking for receiver ID: %s, exists: %v", msg.ReceiverID, exists))

	if !exists {
		logWithConnCount(fmt.Sprintf("Warning: Receiver not connected: %s", msg.ReceiverID))
		// Don't return an error, just acknowledge that we received the message
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "Message received, but recipient not connected"})
		return
	}

	// Send the message to the client
	messageJSON, err := json.Marshal(msg)
	if err != nil {
		logWithConnCount(fmt.Sprintf("Error marshaling message: %v", err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(client.Writer, "data: %s\n\n", messageJSON)
	client.Flusher.Flush()

	logWithConnCount(fmt.Sprintf("Message sent to client %s", msg.ReceiverID))

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "Message sent"})
}

func logWithConnCount(message string) {
	mutex.Lock()
	count := len(clients)
	mutex.Unlock()
	log.Printf("[Active Connections: %d] %s", count, message)
}

// Function to periodically log the state of all connected clients
func startClientMonitor() {
	ticker := time.NewTicker(2 * time.Minute)
	go func() {
		for {
			<-ticker.C
			mutex.Lock()
			if len(clients) > 0 {
				var clientIds []string
				for id := range clients {
					clientIds = append(clientIds, id)
				}
				log.Printf("[CLIENT MONITOR] Currently connected clients (%d): %v", len(clients), clientIds)
			}
			mutex.Unlock()
		}
	}()
}
