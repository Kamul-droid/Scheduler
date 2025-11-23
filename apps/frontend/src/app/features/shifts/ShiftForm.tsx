import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';

interface ShiftFormProps {
  shift?: any;
  departments: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function ShiftForm({ shift, departments, onSubmit, onCancel }: ShiftFormProps) {
  const [formData, setFormData] = useState({
    departmentId: '',
    minStaffing: 1,
    maxStaffing: 2,
    startTime: '',
    endTime: '',
    requiredSkills: '',
    shiftName: '',
    shiftType: 'day',
  });

  useEffect(() => {
    if (shift) {
      // Parse startTime and endTime from ISO string to datetime-local format
      const startDate = shift.startTime ? new Date(shift.startTime).toISOString().slice(0, 16) : '';
      const endDate = shift.endTime ? new Date(shift.endTime).toISOString().slice(0, 16) : '';

      setFormData({
        departmentId: shift.departmentId || '',
        minStaffing: shift.minStaffing || 1,
        maxStaffing: shift.maxStaffing || 2,
        startTime: startDate,
        endTime: endDate,
        requiredSkills: shift.requiredSkills
          ? Array.isArray(shift.requiredSkills)
            ? JSON.stringify(shift.requiredSkills, null, 2)
            : typeof shift.requiredSkills === 'string'
            ? shift.requiredSkills
            : JSON.stringify(shift.requiredSkills, null, 2)
          : '',
        shiftName: shift.metadata?.name || '',
        shiftType: shift.metadata?.shiftType || 'day',
      });
    } else {
      // Set default times (today, 8 AM to 4 PM)
      const now = new Date();
      const start = new Date(now);
      start.setHours(8, 0, 0, 0);
      const end = new Date(now);
      end.setHours(16, 0, 0, 0);

      setFormData({
        ...formData,
        startTime: start.toISOString().slice(0, 16),
        endTime: end.toISOString().slice(0, 16),
      });
    }
  }, [shift]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert datetime-local to ISO string
    const startTimeISO = new Date(formData.startTime).toISOString();
    const endTimeISO = new Date(formData.endTime).toISOString();

    const submitData: any = {
      departmentId: formData.departmentId,
      minStaffing: parseInt(String(formData.minStaffing), 10),
      maxStaffing: parseInt(String(formData.maxStaffing), 10),
      startTime: startTimeISO,
      endTime: endTimeISO,
    };

    // Parse requiredSkills if provided
    if (formData.requiredSkills.trim()) {
      try {
        submitData.requiredSkills = JSON.parse(formData.requiredSkills);
      } catch {
        // If not valid JSON, try to create a simple array
        const skills = formData.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
        if (skills.length > 0) {
          submitData.requiredSkills = skills;
        }
      }
    }

    // Build metadata object
    const metadata: any = {};
    if (formData.shiftName.trim()) {
      metadata.name = formData.shiftName;
    }
    if (formData.shiftType) {
      metadata.shiftType = formData.shiftType;
    }
    if (Object.keys(metadata).length > 0) {
      submitData.metadata = metadata;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Department *
        </label>
        <select
          value={formData.departmentId}
          onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          required
        >
          <option value="">Select a department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Min Staffing *"
          type="number"
          min="0"
          value={formData.minStaffing}
          onChange={(e) => setFormData({ ...formData, minStaffing: parseInt(e.target.value) || 0 })}
          required
        />
        <Input
          label="Max Staffing *"
          type="number"
          min="1"
          value={formData.maxStaffing}
          onChange={(e) => setFormData({ ...formData, maxStaffing: parseInt(e.target.value) || 1 })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Time *"
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          required
        />
        <Input
          label="End Time *"
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shift Name (optional)
        </label>
        <Input
          value={formData.shiftName}
          onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
          placeholder="e.g., Day Shift, Night Shift"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shift Type
        </label>
        <select
          value={formData.shiftType}
          onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="day">Day</option>
          <option value="night">Night</option>
          <option value="evening">Evening</option>
          <option value="weekend">Weekend</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Skills (JSON array or comma-separated)
        </label>
        <textarea
          value={formData.requiredSkills}
          onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          rows={4}
          placeholder='[{"name": "Emergency Medicine", "level": "intermediate", "certifications": ["ACLS", "BLS"]}] or Emergency Medicine, Nursing'
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter as JSON array of skill objects, or comma-separated skill names
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {shift ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

