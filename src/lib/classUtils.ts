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
      
      let sBaseClass = 'Nursery 1';
      if (/Basic 2|Primary 2/i.test(sTrim)) sBaseClass = 'Basic 2';
      else if (/Basic 1|Primary 1/i.test(sTrim)) sBaseClass = 'Basic 1';
      else if (/Nursery/i.test(sTrim)) sBaseClass = 'Nursery 1';

      if (sBaseClass !== baseClass) return false;

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

export function getStudentAdmissionNumber(student: Student): string {
  if (student.admissionNumber && student.admissionNumber.trim().length > 0) {
    return student.admissionNumber.trim();
  }

  // If formNumber starts with AIAA-B or AIAA/, use that as admission number
  if (student.formNumber && (student.formNumber.startsWith('AIAA-B') || student.formNumber.startsWith('AIAA/'))) {
    return student.formNumber.trim();
  }

  const currentYearShort = new Date().getFullYear().toString().slice(-2);

  // Extract number sequence from formNumber if present
  if (student.formNumber) {
    const digits = student.formNumber.replace(/\D/g, '');
    if (digits.length >= 3) {
      const lastDigits = digits.length > 3 ? digits.slice(-4) : digits;
      const num = String(parseInt(lastDigits, 10) || 1).padStart(3, '0');
      return `AIAA-B${currentYearShort}-${num}`;
    }
  }

  // Fallback to student ID hash to guarantee uniqueness when formNumber is absent/identical
  let hash = 0;
  const str = student.id || student.firstName || '0';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const uniqueNum = String(Math.abs(hash) % 899 + 100).padStart(3, '0');
  return `AIAA-B${currentYearShort}-${uniqueNum}`;
}

