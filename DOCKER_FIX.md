# Docker Fix - Local PostgreSQL Setup

## Problem
Docker Desktop was experiencing persistent connectivity issues with Docker Hub (EOF errors), preventing it from pulling the `postgres:16-alpine` image.

## Solution
Switched to using local PostgreSQL instances via Homebrew instead of Docker containers.

## Current Setup

### PostgreSQL 16 (Homebrew)
- **Port**: 5435
- **Status**: Running via `brew services start postgresql@16`
- **Databases**:
  - `phone_agent` (main database)
  - `phone_agent_test` (test database)
- **User**: `phoneagent` with password `phoneagent_password`

### Docker Compose
The `docker-compose.yml` has been updated to disable the PostgreSQL services (commented out). You can re-enable them later if Docker Desktop is fixed.

## Required .env Changes

Your `.env` file should use the local PostgreSQL on port 5435:

```bash
# Database Configuration
DATABASE_URL=postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent
TEST_DATABASE_URL=postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent_test
```

Note: Both databases are on the same PostgreSQL 16 instance (port 5435). The original setup had them on different ports (5434 and 5435) via Docker.

## Running Services

### Start PostgreSQL
```bash
brew services start postgresql@16
```

### Stop PostgreSQL
```bash
brew services stop postgresql@16
```

### Check Status
```bash
brew services list | grep postgresql
```

### Database Migrations
```bash
# Main database
DATABASE_URL="postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent" npx prisma migrate deploy

# Test database
DATABASE_URL="postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent_test" npx prisma migrate deploy
```

### Run Tests
```bash
cd artifacts/api-server
TEST_DATABASE_URL="postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent_test" pnpm test
```

## Docker Desktop Fix (Optional)

If you want to fix Docker Desktop later:
1. Uninstall Docker Desktop completely
2. Reinstall from https://www.docker.com/products/docker-desktop/
3. Once Docker is working, uncomment the services in `docker-compose.yml`
4. Update `.env` back to use ports 5434 and 5435
