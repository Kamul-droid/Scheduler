# Frontend Scripts

## Seed Backend Script

The `seed-backend.js` script populates the backend database with test data from `cypress/fixtures/test-data.json`.

### Usage

#### Manual Seeding

Run the seed script manually in a separate terminal/process:

```bash
npm run seed
```

Or directly:

```bash
node scripts/seed-backend.js
```

**Note:** The seed script is **not** automatically executed when starting the dev server. You must run it separately in another terminal/process.

The seeding process will:
1. Check if the backend is available at `http://localhost:3000` (or `VITE_API_URL`)
2. Load test data from `cypress/fixtures/test-data.json`
3. Create entities in the following order:
   - Departments
   - Employees
   - Constraints
   - Shifts (linked to departments)
   - Schedules (linked to employees and shifts)

### Configuration

The script uses the following environment variables:

- `VITE_API_URL`: Backend API URL (default: `http://localhost:3000`)
- `SEED_BACKEND_STANDALONE`: Set to `true` to exit on errors (default: `true` when run via `npm run seed`)

### Test Data Structure

The script expects test data in `cypress/fixtures/test-data.json` with the following structure:

```json
{
  "departments": [...],
  "employees": [...],
  "shifts": [...],
  "constraints": [...],
  "schedules": [...]
}
```

### Error Handling

- If the backend is not available, the script will exit with an error
- If an entity already exists (409 or 400 status), it will be skipped and the existing entity will be fetched
- The script will continue even if some entities fail to create
- Duplicate detection is automatic - existing entities are found and reused

### Output

The script provides detailed output showing:
- Which entities were created successfully
- Which entities were skipped (already exist) and found
- Which entities failed to create
- A summary of available entities

### Running in Development

To seed the database during development:

1. Start the backend server
2. Start the frontend dev server: `npm run dev`
3. In a separate terminal, run: `npm run seed`

This allows the seed script to run independently without affecting the dev server.
