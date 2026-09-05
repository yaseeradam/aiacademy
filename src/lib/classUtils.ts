import { Student } from '@/types';

export function getStudentClassArm(cls: string | undefined, studentId?: string, allStudents?: Student[]): string {
  if (!cls) return 'Nursery 1 Gold';
  const trimmed = cls.trim();

  // If already assigned to an explicit arm
  if (trimmed.includes('Gold') || trimmed.includes('Silver') || trimmed.includes('Green') || trimmed.includes('Blue') || trimmed.includes('Diamond')) {
    return trimmed;
  }

  // Determine base class
  let baseClass = 'Nursery 1';
  if (/Basic 2|Primary 2/i.test(trimmed)) baseClass = 'Basic 2';
  else if (/Basic 1|Primary 1/i.test(trimmed)) baseClass = 'Basic 1';
  else if (/Nursery/i.test(trimmed)) baseClass = 'Nursery 1';

  if (allStudents && allStudents.length > 0 && studentId) {
    const bareClassStudents = allStudents
      .filter(s => {
        if (!s.intendedClass) return baseClass === 'Nursery 1';
        const sTrim = s.intendedClass.trim();
        if (sTrim.includes('Gold') || sTrim.includes('Silver') || sTrim.includes('Green')) return false;
        let sBase = 'Nursery 1';
        if (/Basic 2|Primary 2/i.test(sTrim)) sBase = 'Basic 2';
        else if (/Basic 1|Primary 1/i.test(sTrim)) sBase = 'Basic 1';
        else if (/Nursery/i.test(sTrim)) sBase = 'Nursery 1';
        return sBase === baseClass;
      })
      .sort((a, b) => (a.formNumber || a.id).localeCompare(b.formNumber || b.id));

    const idx = bareClassStudents.findIndex(s => s.id === studentId);
    if (idx >= 0) {
      if (idx < 35) return `${baseClass} Gold`;
      if (idx < 70) return `${baseClass} Silver`;
      if (idx < 105) return `${baseClass} Green`;
      if (idx < 140) return `${baseClass} Gold 2`;
      if (idx < 175) return `${baseClass} Silver 2`;
      return `${baseClass} Green 2`;
    }
  }

  return `${baseClass} Gold`;
}
