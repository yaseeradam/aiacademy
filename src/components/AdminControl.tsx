'use client';

import { useState } from 'react';
import { Student } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Upload, Download, Search, RefreshCw, CheckCircle, 
  Users, Clock, AlertOctagon, HelpCircle, 
  User, MessageSquare, ShieldCheck, ChevronRight, X, Menu,
  Grid, Settings, Plus, LogOut, Check, Edit3, MapPin, Calendar, Trash2, Save, BookOpen,
  Camera, Loader2
} from 'lucide-react';
import { logoutAction, adminUpdateStudentAction, adminDeleteStudentAction, adminCreateStudentAction, adminVerifyAction } from '@/app/actions';

interface AdminControlProps {
  students: Student[];
}

export default function AdminControl({ students }: AdminControlProps) {
  const router = useRouter();

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
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
          resolve(canvas.toDataURL('image/jpeg', 0.7));
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
          <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-500 uppercase">{student.firstName[0]}{student.lastName?.[0] || ''}</span>
        )}
      </div>
    );
  };

  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'pending' | 'corrections' | 'settings' | 'new-verification'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search & Filter state for Student Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'requires_correction'>('all');
  const [classFilter, setClassFilter] = useState('all');
  
  // CSV status state
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
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
    email: 'alijabahintegratedacademyarg@gmail.com'
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

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
    } catch (err: any) {
      setImportStatus({ success: false, message: err.message || 'An error occurred during upload.' });
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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
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
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                    <Image
                      src="/logo.jpg"
                      alt="School Logo"
                      width={28}
                      height={28}
                      className="object-contain rounded-full"
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
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
              <Image
                src="/logo.jpg"
                alt="School Logo"
                width={28}
                height={28}
                className="object-contain rounded-full"
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
              <Image src="/logo.jpg" alt="Logo" width={28} height={28} className="rounded-full" />
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
                <div className="flex gap-3">
                  <label className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-600 bg-white hover:bg-green-50/10 text-slate-600 font-bold text-xs transition-all cursor-pointer">
                    {isImporting ? <RefreshCw className="w-4 h-4 animate-spin text-green-600" /> : <Upload className="w-4 h-4" />}
                    <span>Upload CSV File</span>
                    <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                  </label>
                  <a href="/api/export-csv" className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Download Updated Excel / CSV</span>
                  </a>
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
                              "{student.correctionNotes}"
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
                    onChange={(e) => setStatusFilter(e.target.value as any)}
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
                        <span className="block font-bold text-rose-900 mb-1">Parent's Complaint:</span>
                        "{student.correctionNotes || 'No notes left'}"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Student Photo</label>
                <div className="flex items-center gap-4 bg-[#f8fafc] p-4 border border-slate-200/60 rounded-2xl shadow-sm">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                    {newStudent.photo ? (
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
                    onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as any})}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Father's Full Name</label>
                  <input
                    type="text"
                    value={newStudent.fatherName}
                    onChange={(e) => setNewStudent({...newStudent, fatherName: e.target.value})}
                    placeholder="e.g., Muh'd Bashir"
                    className="w-full soft-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mother's Full Name</label>
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
                  disabled={isCreatingStudent}
                  className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all cursor-pointer"
                >
                  {isCreatingStudent ? 'Saving...' : 'Add & Register Student'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

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
                  <span className="font-bold block mb-1">Parent's Complaint:</span>
                  "{editingStudent.correctionNotes}"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Father's Name</label>
                  <input
                    type="text"
                    value={editingStudent.fatherName || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, fatherName: e.target.value})}
                    className="w-full soft-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mother's Name</label>
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
                    onChange={(e) => setEditingStudent({...editingStudent, verificationStatus: e.target.value as any})}
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
