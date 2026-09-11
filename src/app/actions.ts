'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getParentByPhone,
  getParentById,
  getStudentsByParentId,
  updateStudentStatus,
  getStudentById,
  addOrUpdateStudent,
  addOrUpdateParent,
  getAllStudents,
  deleteStudent,
  normalizePhone,
  addAuditLog,
  getAuditLogs,
  findDuplicateStudent,
  getStudentByFormNumber,
  getSchoolSettings,
  updateSchoolSettings,
  restoreMissingSeedStudents,
  clearAllStudentsAndParents,
  getNextAdmissionSequence,
  bulkDeleteStudents,
  getStudentsByIds,
  bulkUpdateStudentClasses,
  fixDuplicateAndMissingAdmissionNumbers,
} from '@/lib/db';
import { Student, Parent, SchoolSettings } from '@/types';
import { getStudentClassArm, getStudentAdmissionNumber } from '@/lib/classUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Parent Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const phone = formData.get('phone')?.toString().trim();

  if (!phone) {
    return { error: 'Please enter a valid phone number.' };
  }

  // Admin shortcut — type "admin" in the phone field
  if (phone.toLowerCase() === 'admin') {
    const cookieStore = await cookies();
    cookieStore.set('parent_phone', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
    });
    await addAuditLog({
      action: 'LOGIN',
      actor: 'School Administrator',
      details: 'Logged into Admin Control Portal',
    });
    redirect('/dashboard');
  }

  const parent = await getParentByPhone(phone);

  if (!parent) {
    return {
      error: 'Phone number not found. Please contact the school administration.',
    };
  }

  const cookieStore = await cookies();
  cookieStore.set('parent_phone', parent.phoneNumber, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 day
  });

  await addAuditLog({
    action: 'LOGIN',
    actor: `Parent (${parent.phoneNumber})`,
    details: `Parent ${parent.parentName} logged into Parent Portal`,
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('parent_phone');
  redirect('/');
}

export async function confirmStudentAction(studentId: string): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  const success = await updateStudentStatus(studentId, 'verified');
  if (!success) {
    return { success: false, error: 'Failed to update student verification status.' };
  }
  const studentName = student ? `${student.firstName} ${student.lastName}` : studentId;
  await addAuditLog({
    action: 'VERIFY',
    actor: 'Parent',
    details: `Confirmed student details as correct`,
    studentId,
    studentName,
  });
  return { success: true };
}

export async function submitCorrectionAction(studentId: string, notes: string): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  const success = await updateStudentStatus(studentId, 'requires_correction', notes);
  if (!success) {
    return { success: false, error: 'Failed to submit correction request.' };
  }
  const studentName = student ? `${student.firstName} ${student.lastName}` : studentId;
  await addAuditLog({
    action: 'CORRECTION',
    actor: 'Parent',
    details: `Submitted correction request: "${notes}"`,
    studentId,
    studentName,
  });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function adminVerifyAction(studentId: string): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  const success = await updateStudentStatus(studentId, 'verified', '');
  if (!success) {
    return { success: false, error: 'Student not found or failed to update verification status.' };
  }
  const studentName = student ? `${student.firstName} ${student.lastName}` : studentId;
  await addAuditLog({
    action: 'VERIFY',
    actor: 'School Administrator',
    details: `Admin verified student profile details`,
    studentId,
    studentName,
  });
  return { success: true };
}

export async function adminTogglePaymentStatusAction(studentId: string, paymentStatus: 'paid' | 'pending'): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  if (!student) {
    return { success: false, error: 'Student not found.' };
  }

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentYear = new Date().getFullYear();

  // Fix #5: Generate admission number atomically to prevent race-condition duplicates
  let admissionNumber = student.admissionNumber;
  if (paymentStatus === 'paid' && !admissionNumber) {
    const currentYearShort = currentYear.toString().slice(-2); // e.g. '26'
    const seq = await getNextAdmissionSequence(currentYearShort);
    const nextNum = String(seq).padStart(3, '0');
    admissionNumber = `AIAA-B${currentYearShort}-${nextNum}`;
  }

  const updatedStudent: Student = {
    ...student,
    paymentStatus,
    admissionNumber: paymentStatus === 'paid' ? admissionNumber : student.admissionNumber,
    admissionDate: student.admissionDate || todayStr,
    academicSession: student.academicSession || `${currentYear}/${currentYear + 1}`,
    resumptionDate: student.resumptionDate || '14th September, 2026',
  };

  await addOrUpdateStudent(updatedStudent);

  const studentName = `${student.firstName} ${student.lastName}`;
  await addAuditLog({
    action: 'UPDATE',
    actor: 'School Administrator',
    details: `Admin ${paymentStatus === 'paid' ? 'marked payment as PAID & approved admission letter' : 'set payment status to PENDING'} for student`,
    studentId,
    studentName,
  });

  return { success: true };
}

