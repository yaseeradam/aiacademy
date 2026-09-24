export interface Parent {
  id: string;
  parentName: string;
  phoneNumber: string; // E.g., '09038863534' or '+1 (555) 019-8372'
}

export type VerificationStatus = 'pending' | 'verified' | 'requires_correction';
export type PaymentStatus = 'pending' | 'paid';

export interface Student {
  id: string;
  parentId: string;
  formNumber: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  intendedClass: string;
  verificationStatus: VerificationStatus;
  correctionNotes?: string;
  
  // Custom fields from form.jpg
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  residentialAddress?: string;
  phone1?: string;
  phone2?: string;
  guardianName?: string;
  guardianAddress?: string;
  nationality?: string;
  religion?: string;
  photo?: string;

  // Admission Letter & Payment Approval fields
  paymentStatus?: PaymentStatus;
  admissionNumber?: string; // e.g. AIAA/2026/001
  academicSession?: string;
  resumptionDate?: string;
  admissionDate?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  action: 'LOGIN' | 'VERIFY' | 'CORRECTION' | 'UPDATE' | 'CREATE' | 'DELETE';
  actor: string; // 'Parent (080...)' or 'Administrator'
  details: string;
  studentId?: string;
  studentName?: string;
}

export interface SchoolSettings {
  schoolName: string;
  motto: string;
  address: string;
  phones: string;
  logo: string;
  geminiApiKey?: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  idNumber: string; // Staff ID Number (e.g. AIA/26/P001)
  section: string;  // e.g. Nursery, Primary, Secondary, Administration, Security, etc.
  classAllocated?: string; // e.g. 'Nursery 1 Gold', 'Basic 1 Silver', or unassigned
  role?: string;    // e.g. Teacher, Director, Head Teacher
  bankName?: string;
  accountNumber?: string;
  salary?: string;
  createdAt?: string;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  title?: string;
  type: 'rating_5' | 'single_choice' | 'nps_10' | 'text';
  options?: string[];
  category?: string;
  required?: boolean;
}

export interface SurveyConfig {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  term?: string;
  session?: string;
  questions: SurveyQuestion[];
  updatedAt?: string;
}

export interface SurveyResponse {
  id: string;
  parentPhone: string;
  parentName?: string;
  studentNames?: string[];
  classes?: string[];
  answers: Record<string, string | number>;
  submittedAt: string;
  term?: string;
  session?: string;
}
