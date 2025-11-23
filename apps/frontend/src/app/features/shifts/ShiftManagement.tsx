import { Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/Button';
import { useDepartments } from '../../hooks/useDepartments';
import { useCreateShift, useDeleteShift, useShifts, useUpdateShift } from '../../hooks/useShifts';
import ShiftForm from './ShiftForm';
import ShiftList from './ShiftList';

export default function ShiftManagement() {
  const { shifts, loading, error } = useShifts();
  const { departments } = useDepartments();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);

  const handleCreate = () => {
    setEditingShift(null);
    setIsFormOpen(true);
  };

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await deleteShift.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete shift:', error);
        alert('Failed to delete shift. Please try again.');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingShift) {
        await updateShift.mutateAsync({ id: editingShift.id, data });
      } else {
        await createShift.mutateAsync(data);
      }
      setIsFormOpen(false);
      setEditingShift(null);
    } catch (error) {
      console.error('Failed to save shift:', error);
      alert('Failed to save shift. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingShift(null);
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Loading shifts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500">Error loading shifts. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage shifts and their requirements</p>
        </div>
        <Button 
          onClick={handleCreate} 
          variant="primary"
          disabled={departments.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      {departments.length === 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            ⚠️ Please create at least one department before adding shifts.
          </p>
        </div>
      )}

      {isFormOpen && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingShift ? 'Edit Shift' : 'Create Shift'}
          </h3>
          <ShiftForm
            shift={editingShift}
            departments={departments}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      <ShiftList
        shifts={shifts}
        departments={departments}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

