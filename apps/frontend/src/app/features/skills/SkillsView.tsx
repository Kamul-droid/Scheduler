import { useMemo, useState } from 'react';
import Input from '../../components/Input';
import { useEmployees } from '../../hooks';
import { type Skill } from '../../utils/formatSkills';

export default function SkillsView() {
  const { employees, loading, error } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all unique skills from employees
  const allSkills = useMemo(() => {
    const skillsMap = new Map<string, Skill & { employeeCount: number; employees: string[] }>();

    employees.forEach((employee: any) => {
      if (!employee.skills || !Array.isArray(employee.skills)) return;

      employee.skills.forEach((skill: Skill | string) => {
        const skillObj: Skill = typeof skill === 'string' 
          ? { name: skill } 
          : skill;

        const skillName = skillObj.name || String(skill);
        const key = skillName.toLowerCase();

        if (!skillsMap.has(key)) {
          skillsMap.set(key, {
            ...skillObj,
            name: skillName,
            employeeCount: 0,
            employees: [],
          });
        }

        const existing = skillsMap.get(key)!;
        existing.employeeCount++;
        if (!existing.employees.includes(employee.name)) {
          existing.employees.push(employee.name);
        }
      });
    });

    return Array.from(skillsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [employees]);

  // Filter skills based on search term
  const filteredSkills = useMemo(() => {
    if (!searchTerm.trim()) return allSkills;

    const term = searchTerm.toLowerCase();
    return allSkills.filter((skill) =>
      skill.name.toLowerCase().includes(term) ||
      skill.level?.toLowerCase().includes(term) ||
      skill.certifications?.some((cert) => cert.toLowerCase().includes(term)) ||
      skill.employees.some((emp) => emp.toLowerCase().includes(term))
    );
  }, [allSkills, searchTerm]);

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Loading skills...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500">Error loading skills. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Skills Catalog</h2>
        <p className="mt-1 text-sm text-gray-500">
          View all skills across employees ({allSkills.length} unique skills)
        </p>
      </div>

      <div className="card">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search skills, certifications, or employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {filteredSkills.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'No skills found matching your search.' : 'No skills found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                  <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    {skill.employeeCount} {skill.employeeCount === 1 ? 'employee' : 'employees'}
                  </span>
                </div>

                {skill.level && (
                  <div className="text-sm text-gray-600 mb-1">
                    Level: <span className="font-medium">{skill.level}</span>
                  </div>
                )}

                {skill.certifications && skill.certifications.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">Certifications:</div>
                    <div className="flex flex-wrap gap-1">
                      {skill.certifications.map((cert, certIndex) => (
                        <span
                          key={certIndex}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {skill.yearsExperience !== undefined && (
                  <div className="text-sm text-gray-600 mb-2">
                    Experience: <span className="font-medium">{skill.yearsExperience} years</span>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Employees:</div>
                  <div className="text-sm text-gray-700">
                    {skill.employees.slice(0, 3).join(', ')}
                    {skill.employees.length > 3 && ` +${skill.employees.length - 3} more`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

