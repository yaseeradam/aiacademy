import { Student } from '@/types';

export function getStudentClassArm(cls: string | undefined, studentId?: string, allStudents?: Student[]): string {
  if (!cls) return 'Nursery 1 Gold';
  const trimmed = cls.trim();

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
    // 1. Count how many EXPLICIT students exist for each arm in this baseClass
    const explicitGoldCount = allStudents.filter(s => s.intendedClass && s.intendedClass.trim() === `${baseClass} Gold`).length;
    const explicitSilverCount = allStudents.filter(s => s.intendedClass && s.intendedClass.trim() === `${baseClass} Silver`).length;
    const explicitGreenCount = allStudents.filter(s => s.intendedClass && s.intendedClass.trim() === `${baseClass} Green`).length;
    const explicitGold2Count = allStudents.filter(s => s.intendedClass && s.intendedClass.trim() === `${baseClass} Gold 2`).length;
    const explicitSilver2Count = allStudents.filter(s => s.intendedClass && s.intendedClass.trim() === `${baseClass} Silver 2`).length;

    // 2. Calculate remaining available capacity slots per arm for bare records (max 35 total per arm)
    const goldSlots = Math.max(0, 35 - explicitGoldCount);
    const silverSlots = Math.max(0, 35 - explicitSilverCount);
    const greenSlots = Math.max(0, 35 - explicitGreenCount);
    const gold2Slots = Math.max(0, 35 - explicitGold2Count);
    const silver2Slots = Math.max(0, 35 - explicitSilver2Count);

    const goldCutoff = goldSlots;
    const silverCutoff = goldCutoff + silverSlots;
    const greenCutoff = silverCutoff + greenSlots;
    const gold2Cutoff = greenCutoff + gold2Slots;
    const silver2Cutoff = gold2Cutoff + silver2Slots;

    // 3. Get list of bare students for this baseClass
    const bareClassStudents = allStudents
      .filter(s => {
        if (!s.intendedClass) return baseClass === 'Nursery 1';
        const sTrim = s.intendedClass.trim();
        if (sTrim.includes('Unassigned') || sTrim.includes('Gold') || sTrim.includes('Silver') || sTrim.includes('Green')) return false;
        let sBase = 'Nursery 1';
        if (/Basic 2|Primary 2/i.test(sTrim)) sBase = 'Basic 2';
        else if (/Basic 1|Primary 1/i.test(sTrim)) sBase = 'Basic 1';
        else if (/Nursery/i.test(sTrim)) sBase = 'Nursery 1';
        return sBase === baseClass;
      })
      .sort((a, b) => (a.formNumber || a.id).localeCompare(b.formNumber || b.id));

    const idx = bareClassStudents.findIndex(s => s.id === studentId);
    if (idx >= 0) {
      if (idx < goldCutoff) return `${baseClass} Gold`;
      if (idx < silverCutoff) return `${baseClass} Silver`;
      if (idx < greenCutoff) return `${baseClass} Green`;
      if (idx < gold2Cutoff) return `${baseClass} Gold 2`;
      if (idx < silver2Cutoff) return `${baseClass} Silver 2`;
      return `${baseClass} Green 2`;
    }
  }

  return `${baseClass} Gold`;
}
