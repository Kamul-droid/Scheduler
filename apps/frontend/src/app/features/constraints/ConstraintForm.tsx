import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';

interface ConstraintFormProps {
  constraint?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CONSTRAINT_TYPES = [
  'max_hours',
  'min_rest',
  'fair_distribution',
  'skill_requirement',
  'availability',
  'max_consecutive_days',
  'min_consecutive_days',
] as const;

export default function ConstraintForm({ constraint, onSubmit, onCancel }: ConstraintFormProps) {
  const [formData, setFormData] = useState({
    type: 'max_hours' as typeof CONSTRAINT_TYPES[number],
    rules: '{}',
    priority: 50,
    active: true,
  });

  useEffect(() => {
    if (constraint) {
      setFormData({
        type: constraint.type || 'max_hours',
        rules: typeof constraint.rules === 'object' 
          ? JSON.stringify(constraint.rules, null, 2)
          : typeof constraint.rules === 'string'
          ? constraint.rules
          : '{}',
        priority: constraint.priority || 50,
        active: constraint.active !== undefined ? constraint.active : true,
      });
    }
  }, [constraint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse and validate JSON rules
      const rules = JSON.parse(formData.rules);
      
      // Validate that rules is an object
      if (typeof rules !== 'object' || rules === null || Array.isArray(rules)) {
        throw new Error('Rules must be a valid JSON object');
      }
      
      onSubmit({
        type: formData.type,
        rules,
        priority: formData.priority,
        active: formData.active,
      });
    } catch (error) {
      alert(`Invalid JSON in rules field: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof CONSTRAINT_TYPES[number] })}
          className="input"
          required
        >
          {CONSTRAINT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rules (JSON)
        </label>
        <textarea
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          className="input font-mono text-sm"
          rows={6}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter valid JSON. Example: {`{"maxHoursPerWeek": 40}`}
        </p>
      </div>

      <Input
        label="Priority (0-100)"
        type="number"
        min="0"
        max="100"
        value={formData.priority}
        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
        required
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {constraint ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

