import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../../app/hooks/useEmployees';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useEmployees hook', () => {
  it('should fetch employees', async () => {
    const { result } = renderHook(() => useEmployees(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.employees).toHaveLength(1);
    expect(result.current.employees[0].name).toBe('John Doe');
  });

  it('should create an employee', async () => {
    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: createWrapper(),
    });

    const newEmployee = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      skills: ['React'],
    };

    result.current.mutate(newEmployee);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveProperty('id');
    expect(result.current.data?.name).toBe(newEmployee.name);
  });

  it('should update an employee', async () => {
    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(),
    });

    const updates = {
      id: '1',
      data: { name: 'John Updated' },
    };

    result.current.mutate(updates);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.name).toBe(updates.data.name);
  });

  it('should delete an employee', async () => {
    const { result } = renderHook(() => useDeleteEmployee(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveProperty('id');
  });

  it('should handle errors', async () => {
    server.use(
      http.get('http://localhost:3000/employees', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useEmployees(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});

