#!/bin/bash
cd "$(dirname "$0")"

# Set environment variables for Socket.IO 
export SOCKET_IO_PORT=8080
export NEXT_PUBLIC_GO_SERVER_URL=http://localhost:8080

# Kill any existing node processes on this port
lsof -ti:$SOCKET_IO_PORT | xargs kill -9 2>/dev/null || true

# Compile the TypeScript files if needed
if [ -f "server.ts" ] && [ ! -f "server.js" -o "server.ts" -nt "server.js" ]; then
  echo "Compiling TypeScript server..."
  npx tsc --project ../tsconfig.server.json
fi

echo "Starting Socket.IO server on port $SOCKET_IO_PORT..."
NODE_PATH="$(pwd)/node_modules" node server.js