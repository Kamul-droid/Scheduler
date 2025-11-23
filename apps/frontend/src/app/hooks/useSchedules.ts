import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../../lib/api';

export function useSchedules() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: schedulesApi.getAll,
  });

  return {
    schedules: data || [],
    loading: isLoading,
    error,
  };
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: schedulesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      schedulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: schedulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
