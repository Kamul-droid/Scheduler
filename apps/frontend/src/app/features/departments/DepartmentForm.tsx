import { useState, useEffect } from 'react';
import Input from '../../components/Input';
import Button from '../../components/Button';

interface DepartmentFormProps {
  department?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function DepartmentForm({ department, onSubmit, onCancel }: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    requirements: '',
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        requirements: department.requirements
          ? typeof department.requirements === 'string'
            ? department.requirements
            : JSON.stringify(department.requirements, null, 2)
          : '',
      });
    }
  }, [department]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
    };

    // Try to parse requirements as JSON, otherwise keep as string
    if (formData.requirements.trim()) {
      try {
        submitData.requirements = JSON.parse(formData.requirements);
      } catch {
        // If not valid JSON, treat as plain string
        submitData.requirements = formData.requirements;
      }
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requirements (JSON or plain text)
        </label>
        <textarea
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          rows={6}
          placeholder='{"minStaffing": 2, "requiredCertifications": ["ACLS", "BLS"]}'
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter requirements as JSON object or plain text
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {department ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

