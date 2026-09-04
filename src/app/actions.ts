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
} from '@/lib/db';
import { Student, Parent, SchoolSettings } from '@/types';

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

export async function confirmStudentAction(studentId: string) {
  const student = await getStudentById(studentId);
  const success = await updateStudentStatus(studentId, 'verified');
  if (!success) {
    throw new Error('Failed to update student status');
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

export async function submitCorrectionAction(studentId: string, notes: string) {
  const student = await getStudentById(studentId);
  const success = await updateStudentStatus(studentId, 'requires_correction', notes);
  if (!success) {
    throw new Error('Failed to submit correction');
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

export async function adminVerifyAction(studentId: string) {
  const student = await getStudentById(studentId);
  const success = await updateStudentStatus(studentId, 'verified', '');
  if (!success) {
    throw new Error('Failed to verify student');
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

export async function adminTogglePaymentStatusAction(studentId: string, paymentStatus: 'paid' | 'pending') {
  const student = await getStudentById(studentId);
  if (!student) {
    return { error: 'Student not found.' };
  }

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentYear = new Date().getFullYear();

  // Generate admission number if approving and not already assigned
  let admissionNumber = student.admissionNumber;
  if (paymentStatus === 'paid' && !admissionNumber) {
    const allStudents = await getAllStudents();
    // Determine section prefix based on class
    const isNursery = (student.intendedClass || '').toLowerCase().includes('nursery');
    const sectionPrefix = isNursery ? 'N' : 'B';
    // Find max numeric suffix among existing admission numbers in the same section
    const sectionPattern = `AIAA/${sectionPrefix}/`;
    let maxNum = 0;
    allStudents.forEach(s => {
      if (s.admissionNumber && s.admissionNumber.startsWith(sectionPattern) && s.id !== studentId) {
        const parts = s.admissionNumber.split('/');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = String(maxNum + 1).padStart(3, '0');
    admissionNumber = `AIAA/${sectionPrefix}/${currentYear}/${nextNum}`;
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
) {
  const student = await getStudentById(studentId);
  if (!student) {
    return { error: 'Student not found.' };
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

export async function adminDeleteStudentAction(studentId: string) {
  const student = await getStudentById(studentId);
  const deleted = await deleteStudent(studentId);
  if (!deleted) {
    return { error: 'Student not found.' };
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

export async function checkDuplicateStudentAction(studentData: Partial<Student>): Promise<{ duplicate: boolean; existingStudent?: Student }> {
  const existing = await findDuplicateStudent(studentData);
  if (existing) {
    return { duplicate: true, existingStudent: existing };
  }
  return { duplicate: false };
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

  const newId = `stud-${Date.now()}`;
  const newStudent: Student = {
    id: newId,
    parentId: studentData.parentId || '',
    ...studentData,
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

export async function updateStudentPhotoAction(studentId: string, photoBase64: string) {
  const student = await getStudentById(studentId);
  if (!student) {
    return { error: 'Student not found.' };
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
