import { format } from 'date-fns';
import { Edit, Trash2 } from 'lucide-react';
import { formatSkills } from '../../utils/formatSkills';

interface ShiftListProps {
  shifts: any[];
  departments: any[];
  onEdit: (shift: any) => void;
  onDelete: (id: string) => void;
}

export default function ShiftList({ shifts, departments, onEdit, onDelete }: ShiftListProps) {
  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getShiftName = (shift: any) => {
    if (shift.metadata?.name) {
      return shift.metadata.name;
    }
    const deptName = getDepartmentName(shift.departmentId);
    return `${deptName} Shift`;
  };

  if (shifts.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No shifts found. Add your first shift to get started.</p>
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
                Name / Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staffing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required Skills
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {getShiftName(shift)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getDepartmentName(shift.departmentId)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {formatDateTime(shift.startTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    to {formatDateTime(shift.endTime)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {shift.minStaffing} - {shift.maxStaffing}
                  </div>
                  <div className="text-xs text-gray-500">staff required</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {formatSkills(shift.requiredSkills)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(shift)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(shift.id)}
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

