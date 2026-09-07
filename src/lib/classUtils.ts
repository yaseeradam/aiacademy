import { Student } from '@/types';

export function getStudentClassArm(cls: string | undefined, studentId?: string, allStudents?: Student[]): string {
  if (!cls) return 'Nursery 1 Gold';
  let trimmed = cls.trim();
  if (trimmed === 'Nursery (Unassigned)') {
    trimmed = 'Nursery 1 (Unassigned)';
  }

  // If explicitly unassigned to a subclass arm
  if (trimmed.includes('Unassigned')) {
    return trimmed;
  }

  // If already assigned to an explicit arm (e.g. "Nursery 1 Gold", "Basic 1 Silver 2", etc.)
  if (trimmed.includes('Gold') || trimmed.includes('Silver') || trimmed.includes('Green') || trimmed.includes('Blue') || trimmed.includes('Diamond')) {
    return trimmed;
  }

  // Determine base class
  let baseClass = 'Nursery 1';
  if (/Basic 2|Primary 2/i.test(trimmed)) baseClass = 'Basic 2';
  else if (/Basic 1|Primary 1/i.test(trimmed)) baseClass = 'Basic 1';
  else if (/Nursery/i.test(trimmed)) baseClass = 'Nursery 1';

  if (allStudents && allStudents.length > 0 && studentId) {
    const bareClassStudents = allStudents.filter(s => {
      if (!s.intendedClass) return baseClass === 'Nursery 1';
      const sTrim = s.intendedClass.trim();
      return !sTrim.includes('Unassigned') && !sTrim.includes('Gold') && !sTrim.includes('Silver') && !sTrim.includes('Green') && !sTrim.includes('Blue') && !sTrim.includes('Diamond');
    });

    const idx = bareClassStudents.findIndex(s => s.id === studentId);
    if (idx >= 0) {
      if (idx < 36) return `${baseClass} Gold`;
      if (idx < 72) return `${baseClass} Silver`;
      if (idx < 108) return `${baseClass} Green`;
      return `${baseClass} Gold 2`;
    }
  }

  return `${baseClass} Gold`;
}