export async function adminUpdateStudentAction(
  studentId: string,
  updatedFields: Partial<Student>
): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  if (!student) {
    return { success: false, error: 'Student not found.' };
  }

  // If class is being changed or updated, resolve auto subgroup for the new class (excluding this student from capacity count)
  if (updatedFields.intendedClass && updatedFields.intendedClass !== student.intendedClass) {
    const allStudents = await getAllStudents();
    const otherStudents = allStudents.filter(s => s.id !== studentId);
    const resolvedClass = await resolveAutoSubgroup(updatedFields.intendedClass, otherStudents);
    updatedFields.intendedClass = resolvedClass;
  }

  const updatedStudent: Student = {
    ...student,
    ...updatedFields,
  };

  const newPhone = updatedFields.phone1 || '';

  const currentParentId = student.parentId;
  const parent = currentParentId ? await getParentById(currentParentId) : undefined;
  
  const parentPhone = parent ? parent.phoneNumber : '';
  const isOutOfSync = !parent || normalizePhone(parentPhone) !== normalizePhone(newPhone);

  if (isOutOfSync) {
    if (newPhone) {
      const existingParent = await getParentByPhone(newPhone);
      if (existingParent) {
        updatedStudent.parentId = existingParent.id;
      } else {
        if (currentParentId && parent) {
          // Update the parent's phone number and name
          const updatedParent: Parent = {
            ...parent,
            phoneNumber: newPhone,
            parentName: updatedFields.fatherName || updatedFields.guardianName || parent.parentName,
          };
          await addOrUpdateParent(updatedParent);
          updatedStudent.parentId = currentParentId;

          // Sync all sibling students' phone1 fields to the new parent phone
          const siblingStudents = await getStudentsByParentId(currentParentId);
          for (const sibling of siblingStudents) {
            if (sibling.id !== studentId) {
              const updatedSibling: Student = {
                ...sibling,
                phone1: newPhone,
              };
              await addOrUpdateStudent(updatedSibling);
            }
          }
        } else {
          const newParentId = `parent-${Date.now()}`;
          const newParent: Parent = {
            id: newParentId,
            parentName: updatedFields.fatherName || updatedFields.guardianName || student.fatherName || student.guardianName || 'Unknown',
            phoneNumber: newPhone,
          };
          await addOrUpdateParent(newParent);
          updatedStudent.parentId = newParentId;
        }
      }
    }
  }

  await addOrUpdateStudent(updatedStudent);

  const studentName = `${updatedStudent.firstName} ${updatedStudent.lastName}`;
  await addAuditLog({
    action: 'UPDATE',
    actor: 'School Administrator',
    details: `Admin updated student profile and phone details`,
    studentId,
    studentName,
  });

  return { success: true };
}

export async function adminDeleteStudentAction(studentId: string): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  const deleted = await deleteStudent(studentId);
  if (!deleted) {
    return { success: false, error: 'Student not found.' };
  }
  const studentName = student ? `${student.firstName} ${student.lastName}` : studentId;
  await addAuditLog({
    action: 'DELETE',
    actor: 'School Administrator',
    details: `Admin deleted student record`,
    studentId,
    studentName,
  });
  return { success: true };
}

