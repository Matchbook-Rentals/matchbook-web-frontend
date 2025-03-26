# Plan: Migrate Go Server from SSE to WebSockets

This document outlines the steps required to refactor the Go server (`go_server/main.go`) from using Server-Sent Events (SSE) to WebSockets for real-time communication.

## 1. Add WebSocket Dependency

-   Add a robust WebSocket library. `gorilla/websocket` is a popular choice.
    ```bash
    go get github.com/gorilla/websocket
    ```
-   Import the library in `main.go`.

## 2. Update Client Representation

-   Modify the `Client` struct to store a WebSocket connection instead of `http.ResponseWriter` and `http.Flusher`.
    ```go
    import "github.com/gorilla/websocket"

    type Client struct {
        ID   string
        Conn *websocket.Conn
        // Add a send channel for concurrent writes if needed
        // send chan []byte 
    }
    ```
-   Update the global `clients` map accordingly: `clients = make(map[string]*Client)`.

## 3. Implement WebSocket Connection Handler

-   Replace the `/events` HTTP handler (`handleSSE`) with a new handler for the WebSocket endpoint (e.g., `/ws`). Let's call it `handleWebSocket`.
-   **Upgrade Connection:** Inside `handleWebSocket`, use the WebSocket library's `Upgrader` to upgrade the incoming HTTP GET request to a WebSocket connection.
    ```go
    var upgrader = websocket.Upgrader{
        ReadBufferSize:  1024,
        WriteBufferSize: 1024,
        CheckOrigin: func(r *http.Request) bool {
            // Add appropriate origin checking for security
            return true // Allow all for now, refine later
        },
    }

    func handleWebSocket(w http.ResponseWriter, r *http.Request) {
        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            log.Printf("Failed to upgrade connection: %v", err)
            return
        }
        // ... rest of the handler
    }
    ```
-   **Client Registration:**
    -   Extract the client ID from the request URL query parameters (`r.URL.Query().Get("id")`) as before.
    -   Create the new `Client` struct with the `*websocket.Conn`.
    -   Use the existing mutex logic to add the client to the `clients` map, handling potential existing connections for the same ID (close the old connection before replacing).
-   **Read Pump:** Start a goroutine (`readPump`) for each client connection to handle incoming messages.
    -   This loop reads messages from the WebSocket connection.
    -   It should handle pong messages to keep the connection alive.
    -   It should detect closed connections and trigger cleanup.
    -   Set read deadlines (`conn.SetReadDeadline`).
-   **Write Pump (Optional but Recommended):** Start a goroutine (`writePump`) for each client if concurrent writes are needed or to centralize writing logic.
    -   Use a buffered channel (`client.send`) to queue outgoing messages.
    -   The `writePump` reads from this channel and writes messages to the WebSocket connection.
    -   Handle pings (sent periodically by the server).
    -   Set write deadlines (`conn.SetWriteDeadline`).
-   **Cleanup:** Ensure `conn.Close()` is called and the client is removed from the `clients` map when the connection is closed (either by the client or due to an error in read/write pumps).

## 4. Modify Message Sending Logic

-   Update `handleSendMessage` to send messages via WebSocket connections.
-   **Find Client(s):** The logic to find matching clients based on `ReceiverID` remains largely the same (using the `clients` map and mutex).
-   **Send Message:**
    -   Instead of `fmt.Fprintf`, use the WebSocket connection's methods:
        -   `client.Conn.WriteMessage(websocket.TextMessage, messageJSON)` or
        -   `client.Conn.WriteJSON(msg)`
    -   If using a `writePump`, send the `messageJSON` byte slice to the client's `send` channel: `client.send <- messageJSON`.
    -   Implement appropriate error handling and timeouts for writes. Consider concurrent writes if sending to multiple clients simultaneously.

## 5. Implement Keep-Alive Mechanism

-   Replace the SSE keep-alive (`: keepalive`) with WebSocket's standard ping/pong mechanism.
-   **Server Pings:** In the `writePump` (or a separate goroutine), periodically send ping messages using `conn.WriteMessage(websocket.PingMessage, nil)`.
-   **Client Pongs:** The `readPump` should configure a pong handler using `conn.SetPongHandler` to reset the read deadline when a pong is received.

## 6. Update Error Handling and Logging

-   Adapt error handling to catch WebSocket-specific errors (e.g., `websocket.CloseError`).
-   Update logging messages to reflect WebSocket operations instead of SSE.

## 7. Update Server Configuration

-   Change the HTTP route registration in `main()` from `/events` to the new WebSocket endpoint (e.g., `/ws`).
    ```go
    // http.HandleFunc("/events", setupLogging(setupErrorHandling(handleSSE))) // Remove this
    http.HandleFunc("/ws", setupLogging(setupErrorHandling(handleWebSocket))) // Add this
    ```
-   The `/send-message` endpoint remains the same (HTTP POST).

## 8. Client-Side Changes (Important Note)

-   The client application (presumably JavaScript in a browser) **must** be updated.
-   Replace the `EventSource` API with the `WebSocket` API.
-   Implement connection logic, message handling (parsing JSON), and potentially reconnection logic on the client side.

## 9. Testing

-   **Unit Tests:** Write unit tests for the WebSocket handler logic, message formatting, and client registration/deregistration.
-   **Integration Tests:** Use a WebSocket client library (in Go or another language) to test the connection lifecycle, message sending/receiving, and concurrent connections.
-   **Load Testing:** Simulate multiple concurrent WebSocket clients to test server performance and stability.

## 10. Deployment Considerations

-   Ensure any reverse proxies (like Nginx or Caddy) or load balancers are configured correctly to handle WebSocket connections (e.g., supporting `Upgrade` and `Connection` headers).
-   Review security implications (e.g., `CheckOrigin` function, authentication/authorization if needed).

## 11. Refactor Monitoring

-   Update `startClientMonitor` and `logWithConnCount` if necessary, although the core logic of checking the `clients` map size should still work. Logging details might change.
-   Update the `/health-check` endpoint if its logic needs adjustment based on WebSocket connections (currently just counts clients, which should be fine).
