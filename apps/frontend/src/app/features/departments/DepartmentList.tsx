import { Edit, Trash2 } from 'lucide-react';
import Button from '../../components/Button';

interface DepartmentListProps {
  departments: any[];
  onEdit: (department: any) => void;
  onDelete: (id: string) => void;
}

export default function DepartmentList({ departments, onEdit, onDelete }: DepartmentListProps) {
  if (departments.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No departments found. Add your first department to get started.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requirements
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((department) => (
              <tr key={department.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{department.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {department.requirements ? (
                      typeof department.requirements === 'string' ? (
                        department.requirements
                      ) : (
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(department.requirements, null, 2)}
                        </pre>
                      )
                    ) : (
                      'No requirements'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(department)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(department.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

