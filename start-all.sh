#!/bin/bash

# Script to start all processes in the Phone-Agent-MVP workspace

echo "Starting all processes..."

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate dev --name init || echo "Migration failed (might already exist)"

# Seed the database
echo "Seeding database..."
npx tsx prisma/seed.ts || echo "Seed failed (might already exist)"

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
export DATABASE_URL="file:$(pwd)/dev.db"
export GEMINI_API_KEY="test_key_for_testing"
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
echo "  - SQLite database (file:./dev.db)"
echo ""
echo "Press Ctrl+C to stop all processes"

# Wait for all background processes
wait
