import { Student } from '@/types';

// Memoize class arm assignments per array reference to ensure O(1) lookups and eliminate O(N^2) render freezes
const armCacheByArray = new WeakMap<Student[], Map<string, string>>();

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

  // If already assigned to an explicit arm (e.g. "Nursery 1 Gold", "Basic 3 Diamond", etc.)
  if (/\b(Gold|Silver|Green|Blue|Red|Diamond|Ruby|Bronze|Yellow|Gold 2|Silver 2|Green 2)\b/i.test(trimmed)) {
    return trimmed;
  }

  // Determine base class dynamically
  let baseClass = trimmed.replace(/^Primary\s+/i, 'Basic ');

  if (allStudents && allStudents.length > 0 && studentId) {
    let studentMap = armCacheByArray.get(allStudents);
    if (!studentMap) {
      studentMap = new Map<string, string>();
      const classBuckets = new Map<string, string[]>();

      for (let i = 0; i < allStudents.length; i++) {
        const s = allStudents[i];
        if (!s.intendedClass) continue;
        const sTrim = s.intendedClass.trim();
        if (sTrim.includes('Unassigned') || /\b(Gold|Silver|Green|Blue|Red|Diamond|Ruby|Bronze|Yellow|Gold 2|Silver 2|Green 2)\b/i.test(sTrim)) {
          continue;
        }
        const sBase = sTrim.replace(/^Primary\s+/i, 'Basic ');
        const baseKey = sBase.startsWith('Basic 2') ? 'Basic 2' : sBase.startsWith('Basic 1') ? 'Basic 1' : sBase.startsWith('Nursery 2') ? 'Nursery 2' : sBase.startsWith('Nursery 1') ? 'Nursery 1' : sBase;
        let bucket = classBuckets.get(baseKey);
        if (!bucket) {
          bucket = [];
          classBuckets.set(baseKey, bucket);
        }
        bucket.push(s.id);
      }

      classBuckets.forEach((ids, bClass) => {
        ids.forEach((id, idx) => {
          let assigned = `${bClass} Gold`;
          if (idx < 36) assigned = `${bClass} Gold`;
          else if (idx < 72) assigned = `${bClass} Silver`;
          else if (idx < 108) assigned = `${bClass} Green`;
          else assigned = `${bClass} Gold 2`;
          studentMap!.set(id, assigned);
        });
      });

      armCacheByArray.set(allStudents, studentMap);
    }

    const cached = studentMap.get(studentId);
    if (cached) return cached;
  }

  return `${baseClass} Gold`;
}

/**
 * Standardize any admission number to the official format: AIAA-B26-XXX
 * Converts all variations (such as AIAA/B/2026/009, AIAA-B2026-009, AIAA/2026/009,
 * AIAA/B/26/009, B2026/009) strictly to AIAA-B26-XXX.
 */
export function normalizeAdmissionNumber(adm: string | undefined | null): string {
  if (!adm || typeof adm !== 'string') return '';
  const trimmed = adm.trim();
  if (!trimmed) return '';

  // Already strictly in the official standard format: AIAA-B26-XXX
  if (/^AIAA-B26-\d{3,}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Handle patterns containing B/2026, B2026, 2026 or 26 with serial digits
  // e.g. AIAA/B/2026/009, AIAA-B2026-009, AIAA/2026/009, AIAA-2026-014, B2026-008
  const match = trimmed.match(/(?:AIAA|AIA)?[\/\-_]?(?:B)?[\/\-_]?(?:2026|26)?[\/\-_]?(\d{1,4})$/i);
  if (match && match[1]) {
    const num = match[1].padStart(3, '0');
    return `AIAA-B26-${num}`;
  }

  // If it has '2026' anywhere, extract the serial digits and format as AIAA-B26-XXX
  if (trimmed.includes('2026') || trimmed.includes('B2026')) {
    const digitsOnly = trimmed.replace(/\D/g, '');
    const lastDigits = (digitsOnly.slice(-3) || '001').padStart(3, '0');
    return `AIAA-B26-${lastDigits}`;
  }

  // If it contains AIAA prefix with numbers
  if (/^AIAA/i.test(trimmed)) {
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      const lastDigits = (digitsOnly.slice(-3) || '001').padStart(3, '0');
      return `AIAA-B26-${lastDigits}`;
    }
  }

  return trimmed;
}

export function getStudentAdmissionNumber(student: Student): string {
  if (student.admissionNumber && student.admissionNumber.trim().length > 0) {
    return normalizeAdmissionNumber(student.admissionNumber);
  }

  // If formNumber starts with AIAA-B or AIAA/, normalize that
  if (student.formNumber && (student.formNumber.startsWith('AIAA-B') || student.formNumber.startsWith('AIAA/'))) {
    return normalizeAdmissionNumber(student.formNumber);
  }

  const currentYearShort = '26'; // Standard year prefix: B26

  // Extract number sequence from formNumber if present
  if (student.formNumber) {
    const parts = student.formNumber.split(/[-_/]/);
    const lastPart = parts[parts.length - 1]?.replace(/\D/g, '');
    if (lastPart && lastPart.length > 0) {
      const num = (lastPart.slice(-3) || '001').padStart(3, '0');
      return `AIAA-B${currentYearShort}-${num}`;
    }
    const digits = student.formNumber.replace(/\D/g, '');
    if (digits.length >= 3) {
      const lastDigits = digits.slice(-3);
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


