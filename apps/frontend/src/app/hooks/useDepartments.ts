import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../../lib/api';

export function useDepartments() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  return {
    departments: data || [],
    loading: isLoading,
    error,
  };
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      departmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

