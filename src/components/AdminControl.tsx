'use client';

import { useState, useEffect, useMemo } from 'react';
import { Student, AuditLog } from '@/types';
import { useRouter } from 'next/navigation';
import { createWorker } from 'tesseract.js';
import JSZip from 'jszip';
import { 
  Upload, Download, Search, RefreshCw, 
  Users, Clock, AlertOctagon, HelpCircle, 
  ShieldCheck, ChevronRight, ChevronDown, X, Menu,
  Grid, Settings, Plus, LogOut, Trash2, Save, BookOpen,
  Loader2, Scan, History, MessageSquare, Camera, FileText, CheckCircle2, CreditCard, Printer,
  GraduationCap, Folder, FolderOpen, Edit3
} from 'lucide-react';
import { logoutAction, adminUpdateStudentAction, adminDeleteStudentAction, adminCreateStudentAction, adminVerifyAction, adminTogglePaymentStatusAction, getAuditLogsAction, scanAdmissionFormOCRAction, getSchoolSettingsAction, updateSchoolSettingsAction } from '@/app/actions';
import AdmissionLetterModal, { printBulkAdmissionLetters } from './AdmissionLetterModal';

interface AdminControlProps {
  students: Student[];
}

export default function AdminControl({ students }: AdminControlProps) {
  const router = useRouter();

  const compressImage = (file: File, maxDim = 1000, quality = 0.70): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const StudentAvatar = ({ student, size = 'sm' }: { student: Student; size?: 'sm' | 'md' | 'lg' }) => {
    const dimensions = size === 'lg' ? 'w-16 h-16 text-sm' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-10 h-10 text-xs';
    return (
      <div className={`${dimensions} rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center font-bold border border-slate-200/60 relative`}>
        {student.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-500 uppercase">{student.firstName[0]}{student.lastName?.[0] || ''}</span>
        )}
      </div>
    );
  };

  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'directory' | 'pending' | 'corrections' | 'settings' | 'new-verification' | 'audit-log' | 'admission-letters'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal State for viewing Admission Letter
  const [letterModalStudent, setLetterModalStudent] = useState<Student | null>(null);
  const [isTogglingFee, setIsTogglingFee] = useState<string | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Feedback Modal State (Loading, Success, Error)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'loading' | 'success' | 'error';
    title: string;
    message: string;
    details?: Record<string, string>;
  } | null>(null);

  // Classes Page filter state
  const [classTabFilter, setClassTabFilter] = useState<string>('all');
  const [classPageSearch, setClassPageSearch] = useState<string>('');
  const [selectedSubgroupRoster, setSelectedSubgroupRoster] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [subgroupSortOrder, setSubgroupSortOrder] = useState<'most_populated' | 'alphabetical' | 'capacity'>('most_populated');

  // Default Class Subgroups / Streams (30 students per class capacity)
  const defaultSubgroups = useMemo(() => [
    'Nursery 1 Gold',
    'Nursery 1 Silver',
    'Nursery 1 Green',
    'Basic 1 Gold',
    'Basic 1 Silver',
    'Basic 1 Green',
    'Basic 2 Gold',
    'Basic 2 Silver',
    'Basic 2 Green',
  ], []);

  // Helper to normalize bare classes (e.g. "Nursery 1" -> "Nursery 1 Gold")
  const getStudentClassArm = (cls: string | undefined): string => {
    if (!cls) return 'Nursery 1 Gold';
    const trimmed = cls.trim();
    if (trimmed === 'Nursery 1' || trimmed === 'Nursery') return 'Nursery 1 Gold';
    if (trimmed === 'Basic 1' || trimmed === 'Primary 1') return 'Basic 1 Gold';
    if (trimmed === 'Basic 2' || trimmed === 'Primary 2') return 'Basic 2 Gold';
    return trimmed;
  };

  // Main class categories sorted by enrollment count (most populated first)
  const sortedMainClasses = useMemo(() => {
    const classes = ['Nursery 1', 'Basic 1', 'Basic 2'];
    return classes.sort((a, b) => {
      const countA = students.filter(s => getStudentClassArm(s.intendedClass).startsWith(a)).length;
      const countB = students.filter(s => getStudentClassArm(s.intendedClass).startsWith(b)).length;
      return countB - countA;
    });
  }, [students]);

  // Class list sorted based on selected priority order (most populated first by default)
  const classList = useMemo(() => {
    const set = new Set([
      ...defaultSubgroups,
      ...students.map(s => getStudentClassArm(s.intendedClass)).filter(Boolean)
    ]);
    const list = Array.from(set);

    return list.sort((a, b) => {
      const countA = students.filter(s => getStudentClassArm(s.intendedClass) === a).length;
      const countB = students.filter(s => getStudentClassArm(s.intendedClass) === b).length;

      if (subgroupSortOrder === 'most_populated') {
        if (countB !== countA) return countB - countA; // Highest enrollment first!
        return a.localeCompare(b);
      } else if (subgroupSortOrder === 'capacity') {
        const isFullA = countA >= 30 ? 1 : 0;
        const isFullB = countB >= 30 ? 1 : 0;
        if (isFullB !== isFullA) return isFullB - isFullA;
        return countB - countA;
      } else {
        return a.localeCompare(b);
      }
    });
  }, [students, defaultSubgroups, subgroupSortOrder]);

  const classStudentMap = useMemo(() => {
    const map: Record<string, Student[]> = {};
    students.forEach(student => {
      const cls = getStudentClassArm(student.intendedClass);
      if (!map[cls]) map[cls] = [];
      map[cls].push(student);
    });
    return map;
  }, [students]);

  // OCR Form Scanning state
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');

  // Duplicate Student Warning state
  const [duplicateWarning, setDuplicateWarning] = useState<Student | null>(null);

  useEffect(() => {
    if (activeTab === 'audit-log') {
      setIsLoadingAudit(true);
      getAuditLogsAction(100).then(res => {
        if (res.success && res.logs) {
          setAuditLogs(res.logs);
        }
        setIsLoadingAudit(false);
      });
    }
  }, [activeTab]);

  const handleScanOCR = async (file: File) => {
    setIsScanningOCR(true);
    setOcrProgress('Reading handwritten form with AI Vision...');
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Scanning Physical Form...',
      message: 'Compressing image & extracting handwritten text with AI Vision...',
    });

    try {
      const base64 = await compressImage(file, 1000, 0.70);
      
      const aiResult = await scanAdmissionFormOCRAction(base64);
      if (aiResult.success && aiResult.data) {
        const d = aiResult.data;
        const extractedName = `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Student';
        setNewStudent({
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          dateOfBirth: d.dateOfBirth || '',
          gender: (d.gender === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
          intendedClass: d.intendedClass || 'Nursery 1',
          fatherName: d.fatherName || '',
          motherName: d.motherName || '',
          residentialAddress: d.residentialAddress || '',
          phone1: d.phone1 || '',
          phone2: d.phone2 || '',
          guardianName: d.guardianName || '',
          guardianAddress: d.guardianAddress || '',
          nationality: d.nationality || 'Nigerian',
          religion: d.religion || 'Islam',
          photo: '',
        });
        setOcrProgress('Handwritten details extracted successfully with AI Vision!');
        
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Handwritten Form Extracted!',
          message: `AI Vision successfully recognized handwritten details for "${extractedName}". The form fields below have been pre-filled for your review.`,
          details: {
            'Student Name': extractedName,
            'Class': d.intendedClass || 'Nursery 1',
            'Date of Birth': d.dateOfBirth || 'Not specified',
            'Gender': d.gender || 'Male',
            'Father / Mother': d.fatherName || d.motherName || 'Not specified',
            'Phone': d.phone1 || 'Not specified',
          }
        });
        return;
      }

      const errorDetail = aiResult.error || 'Could not recognize handwritten text.';
      setOcrProgress(`OCR failed: ${errorDetail}`);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'OCR Scanning Failed',
        message: `${errorDetail}\n\nPlease ensure the photo is well-lit and clear, or check your Gemini API key in Settings. You can also type the student details manually.`,
      });
    } catch (err) {
      console.error('OCR Error:', err);
      const errMsg = err instanceof Error ? err.message : 'Could not process form image.';
      setOcrProgress('Could not process form image. Please enter details manually.');
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'OCR Processing Error',
        message: `${errMsg}\n\nPlease try uploading a clearer image or fill in the student fields manually.`,
      });
    } finally {
      setIsScanningOCR(false);
    }
  };
  
  // Search & Filter state for Student Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'requires_correction'>('all');
  const [classFilter, setClassFilter] = useState('all');
  
  // CSV status state
  const [, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Edit Student Details state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // School Settings state
  const [schoolSettings, setSchoolSettings] = useState({
    name: 'AI Integrated Academy Argungu',
    motto: 'Learning Today, Leading Tomorrow',
    address: "Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu",
    tel1: '08069676697',
    tel2: '07034784861',
    email: 'alijabahintegratedacademyarg@gmail.com',
    logo: '/logo.jpg',
    geminiApiKey: '',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    getSchoolSettingsAction().then(dbSettings => {
      if (dbSettings) {
        setSchoolSettings(prev => ({
          ...prev,
          name: dbSettings.schoolName || prev.name,
          motto: dbSettings.motto || prev.motto,
          address: dbSettings.address || prev.address,
          tel1: dbSettings.phones ? dbSettings.phones.split(',')[0]?.trim() || prev.tel1 : prev.tel1,
          tel2: dbSettings.phones ? dbSettings.phones.split(',')[1]?.trim() || prev.tel2 : prev.tel2,
          logo: dbSettings.logo || prev.logo,
          geminiApiKey: dbSettings.geminiApiKey || prev.geminiApiKey,
        }));
      }
    });
  }, []);

  // New Student Verification form state
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female',
    intendedClass: 'Nursery 1',
    fatherName: '',
    motherName: '',
    residentialAddress: '',
    phone1: '',
    phone2: '',
    guardianName: '',
    guardianAddress: '',
    nationality: 'Nigerian',
    religion: 'Islam',
    photo: '',
  });

  useEffect(() => {
    const first = newStudent.firstName.trim().toLowerCase();
    const last = newStudent.lastName.trim().toLowerCase();
    const phone = newStudent.phone1.replace(/[^\d]/g, '');
    const dob = newStudent.dateOfBirth.trim().toLowerCase();

    if (first && last && (phone || dob)) {
      const match = students.find(s => {
        const sFirst = s.firstName.trim().toLowerCase();
        const sLast = s.lastName.trim().toLowerCase();
        const sPhone = (s.phone1 || '').replace(/[^\d]/g, '');
        const sDob = (s.dateOfBirth || '').trim().toLowerCase();

        if (phone && sFirst === first && sLast === last && sPhone === phone) return true;
        if (dob && sFirst === first && sLast === last && sDob === dob) return true;
        return false;
      });
      setDuplicateWarning(match || null);
    } else {
      setDuplicateWarning(null);
    }
  }, [newStudent.firstName, newStudent.lastName, newStudent.phone1, newStudent.dateOfBirth, students]);

  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Dynamic stats
  const totalStudents = students.length;
  const pendingCount = students.filter(s => s.verificationStatus === 'pending').length;
  const verifiedCount = students.filter(s => s.verificationStatus === 'verified').length;
  const correctionCount = students.filter(s => s.verificationStatus === 'requires_correction').length;
  const completionRate = totalStudents > 0 ? Math.round((verifiedCount / totalStudents) * 100) : 0;

  // Filter students based on active settings
  const classes = Array.from(new Set(students.map(s => s.intendedClass))).filter(Boolean);

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const formNum = student.formNumber.toLowerCase();
    const parentPhone = student.phone1?.toLowerCase() || '';
    const intendedCls = student.intendedClass.toLowerCase();

    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          formNum.includes(searchQuery.toLowerCase()) ||
                          parentPhone.includes(searchQuery.toLowerCase()) ||
                          intendedCls.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.verificationStatus === statusFilter;
    const matchesClass = classFilter === 'all' || student.intendedClass === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // Handle CSV Import
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Importing CSV Records...',
      message: `Reading and parsing "${file.name}"...`,
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setImportStatus({ success: true, message: data.message });
        router.refresh();
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'CSV Imported Successfully!',
          message: data.message || 'Student records have been imported into the database.',
        });
      } else {
        const errorMsg = data.error || 'Failed to import CSV.';
        setImportStatus({ success: false, message: errorMsg });
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'CSV Import Failed',
          message: errorMsg,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during upload.';
      setImportStatus({ success: false, message });
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'CSV Import Error',
        message,
      });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent({ ...student });
    setDeleteConfirm(false);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSavingStudent(true);
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Saving Student Details...',
      message: `Updating profile for ${editingStudent.firstName} ${editingStudent.lastName}...`,
    });
    try {
      const result = await adminUpdateStudentAction(editingStudent.id, editingStudent);
      if (result.success) {
        const studentName = `${editingStudent.firstName} ${editingStudent.lastName}`;
        setEditingStudent(null);
        router.refresh();
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Student Profile Updated!',
          message: `All details for "${studentName}" have been updated successfully.`,
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Update Failed',
          message: result.error || 'Failed to update student profile.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving.';
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Update Error',
        message: msg,
      });
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!editingStudent) return;
    setIsDeletingStudent(true);
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Deleting Student Record...',
      message: `Removing profile for ${editingStudent.firstName} ${editingStudent.lastName}...`,
    });
    try {
      const studentName = `${editingStudent.firstName} ${editingStudent.lastName}`;
      const result = await adminDeleteStudentAction(editingStudent.id);
      if (result.success) {
        setEditingStudent(null);
        router.refresh();
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Student Record Deleted',
          message: `The profile for "${studentName}" has been permanently removed from the system.`,
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Deletion Failed',
          message: result.error || 'Failed to delete student record.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while deleting.';
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Deletion Error',
        message: msg,
      });
    } finally {
      setIsDeletingStudent(false);
      setDeleteConfirm(false);
    }
  };

  const handleVerify = async (studentId: string) => {
    setIsVerifying(true);
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Verifying Student Details...',
      message: 'Updating verification status to verified...',
    });
    try {
      const result = await adminVerifyAction(studentId);
      if (result.success) {
        router.refresh();
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Student Profile Verified!',
          message: 'The student enrollment details have been officially marked as verified.',
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Verification Failed',
          message: result.error || 'Could not verify student details.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during verification.';
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Verification Error',
        message: msg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTogglePaymentStatus = async (studentId: string, currentStatus: string) => {
    setIsTogglingFee(studentId);
    try {
      await adminTogglePaymentStatusAction(studentId, currentStatus === 'paid' ? 'pending' : 'paid');
      router.refresh();
    } catch (err) {
      console.error('Failed to toggle fee payment status:', err);
    } finally {
      setIsTogglingFee(null);
    }
  };

  // Submit manual student creation
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStudent(true);
    setCreateSuccess(false);
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Registering Student...',
      message: 'Creating official enrollment profile and generating serial number...',
    });
    
    try {
      const formNumber = `FORM-2026-M${Date.now().toString().slice(-4)}`;
      const result = await adminCreateStudentAction({
        ...newStudent,
        formNumber,
        verificationStatus: 'pending'
      });
      
      if (result.success) {
        setCreateSuccess(true);
        const createdName = `${newStudent.firstName} ${newStudent.lastName}`;
        setNewStudent({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'Male',
          intendedClass: 'Nursery 1 Gold',
          fatherName: '',
          motherName: '',
          residentialAddress: '',
          phone1: '',
          phone2: '',
          guardianName: '',
          guardianAddress: '',
          nationality: 'Nigerian',
          religion: 'Islam',
          photo: '',
        });
        router.refresh();
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Student Registered Successfully!',
          message: `Profile for "${createdName}" has been saved into the student database with Form Serial No: ${formNumber}.`,
          details: {
            'Form Number': formNumber,
            'Student Name': createdName,
            'Class': newStudent.intendedClass,
            'Status': 'Review Pending',
          }
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'Registration Failed',
          message: result.error || 'Failed to create student record. Please try again.',
        });
      }
    } catch (err: unknown) {
      console.error('Create student error:', err);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Registration Error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred while creating student.',
      });
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const [isExportingPhotos, setIsExportingPhotos] = useState(false);

  const handleExportPhotos = async () => {
    setIsExportingPhotos(true);
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Packaging Student Photos...',
      message: 'Converting images and packaging into ZIP archive...',
    });
    try {
      const zip = new JSZip();
      const folder = zip.folder("Student_Photos");
      let count = 0;
      let skippedNoPhoto = 0;

      for (const student of students) {
        if (!student.photo || !student.photo.trim()) {
          skippedNoPhoto++;
          continue;
        }

        const rawPhoto = student.photo.trim();
        const cleanFirst = (student.firstName || 'Student').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanLast = (student.lastName || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanForm = (student.formNumber || student.id).trim().replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${cleanFirst}_${cleanLast}_${cleanForm}`;

        try {
          if (rawPhoto.includes(';base64,')) {
            const parts = rawPhoto.split(';base64,');
            const header = parts[0];
            const base64Content = parts[1].replace(/\s+/g, '');
            const extMatch = header.match(/image\/([a-zA-Z0-9]+)/);
            let ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
            if (ext === 'jpeg') ext = 'jpg';
            
            folder?.file(`${fileName}.${ext}`, base64Content, { base64: true });
            count++;
          } else if (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') || rawPhoto.startsWith('/')) {
            const res = await fetch(rawPhoto);
            if (res.ok) {
              const blob = await res.blob();
              let ext = 'jpg';
              if (blob.type.includes('png')) ext = 'png';
              else if (blob.type.includes('webp')) ext = 'webp';
              folder?.file(`${fileName}.${ext}`, blob);
              count++;
            }
          } else {
            const cleanBase64 = rawPhoto.replace(/\s+/g, '');
            folder?.file(`${fileName}.jpg`, cleanBase64, { base64: true });
            count++;
          }
        } catch (err) {
          console.error(`Failed to package photo for ${student.firstName} (${student.formNumber}):`, err);
        }
      }

      if (count === 0) {
        setFeedbackModal({
          isOpen: true,
          type: 'error',
          title: 'No Photos Found',
          message: `No exportable student photos found among ${students.length} student records (${skippedNoPhoto} students have no photo uploaded).`,
        });
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_Academy_Student_Photos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Photos Exported Successfully!',
        message: `Exported ${count} student photo(s) into AI_Academy_Student_Photos.zip! (${skippedNoPhoto} student(s) had no photo uploaded).`,
      });
    } catch (err) {
      console.error("Error creating photos zip:", err);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Export Photos Error',
        message: 'Failed to package photos into ZIP file. Please try again.',
      });
    } finally {
      setIsExportingPhotos(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackModal({
      isOpen: true,
      type: 'loading',
      title: 'Updating School Settings...',
      message: 'Saving updated configuration to database...',
    });
    try {
      localStorage.setItem('ai_academy_school_settings', JSON.stringify(schoolSettings));
      await updateSchoolSettingsAction({
        schoolName: schoolSettings.name,
        motto: schoolSettings.motto,
        address: schoolSettings.address,
        phones: `${schoolSettings.tel1}, ${schoolSettings.tel2}`,
        logo: schoolSettings.logo,
        geminiApiKey: schoolSettings.geminiApiKey,
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'School Settings Saved!',
        message: 'School name, motto, address, phone numbers, and Gemini API Key settings have been updated.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings.';
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Save Settings Error',
        message: msg,
      });
    }
  };

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Mobile Sliding Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-out" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer content sliding in from left */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out animate-slide-right z-50">
            <div className="space-y-8">
              {/* Header: Logo & Title, Close Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 p-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={schoolSettings.logo || '/logo.jpg'}
                      alt="School Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <span className="block font-black text-slate-800 text-sm leading-tight tracking-tight">
                      Admin Portal
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400">
                      Private Academy v2.0
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                <button 
                  onClick={() => {
                    setActiveTab('overview');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    activeTab === 'overview' 
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Overview</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('classes');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    activeTab === 'classes' 
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    <span>Classes & Students</span>
                  </div>
                  <span className="bg-[#0f7343] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {classList.length}
                  </span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('directory');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    activeTab === 'directory' 
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Student Directory</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('admission-letters');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    activeTab === 'admission-letters' 
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Admission Letters</span>
                  {totalStudents > 0 && (
                    <span className="ml-auto bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                      {students.filter(s => s.paymentStatus === 'paid').length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('pending');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    activeTab === 'pending' 
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Pending Verifications</span>
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('corrections');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    activeTab === 'corrections' 
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Correction Logs</span>
                  {correctionCount > 0 && (
                    <span className="ml-auto bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                      {correctionCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    activeTab === 'settings' 
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>School Settings</span>
                </button>
              </nav>
            </div>

            {/* Sidebar Bottom (Mobile Drawer Version) */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <button 
                onClick={() => {
                  setActiveTab('new-verification');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0f7343] hover:bg-[#0b5c34] text-white font-bold text-sm transition-all cursor-pointer shadow-sm shadow-[#0f7343]/10"
              >
                <Plus className="w-4 h-4" />
                <span>New Student</span>
              </button>
              
              <div className="space-y-1">
                <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold transition-all">
                  <HelpCircle className="w-4 h-4" />
                  <span>Support</span>
                </a>
                <form action={logoutAction} className="w-full">
                  <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer text-left">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEFT SIDEBAR (Matches adm dashboard.png) ================= */}
      <aside className="w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-8">
          {/* Brand Logo and Name */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={schoolSettings.logo || '/logo.jpg'}
                alt="School Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="block font-black text-slate-800 text-sm leading-tight tracking-tight">
                Admin Portal
              </span>
              <span className="block text-[10px] font-bold text-slate-400">
                Private Academy v2.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button 
              onClick={() => setActiveTab('classes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'classes' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>Classes & Students</span>
              </div>
              <span className="bg-[#0f7343] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {classList.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('directory')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'directory' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Directory</span>
            </button>
            <button 
              onClick={() => setActiveTab('admission-letters')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'admission-letters' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Admission Letters</span>
              {totalStudents > 0 && (
                <span className="ml-auto bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                  {students.filter(s => s.paymentStatus === 'paid').length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'pending' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending Verifications</span>
              {pendingCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                  {pendingCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('corrections')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'corrections' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Correction Logs</span>
              {correctionCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                  {correctionCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>School Settings</span>
            </button>
            <button 
              onClick={() => setActiveTab('audit-log')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                activeTab === 'audit-log' 
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit History</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setActiveTab('new-verification')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0f7343] hover:bg-[#0b5c34] text-white font-bold text-sm transition-all cursor-pointer shadow-sm shadow-[#0f7343]/10"
          >
            <Plus className="w-4 h-4" />
            <span>New Student</span>
          </button>
          
          <div className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold transition-all">
              <HelpCircle className="w-4 h-4" />
              <span>Support</span>
            </a>
            <form action={logoutAction} className="w-full">
              <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer text-left">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ================= MAIN PANEL CONTENT AREA ================= */}
      <main className="flex-1 bg-[#f8fafc] p-6 md:p-10 overflow-y-auto">
        {/* Header for Mobile Admin with Hamburger Menu */}
        <div className="md:hidden flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-slate-100 flex items-center justify-center p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={schoolSettings.logo || '/logo.jpg'} alt="Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <div>
                <span className="block font-black text-slate-800 text-sm leading-tight">Admin Portal</span>
                <span className="block text-[9px] font-bold text-slate-400">Private Academy v2.0</span>
              </div>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="p-2 border border-slate-200 rounded-xl text-slate-550 hover:text-rose-600 bg-white transition-colors cursor-pointer flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ================= TAB ROUTING CONTENTS ================= */}
        
        {/* TAB 1: OVERVIEW (Matches adm dashboard.png layout) */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-slide-down">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Overview</h1>
              <p className="text-slate-500 text-sm font-semibold mt-2.5">
                Welcome back. Here is the status of Argungu Academy today.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="soft-card p-6 bg-white flex flex-col justify-between rounded-3xl">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-[#f0f4f9] flex items-center justify-center text-slate-700">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Active</span>
                </div>
                <div className="mt-6">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
                  <span className="text-4xl font-black text-slate-800 mt-1.5 block">{totalStudents}</span>
                </div>
              </div>

              <div className="soft-card p-6 bg-white flex flex-col justify-between rounded-3xl">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-[#f0f4f9] flex items-center justify-center text-slate-700">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Requires Attention</span>
                </div>
                <div className="mt-6">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Verifications</span>
                  <span className="text-4xl font-black text-slate-800 mt-1.5 block">{pendingCount}</span>
                </div>
              </div>

              <div className="soft-card p-6 bg-white flex flex-col justify-between rounded-3xl">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-[#f0f4f9] flex items-center justify-center text-slate-700">
                    <AlertOctagon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Correction Requests</span>
                </div>
                <div className="mt-6">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Correction Requests</span>
                  <span className="text-4xl font-black text-slate-800 mt-1.5 block">{correctionCount}</span>
                </div>
              </div>

              <div className="soft-card p-6 bg-white flex flex-col justify-between rounded-3xl">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-[#f0f4f9] flex items-center justify-center text-slate-700">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{completionRate}% Completion</span>
                </div>
                <div className="mt-6">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Profiles</span>
                  <span className="text-4xl font-black text-slate-800 mt-1.5 block">{verifiedCount}</span>
                </div>
              </div>
            </div>

            {/* CSV Operations */}
            <div className="soft-card p-6 bg-white rounded-[2rem] border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">CSV Excel Data Management</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Import new lists from Excel or export corrections back.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-600 bg-white hover:bg-green-50/10 text-slate-600 font-bold text-xs transition-all cursor-pointer">
                    {isImporting ? <RefreshCw className="w-4 h-4 animate-spin text-green-600" /> : <Upload className="w-4 h-4" />}
                    <span>Upload CSV File</span>
                    <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                  </label>
                  <a href="/api/export-csv" className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Download Excel / CSV</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleExportPhotos}
                    disabled={isExportingPhotos}
                    className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isExportingPhotos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    <span>{isExportingPhotos ? "Packaging ZIP..." : "Export Photos (ZIP)"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Correction Logs Preview */}
              <div className="soft-card p-6 bg-white lg:col-span-2 rounded-[2rem]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Recent Parent Complaints</h3>
                  <button onClick={() => setActiveTab('corrections')} className="text-xs font-bold text-slate-400 hover:text-slate-600">View Logs</button>
                </div>

                <div className="space-y-5">
                  {students.filter(s => s.verificationStatus === 'requires_correction').length > 0 ? (
                    students.filter(s => s.verificationStatus === 'requires_correction').slice(0, 3).map((student) => (
                      <div key={student.id} className="flex justify-between items-start gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <StudentAvatar student={student} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {student.fatherName || 'Parent'} <span className="font-normal text-slate-500">submitted correction for</span> {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-rose-600 bg-rose-50/50 border border-rose-100/50 p-2 mt-1.5 rounded-lg italic">
                              &quot;{student.correctionNotes}&quot;
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => startEditStudent(student)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
                        >
                          Make Correction
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                      No correction complaints submitted by parents yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="soft-card p-6 bg-white rounded-[2rem] space-y-4">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Quick Actions</h3>
                <button onClick={() => setActiveTab('new-verification')} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#f8fafc] border border-slate-100 hover:bg-slate-100 transition-all text-left">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Manually Add Student</span>
                    <span className="block text-[10px] text-slate-400">Bypass parent portal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <a href="/api/export-csv" className="w-full flex items-center justify-between p-4 rounded-xl bg-[#f8fafc] border border-slate-100 hover:bg-slate-100 transition-all text-left">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Export Report</span>
                    <span className="block text-[10px] text-slate-400">Download Excel/CSV</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLASSES & STUDENTS EXPLORER PAGE */}
        {activeTab === 'classes' && (
          <div className="space-y-8 animate-slide-down">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-[#0f7343]" />
                  <span>Classes & Subgroups Roster</span>
                </h1>
                <p className="text-slate-500 text-sm font-semibold mt-2.5">
                  Class arms with 30-student capacity tracking (Gold, Silver, Green) and instant admission letter printing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => printBulkAdmissionLetters(students, schoolSettings.logo)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Bulk Print All Letters ({students.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('new-verification')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0f7343] hover:bg-[#0b5c34] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student to Class</span>
                </button>
              </div>
            </div>

            {/* Comprehensive Top Class Stat Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sortedMainClasses.map((mainClass) => {
                const classStudents = students.filter(s => getStudentClassArm(s.intendedClass).startsWith(mainClass));
                const goldCount = students.filter(s => getStudentClassArm(s.intendedClass) === `${mainClass} Gold`).length;
                const silverCount = students.filter(s => getStudentClassArm(s.intendedClass) === `${mainClass} Silver`).length;
                const greenCount = students.filter(s => getStudentClassArm(s.intendedClass) === `${mainClass} Green`).length;

                const verified = classStudents.filter(s => s.verificationStatus === 'verified').length;
                const paid = classStudents.filter(s => s.paymentStatus === 'paid').length;
                const pendingPaid = classStudents.filter(s => s.paymentStatus !== 'paid').length;
                const totalCapacity = 90; // 3 arms x 30 capacity
                const mainPct = Math.min(100, Math.round((classStudents.length / totalCapacity) * 100));

                const isSelected = classTabFilter === mainClass;

                return (
                  <div 
                    key={mainClass} 
                    className={`soft-card bg-white rounded-3xl border flex flex-col justify-between overflow-hidden transition-all shadow-xs ${
                      isSelected 
                        ? 'border-[#0f7343] ring-2 ring-[#0f7343]/20 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Card Header */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-[#0f7343] flex items-center justify-center font-black border border-emerald-200 shadow-xs">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{mainClass}</h3>
                            <span className="text-[11px] font-bold text-slate-500">
                              3 Subclasses (Gold, Silver, Green)
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                          {classStudents.length} / 90 Enrolled
                        </span>
                      </div>
                    </div>

                    {/* Top Card Detailed Breakdown */}
                    <div className="p-5 space-y-4 flex-1">
                      {/* Main Class Stats Grid */}
                      <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                        <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/60">
                          <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified</span>
                          <span className="text-sm font-black text-emerald-900 mt-0.5 block">{verified}</span>
                        </div>
                        <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/60">
                          <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Fees Paid</span>
                          <span className="text-sm font-black text-blue-900 mt-0.5 block">{paid}</span>
                        </div>
                        <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100/60">
                          <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">Unpaid</span>
                          <span className="text-sm font-black text-amber-900 mt-0.5 block">{pendingPaid}</span>
                        </div>
                      </div>

                      {/* Main Capacity Meter */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-extrabold text-slate-700">
                          <span>Total Class Capacity</span>
                          <span className="text-[#0f7343] font-black">{mainPct}% Filled</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div style={{ width: `${mainPct}%` }} className="bg-[#0f7343] h-full rounded-full transition-all" />
                        </div>
                      </div>

                      {/* Subclass Arm Rows Breakdown */}
                      <div className="pt-2 space-y-2 border-t border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Subclass Arms (30 Max Each):</span>
                        
                        {/* Gold */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                            <span>Gold Arm</span>
                          </div>
                          <span className={`font-black ${goldCount >= 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {goldCount} / 30 {goldCount >= 30 && '🔴 FULL'}
                          </span>
                        </div>

                        {/* Silver */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                            <span>Silver Arm</span>
                          </div>
                          <span className={`font-black ${silverCount >= 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {silverCount} / 30 {silverCount >= 30 && '🔴 FULL'}
                          </span>
                        </div>

                        {/* Green */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                          <div className="flex items-center gap-2 font-bold text-emerald-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>Green Arm</span>
                          </div>
                          <span className={`font-black ${greenCount >= 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {greenCount} / 30 {greenCount >= 30 && '🔴 FULL'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Card Actions */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => printBulkAdmissionLetters(classStudents, schoolSettings.logo)}
                        disabled={classStudents.length === 0}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print All {mainClass} Letters</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClassTabFilter(mainClass)}
                        className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#0f7343] text-white' 
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Filtered ✓' : 'Filter'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="soft-card p-4 bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => setClassTabFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    classTabFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Subgroups ({students.length})
                </button>
                {['Nursery 1', 'Basic 1', 'Basic 2'].map(mainCls => (
                  <button
                    key={mainCls}
                    onClick={() => setClassTabFilter(mainCls)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      classTabFilter === mainCls
                        ? 'bg-[#0f7343] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mainCls} ({students.filter(s => getStudentClassArm(s.intendedClass).startsWith(mainCls)).length})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 shrink-0">
                  <span>Priority:</span>
                  <select
                    value={subgroupSortOrder}
                    onChange={(e) => setSubgroupSortOrder(e.target.value as 'most_populated' | 'alphabetical' | 'capacity')}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0f7343] cursor-pointer"
                  >
                    <option value="most_populated">🔥 Highest Students First</option>
                    <option value="capacity">🔴 Full Capacity First</option>
                    <option value="alphabetical">🔤 Name (A-Z)</option>
                  </select>
                </div>

                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={classPageSearch}
                    onChange={(e) => setClassPageSearch(e.target.value)}
                    placeholder="Search student, form no..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0f7343] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Subgroup Roster Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classList
                .filter(subgroupName => {
                  if (classTabFilter === 'all') return true;
                  return subgroupName.startsWith(classTabFilter);
                })
                .map(subgroupName => {
                  const classStudents = students.filter(s => getStudentClassArm(s.intendedClass) === subgroupName);
                  const count = classStudents.length;
                  const isFull = count >= 30;
                  const pct = Math.min(100, Math.round((count / 30) * 100));

                  const verifiedCount = classStudents.filter(s => s.verificationStatus === 'verified').length;
                  const paidCount = classStudents.filter(s => s.paymentStatus === 'paid').length;
                  const pendingPaidCount = classStudents.filter(s => s.paymentStatus !== 'paid').length;

                  const isGold = subgroupName.includes('Gold');
                  const isSilver = subgroupName.includes('Silver');
                  const isGreen = subgroupName.includes('Green');

                  return (
                    <div 
                      key={subgroupName} 
                      onClick={() => setSelectedSubgroupRoster(subgroupName)}
                      className={`soft-card bg-white rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xs transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group ${
                        isGold 
                          ? 'border-amber-200 hover:border-amber-400 hover:ring-2 hover:ring-amber-400/20' 
                          : isSilver 
                          ? 'border-slate-300 hover:border-slate-400 hover:ring-2 hover:ring-slate-400/20' 
                          : isGreen 
                          ? 'border-emerald-200 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-400/20' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Subgroup Banner Header */}
                      <div className={`p-5 border-b border-slate-100 ${
                        isGold 
                          ? 'bg-amber-50/60' 
                          : isSilver 
                          ? 'bg-slate-50' 
                          : isGreen 
                          ? 'bg-emerald-50/60' 
                          : 'bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black shadow-xs ${
                              isGold ? 'bg-amber-500' : isSilver ? 'bg-slate-600' : isGreen ? 'bg-emerald-600' : 'bg-[#0f7343]'
                            }`}>
                              <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                              <h2 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-[#0f7343] transition-colors">
                                {subgroupName}
                              </h2>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Max Capacity: 30
                              </span>
                            </div>
                          </div>

                          {isFull ? (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-rose-200 shrink-0">
                              🔴 FULL (30/30)
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                              🟢 {30 - count} Available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content - Subclass Details Grid */}
                      <div className="p-5 space-y-4 flex-1">
                        {/* Subclass Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</span>
                            <span className="text-base font-black text-slate-800 mt-0.5 block">{count} / 30</span>
                          </div>
                          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/60">
                            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verified</span>
                            <span className="text-base font-black text-emerald-800 mt-0.5 block">{verifiedCount}</span>
                          </div>
                          <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/60">
                            <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider">Fees Paid</span>
                            <span className="text-base font-black text-blue-800 mt-0.5 block">{paidCount}</span>
                          </div>
                          <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/60">
                            <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">Fees Pending</span>
                            <span className="text-base font-black text-amber-800 mt-0.5 block">{pendingPaidCount}</span>
                          </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-xs font-extrabold text-slate-700">
                            <span>Capacity Gauge</span>
                            <span className={isFull ? 'text-rose-600 font-black' : 'text-emerald-700'}>{pct}% Filled</span>
                          </div>
                          <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${pct}%` }} 
                              className={`h-full transition-all rounded-full ${isFull ? 'bg-rose-500' : isGold ? 'bg-amber-500' : isSilver ? 'bg-slate-600' : 'bg-emerald-600'}`} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Subgroup Card Footer Actions */}
                      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedSubgroupRoster(subgroupName)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span>View Roster ({count})</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setNewStudent(prev => ({ ...prev, intendedClass: subgroupName }));
                            setActiveTab('new-verification');
                          }}
                          disabled={isFull}
                          className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isFull 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-[#0f7343] hover:bg-[#0b5c34] text-white shadow-2xs'
                          }`}
                          title={isFull ? 'Subclass arm is full (30/30)' : 'Add student to this arm'}
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isFull ? 'Full' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Redesigned Subgroup Roster Modal */}
            {selectedSubgroupRoster && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
                <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up my-6 flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30 shrink-0">
                        <GraduationCap className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-white tracking-tight">{selectedSubgroupRoster} Roster</h2>
                          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            Class Roster
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold mt-1">
                          Enrolled: <strong className="text-white">{students.filter(s => getStudentClassArm(s.intendedClass) === selectedSubgroupRoster).length}</strong> / 30 Capacity • AI Integrated Academy Argungu
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const rosterSts = students.filter(s => getStudentClassArm(s.intendedClass) === selectedSubgroupRoster);
                          printBulkAdmissionLetters(rosterSts, schoolSettings.logo);
                        }}
                        className="px-4 py-2.5 bg-[#0f7343] hover:bg-[#0b5c34] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        <Printer className="w-4 h-4 text-emerald-200" />
                        <span>Print All Letters (Bulk)</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubgroupRoster(null);
                          setRosterSearch('');
                        }}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                        aria-label="Close modal"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar & Roster Search inside Modal */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        placeholder="Search by name, serial no, or phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0f7343] focus:ring-2 focus:ring-[#0f7343]/20 transition-all"
                      />
                    </div>

                    {/* Stats Pill Badges */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto text-xs font-bold">
                      {(() => {
                        const classSts = students.filter(s => getStudentClassArm(s.intendedClass) === selectedSubgroupRoster);
                        const verifiedCount = classSts.filter(s => s.verificationStatus === 'verified').length;
                        const paidCount = classSts.filter(s => s.paymentStatus === 'paid').length;

                        return (
                          <>
                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 shrink-0">
                              Total: <strong className="text-slate-900">{classSts.length}/30</strong>
                            </span>
                            <span className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 shrink-0">
                              Verified: <strong>{verifiedCount}</strong>
                            </span>
                            <span className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-blue-800 shrink-0">
                              Paid: <strong>{paidCount}</strong>
                            </span>
                          </>
                        );
                      })()}

                      <button
                        onClick={() => {
                          setNewStudent(prev => ({ ...prev, intendedClass: selectedSubgroupRoster }));
                          setSelectedSubgroupRoster(null);
                          setActiveTab('new-verification');
                        }}
                        disabled={students.filter(s => getStudentClassArm(s.intendedClass) === selectedSubgroupRoster).length >= 30}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Student</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Roster List View */}
                  <div className="p-6 overflow-y-auto flex-1 space-y-3">
                    {(() => {
                      const rosterStudents = students.filter(s => {
                        const matchesSubgroup = getStudentClassArm(s.intendedClass) === selectedSubgroupRoster;
                        if (!matchesSubgroup) return false;
                        if (!rosterSearch.trim()) return true;
                        const q = rosterSearch.toLowerCase();
                        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
                               s.formNumber.toLowerCase().includes(q) ||
                               (s.phone1 && s.phone1.includes(q)) ||
                               (s.fatherName && s.fatherName.toLowerCase().includes(q));
                      });

                      if (rosterStudents.length === 0) {
                        return (
                          <div className="py-16 text-center text-slate-400 font-semibold text-sm">
                            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No students currently registered in {selectedSubgroupRoster}.</p>
                          </div>
                        );
                      }

                      return rosterStudents.map((student, idx) => {
                        const isPaid = student.paymentStatus === 'paid';
                        return (
                          <div key={student.id} className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                            {/* Student Identity */}
                            <div className="flex items-center gap-4 min-w-0">
                              <span className="text-xs font-black text-slate-400 w-5 text-right shrink-0">{idx + 1}.</span>
                              <StudentAvatar student={student} size="md" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-slate-900 text-base truncate">
                                    {student.firstName} {student.lastName}
                                  </h4>
                                  {student.verificationStatus === 'verified' ? (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                                    </span>
                                  ) : (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                                      Review Pending
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-1 flex-wrap">
                                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                                    {student.formNumber}
                                  </span>
                                  <span>Gender: <strong>{student.gender}</strong></span>
                                  <span>Parent: <strong>{student.fatherName || student.motherName || 'N/A'}</strong> ({student.phone1 || 'No Tel'})</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions (Print Admission, Fee Status, Edit) */}
                            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                              {/* Fee Payment Toggle Button */}
                              <button
                                onClick={() => handleTogglePaymentStatus(student.id, student.paymentStatus || 'pending')}
                                disabled={isTogglingFee === student.id}
                                className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                                  isPaid 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                                }`}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>{isPaid ? 'Fee Paid ✓' : 'Fee Pending'}</span>
                              </button>

                              {/* Individual Print Admission Letter Button */}
                              <button
                                onClick={() => {
                                  setLetterModalStudent(student);
                                }}
                                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0f7343] border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                title="Print individual admission letter"
                              >
                                <Printer className="w-3.5 h-3.5 text-[#0f7343]" />
                                <span>Print Admission</span>
                              </button>

                              {/* Edit Profile Button */}
                              <button
                                onClick={() => {
                                  setSelectedSubgroupRoster(null);
                                  startEditStudent(student);
                                }}
                                className="px-3 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="Edit student details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-500">
                      Showing subclass roster for <strong className="text-slate-800">{selectedSubgroupRoster}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const rosterSts = students.filter(s => (s.intendedClass || 'Nursery 1 Gold') === selectedSubgroupRoster);
                          printBulkAdmissionLetters(rosterSts, schoolSettings.logo);
                        }}
                        className="px-4 py-2 bg-[#0f7343] hover:bg-[#0b5c34] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Bulk Admission Letters</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubgroupRoster(null);
                          setRosterSearch('');
                        }}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
                      >
                        Close Roster
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDENT DIRECTORY (Matches students list page.png) */}
        {activeTab === 'directory' && (
          <div className="space-y-6 animate-slide-down">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Student Directory</h1>
              <p className="text-slate-500 text-sm font-semibold mt-2.5">
                Manage student records. Use filters to locate specific individuals.
              </p>
            </div>

            <div className="soft-card bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, serial number, or class..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none"
                  >
                    <option value="all">All Classes</option>
                    {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'verified' | 'requires_correction')}
                    className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Review Pending</option>
                    <option value="verified">Verified</option>
                    <option value="requires_correction">Correction Req.</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <StudentAvatar student={student} size="md" />
                        <div>
                          <h4 className="font-bold text-slate-800">{student.firstName} {student.lastName}</h4>
                          <span className="text-xs font-semibold text-slate-400 font-mono">SN: {student.formNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="text-sm font-bold text-slate-600">{student.intendedClass}</span>

                        {student.verificationStatus === 'verified' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#137333]">
                            Verified
                          </span>
                        )}
                        {student.verificationStatus === 'requires_correction' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                            Correction Req.
                          </span>
                        )}
                        {student.verificationStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f0f4f9] text-[#3c4043]">
                            Pending
                          </span>
                        )}

                        <div className="flex gap-2">
                          {student.phone1 && (
                            <a
                              href={`https://wa.me/${student.phone1.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Dear Parent, your child ${student.firstName} ${student.lastName}'s details (Form: ${student.formNumber}) have been verified at AI Integrated Academy Argungu. Thank you!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Send WhatsApp Update"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}
                          <button
                            onClick={() => startEditStudent(student)}
                            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
                          >
                            Edit Student Record
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 font-semibold">
                    No student records matched your filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PENDING VERIFICATIONS */}
        {activeTab === 'pending' && (
          <div className="space-y-6 animate-slide-down">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Pending Verifications</h1>
              <p className="text-slate-500 text-sm font-semibold mt-2.5">
                Review and approve student profiles awaiting confirmation.
              </p>
            </div>

            <div className="soft-card bg-white rounded-[2rem] overflow-hidden border border-slate-200">
              <div className="divide-y divide-slate-100">
                {students.filter(s => s.verificationStatus === 'pending').length > 0 ? (
                  students.filter(s => s.verificationStatus === 'pending').map((student) => (
                    <div key={student.id} className="p-6 hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <StudentAvatar student={student} size="sm" />
                        <div>
                          <h4 className="font-bold text-slate-800">{student.firstName} {student.lastName}</h4>
                          <p className="text-xs text-slate-400">Class: {student.intendedClass} | Parent Phone: {student.phone1}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleVerify(student.id)} className="px-4 py-2 bg-[#137333] hover:bg-[#0f6229] text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                          Verify & Approve
                        </button>
                        <button onClick={() => startEditStudent(student)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer">
                          Edit Student Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 font-semibold">
                    No pending verifications at this time.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CORRECTION LOGS */}
        {activeTab === 'corrections' && (
          <div className="space-y-6 animate-slide-down">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Correction Logs (Complaints)</h1>
              <p className="text-slate-500 text-sm font-semibold mt-2.5">
                Review and make corrections to records based on complaints submitted by parents.
              </p>
            </div>

            <div className="soft-card bg-white rounded-[2rem] overflow-hidden border border-slate-200">
              <div className="divide-y divide-slate-100">
                {students.filter(s => s.verificationStatus === 'requires_correction').length > 0 ? (
                  students.filter(s => s.verificationStatus === 'requires_correction').map((student) => (
                    <div key={student.id} className="p-6 hover:bg-slate-50/50 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StudentAvatar student={student} size="sm" />
                          <div>
                            <h4 className="font-bold text-slate-800">{student.firstName} {student.lastName}</h4>
                            <p className="text-xs text-slate-400">Class: {student.intendedClass} | Parent Phone: {student.phone1}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEditStudent(student)} className="px-3.5 py-1.5 bg-[#e2e8f0] text-slate-800 hover:bg-slate-200 border border-slate-350 rounded-lg text-xs font-bold cursor-pointer">
                            Make Corrections
                          </button>
                          <button onClick={() => handleVerify(student.id)} className="px-3.5 py-1.5 bg-[#e6f4ea] text-[#137333] hover:bg-[#ceead6] border border-[#137333]/10 rounded-lg text-xs font-bold cursor-pointer">
                            Resolve & Verify
                          </button>
                        </div>
                      </div>
                      <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-100/50 text-xs text-rose-900 leading-relaxed italic">
                        <span className="block font-bold text-rose-900 mb-1">Parent&apos;s Complaint:</span>
                        &quot;{student.correctionNotes || 'No notes left'}&quot;
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 font-semibold">
                    No active correction requests.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SCHOOL SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-slide-down max-w-2xl">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">School Settings</h1>
              <p className="text-slate-500 text-sm font-semibold mt-2.5">
                Configure primary metadata and branding text displayed on the verification portal.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="soft-card p-6 md:p-8 bg-white rounded-[2rem] border border-slate-200 space-y-5">
              {/* School Crest / Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">School Crest / Logo</label>
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#f8fafc] border border-slate-200 rounded-2xl">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white border-2 border-slate-200 shadow-xs flex items-center justify-center p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={schoolSettings.logo || '/logo.jpg'}
                      alt="School Logo"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <h5 className="text-xs font-bold text-slate-800">Official School Badge</h5>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Upload a custom square image (PNG/JPG) to update the school logo across ID cards, printable slips, and navigation headers.
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await compressImage(file, 600, 0.9);
                              setSchoolSettings(prev => ({ ...prev, logo: base64 }));
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {schoolSettings.logo && schoolSettings.logo !== '/logo.jpg' && (
                        <button
                          type="button"
                          onClick={() => setSchoolSettings(prev => ({ ...prev, logo: '/logo.jpg' }))}
                          className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">School Name</label>
                <input
                  type="text"
                  value={schoolSettings.name}
                  onChange={(e) => setSchoolSettings({...schoolSettings, name: e.target.value})}
                  className="w-full soft-input font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Motto / Branding Slogan</label>
                <input
                  type="text"
                  value={schoolSettings.motto}
                  onChange={(e) => setSchoolSettings({...schoolSettings, motto: e.target.value})}
                  className="w-full soft-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tel Number 1</label>
                  <input
                    type="text"
                    value={schoolSettings.tel1}
                    onChange={(e) => setSchoolSettings({...schoolSettings, tel1: e.target.value})}
                    className="w-full soft-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tel Number 2</label>
                  <input
                    type="text"
                    value={schoolSettings.tel2}
                    onChange={(e) => setSchoolSettings({...schoolSettings, tel2: e.target.value})}
                    className="w-full soft-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">School Email Address</label>
                <input
                  type="email"
                  value={schoolSettings.email}
                  onChange={(e) => setSchoolSettings({...schoolSettings, email: e.target.value})}
                  className="w-full soft-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Physical Residential Address</label>
                <textarea
                  value={schoolSettings.address}
                  onChange={(e) => setSchoolSettings({...schoolSettings, address: e.target.value})}
                  rows={2}
                  className="w-full soft-input resize-none"
                  required
                />
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-4.5 rounded-2xl space-y-2.5 shadow-xs">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  🔑 Google Gemini Vision AI API Key (For Handwritten Form Scanning)
                </label>
                <input
                  type="password"
                  value={schoolSettings.geminiApiKey || ''}
                  onChange={(e) => setSchoolSettings({...schoolSettings, geminiApiKey: e.target.value})}
                  placeholder="AIzaSy..."
                  className="w-full soft-input font-mono text-xs bg-white border border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-600 leading-snug font-medium">
                  To enable 100% accurate AI scanning of handwritten admission form images, paste your free Google AI Studio key starting with <code className="font-bold font-mono text-emerald-900 bg-emerald-100 px-1 py-0.5 rounded">AIzaSy...</code> from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-black text-emerald-900">
                    aistudio.google.com ($0 Free Key)
                  </a>.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold text-center">
                  Settings successfully saved!
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button type="submit" className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all cursor-pointer">
                  Save School Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: NEW VERIFICATION (Manually Add Student) */}
        {activeTab === 'new-verification' && (
          <div className="space-y-6 animate-slide-down max-w-3xl">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">New Student Admission Form</h1>
              <p className="text-slate-500 text-sm font-semibold mt-2.5">
                Register a new student directly into the local database (matches fields of physical form.jpg).
              </p>
            </div>

            <form onSubmit={handleCreateStudent} className="soft-card p-6 md:p-8 bg-white rounded-[2rem] border border-slate-200 space-y-6">
              <div className="text-center pb-4 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI INTEGRATED ACADEMY ARGUNGU</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">Nursery & Primary Application Form</h3>
              </div>

              {/* AI OCR Form Scanner Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      <Scan className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Scan Physical Form (AI OCR)</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Upload a photo of form.jpg to auto-fill details (100% Free)</p>
                      <p className="text-[10px] text-emerald-700 font-bold mt-1">
                        🔑 Requires a free Google AI Studio key starting with <code className="bg-emerald-100 px-1 rounded text-emerald-900">AIzaSy...</code>.{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-black text-emerald-900">
                          Get Free Key ($0)
                        </a>
                      </p>
                    </div>
                  </div>
                  
                  <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-xs shrink-0">
                    {isScanningOCR ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{ocrProgress || 'Scanning...'}</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        <span>Upload & Scan Form</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isScanningOCR}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleScanOCR(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Duplicate Student Warning Card */}
              {duplicateWarning && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300/80 text-amber-900 text-xs space-y-2 animate-slide-down shadow-xs">
                  <div className="flex items-center gap-2 font-black text-amber-900">
                    <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="uppercase tracking-wider">Duplicate Student Record Detected!</span>
                  </div>
                  <p className="leading-relaxed text-slate-700 font-medium">
                    A student record for <strong className="font-extrabold text-amber-950">{duplicateWarning.firstName} {duplicateWarning.lastName}</strong> (Form No: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">{duplicateWarning.formNumber}</code>) already exists in <strong>Class {duplicateWarning.intendedClass}</strong>.
                  </p>
                  <div className="pt-1 flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEditStudent(duplicateWarning)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <span>View / Edit Existing Record</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Student Photo</label>
                <div className="flex items-center gap-4 bg-[#f8fafc] p-4 border border-slate-200/60 rounded-2xl shadow-sm">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                    {newStudent.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={newStudent.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg bg-slate-50 uppercase">
                        {newStudent.firstName[0] || 'S'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setNewStudent({ ...newStudent, photo: base64 });
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#111622] file:text-white hover:file:bg-[#1a2133] cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Square image recommended. Compression applied automatically.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                    placeholder="e.g., Muhd Imam"
                    className="w-full soft-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                    placeholder="e.g., Bashir"
                    className="w-full soft-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date of Birth</label>
                  <input
                    type="text"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                    placeholder="DD/MM/YYYY"
                    className="w-full soft-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as 'Male' | 'Female'})}
                    className="w-full soft-input cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Intended Admission Class</label>
                  <select
                    value={newStudent.intendedClass}
                    onChange={(e) => setNewStudent({...newStudent, intendedClass: e.target.value})}
                    className="w-full soft-input cursor-pointer font-bold"
                    required
                  >
                    <optgroup label="⚡ Automatic Subgroup Placement">
                      {['Nursery 1', 'Basic 1', 'Basic 2'].map(mainCls => {
                        const targetArm = ['Gold', 'Silver', 'Green', 'Blue'].find(arm => {
                          const cnt = students.filter(s => s.intendedClass === `${mainCls} ${arm}`).length;
                          return cnt < 30;
                        }) || 'Gold';
                        const assignedFull = `${mainCls} ${targetArm}`;
                        const spotCnt = students.filter(s => s.intendedClass === assignedFull).length;
                        return (
                          <option key={`auto-${mainCls}`} value={assignedFull}>
                            ⚡ Auto-Assign to {mainCls} (→ {targetArm} Arm: {30 - spotCnt} spots available)
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="Direct Subgroup Selection">
                      {classList.map(cls => {
                        const count = students.filter(s => s.intendedClass === cls).length;
                        const isFull = count >= 30;
                        return (
                          <option 
                            key={cls} 
                            value={cls} 
                            disabled={isFull}
                            className={isFull ? 'text-rose-400 bg-slate-100 font-normal' : 'font-bold text-slate-800'}
                          >
                            {cls} {isFull ? '🔴 FULL (30/30)' : `🟢 (${count}/30 enrolled)`}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Father&apos;s Full Name</label>
                  <input
                    type="text"
                    value={newStudent.fatherName}
                    onChange={(e) => setNewStudent({...newStudent, fatherName: e.target.value})}
                    placeholder="e.g., Muh'd Bashir"
                    className="w-full soft-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mother&apos;s Full Name</label>
                  <input
                    type="text"
                    value={newStudent.motherName}
                    onChange={(e) => setNewStudent({...newStudent, motherName: e.target.value})}
                    placeholder="e.g., Hauwa,u Abubakar kigo"
                    className="w-full soft-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Residential Address</label>
                <input
                  type="text"
                  value={newStudent.residentialAddress}
                  onChange={(e) => setNewStudent({...newStudent, residentialAddress: e.target.value})}
                  placeholder="e.g., Near dutsen Mariya f|Tank, Argungu"
                  className="w-full soft-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Contact Phone</label>
                  <input
                    type="text"
                    value={newStudent.phone1}
                    onChange={(e) => setNewStudent({...newStudent, phone1: e.target.value})}
                    placeholder="e.g., 07038363534"
                    className="w-full soft-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Secondary Contact Phone</label>
                  <input
                    type="text"
                    value={newStudent.phone2}
                    onChange={(e) => setNewStudent({...newStudent, phone2: e.target.value})}
                    placeholder="e.g., 09033279601"
                    className="w-full soft-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Guardian Name</label>
                  <input
                    type="text"
                    value={newStudent.guardianName}
                    onChange={(e) => setNewStudent({...newStudent, guardianName: e.target.value})}
                    placeholder="e.g., Hauwa,u Abubakar kigo"
                    className="w-full soft-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Guardian Address / Branch</label>
                  <input
                    type="text"
                    value={newStudent.guardianAddress}
                    onChange={(e) => setNewStudent({...newStudent, guardianAddress: e.target.value})}
                    placeholder="e.g., of chc Uduths Branch Argungu"
                    className="w-full soft-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nationality</label>
                  <input
                    type="text"
                    value={newStudent.nationality}
                    onChange={(e) => setNewStudent({...newStudent, nationality: e.target.value})}
                    className="w-full soft-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Religion</label>
                  <input
                    type="text"
                    value={newStudent.religion}
                    onChange={(e) => setNewStudent({...newStudent, religion: e.target.value})}
                    className="w-full soft-input"
                  />
                </div>
              </div>

              {createSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold text-center">
                  Student record successfully created and verified!
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('overview')}
                  className="py-3 px-5 border border-slate-200 rounded-xl font-bold text-sm text-slate-650 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreatingStudent || !!duplicateWarning}
                  className={`py-3 px-6 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    duplicateWarning 
                      ? 'bg-amber-200 text-amber-800 cursor-not-allowed border border-amber-300' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCreatingStudent ? 'Saving...' : duplicateWarning ? 'Duplicate Record Blocked' : 'Add & Register Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: AUDIT HISTORY LOG */}
        {activeTab === 'audit-log' && (
          <div className="space-y-6 animate-slide-down">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Audit History & Activity Log</h1>
              <p className="text-slate-500 text-sm font-semibold mt-2.5">
                Real-time log of parent logins, verifications, admin updates, and system events.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
              {isLoadingAudit ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#0f7343] animate-spin" />
                  <span className="text-xs font-bold">Loading system audit logs...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <History className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 my-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 group">
                      {/* Circle indicator */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${
                        log.action === 'VERIFY' ? 'border-green-600 bg-green-50' :
                        log.action === 'CORRECTION' ? 'border-rose-500 bg-rose-50' :
                        log.action === 'LOGIN' ? 'border-blue-500 bg-blue-50' :
                        log.action === 'CREATE' ? 'border-emerald-600 bg-emerald-50' :
                        log.action === 'DELETE' ? 'border-red-600 bg-red-50' :
                        'border-slate-400'
                      }`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{log.actor}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            log.action === 'VERIFY' ? 'bg-green-100 text-green-800' :
                            log.action === 'CORRECTION' ? 'bg-rose-100 text-rose-800' :
                            log.action === 'LOGIN' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          {new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-semibold mt-1">
                        {log.details}
                        {log.studentName && <span className="font-bold text-slate-800"> ({log.studentName})</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: ADMISSION LETTERS MANAGEMENT */}
        {activeTab === 'admission-letters' && (
          <div className="space-y-6 animate-slide-down">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Student Admission Letters</h1>
                <p className="text-slate-500 text-sm font-semibold mt-2.5">
                  Approve school fee payments to unlock and issue official A4 Admission Letters to parents.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                  {students.filter(s => s.paymentStatus === 'paid').length} Approved / Paid Letters
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const paidStudents = students.filter(s => s.paymentStatus === 'paid');
                    const targetStudents = paidStudents.length > 0 ? paidStudents : filteredStudents;
                    if (targetStudents.length === 0) {
                      alert("No student records available to print.");
                      return;
                    }
                    printBulkAdmissionLetters(targetStudents, schoolSettings.logo || '/logo.jpg');
                  }}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>Print All Admission Letters (Bulk A4)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPhotos}
                  disabled={isExportingPhotos}
                  className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isExportingPhotos ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Camera className="w-4 h-4 text-emerald-400" />}
                  <span>{isExportingPhotos ? "Packaging ZIP..." : "Export Photos (ZIP)"}</span>
                </button>
              </div>
            </div>

            {/* Verification Status Switcher Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Students ({totalStudents})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('verified')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    statusFilter === 'verified' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified ({verifiedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    statusFilter === 'pending' 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-amber-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Unverified / Pending ({pendingCount})</span>
                </button>
              </div>

              {/* Verified Admission Letters Download Button */}
              <button
                type="button"
                onClick={() => {
                  const verifiedStudents = students.filter(s => s.verificationStatus === 'verified');
                  if (verifiedStudents.length === 0) {
                    alert("No verified student records found.");
                    return;
                  }
                  printBulkAdmissionLetters(verifiedStudents, schoolSettings.logo || '/logo.jpg');
                }}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm active:scale-98 shrink-0"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>Download Verified Letters ({verifiedCount})</span>
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, form number, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Grid of Students */}
            {filteredStudents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Student Records Found</h3>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                  Registered students will appear here to manage fee approval and issue admission letters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStudents.map((student) => {
                  const isPaid = student.paymentStatus === 'paid';
                  const parentPhone = student.phone1 ? student.phone1.replace(/[^\d]/g, '') : '';
                  const waMessage = encodeURIComponent(
                    `Hello ${student.fatherName || 'Parent'}, your student ${student.firstName} ${student.lastName} (Form No: ${student.formNumber}) has been approved for admission at AI Integrated Academy Argungu. View/Download Admission Letter: ${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`
                  );
                  const waUrl = parentPhone ? `https://wa.me/${parentPhone.replace('0', '234')}?text=${waMessage}` : '#';

                  return (
                    <div key={student.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="flex items-start gap-4">
                        <StudentAvatar student={student} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {student.formNumber}
                            </span>
                            {isPaid ? (
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                Fee Paid ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                Fee Unpaid
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-1 truncate">
                            {student.firstName} {student.lastName}
                          </h4>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {student.intendedClass} • {student.gender}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 text-slate-500 pt-3 border-t border-slate-100 font-medium">
                        <p><strong className="text-slate-700 font-bold">Parent:</strong> {student.fatherName || student.guardianName || 'N/A'}</p>
                        <p><strong className="text-slate-700 font-bold">Phone:</strong> {student.phone1 || 'N/A'}</p>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        {/* Admin Action: Approve / Revoke Fee Payment Button */}
                        <button
                          type="button"
                          disabled={isTogglingFee === student.id}
                          onClick={async () => {
                            setIsTogglingFee(student.id);
                            try {
                              await adminTogglePaymentStatusAction(student.id, isPaid ? 'pending' : 'paid');
                              router.refresh();
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsTogglingFee(null);
                            }
                          }}
                          className={`w-full py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                            isPaid
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isTogglingFee === student.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPaid ? (
                            <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                          <span>{isPaid ? 'Revoke Fee Approval' : 'Approve Fee & Issue Admission Letter'}</span>
                        </button>

                        {/* View/Download A4 Admission Letter */}
                        <button
                          type="button"
                          onClick={() => setLetterModalStudent(student)}
                          className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span>Download A4 Admission Letter</span>
                        </button>

                        {parentPhone && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Notify Parent via WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Official A4 Admission Letter Modal */}
      {letterModalStudent && (
        <AdmissionLetterModal
          student={letterModalStudent}
          isOpen={!!letterModalStudent}
          onClose={() => setLetterModalStudent(null)}
        />
      )}

      {/* ================= EDIT STUDENT DETAILS MODAL OVERLAY (Matches students edit page.png) ================= */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl border border-slate-100 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Edit Student Record</h3>
                <p className="text-xs font-semibold text-slate-400 mt-2">Update the details for the selected student.</p>
              </div>
              <div className="flex items-center gap-3">
                <StudentAvatar student={editingStudent} size="md" />
                <button 
                  onClick={() => setEditingStudent(null)} 
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Display Parent Complaint Alert if student is in requires_correction status */}
            {editingStudent.verificationStatus === 'requires_correction' && editingStudent.correctionNotes && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-900 leading-relaxed italic flex items-start gap-2.5">
                <AlertOctagon className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Parent&apos;s Complaint:</span>
                  &quot;{editingStudent.correctionNotes}&quot;
                </div>
              </div>
            )}

            {/* Main Form Fields (Matches layout in students edit page.png) */}
            <form onSubmit={handleUpdateStudent} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Student Photo</label>
                <div className="flex items-center gap-4 bg-[#f8fafc] p-4 border border-slate-200/60 rounded-2xl shadow-sm">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                    {editingStudent.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={editingStudent.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg bg-slate-50 uppercase">
                        {editingStudent.firstName[0] || 'S'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setEditingStudent({ ...editingStudent, photo: base64 });
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#111622] file:text-white hover:file:bg-[#1a2133] cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Square image recommended. Compression applied automatically.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Form Serial Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editingStudent.formNumber}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Serial numbers cannot be modified after creation.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    value={editingStudent.firstName}
                    onChange={(e) => setEditingStudent({...editingStudent, firstName: e.target.value})}
                    className="w-full soft-input text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editingStudent.lastName}
                    onChange={(e) => setEditingStudent({...editingStudent, lastName: e.target.value})}
                    className="w-full soft-input text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Admission Class</label>
                  <select
                    value={editingStudent.intendedClass}
                    onChange={(e) => setEditingStudent({...editingStudent, intendedClass: e.target.value})}
                    className="w-full soft-input text-sm cursor-pointer font-bold"
                    required
                  >
                    {classList.map(cls => {
                      const count = students.filter(s => s.intendedClass === cls).length;
                      const isCurrent = editingStudent.intendedClass === cls;
                      const isFull = count >= 30 && !isCurrent;
                      return (
                        <option 
                          key={cls} 
                          value={cls} 
                          disabled={isFull}
                          className={isFull ? 'text-rose-400 bg-slate-100 font-normal' : 'font-bold text-slate-800'}
                        >
                          {cls} {isCurrent ? '(Current)' : isFull ? '🔴 FULL (30/30)' : `🟢 (${count}/30 enrolled)`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date of Birth</label>
                  <input
                    type="text"
                    value={editingStudent.dateOfBirth}
                    onChange={(e) => setEditingStudent({...editingStudent, dateOfBirth: e.target.value})}
                    placeholder="YYYY-MM-DD"
                    className="w-full soft-input text-sm"
                  />
                </div>
              </div>

              {/* Gender Radio buttons (Female, Male) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gender</label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-750 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={editingStudent.gender === 'Female'}
                      onChange={() => setEditingStudent({...editingStudent, gender: 'Female'})}
                      className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900"
                    />
                    <span>Female</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-750 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={editingStudent.gender === 'Male'}
                      onChange={() => setEditingStudent({...editingStudent, gender: 'Male'})}
                      className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900"
                    />
                    <span>Male</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Parent Phone I</label>
                  <input
                    type="text"
                    value={editingStudent.phone1}
                    onChange={(e) => setEditingStudent({...editingStudent, phone1: e.target.value})}
                    className="w-full soft-input text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Parent Phone II</label>
                  <input
                    type="text"
                    value={editingStudent.phone2 || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, phone2: e.target.value})}
                    className="w-full soft-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={editingStudent.fatherName || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, fatherName: e.target.value})}
                    className="w-full soft-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mother&apos;s Name</label>
                  <input
                    type="text"
                    value={editingStudent.motherName || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, motherName: e.target.value})}
                    className="w-full soft-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Residential Address</label>
                <input
                  type="text"
                  value={editingStudent.residentialAddress || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, residentialAddress: e.target.value})}
                  className="w-full soft-input text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Guardian Name</label>
                  <input
                    type="text"
                    value={editingStudent.guardianName || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, guardianName: e.target.value})}
                    className="w-full soft-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Guardian Address</label>
                  <input
                    type="text"
                    value={editingStudent.guardianAddress || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, guardianAddress: e.target.value})}
                    className="w-full soft-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Verification Status</label>
                  <select
                    value={editingStudent.verificationStatus}
                    onChange={(e) => setEditingStudent({...editingStudent, verificationStatus: e.target.value as 'pending' | 'verified' | 'requires_correction'})}
                    className="w-full soft-input text-sm cursor-pointer"
                  >
                    <option value="pending">Review Pending</option>
                    <option value="verified">Verified</option>
                    <option value="requires_correction">Requires Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Religion</label>
                  <input
                    type="text"
                    value={editingStudent.religion || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, religion: e.target.value})}
                    className="w-full soft-input text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons (Matches Save / Cancel layout) */}
              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                {/* Delete button option */}
                {!deleteConfirm ? (
                  <button 
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="py-3 px-5 rounded-xl border border-rose-250 text-rose-600 hover:bg-rose-50 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Student</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 p-2.5 rounded-xl animate-slide-down">
                    <span className="text-xs font-black text-rose-800">Confirm Deletion?</span>
                    <button 
                      type="button"
                      onClick={handleDeleteStudent}
                      disabled={isDeletingStudent}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button 
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="py-3 px-5 border border-slate-200 rounded-xl font-bold text-sm text-slate-650 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit"
                    disabled={isSavingStudent}
                    className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingStudent ? 'Saving...' : 'Save Student'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Global Feedback Modal (Loading / Success / Error) */}
      {feedbackModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-slide-up flex flex-col items-center text-center space-y-4 relative">
            {feedbackModal.type !== 'loading' && (
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Icon Banner */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xs ${
              feedbackModal.type === 'loading'
                ? 'bg-slate-50 border-slate-100 text-[#0f7343]'
                : feedbackModal.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              {feedbackModal.type === 'loading' && <Loader2 className="w-8 h-8 animate-spin text-[#0f7343]" />}
              {feedbackModal.type === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
              {feedbackModal.type === 'error' && <AlertOctagon className="w-8 h-8 text-rose-600" />}
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                {feedbackModal.title}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed whitespace-pre-line">
                {feedbackModal.message}
              </p>
            </div>

            {/* Extracted Details Table (if any) */}
            {feedbackModal.details && (
              <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-left text-xs space-y-2">
                {Object.entries(feedbackModal.details).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center border-b border-slate-200/40 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-semibold text-slate-400">{key}:</span>
                    <span className="font-extrabold text-slate-800 truncate max-w-[200px]">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {feedbackModal.type !== 'loading' && (
              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackModal(null);
                  }}
                  className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                    feedbackModal.type === 'success'
                      ? 'bg-[#0f7343] hover:bg-[#0b5c34] text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {feedbackModal.type === 'success' ? 'Review & Save Form ✓' : 'Dismiss / Try Again'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* General Progress Overlay */}
      {(isImporting || isSavingStudent || isDeletingStudent || isVerifying) && !feedbackModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center space-y-4 animate-slide-down">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <Loader2 className="w-8 h-8 text-[#0f7343] animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {isImporting && 'Importing CSV Records...'}
                {isSavingStudent && 'Saving Student Details...'}
                {isDeletingStudent && 'Deleting Student Record...'}
                {isVerifying && 'Verifying Student Details...'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Please wait while we process your request...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
