import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '../../lib/api';

export function useShifts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shifts'],
    queryFn: shiftsApi.getAll,
  });

  return {
    shifts: data || [],
    loading: isLoading,
    error,
  };
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shiftsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      shiftsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shiftsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

