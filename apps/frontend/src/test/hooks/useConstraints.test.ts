import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useConstraints,
  useActiveConstraints,
  useCreateConstraint,
  useUpdateConstraint,
  useDeleteConstraint,
} from '../../app/hooks/useConstraints';

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

describe('useConstraints hooks', () => {
  it('should fetch all constraints', async () => {
    const { result } = renderHook(() => useConstraints(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.constraints).toHaveLength(1);
    expect(result.current.constraints[0].type).toBe('max_hours');
  });

  it('should fetch active constraints only', async () => {
    const { result } = renderHook(() => useActiveConstraints(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.constraints).toHaveLength(1);
    expect(result.current.constraints[0].active).toBe(true);
  });

  it('should create a constraint', async () => {
    const { result } = renderHook(() => useCreateConstraint(), {
      wrapper: createWrapper(),
    });

    const newConstraint = {
      type: 'min_rest',
      rules: { minRestHours: 11 },
      priority: 75,
      active: true,
    };

    result.current.mutate(newConstraint);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveProperty('id');
    expect(result.current.data?.type).toBe(newConstraint.type);
  });

  it('should update a constraint', async () => {
    const { result } = renderHook(() => useUpdateConstraint(), {
      wrapper: createWrapper(),
    });

    const updates = {
      id: '1',
      data: { active: false, priority: 80 },
    };

    result.current.mutate(updates);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.active).toBe(false);
    expect(result.current.data?.priority).toBe(80);
  });

  it('should delete a constraint', async () => {
    const { result } = renderHook(() => useDeleteConstraint(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveProperty('id');
  });
});

