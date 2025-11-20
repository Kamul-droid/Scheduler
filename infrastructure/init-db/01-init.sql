-- This file is executed when the PostgreSQL container is first created
-- It runs before Hasura connects, so we can set up initial data if needed

-- The main schema is created via Hasura migrations
-- This file can be used for any pre-Hasura setup or seed data

-- Example: Create a read-only user for reporting (optional)
-- CREATE USER scheduler_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE scheduler TO scheduler_readonly;
-- GRANT USAGE ON SCHEMA public TO scheduler_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO scheduler_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO scheduler_readonly;

