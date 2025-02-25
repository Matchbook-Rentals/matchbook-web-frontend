package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

type Client struct {
	ID string
	Writer http.ResponseWriter
	Flusher http.Flusher
}

type Message struct {
	ID            string    `json:"id,omitempty"`
	ConversationID string    `json:"conversationId,omitempty"`
	SenderID      string    `json:"senderId,omitempty"`
	ReceiverID    string    `json:"receiverId"`
	Content       string    `json:"content"`
	SenderRole    string    `json:"senderRole,omitempty"`
	ImgUrl        string    `json:"imgUrl,omitempty"`
	CreatedAt     time.Time `json:"createdAt,omitempty"`
	UpdatedAt     time.Time `json:"updatedAt,omitempty"`
}

var (
	clients = make(map[string]*Client)
	mutex   = &sync.Mutex{}
)

func main() {
	http.HandleFunc("/events", handleSSE)
	http.HandleFunc("/send-message", handleSendMessage)

	port := 3000
	fmt.Printf("SSE server running on port %d\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
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
	client, exists := clients[msg.ReceiverID]
	mutex.Unlock()

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