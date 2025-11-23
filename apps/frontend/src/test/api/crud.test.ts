import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import EmployeeManagement from '../../app/features/employees/EmployeeManagement';
import ConstraintManagement from '../../app/features/constraints/ConstraintManagement';
import SchedulerView from '../../app/features/scheduler/SchedulerView';
import { employeesApi, constraintsApi, schedulesApi } from '../../lib/api';

// Setup MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CRUD Operations', () => {
  describe('Employees', () => {
    it('should fetch employees on mount', async () => {
      render(
        <TestWrapper>
          <EmployeeManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });
    });

    it('should create a new employee', async () => {
      const newEmployee = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        skills: ['React'],
      };

      const response = await employeesApi.create(newEmployee);
      expect(response).toHaveProperty('id');
      expect(response.name).toBe(newEmployee.name);
      expect(response.email).toBe(newEmployee.email);
    });

    it('should update an existing employee', async () => {
      const updates = {
        name: 'John Updated',
        email: 'john.updated@example.com',
      };

      const response = await employeesApi.update('1', updates);
      expect(response.name).toBe(updates.name);
      expect(response.email).toBe(updates.email);
    });

    it('should delete an employee', async () => {
      const response = await employeesApi.delete('1');
      expect(response).toHaveProperty('id');
      expect(response.id).toBe('1');
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('http://localhost:3000/employees', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      await expect(employeesApi.getAll()).rejects.toThrow();
    });
  });

  describe('Constraints', () => {
    it('should fetch constraints on mount', async () => {
      render(
        <TestWrapper>
          <ConstraintManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/max_hours/i)).toBeInTheDocument();
      });
    });

    it('should fetch active constraints', async () => {
      const constraints = await constraintsApi.getActive();
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.every((c) => c.active === true)).toBe(true);
    });

    it('should create a new constraint', async () => {
      const newConstraint = {
        type: 'min_rest',
        rules: { minRestHours: 11 },
        priority: 75,
        active: true,
      };

      const response = await constraintsApi.create(newConstraint);
      expect(response).toHaveProperty('id');
      expect(response.type).toBe(newConstraint.type);
      expect(response.rules).toEqual(newConstraint.rules);
    });

    it('should update a constraint', async () => {
      const updates = {
        active: false,
        priority: 80,
      };

      const response = await constraintsApi.update('1', updates);
      expect(response.active).toBe(updates.active);
      expect(response.priority).toBe(updates.priority);
    });

    it('should delete a constraint', async () => {
      const response = await constraintsApi.delete('1');
      expect(response).toHaveProperty('id');
    });
  });

  describe('Schedules', () => {
    it('should fetch schedules on mount', async () => {
      render(
        <TestWrapper>
          <SchedulerView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Schedule View/i)).toBeInTheDocument();
      });
    });

    it('should create a new schedule', async () => {
      const newSchedule = {
        employeeId: '1',
        shiftId: '1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        status: 'confirmed',
      };

      const response = await schedulesApi.create(newSchedule);
      expect(response).toHaveProperty('id');
      expect(response.employeeId).toBe(newSchedule.employeeId);
      expect(response.status).toBe(newSchedule.status);
    });

    it('should update a schedule', async () => {
      const updates = {
        status: 'tentative',
        startTime: '2024-01-01T10:00:00Z',
      };

      const response = await schedulesApi.update('1', updates);
      expect(response.status).toBe(updates.status);
    });

    it('should delete a schedule', async () => {
      const response = await schedulesApi.delete('1');
      expect(response).toHaveProperty('id');
    });
  });
});

