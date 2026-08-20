#!/bin/bash

# Script to start all processes in the Phone-Agent-MVP workspace

echo "Starting all processes..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "Environment variables loaded from .env"
fi

# Function to kill processes using specific ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ -n "$pid" ]; then
        echo "Killing process using port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Kill any existing processes on the ports
echo "Checking for existing processes on ports..."
kill_port 5175
kill_port 5176
kill_port 5177
echo "Ports cleared."

# Run Prisma migrations
echo "Running Prisma migrations..."
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev --name init || echo "Migration failed (might already exist)"

# Seed the database
echo "Seeding database..."
DATABASE_URL="file:./prisma/dev.db" npx tsx seed.ts || echo "Seed failed (might already exist)"

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all processes..."
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Start API server
echo "Starting API server..."
cd artifacts/api-server
export PORT=5175
export DATABASE_URL="file:$(pwd)/../../prisma/dev.db"
pnpm run dev &
API_PID=$!
cd ../..

# Start mockup sandbox
echo "Starting mockup sandbox..."
cd artifacts/mockup-sandbox
export PORT=5176
pnpm run dev &
SANDBOX_PID=$!
cd ../..

# Start phone agent
echo "Starting phone agent..."
cd artifacts/phone-agent
export PORT=5177
pnpm run dev &
AGENT_PID=$!
cd ../..

echo ""
echo "All processes started:"
echo "  - API server (PID: $API_PID) - http://localhost:5175"
echo "  - Mockup sandbox (PID: $SANDBOX_PID) - http://localhost:5176"
echo "  - Phone agent (PID: $AGENT_PID) - http://localhost:5177"
echo "  - SQLite database (file:./prisma/dev.db)"
echo ""
echo "Press Ctrl+C to stop all processes"

# Wait for all background processes
wait
