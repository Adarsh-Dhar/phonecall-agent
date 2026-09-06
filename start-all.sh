#!/bin/bash
# Script to start all processes in the Phone-Agent-MVP workspace

echo "Starting all processes..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
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
echo "Ports cleared."

# Start PostgreSQL Docker container if not running
echo "Checking PostgreSQL Docker container..."
if ! docker ps | grep -q phone-agent-postgres; then
  echo "Starting PostgreSQL Docker container..."
  docker compose up -d
  echo "Waiting for PostgreSQL to be ready..."
  sleep 5
else
  echo "PostgreSQL container is already running"
fi

# Run Prisma migrations for PostgreSQL
echo "Running Prisma migrations for PostgreSQL..."
npx prisma@6.19.3 migrate deploy --schema=prisma/schema.prisma || echo "Migration failed"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma@6.19.3 generate --schema=prisma/schema.prisma

# Build frontend
echo "Building frontend..."
(cd artifacts/phone-agent && pnpm run build)
echo "Frontend built."

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all processes..."
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Start API server (also serves the built frontend)
echo "Starting API server..."
(cd artifacts/api-server && PORT=5175 pnpm run dev) &
API_PID=$!

echo ""
echo "All processes started:"
[ -n "$API_PID" ] && echo "  - App (API + frontend) - http://localhost:5175"
echo "  - Database: $DATABASE_URL"
echo ""
echo "Press Ctrl+C to stop all processes"

# Wait for all background processes
wait
