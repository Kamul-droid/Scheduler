import { Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useConstraints, useCreateConstraint, useDeleteConstraint, useUpdateConstraint } from '../../hooks/useConstraints';
import ConstraintForm from './ConstraintForm';
import ConstraintList from './ConstraintList';

export default function ConstraintManagement() {
  const { constraints, loading } = useConstraints();
  const createConstraintMutation = useCreateConstraint();
  const updateConstraintMutation = useUpdateConstraint();
  const deleteConstraintMutation = useDeleteConstraint();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<any>(null);

  const handleCreate = () => {
    setEditingConstraint(null);
    setIsModalOpen(true);
  };

  const handleEdit = (constraint: any) => {
    setEditingConstraint(constraint);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this constraint?')) {
      try {
        await deleteConstraintMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting constraint:', error);
        alert('Failed to delete constraint. Please try again.');
      }
    }
  };

  const handleToggleActive = async (constraint: any) => {
    try {
      await updateConstraintMutation.mutateAsync({
        id: constraint.id,
        data: { active: !constraint.active },
      });
    } catch (error) {
      console.error('Error updating constraint:', error);
      alert('Failed to update constraint. Please try again.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingConstraint) {
        await updateConstraintMutation.mutateAsync({
          id: editingConstraint.id,
          data,
        });
      } else {
        await createConstraintMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingConstraint(null);
    } catch (error) {
      console.error('Error saving constraint:', error);
      alert('Failed to save constraint. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Constraint Management</h2>
          <p className="mt-1 text-sm text-gray-500">Define and manage scheduling constraints</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Constraint
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading constraints...</p>
        </div>
      ) : (
        <ConstraintList
          constraints={constraints}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingConstraint(null);
        }}
        title={editingConstraint ? 'Edit Constraint' : 'Add Constraint'}
      >
        <ConstraintForm
          constraint={editingConstraint}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingConstraint(null);
          }}
        />
      </Modal>
    </div>
  );
}

