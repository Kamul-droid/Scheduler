import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { shiftsApi } from '../../../lib/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useEmployees } from '../../hooks/useEmployees';

interface ScheduleFormProps {
  schedule?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  defaultDate?: Date;
  defaultEmployeeId?: string;
}

export default function ScheduleForm({
  schedule,
  onSubmit,
  onCancel,
  defaultDate,
  defaultEmployeeId,
}: ScheduleFormProps) {
  const { employees } = useEmployees();
  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: shiftsApi.getAll,
  });

  const [formData, setFormData] = useState({
    employeeId: defaultEmployeeId || '',
    shiftId: '',
    startTime: '',
    endTime: '',
    status: 'tentative' as 'confirmed' | 'tentative' | 'conflict',
    metadata: null as any,
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        employeeId: schedule.employeeId || '',
        shiftId: schedule.shiftId || '',
        startTime: schedule.startTime ? new Date(schedule.startTime).toISOString().slice(0, 16) : '',
        endTime: schedule.endTime ? new Date(schedule.endTime).toISOString().slice(0, 16) : '',
        status: schedule.status || 'tentative',
        metadata: schedule.metadata || null,
      });
    } else if (defaultDate) {
      const dateStr = defaultDate.toISOString().slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        startTime: `${dateStr}T09:00`,
        endTime: `${dateStr}T17:00`,
      }));
    }
  }, [schedule, defaultDate, defaultEmployeeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      metadata: formData.metadata || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employee
        </label>
        <select
          value={formData.employeeId}
          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          className="input"
          required
        >
          <option value="">Select an employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shift
        </label>
        <select
          value={formData.shiftId}
          onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
          className="input"
        >
          <option value="">No shift (manual schedule)</option>
          {shifts.map((shift: any) => (
            <option key={shift.id} value={shift.id}>
              {shift.name || `Shift ${shift.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Start Time"
        type="datetime-local"
        value={formData.startTime}
        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
        required
      />

      <Input
        label="End Time"
        type="datetime-local"
        value={formData.endTime}
        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value as 'confirmed' | 'tentative' | 'conflict',
            })
          }
          className="input"
        >
          <option value="confirmed">Confirmed</option>
          <option value="tentative">Tentative</option>
          <option value="conflict">Conflict</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{schedule ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}