export async function adminDeleteMultipleStudentsAction(studentIds: string[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Fetch all students in a single query for audit log names
    const students = await getStudentsByIds(studentIds);
    const nameMap = new Map(students.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

    // Delete all in a single deleteMany call
    const deletedCount = await bulkDeleteStudents(studentIds);

    // Write all audit logs in parallel
    await Promise.all(
      studentIds.map(id =>
        addAuditLog({
          action: 'DELETE',
          actor: 'School Administrator',
          details: `Admin bulk-removed student record from subclass`,
          studentId: id,
          studentName: nameMap.get(id) ?? id,
        })
      )
    );

    return { success: true, count: deletedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete students.';
    return { success: false, count: 0, error: msg };
  }
}

// Fix #20: Shared base-class resolver — eliminates 30 lines of duplication
function resolveBaseClass(cls: string | undefined): string {
  const trimmed = (cls || '').trim();
  if (/Basic 2|Primary 2/i.test(trimmed)) return 'Basic 2';
  if (/Basic 1|Primary 1/i.test(trimmed)) return 'Basic 1';
  if (/Nursery/i.test(trimmed)) return 'Nursery 1';
  const stripped = trimmed
    .replace(/\s+(Gold|Silver|Green|Blue|Diamond)(\s+\d+)?/gi, '')
    .replace(/\(Unassigned\)/gi, '')
    .trim();
  return stripped || 'Nursery 1';
}

export async function unassignStudentFromSubclassAction(studentId: string): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  if (!student) return { success: false, error: 'Student not found.' };

  const baseClass = resolveBaseClass(student.intendedClass);

  await addOrUpdateStudent({
    ...student,
    intendedClass: `${baseClass} (Unassigned)`,
  });

  const studentName = `${student.firstName} ${student.lastName}`;
  await addAuditLog({
    action: 'UPDATE',
    actor: 'School Administrator',
    details: `Admin unassigned student from subclass arm back to base class ${baseClass} (Unassigned)`,
    studentId,
    studentName,
  });

  return { success: true };
}

export async function unassignMultipleStudentsFromSubclassAction(studentIds: string[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Fetch all students in one round-trip
    const students = await getStudentsByIds(studentIds);

    // Prepare updates (each student may resolve to a different base class)
    const updates = students.map(s => ({
      id: s.id,
      intendedClass: `${resolveBaseClass(s.intendedClass)} (Unassigned)`,
    }));

    // Apply all updates in a single bulkWrite
    const count = await bulkUpdateStudentClasses(updates);

    return { success: true, count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to unassign students.';
    return { success: false, count: 0, error: msg };
  }
}

export async function assignMultipleStudentsToSubclassAction(
  studentIds: string[],
  targetArm: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Fetch all student names in one round-trip for audit logs
    const students = await getStudentsByIds(studentIds);
    const nameMap = new Map(students.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

    // All targets get the same class — use bulkWrite in a single call
    const updates = studentIds.map(id => ({ id, intendedClass: targetArm }));
    const count = await bulkUpdateStudentClasses(updates);

    // Write all audit logs in parallel
    await Promise.all(
      studentIds.map(id =>
        addAuditLog({
          action: 'UPDATE',
          actor: 'School Administrator',
          details: `Admin assigned student to subclass arm ${targetArm}`,
          studentId: id,
          studentName: nameMap.get(id) ?? id,
        })
      )
    );

    return { success: true, count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to assign students to subclass.';
    return { success: false, count: 0, error: msg };
  }
}

export async function restoreMissingSeedStudentsAction(): Promise<{ success: boolean; restoredCount: number; error?: string }> {
  try {
    const count = await restoreMissingSeedStudents();
    await addAuditLog({
      action: 'UPDATE',
      actor: 'School Administrator',
      details: `Admin restored ${count} missing initial student records`,
    });
    return { success: true, restoredCount: count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to restore seed data.';
    return { success: false, restoredCount: 0, error: msg };
  }
}

export async function clearAllDatabaseDataAction(): Promise<{ success: boolean; studentCount: number; parentCount: number; error?: string }> {
  try {
    const res = await clearAllStudentsAndParents();
    await addAuditLog({
      action: 'DELETE',
      actor: 'School Administrator',
      details: `Admin cleared all initial database seed records (${res.studentCount} students removed)`,
    });
    return { success: true, ...res };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear database data.';
    return { success: false, studentCount: 0, parentCount: 0, error: msg };
  }
}


export interface DuplicateGroup {
  reason: string;
  key: string;
  students: Student[];
  confidence?: number;       // 0-100 AI confidence score (only for AI-detected groups)
  aiExplanation?: string;    // AI reasoning for the match
}

export async function checkDuplicateStudentAction(studentData: Partial<Student>): Promise<{ duplicate: boolean; existingStudent?: Student }> {
  const existing = await findDuplicateStudent(studentData);
  if (existing) {
    return { duplicate: true, existingStudent: existing };
  }
  return { duplicate: false };
}

// ── Groq AI Fuzzy Duplicate Detection ───────────────────────────────────────

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

interface AIMatchPair {
  id1: string;
  id2: string;
  confidence: number;
  reason: string;
}

async function detectFuzzyDuplicatesWithAI(
  students: Student[],
  alreadyGroupedIds: Set<string>
): Promise<DuplicateGroup[]> {
  if (!GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not set — skipping AI duplicate detection');
    return [];
  }
  if (students.length < 2) return [];

  // Build a compact list of student names + ids for the AI
  // Filter out students already caught by exact matching to reduce noise
  const candidateStudents = students.filter(s => {
    const firstName = (s.firstName || '').trim();
    const lastName = (s.lastName || '').trim();
    return firstName.length > 0 || lastName.length > 0;
  });

  if (candidateStudents.length < 2) return [];

  // Build the student list for the AI prompt (id, firstName, lastName, class)
  const studentList = candidateStudents.map(s => ({
    id: s.id,
    firstName: (s.firstName || '').trim(),
    lastName: (s.lastName || '').trim(),
    class: s.intendedClass || ''
  }));

  const prompt = `You are a strict duplicate student name detector for a school database. Your job is to find students who are likely the SAME PERSON registered more than once, but with different spellings, casing, typos, or name order.

IMPORTANT RULES:
- Compare ALL names against each other for similarity
- Detect: typos (Mussa vs Musa), transliteration variants (Muhammad vs Mohammed vs Muhd), swapped first/last names (Ibrahim Musa vs Musa Ibrahim), missing/extra letters (Abdullahi vs Abdulahi), mixed casing (IBRAHIM vs Ibrahim)
- Do NOT flag family members (siblings in different classes with different first names) as duplicates
- Only flag pairs where you are ≥70% confident they are the SAME person
- If two students have identical or near-identical names but are in very different class levels (e.g., Nursery 1 vs Basic 2), lower your confidence slightly but still flag if names are very similar
- Return ONLY a JSON array. No markdown, no explanation outside JSON.

Student records:
${JSON.stringify(studentList)}

Return a JSON array of duplicate pairs found. Each object must have:
- "id1": first student id
- "id2": second student id  
- "confidence": number 70-100
- "reason": brief explanation (max 15 words)

If no fuzzy duplicates found, return: []

Return ONLY valid JSON array, nothing else.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a precise duplicate name detection system. You output ONLY valid JSON arrays. No markdown fences, no extra text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      console.error(`Groq API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || '[]';
    
    // Parse AI response — handle both direct arrays and wrapped objects
    let pairs: AIMatchPair[] = [];
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        pairs = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // AI might wrap in an object like { "duplicates": [...] } or { "pairs": [...] }
        const firstArrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (firstArrayKey) {
          pairs = parsed[firstArrayKey];
        }
      }
    } catch (parseErr) {
      // Try to extract JSON array from the raw text
      const arrayMatch = rawContent.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          pairs = JSON.parse(arrayMatch[0]);
        } catch {
          console.error('Groq AI: Could not parse response:', rawContent.substring(0, 300));
          return [];
        }
      } else {
        console.error('Groq AI: No JSON array in response:', rawContent.substring(0, 300));
        return [];
      }
    }

    // Validate and filter pairs
    const validPairs = pairs.filter(p =>
      p && typeof p.id1 === 'string' && typeof p.id2 === 'string' &&
      typeof p.confidence === 'number' && p.confidence >= 70 &&
      p.id1 !== p.id2
    );

    // Convert pairs to DuplicateGroup objects
    const studentMap = new Map<string, Student>();
    students.forEach(s => studentMap.set(s.id, s));

    const aiGroups: DuplicateGroup[] = [];
    const processedPairKeys = new Set<string>();

    for (const pair of validPairs) {
      const s1 = studentMap.get(pair.id1);
      const s2 = studentMap.get(pair.id2);
      if (!s1 || !s2) continue;

      // Skip if BOTH students are already in an exact-match group together
      if (alreadyGroupedIds.has(pair.id1) && alreadyGroupedIds.has(pair.id2)) continue;

      // Deduplicate: don't create two groups for the same pair
      const pairKey = [pair.id1, pair.id2].sort().join('|');
      if (processedPairKeys.has(pairKey)) continue;
      processedPairKeys.add(pairKey);

      const displayName = `${s1.firstName} ${s1.lastName || ''} ↔ ${s2.firstName} ${s2.lastName || ''}`.trim();
      aiGroups.push({
        reason: '🧠 AI-Detected Similar Name',
        key: displayName,
        students: [s1, s2],
        confidence: Math.round(pair.confidence),
        aiExplanation: pair.reason || 'Names are similar — possible duplicate entry'
      });
    }

    return aiGroups;
  } catch (err) {
    console.error('Groq AI duplicate detection failed (graceful fallback):', err);
    return [];
  }
}

