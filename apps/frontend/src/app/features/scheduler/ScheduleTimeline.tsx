import { format, parseISO } from 'date-fns';
import { Clock, Edit, Trash2, User } from 'lucide-react';

interface ScheduleTimelineProps {
  schedules: any[];
  employees: any[];
  selectedDate: Date;
  selectedEmployee: string | null;
  onEmployeeSelect: (employeeId: string | null) => void;
  onEdit?: (schedule: any) => void;
  onDelete?: (id: string) => void;
}

export default function ScheduleTimeline({
  schedules,
  employees,
  selectedDate: _selectedDate, // Prefixed with underscore to indicate intentionally unused (kept for interface compatibility)
  selectedEmployee,
  onEmployeeSelect,
  onEdit,
  onDelete,
}: ScheduleTimelineProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || 'Unknown';
  };


  const employeeSchedules = selectedEmployee
    ? schedules.filter((s) => s.employeeId === selectedEmployee)
    : schedules;

  return (
    <div className="card">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Employee
        </label>
        <select
          value={selectedEmployee || ''}
          onChange={(e) => onEmployeeSelect(e.target.value || null)}
          className="input"
        >
          <option value="">All Employees</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="flex gap-2 mb-2 pb-2 border-b border-gray-200">
            <div className="w-20 font-medium text-sm text-gray-700">Time</div>
            <div className="flex-1 grid grid-cols-12 gap-1">
              {hours.map((hour) => (
                <div key={hour} className="text-center text-xs text-gray-500">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Blocks */}
          <div className="space-y-2">
            {employeeSchedules.map((schedule) => {
              const start = parseISO(schedule.startTime);
              const end = parseISO(schedule.endTime);
              const startHour = start.getHours();
              const startMinute = start.getMinutes();
              const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
              const width = (duration / 60) * 100; // percentage
              const left = (startMinute / 60) * 100; // percentage offset

              return (
                <div
                  key={schedule.id}
                  className={`relative p-2 rounded-lg text-white text-sm ${
                    schedule.status === 'conflict'
                      ? 'bg-red-500'
                      : schedule.status === 'tentative'
                      ? 'bg-yellow-500'
                      : 'bg-primary-600'
                  }`}
                  style={{
                    marginLeft: `${startHour * 4.17 + (left / 24)}%`,
                    width: `${width / 24}%`,
                    minWidth: '120px',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{getEmployeeName(schedule.employeeId)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-90">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                    </span>
                  </div>
                  {schedule.status === 'conflict' && (
                    <div className="mt-1 text-xs font-semibold">⚠️ Conflict</div>
                  )}
                  {(onEdit || onDelete) && (
                    <div className="flex gap-2 mt-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(schedule)}
                          className="text-white hover:text-gray-200"
                          title="Edit schedule"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(schedule.id)}
                          className="text-white hover:text-gray-200"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {employeeSchedules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No schedules for this day. Click "Add Schedule" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

