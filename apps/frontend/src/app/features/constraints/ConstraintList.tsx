import { Edit, Trash2 } from 'lucide-react';

interface ConstraintListProps {
  constraints: any[];
  onEdit: (constraint: any) => void;
  onDelete: (id: string) => void;
  onToggleActive: (constraint: any) => void;
}

export default function ConstraintList({ constraints, onEdit, onDelete, onToggleActive }: ConstraintListProps) {
  if (constraints.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No constraints found. Add your first constraint to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {constraints.map((constraint) => (
        <div key={constraint.id} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{constraint.type}</h3>
              <p className="text-sm text-gray-500">Priority: {constraint.priority}</p>
            </div>
            <button
              onClick={() => onToggleActive(constraint)}
              className={`p-1 rounded ${
                constraint.active ? 'text-green-600' : 'text-gray-400'
              }`}
              title={constraint.active ? 'Active' : 'Inactive'}
            >
              {constraint.active ? '●' : '○'}
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {typeof constraint.rules === 'object'
                ? JSON.stringify(constraint.rules, null, 2)
                : constraint.rules}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => onEdit(constraint)}
              className="text-primary-600 hover:text-primary-900"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(constraint.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

