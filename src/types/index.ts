export interface Parent {
  id: string;
  parentName: string;
  phoneNumber: string; // E.g., '09038863534' or '+1 (555) 019-8372'
}

export type VerificationStatus = 'pending' | 'verified' | 'requires_correction';

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
}