// ── Main Duplicate Detection Action ─────────────────────────────────────────

export async function findDuplicateStudentsAction(): Promise<{ success: boolean; duplicateGroups: DuplicateGroup[] }> {
  const allStudents = await getAllStudents();
  const groups: DuplicateGroup[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Exact-match checks (instant, no AI needed)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Group by Form Number
  const formMap = new Map<string, Student[]>();
  allStudents.forEach(s => {
    if (!s.formNumber) return;
    const key = s.formNumber.trim().toLowerCase();
    if (!formMap.has(key)) formMap.set(key, []);
    formMap.get(key)!.push(s);
  });

  formMap.forEach((students) => {
    if (students.length > 1) {
      groups.push({
        reason: 'Duplicate Form / Serial Number',
        key: students[0].formNumber,
        students
      });
    }
  });

  // 2. Group by Full Name (Detect Same Student Name — case-insensitive)
  const nameMap = new Map<string, Student[]>();
  allStudents.forEach(s => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!fullName || fullName.length < 2) return;
    if (!nameMap.has(fullName)) nameMap.set(fullName, []);
    nameMap.get(fullName)!.push(s);
  });

  nameMap.forEach((students) => {
    if (students.length > 1) {
      const alreadyInFormGroup = groups.some(g => g.reason === 'Duplicate Form / Serial Number' && g.students.some(s => s.id === students[0].id));
      if (!alreadyInFormGroup) {
        const formattedName = `${students[0].firstName} ${students[0].lastName || ''}`.trim();
        groups.push({
          reason: 'Duplicate Student Name',
          key: formattedName,
          students
        });
      }
    }
  });

  // 3. Group by Admission Number (check both saved and computed admission numbers)
  const admMap = new Map<string, Student[]>();
  allStudents.forEach(s => {
    const admNo = getStudentAdmissionNumber(s);
    if (!admNo) return;
    const key = admNo.trim().toLowerCase();
    if (!admMap.has(key)) admMap.set(key, []);
    admMap.get(key)!.push(s);
  });

  admMap.forEach((students) => {
    if (students.length > 1) {
      const alreadyInGroup = groups.some(g => g.students.some(s => s.id === students[0].id));
      if (!alreadyInGroup) {
        const admNo = getStudentAdmissionNumber(students[0]);
        groups.push({
          reason: 'Duplicate Official Admission Number',
          key: admNo,
          students
        });
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: AI-powered fuzzy matching via Groq (catches typos, variants)
  // ═══════════════════════════════════════════════════════════════════════════

  // Collect IDs already grouped by Phase 1 so AI can deprioritize them
  const alreadyGroupedIds = new Set<string>();
  groups.forEach(g => g.students.forEach(s => alreadyGroupedIds.add(s.id)));

  try {
    const aiGroups = await detectFuzzyDuplicatesWithAI(allStudents, alreadyGroupedIds);
    groups.push(...aiGroups);
  } catch (err) {
    // Phase 2 failure should never break Phase 1 results
    console.error('AI Phase 2 duplicate detection error (non-fatal):', err);
  }

  return { success: true, duplicateGroups: groups };
}

export async function resolveAutoSubgroup(requestedClass: string, allStudents: Student[]): Promise<string> {
  let targetBase = 'Nursery 1';
  if (/Basic 2|Primary 2/i.test(requestedClass)) targetBase = 'Basic 2';
  else if (/Basic 1|Primary 1/i.test(requestedClass)) targetBase = 'Basic 1';
  else if (/Nursery/i.test(requestedClass)) targetBase = 'Nursery 1';

  // If exact subgroup specified and it has space (< 36), check true resolved count
  if (requestedClass.includes('Gold') || requestedClass.includes('Silver') || requestedClass.includes('Green')) {
    const exactCount = allStudents.filter(s => getStudentClassArm(s.intendedClass, s.id, allStudents) === requestedClass).length;
    if (exactCount < 36) {
      return requestedClass;
    }
  }

  // Find first available arm with < 36 students using getStudentClassArm
  const arms = ['Gold', 'Silver', 'Green', 'Gold 2', 'Silver 2', 'Green 2', 'Gold 3', 'Silver 3', 'Green 3'];
  for (const arm of arms) {
    const candidate = `${targetBase} ${arm}`;
    const count = allStudents.filter(s => getStudentClassArm(s.intendedClass, s.id, allStudents) === candidate).length;
    if (count < 36) {
      return candidate;
    }
  }

  // Fix #8: All arms are full — surface an error instead of silently overflowing
  throw new Error(
    `All subclass arms for ${targetBase} are at full capacity (36 students each). ` +
    `Please create a new arm or increase capacity before adding more students.`
  );
}

export async function adminCreateStudentAction(studentData: Omit<Student, 'id' | 'parentId'> & { parentId?: string }): Promise<{ success: boolean; id?: string; error?: string; existingStudent?: Student }> {
  // Check for duplicates before creation
  const duplicate = await findDuplicateStudent(studentData);
  if (duplicate) {
    return {
      success: false,
      error: `Duplicate student detected! A record for "${duplicate.firstName} ${duplicate.lastName}" (Form No: ${duplicate.formNumber}) already exists in Class ${duplicate.intendedClass}.`,
      existingStudent: duplicate,
    };
  }

  const allStudents = await getAllStudents();

  // Automatically resolve class subgroup to next available arm with space (< 30)
  const requestedClass = studentData.intendedClass || 'Nursery 1 Gold';
  const resolvedClass = await resolveAutoSubgroup(requestedClass, allStudents);
  studentData.intendedClass = resolvedClass;

  const newId = `stud-${Date.now()}`;
  
  // Ensure new student receives a unique admission number if not provided
  let admissionNumber = studentData.admissionNumber;
  if (!admissionNumber) {
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const seq = await getNextAdmissionSequence(currentYearShort);
    const nextNum = String(seq).padStart(3, '0');
    admissionNumber = `AIAA-B${currentYearShort}-${nextNum}`;
  }

  const newStudent: Student = {
    id: newId,
    parentId: studentData.parentId || '',
    ...studentData,
    admissionNumber,
    verificationStatus: studentData.verificationStatus || 'pending',
  };

  // Ensure parent exists for the phone number
  const phone = studentData.phone1 || '';
  let parent = phone ? await getParentByPhone(phone) : undefined;

  if (!parent && phone) {
    const parentId = `parent-${Date.now()}`;
    parent = {
      id: parentId,
      parentName: studentData.fatherName || studentData.guardianName || 'Unknown',
      phoneNumber: phone,
    };
    await addOrUpdateParent(parent);
    newStudent.parentId = parentId;
  } else if (parent) {
    newStudent.parentId = parent.id;
  }

  await addOrUpdateStudent(newStudent);

  const studentName = `${newStudent.firstName} ${newStudent.lastName}`;
  await addAuditLog({
    action: 'CREATE',
    actor: 'School Administrator',
    details: `Admin registered new student record`,
    studentId: newId,
    studentName,
  });

  return { success: true, id: newId };
}

export async function updateStudentPhotoAction(studentId: string, photoBase64: string): Promise<{ success: boolean; error?: string }> {
  const student = await getStudentById(studentId);
  if (!student) {
    return { success: false, error: 'Student not found.' };
  }

  const updatedStudent: Student = {
    ...student,
    photo: photoBase64,
  };

  await addOrUpdateStudent(updatedStudent);

  const studentName = `${student.firstName} ${student.lastName}`;
  await addAuditLog({
    action: 'UPDATE',
    actor: 'School Administrator',
    details: `Admin updated photo for student`,
    studentId,
    studentName,
  });

  return { success: true };
}

export async function getAuditLogsAction(limit = 50) {
  const logs = await getAuditLogs(limit);
  return { success: true, logs };
}

export async function scanAdmissionFormOCRAction(base64Image: string) {
  const settings = await getSchoolSettings();
  const FALLBACK_KEY = 'AIzaSyCjanwN_cuYywnxmiglsv3VM5UaXIpOoM8';
  const primaryKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  // Updated to current Gemini models (2025-2026)
  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  ];

  const prompt = `You are an expert OCR engine specializing in handwritten school admission forms.
Examine this handwritten admission form image from AI Integrated Academy Argungu.
Extract ONLY the handwritten blue/black ink answers written in the form fields.
Ignore printed form labels (like "1. Name of Student:", "2. Date of Birth:", "Father's Name:") and Arabic subtitles.

Return ONLY a valid JSON object matching this schema:
{
  "firstName": "string (student's first name, e.g. HAFSAT)",
  "lastName": "string (student's middle/surname, e.g. HARUNA HANZALA)",
  "dateOfBirth": "string (e.g. 14/11/2021)",
  "gender": "Male or Female (detect tick mark ✓ in checkboxes)",
  "fatherName": "string (e.g. HARUNA ABUBAKAR)",
  "motherName": "string (e.g. SAMANIYYA MUSTAPHA)",
  "residentialAddress": "string (e.g. UNGUWAR MALAMAI ARGUNGU)",
  "phone1": "string (e.g. 08100423094)",
  "phone2": "string (e.g. 09063683651)",
  "guardianName": "string (e.g. HASSAN GARBA)",
  "guardianAddress": "string (e.g. BAKIN KASUWA AREA ARGUNGU)",
  "nationality": "string (e.g. NIGERIA)",
  "religion": "string (e.g. ISLAM)",
  "intendedClass": "string (e.g. NURSERY)"
}`;

  // Build list of keys to try: primary first (if valid), then fallback
  const keysToTry: string[] = [];
  if (primaryKey && !primaryKey.startsWith('AQ.') && primaryKey !== FALLBACK_KEY) {
    keysToTry.push(primaryKey);
  }
  keysToTry.push(FALLBACK_KEY);

  let lastError = 'No output from Gemini Vision AI.';

  for (const apiKey of keysToTry) {
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(
          `${endpoint}?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data,
                      },
                    },
                    { text: prompt },
                  ],
                },
              ],
            }),
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          const errBody = await response.text();
          console.error(`Gemini OCR [${response.status}] (${endpoint}):`, errBody.substring(0, 200));
          lastError = `API error ${response.status}`;
          continue;
        }

        const data = await response.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textOutput) {
          const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return { success: true, data: parsed };
          }
        }

        if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
          lastError = 'Image was blocked by safety filters. Please try a clearer photo.';
        } else if (data?.error?.message) {
          lastError = data.error.message;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Gemini Vision OCR Error (${endpoint}):`, errMsg);
        if (errMsg.includes('aborted')) {
          lastError = 'Request timed out. Please check your internet connection and try again.';
        } else {
          lastError = errMsg;
        }
      }
    }
  }

  return { error: lastError };
}

