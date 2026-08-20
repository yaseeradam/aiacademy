'use client';

import { useState, useEffect } from 'react';
import { Student, AuditLog } from '@/types';
import { useRouter } from 'next/navigation';
import { createWorker } from 'tesseract.js';
import JSZip from 'jszip';
import { 
  Upload, Download, Search, RefreshCw, 
  Users, Clock, AlertOctagon, HelpCircle, 
  ShieldCheck, ChevronRight, X, Menu,
  Grid, Settings, Plus, LogOut, Trash2, Save, BookOpen,
  Loader2, Scan, History, MessageSquare, Camera, FileText, CheckCircle2, CreditCard, Printer
} from 'lucide-react';
import { logoutAction, adminUpdateStudentAction, adminDeleteStudentAction, adminCreateStudentAction, adminVerifyAction, adminTogglePaymentStatusAction, getAuditLogsAction, scanAdmissionFormOCRAction, getSchoolSettingsAction, updateSchoolSettingsAction } from '@/app/actions';
import AdmissionLetterModal, { printBulkAdmissionLetters } from './AdmissionLetterModal';

interface AdminControlProps {
  students: Student[];
}

export default function AdminControl({ students }: AdminControlProps) {
  const router = useRouter();

  const compressImage = (file: File, maxDim = 1800, quality = 0.85): Promise<string> => {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'pending' | 'corrections' | 'settings' | 'new-verification' | 'audit-log' | 'admission-letters'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal State for viewing Admission Letter
  const [letterModalStudent, setLetterModalStudent] = useState<Student | null>(null);
  const [isTogglingFee, setIsTogglingFee] = useState<string | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

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
    try {
      const base64 = await compressImage(file);
      
      // Attempt Gemini Vision AI first
      const aiResult = await scanAdmissionFormOCRAction(base64);
      if (aiResult.success && aiResult.data) {
        const d = aiResult.data;
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
        return;
      }

      setOcrProgress('Could not parse handwritten text. Please ensure Gemini API Key is set in Settings or enter details manually.');
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrProgress('Could not process form image. Please enter details manually.');
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
      } else {
        setImportStatus({ success: false, message: data.error || 'Failed to import CSV.' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during upload.';
      setImportStatus({ success: false, message });
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
    try {
      const result = await adminUpdateStudentAction(editingStudent.id, editingStudent);
      if (result.success) {
        setEditingStudent(null);
        router.refresh();
      } else {
        console.error(result.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!editingStudent) return;
    setIsDeletingStudent(true);
    try {
      const result = await adminDeleteStudentAction(editingStudent.id);
      if (result.success) {
        setEditingStudent(null);
        router.refresh();
      } else {
        console.error(result.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingStudent(false);
      setDeleteConfirm(false);
    }
  };

  const handleVerify = async (studentId: string) => {
    setIsVerifying(true);
    try {
      await adminVerifyAction(studentId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Submit manual student creation
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStudent(true);
    setCreateSuccess(false);
    
    try {
      const formNumber = `FORM-2026-M${Date.now().toString().slice(-4)}`;
      const result = await adminCreateStudentAction({
        ...newStudent,
        formNumber,
        verificationStatus: 'pending'
      });
      
      if (result.success) {
        setCreateSuccess(true);
        setNewStudent({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'Male',
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
        router.refresh();
      } else {
        console.error(result.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const [isExportingPhotos, setIsExportingPhotos] = useState(false);

  const handleExportPhotos = async () => {
    setIsExportingPhotos(true);
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
            // Data URL format: data:image/png;base64,iVBORw0KGgo...
            const parts = rawPhoto.split(';base64,');
            const header = parts[0];
            const base64Content = parts[1].replace(/\s+/g, '');
            const extMatch = header.match(/image\/([a-zA-Z0-9]+)/);
            let ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
            if (ext === 'jpeg') ext = 'jpg';
            
            folder?.file(`${fileName}.${ext}`, base64Content, { base64: true });
            count++;
          } else if (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') || rawPhoto.startsWith('/')) {
            // Remote or relative URL fetch
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
            // Raw base64 string without data:image prefix
            const cleanBase64 = rawPhoto.replace(/\s+/g, '');
            folder?.file(`${fileName}.jpg`, cleanBase64, { base64: true });
            count++;
          }
        } catch (err) {
          console.error(`Failed to package photo for ${student.firstName} (${student.formNumber}):`, err);
        }
      }

      if (count === 0) {
        alert(`No exportable student photos found among ${students.length} student records (${skippedNoPhoto} students have no photo uploaded).`);
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

      alert(`Successfully exported ${count} student photo(s) into AI_Academy_Student_Photos.zip!\n(${skippedNoPhoto} student(s) had no photo uploaded).`);
    } catch (err) {
      console.error("Error creating photos zip:", err);
      alert("Failed to package photos into ZIP file. Please try again.");
    } finally {
      setIsExportingPhotos(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
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
                  <input
                    type="text"
                    value={newStudent.intendedClass}
                    onChange={(e) => setNewStudent({...newStudent, intendedClass: e.target.value})}
                    placeholder="e.g., Primary 1"
                    className="w-full soft-input"
                    required
                  />
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
                  <input
                    type="text"
                    value={editingStudent.intendedClass}
                    onChange={(e) => setEditingStudent({...editingStudent, intendedClass: e.target.value})}
                    className="w-full soft-input text-sm"
                    required
                  />
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
      {/* Loading Overlay Modal */}
      {(isImporting || isSavingStudent || isDeletingStudent || isCreatingStudent || isVerifying) && (
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
                {isCreatingStudent && 'Creating Student Record...'}
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
