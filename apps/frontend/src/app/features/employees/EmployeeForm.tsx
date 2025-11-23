import { useState, useEffect } from 'react';
import Input from '../../components/Input';
import Button from '../../components/Button';

interface EmployeeFormProps {
  employee?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: [] as string[],
    availabilityPattern: null as any,
    metadata: null as any,
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        skills: Array.isArray(employee.skills) ? employee.skills : [],
        availabilityPattern: employee.availabilityPattern || null,
        metadata: employee.metadata || null,
      });
    }
  }, [employee]);

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
      email: formData.email,
    };
    
    // Only include optional fields if they have values
    if (formData.skills.length > 0) {
      submitData.skills = formData.skills;
    }
    if (formData.availabilityPattern) {
      submitData.availabilityPattern = formData.availabilityPattern;
    }
    if (formData.metadata) {
      submitData.metadata = formData.metadata;
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
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            placeholder="Add a skill"
            className="flex-1"
          />
          <Button type="button" onClick={handleAddSkill}>
            Add
          </Button>
        </div>
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {employee ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

