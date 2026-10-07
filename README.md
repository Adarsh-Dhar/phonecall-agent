# phonecall-agent

## Running Tests

The project includes Vitest tests that run against a real PostgreSQL database.

### Setup Test Database

1. Start the test database:
```bash
docker-compose up postgres-test
```

2. Set the test database URL:
```bash
export TEST_DATABASE_URL="postgresql://phoneagent:phoneagent_password@localhost:5435/phone_agent_test"
```

3. Run migrations on the test database:
```bash
cd artifacts/api-server
npx prisma migrate deploy
```

### Run Tests

```bash
cd artifacts/api-server
pnpm test
```

**Important**: Tests verify that `DATABASE_URL` or `TEST_DATABASE_URL` contains "test" to prevent accidental data loss in production databases.