export async function publicVerifyStudentAction(formNumber: string): Promise<{ success: boolean; student?: Student; error?: string }> {
  const student = await getStudentByFormNumber(formNumber);
  if (!student) {
    return { success: false, error: `No student enrollment record found for Form Serial No: "${formNumber}".` };
  }
  return { success: true, student };
}

export async function getSchoolSettingsAction(): Promise<SchoolSettings> {
  return await getSchoolSettings();
}

export async function updateSchoolSettingsAction(settings: SchoolSettings): Promise<{ success: boolean; error?: string }> {
  try {
    await updateSchoolSettings(settings);
    await addAuditLog({
      action: 'UPDATE',
      actor: 'Administrator',
      details: 'Updated global school settings and custom logo.',
    });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update settings';
    return { success: false, error: msg };
  }
}

export async function fixDuplicateAdmissionNumbersAction(): Promise<{
  success: boolean;
  fixedCount: number;
  details: string;
  error?: string;
}> {
  try {
    const res = await fixDuplicateAndMissingAdmissionNumbers();
    if (res.fixedCount > 0) {
      await addAuditLog({
        action: 'UPDATE',
        actor: 'School Administrator',
        details: `Reassigned unique admission numbers to ${res.fixedCount} students to resolve duplicates`,
      });
    }
    return {
      success: true,
      fixedCount: res.fixedCount,
      details: res.fixedCount > 0
        ? `Fixed ${res.fixedCount} duplicate/missing admission numbers: ${res.updatedStudents.map(s => `${s.name} (${s.oldAdm} ➔ ${s.newAdm})`).join(', ')}`
        : 'All students already have unique admission numbers. No changes needed.'
    };
  } catch (err: unknown) {
    return {
      success: false,
      fixedCount: 0,
      details: '',
      error: err instanceof Error ? err.message : 'Failed to fix admission numbers'
    };
  }
}
