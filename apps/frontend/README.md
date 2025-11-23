# Resource Scheduler Frontend

React + TypeScript frontend for the Resource Scheduler application.

## Features

- **Scheduler View**: Interactive timeline visualization of schedules with conflict detection
- **Employee Management**: CRUD operations for employees with skills management
- **Constraint Management**: Define and manage scheduling constraints
- **Optimization Panel**: Generate optimal schedules using the optimization service

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling (responsive by default)
- **Apollo Client** for GraphQL queries
- **React Query** for REST API state management
- **React Router** for navigation
- **date-fns** for date manipulation
- **Lucide React** for icons

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file):
```env
VITE_HASURA_URL=http://localhost:8080/v1/graphql
VITE_HASURA_ADMIN_SECRET=your-secret
VITE_API_URL=http://localhost:3001
```

3. Generate GraphQL types (optional):
```bash
npm run codegen
```

4. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── components/      # Reusable UI components
│   ├── features/        # Feature modules
│   │   ├── employees/  # Employee management
│   │   ├── constraints/ # Constraint management
│   │   └── scheduler/  # Schedule visualization
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and API clients
├── graphql/            # GraphQL queries and generated types
└── main.tsx            # Application entry point
```

## Key Components

### SchedulerView
- Week navigation
- Timeline visualization
- Conflict detection indicators
- Employee filtering

### EmployeeManagement
- Employee list with skills
- Create/Edit/Delete operations
- Skills management

### ConstraintManagement
- Constraint cards with active/inactive toggle
- JSON-based rule editor
- Priority management

### OptimizationPanel
- Optimization controls
- Real-time status polling
- Solution preview and application

## Responsive Design

All components are built with Tailwind CSS and are responsive by default:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Navigation adapts to screen size
## GraphQL Integration

The app uses Apollo Client for GraphQL queries. Queries are defined in hook files:
- `useEmployees.ts` - Employee queries
- `useSchedules.ts` - Schedule queries
- `useConstraints.ts` - Constraint queries

## API Integration

REST API calls (for optimization) are handled via React Query:
- `optimizationApi` in `lib/api.ts`
- Polling for optimization status
- Error handling and loading states


