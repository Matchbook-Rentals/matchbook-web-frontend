#!/bin/bash

# This script starts both the Next.js app and the Socket.IO server

# Environment variables
export SOCKET_IO_PORT=8080
export NEXT_PUBLIC_GO_SERVER_URL=http://localhost:8080

# Trap SIGINT to ensure both processes are killed on Ctrl+C
trap 'kill $(jobs -p)' SIGINT SIGTERM EXIT

# Start Socket.IO server in background
echo "Starting Socket.IO server..."
(cd ts_server && bash ./start.sh) &

# Wait a moment for the Socket.IO server to start
sleep 2

# Start Next.js app
echo "Starting Next.js app..."
npm run dev

# Wait for all background processes to complete
wait