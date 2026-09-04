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
kill_port 5177
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
npx prisma@6.19.3 db push --schema=prisma/schema.prisma || echo "Migration failed"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma@6.19.3 generate --schema=prisma/schema.prisma

# Seed the database
echo "Seeding database..."
npx tsx seed.ts || echo "Seed failed (might already exist)"

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
pnpm run dev &
API_PID=$!
cd ../..

# Start phone agent (Vite dev server)
echo "Starting phone agent..."
cd artifacts/phone-agent
export PORT=5177
pnpm run dev &
AGENT_PID=$!
cd ../..

echo ""
echo "All processes started:"
[ -n "$API_PID" ] && echo "  - API server (PID: $API_PID) - http://localhost:5175"
[ -n "$AGENT_PID" ] && echo "  - Phone agent (PID: $AGENT_PID) - http://localhost:5177"
echo "  - Database: $DATABASE_URL"
echo ""
echo "Press Ctrl+C to stop all processes"

# Wait for all background processes
wait
