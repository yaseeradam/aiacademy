'use client';

import AdmissionLetterModal from './AdmissionLetterModal';
import { Student } from '@/types';

interface VerificationSlipModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationSlipModal({ student, isOpen, onClose }: VerificationSlipModalProps) {
  return (
    <AdmissionLetterModal
      student={student}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
