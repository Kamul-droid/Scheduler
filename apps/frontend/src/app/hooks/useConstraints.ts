import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { constraintsApi } from '../../lib/api';

export function useConstraints() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['constraints'],
    queryFn: constraintsApi.getAll,
  });

  return {
    constraints: data || [],
    loading: isLoading,
    error,
  };
}

export function useActiveConstraints() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['constraints', 'active'],
    queryFn: constraintsApi.getActive,
  });

  return {
    constraints: data || [],
    loading: isLoading,
    error,
  };
}

export function useCreateConstraint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: constraintsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] });
    },
  });
}

export function useUpdateConstraint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      constraintsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] });
    },
  });
}

export function useDeleteConstraint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: constraintsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] });
    },
  });
}
