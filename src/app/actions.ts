'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getParentByPhone,
  updateStudentStatus,
  getAllStudents,
  getStudentById,
  addOrUpdateStudent,
  addOrUpdateParent,
  deleteStudent,
  normalizePhone,
} from '@/lib/db';
import { Student, Parent, VerificationStatus } from '@/types';

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

  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('parent_phone');
  redirect('/');
}

export async function confirmStudentAction(studentId: string) {
  const success = await updateStudentStatus(studentId, 'verified');
  if (!success) {
    throw new Error('Failed to update student status');
  }
  return { success: true };
}

export async function submitCorrectionAction(studentId: string, notes: string) {
  const success = await updateStudentStatus(studentId, 'requires_correction', notes);
  if (!success) {
    throw new Error('Failed to submit correction');
  }
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function adminVerifyAction(studentId: string) {
  const success = await updateStudentStatus(studentId, 'verified', '');
  if (!success) {
    throw new Error('Failed to verify student');
  }
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

  await addOrUpdateStudent(updatedStudent);
  return { success: true };
}

export async function adminDeleteStudentAction(studentId: string) {
  const deleted = await deleteStudent(studentId);
  if (!deleted) {
    return { error: 'Student not found.' };
  }
  return { success: true };
}

export async function adminCreateStudentAction(studentData: Omit<Student, 'id' | 'parentId'> & { parentId?: string }): Promise<{ success: boolean; id?: string; error?: string }> {
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
  return { success: true };
}
