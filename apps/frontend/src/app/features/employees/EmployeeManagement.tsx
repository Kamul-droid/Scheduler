import { Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee } from '../../hooks/useEmployees';
import EmployeeForm from './EmployeeForm';
import EmployeeList from './EmployeeList';

export default function EmployeeManagement() {
  const { employees, loading } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployeeMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Failed to delete employee. Please try again.');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingEmployee) {
        await updateEmployeeMutation.mutateAsync({ id: editingEmployee.id, data });
      } else {
        await createEmployeeMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage employees and their skills</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading employees...</p>
        </div>
      ) : (
        <EmployeeList
          employees={employees}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
          }}
        />
      </Modal>
    </div>
  );
}

