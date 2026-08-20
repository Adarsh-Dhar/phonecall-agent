# Phone Agent MVP - Database Integration

## Overview
This project now includes a complete PostgreSQL database integration with Prisma ORM, replacing the previous dummy data with real persistent storage.

## What's Been Implemented

### 1. Database Setup
- **Docker PostgreSQL**: PostgreSQL 16 running in Docker container
- **Prisma ORM**: Full Prisma integration with auto-generated types
- **Database Schema**: 
  - `Contact` - Store contact information
  - `Conversation` - Group messages and history
  - `Message` - Chat messages with role tracking
  - `History` - Task history and status tracking

### 2. Backend API
New REST API endpoints for database operations:
- `GET/POST /api/contacts` - Manage contacts
- `GET/POST/PUT/DELETE /api/conversations` - Manage conversations
- `GET/POST/PUT/DELETE /api/conversations/:id/messages` - Manage messages
- `GET/POST/PUT/DELETE /api/history` - Manage task history
- Existing `/api/gemini/chat` - AI chat functionality

### 3. Frontend Integration
- Real API calls instead of hardcoded data
- Loading states and error handling
- Fallback to seed data if API unavailable
- Dynamic contact and history loading

## How to Run

### Prerequisites
1. **Docker**: Make sure Docker is running
   ```bash
   # Check Docker status
   docker info
   ```

2. **Environment Variables**: The app uses these defaults (configured in docker-compose.yml):
   - `DATABASE_URL`: `postgresql://phoneagent:phoneagent_password@localhost:5432/phone_agent`
   - `GEMINI_API_KEY`: Required for AI functionality (set in your environment)

### Start the Application

**Option 1: Use the start script (Recommended)**
```bash
# This will:
# 1. Start PostgreSQL in Docker
# 2. Run Prisma migrations
# 3. Seed the database with initial data
# 4. Start all services (API, frontend, mockup sandbox)
./start-all.sh
```

**Option 2: Manual startup**
```bash
# Start PostgreSQL
docker-compose up -d

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx tsx prisma/seed.ts

# Start services
export PORT=5175 DATABASE_URL="postgresql://phoneagent:phoneagent_password@localhost:5432/phone_agent"
cd artifacts/api-server && pnpm run dev &

cd artifacts/mockup-sandbox && export PORT=5176 && pnpm run dev &

cd artifacts/phone-agent && export PORT=5177 && pnpm run dev &
```

### Access the Application
- **Phone Agent**: http://localhost:5177
- **Mockup Sandbox**: http://localhost:5176
- **API Server**: http://localhost:5175
- **Prisma Studio**: `pnpm run db:studio` (for database GUI)

## Database Schema

### Contact
```typescript
{
  id: string
  name: string
  business: string
  initials: string
  color: string
  note: string | null
  online: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Conversation
```typescript
{
  id: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  messages: Message[]
  history: History[]
}
```

### Message
```typescript
{
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  pending: boolean
  createdAt: Date
  updatedAt: Date
  conversationId: string
}
```

### History
```typescript
{
  id: string
  title: string
  detail: string
  status: 'Completed' | 'Needs you' | 'In Progress'
  time: string
  createdAt: Date
  updatedAt: Date
  conversationId: string
}
```

## Development Commands

```bash
# Database operations
pnpm run db:migrate      # Create and run migrations
pnpm run db:seed        # Seed database with sample data
pnpm run db:studio      # Open Prisma Studio (database GUI)
pnpm run db:generate    # Regenerate Prisma Client

# Build and test
pnpm run build          # Build all packages
pnpm run typecheck      # Type checking
pnpm start              # Start all services
```

## Troubleshooting

### Docker Issues
If Docker isn't running:
```bash
# Start Docker Desktop (Mac) or Docker service (Linux)
# Then run:
docker-compose up -d
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Migration Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Port Conflicts
If ports are already in use, the services will automatically try alternative ports. Check the startup logs for actual URLs.

## Next Steps

1. **Set Gemini API Key**: Add your real Gemini API key to enable AI functionality
2. **Customize Schema**: Modify `prisma/schema.prisma` for your data needs
3. **Add Authentication**: Implement user authentication and data isolation
4. **Add More Features**: Expand the API with additional endpoints as needed

## Architecture Changes

### Before
- Dummy data hardcoded in React components
- No persistent storage
- Limited scalability

### After
- PostgreSQL database with Docker
- Prisma ORM for type-safe database access
- RESTful API for all data operations
- Real-time data synchronization
- Scalable architecture for production
