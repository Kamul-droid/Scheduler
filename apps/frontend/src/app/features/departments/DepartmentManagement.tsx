import { Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/Button';
import { useCreateDepartment, useDeleteDepartment, useDepartments, useUpdateDepartment } from '../../hooks/useDepartments';
import DepartmentForm from './DepartmentForm';
import DepartmentList from './DepartmentList';

export default function DepartmentManagement() {
  const { departments, loading, error } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);

  const handleCreate = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete department:', error);
        alert('Failed to delete department. Please try again.');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingDepartment) {
        await updateDepartment.mutateAsync({ id: editingDepartment.id, data });
      } else {
        await createDepartment.mutateAsync(data);
      }
      setIsFormOpen(false);
      setEditingDepartment(null);
    } catch (error) {
      console.error('Failed to save department:', error);
      alert('Failed to save department. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingDepartment(null);
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Loading departments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500">Error loading departments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage departments and their requirements</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {isFormOpen && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDepartment ? 'Edit Department' : 'Create Department'}
          </h3>
          <DepartmentForm
            department={editingDepartment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      <DepartmentList
        departments={departments}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

