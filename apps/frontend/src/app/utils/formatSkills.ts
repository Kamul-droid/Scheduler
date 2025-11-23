/**
 * Utility functions for formatting employee skills
 */

export interface Skill {
  name: string;
  level?: string;
  certifications?: string[];
  yearsExperience?: number;
}

/**
 * Formats a skill object into a human-readable string
 */
export function formatSkill(skill: Skill | string): string {
  if (typeof skill === 'string') {
    return skill;
  }

  if (!skill || typeof skill !== 'object') {
    return 'Unknown';
  }

  const parts: string[] = [];

  // Add skill name
  if (skill.name) {
    parts.push(skill.name);
  }

  // Add level if available
  if (skill.level) {
    parts.push(`(${skill.level})`);
  }

  // Add certifications if available
  if (skill.certifications && skill.certifications.length > 0) {
    parts.push(`[${skill.certifications.join(', ')}]`);
  }

  // Add years of experience if available
  if (skill.yearsExperience !== undefined) {
    parts.push(`${skill.yearsExperience}yr${skill.yearsExperience !== 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'No skill information';
}

/**
 * Formats an array of skills into a human-readable string
 */
export function formatSkills(skills: (Skill | string)[] | null | undefined): string {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return 'No skills';
  }

  return skills.map(formatSkill).join(', ');
}

/**
 * Formats skills as a list of formatted strings
 */
export function formatSkillsList(skills: (Skill | string)[] | null | undefined): string[] {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return [];
  }

  return skills.map(formatSkill);
}

