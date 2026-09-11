'use client';

import React, { useState } from 'react';
import { Student } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import type QRCode from 'qrcode';
import { 
  X, Printer, ShieldCheck, Phone,
  Scan, Camera, CheckCircle2, RefreshCw, Sparkles, Download, Clock
} from 'lucide-react';
import { getStudentClassArm, getStudentAdmissionNumber } from './AdmissionLetterModal';

interface PickupIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  initialStudent?: Student | null;
  logoSrc?: string;
}

export default function PickupIDCardModal({
  isOpen,
  onClose,
  students,
  initialStudent = null,
  logoSrc = '/logo.jpg'
}: PickupIDCardModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'simulator'>('preview');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Simulator State
  const [simulatedStudent, setSimulatedStudent] = useState<Student | null>(initialStudent || (students[0] || null));
  const [pickupLogs, setPickupLogs] = useState<Array<{ id: string; name: string; time: string; status: string }>>([]);
  const [justApproved, setJustApproved] = useState<boolean>(false);

  // ZIP Export State
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  if (!isOpen) return null;

  // Filter students for ID Card batch preview
  const displayStudents = students.filter(student => {
    const arm = getStudentClassArm(student.intendedClass, student.id, students);
    const matchesClass = selectedClassFilter === 'all' || arm.startsWith(selectedClassFilter) || arm === selectedClassFilter;
    const matchesSearch = !searchQuery || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.formNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.intendedClass))).filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadZip = async () => {
    if (displayStudents.length === 0) return;
    setIsExportingZip(true);
    setZipProgress({ current: 0, total: displayStudents.length });

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder('Parent_Pickup_ID_Cards');

      for (let i = 0; i < displayStudents.length; i++) {
        const student = displayStudents[i];
        setZipProgress({ current: i + 1, total: displayStudents.length });

        const classArm = getStudentClassArm(student.intendedClass, student.id, students);
        const admissionNo = getStudentAdmissionNumber(student);

        const blob = await generateIDCardImageBlob(student, classArm, admissionNo, logoSrc);
        const sanitize = (str: string) => (str || '').replace(/[^\w.-]/g, '_');
        const fileName = `${sanitize(student.firstName)}_${sanitize(student.lastName)}_${sanitize(student.formNumber || admissionNo)}.png`;
        folder?.file(fileName, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_Academy_Parent_Pickup_ID_Cards_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleApprovePickup = (student: Student) => {
    const newLog = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'APPROVED & RELEASED'
    };
    setPickupLogs(prev => [newLog, ...prev]);
    setJustApproved(true);
    setTimeout(() => setJustApproved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:block">
      
      {/* Container - Soft 3D Claymorphic Container */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 w-full max-w-6xl rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-800/80 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:bg-white print:rounded-none">
        
        {/* Top Header - Soft 3D Navbar */}
        <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 print:hidden shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0f7343] to-emerald-400 text-white flex items-center justify-center font-black shadow-[0_8px_20px_rgba(15,115,67,0.4)] border border-emerald-300/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Parent Pickup ID Cards</h2>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider shadow-inner">
                  Offline QR Security
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Official CR80 security badges for parents to pick up students. Scannable offline without internet.
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'preview'
                    ? 'bg-gradient-to-r from-[#0f7343] to-emerald-600 text-white shadow-[0_4px_12px_rgba(15,115,67,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Batch Print Cards ({displayStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'simulator'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scan className="w-4 h-4" />
                <span>Gate Scanner Simulator</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer shadow-xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB 1: BATCH ID CARD PREVIEW & PRINT */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950 print:bg-white print:overflow-visible">
            
            {/* Filter Controls (Hidden during print) */}
            <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <input
                  type="text"
                  placeholder="Search student name or form number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-semibold"
                />

                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Classes ({students.length})</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                <span className="text-xs font-bold text-slate-400">
                  Showing {displayStudents.length} card(s)
                </span>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isExportingZip || displayStudents.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-[0_6px_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center gap-2 border border-amber-300/40 disabled:opacity-50"
                  title="Download all student ID card images instantly as a ZIP file"
                >
                  {isExportingZip ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-950" />
                  )}
                  <span>
                    {isExportingZip 
                      ? `Zipping ${zipProgress.current}/${zipProgress.total}...` 
                      : `Download All ID Cards (ZIP)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-[#0f7343] hover:from-emerald-500 hover:to-[#0b5c34] text-white font-black text-xs rounded-xl shadow-[0_6px_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-2 border border-emerald-400/30"
                  title="Print ID Cards via browser print engine"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All ID Cards (A4 PDF)</span>
                </button>
              </div>
            </div>

            {/* ID Card Display Area */}
            <div className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto print:grid-cols-2 print:gap-4 print:max-w-none">
                {displayStudents.map((student) => {
                  const classArm = getStudentClassArm(student.intendedClass, student.id, students);
                  const admissionNo = getStudentAdmissionNumber(student);
                  
                  // Compact Offline JSON Payload
                  const qrPayload = JSON.stringify({
                    id: student.id,
                    fn: student.firstName,
                    ln: student.lastName,
                    admNo: admissionNo,
                    form: student.formNumber || '',
                    cls: classArm,
                    fa: student.fatherName || student.guardianName || 'N/A',
                    mo: student.motherName || 'N/A',
                    ph: student.phone1 || student.phone2 || 'N/A'
                  });

                  return (
                    <div 
                      key={student.id} 
                      className="id-card-wrapper relative bg-white rounded-2xl overflow-hidden flex flex-col justify-between text-slate-900 group transition-all shadow-[0_8px_32px_rgba(15,115,67,0.18)] border border-emerald-200 hover:shadow-[0_12px_40px_rgba(15,115,67,0.28)] hover:-translate-y-0.5 print:border-2 print:border-slate-800 print:shadow-none print:rounded-2xl print:break-inside-avoid"
                      style={{ minHeight: '280px' }}
                    >
                      {/* Header Emerald Banner with diagonal stripe overlay */}
                      <div className="relative bg-gradient-to-r from-[#0a5c33] via-[#0f7343] to-[#1a9456] text-white px-4 py-3 border-b-4 border-amber-400 flex items-center justify-between gap-3 overflow-hidden">
                        {/* Diagonal stripe pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                        
                        <div className="flex items-center gap-3 min-w-0 relative z-10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoSrc} alt="School Logo" className="w-11 h-11 rounded-full object-contain bg-white p-0.5 border-2 border-amber-300 shadow-[0_2px_8px_rgba(0,0,0,0.3)] shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-[12px] font-black uppercase tracking-wider text-white leading-none truncate drop-shadow">
                              AI INTEGRATED ACADEMY
                            </h4>
                            <span className="text-[8px] font-extrabold text-amber-300 uppercase tracking-widest block mt-1">
                              STUDENT IDENTITY CARD • ARGUNGU
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 relative z-10">
                          <span className="text-[7px] font-extrabold text-emerald-200 block uppercase tracking-wider mb-0.5">ADM NO</span>
                          <span className="text-[10px] font-mono font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded-md border border-amber-400/50 block shadow-inner">
                            {admissionNo}
                          </span>
                        </div>
                      </div>

                      {/* Main Card Body */}
                      <div className="flex-1 flex items-stretch gap-0 bg-white">
                        {/* Left accent bar */}
                        <div className="w-1.5 bg-gradient-to-b from-[#0f7343] via-amber-400 to-[#0f7343] shrink-0" />

                        <div className="p-3 flex-1 flex items-center gap-3">
                          {/* Column 1: Passport Photo */}
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            <div className="w-[72px] h-[86px] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-[#0f7343] shadow-[0_2px_8px_rgba(15,115,67,0.25)] relative">
                              {student.photo ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 text-[#0f7343]">
                                  <span className="font-black text-2xl leading-none">{student.firstName[0]}{student.lastName?.[0] || ''}</span>
                                  <span className="text-[7px] font-bold text-emerald-600 mt-1 uppercase tracking-wide">Photo</span>
                                </div>
                              )}
                            </div>
                            <span className="text-[6.5px] font-black uppercase tracking-wider text-slate-400">Passport</span>
                          </div>

                          {/* Column 2: Student Details */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div>
                              <h3 className="font-black text-[13px] text-slate-900 tracking-tight leading-tight truncate">
                                {student.firstName} {student.lastName}
                              </h3>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-[#0f7343] text-[9px] font-black tracking-wide mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                {classArm}
                              </div>
                            </div>

                            <div className="text-[9px] text-slate-600 space-y-1 pt-1.5 border-t border-dashed border-slate-200">
                              <div className="flex items-baseline gap-1 truncate">
                                <span className="text-slate-400 font-bold shrink-0">Gender/DoB</span>
                                <span className="font-black text-slate-800 truncate">{student.gender || 'N/A'}{student.dateOfBirth ? ` • ${student.dateOfBirth}` : ''}</span>
                              </div>
                              <div className="flex items-baseline gap-1 truncate">
                                <span className="text-slate-400 font-bold shrink-0">Parent</span>
                                <span className="font-black text-slate-800 truncate">{student.fatherName || student.guardianName || 'N/A'}</span>
                              </div>
                              <div className="flex items-baseline gap-1 truncate">
                                <span className="text-slate-400 font-bold shrink-0">Phone</span>
                                <span className="font-mono font-black text-[#0f7343] truncate">{student.phone1 || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Column 3: QR Code */}
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            <div className="bg-white p-1 rounded-lg border-2 border-emerald-200 shadow-[0_2px_8px_rgba(15,115,67,0.15)]">
                              <QRCodeSVG 
                                value={qrPayload} 
                                size={64} 
                                level="M" 
                                includeMargin={false}
                                fgColor="#0f172a"
                              />
                            </div>
                            <span className="text-[6.5px] font-black uppercase tracking-wider text-[#0f7343]">Scan QR</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Footer */}
                      <div className="bg-gradient-to-r from-[#0a5c33] via-[#0f7343] to-[#1a9456] px-4 py-1.5 flex items-center justify-between">
                        <span className="text-[8px] font-black text-amber-300 uppercase tracking-wider">AI Integrated Academy Argungu</span>
                        <span className="text-[7px] font-bold text-emerald-200 uppercase tracking-wide">Official ID Badge</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOFT 3D GATE SCANNER SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Soft 3D Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 rounded-3xl p-6 border border-emerald-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Interactive Mobile Scanner Simulation</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Offline Gate Security Scanner</h3>
                  <p className="text-xs text-slate-300 font-medium max-w-xl">
                    Test how school security guards scan the parent pickup card at closing time. The scanner extracts student photo, class arm, and authorized parent phone numbers directly from the QR code without internet connection.
                  </p>
                </div>

                {/* Quick Student Selector */}
                <div className="w-full sm:w-auto bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-inner space-y-2">
                  <label className="text-[11px] font-black uppercase text-emerald-400 block tracking-wider">
                    Select Card to Simulate Scan:
                  </label>
                  <select
                    value={simulatedStudent?.id || ''}
                    onChange={(e) => {
                      const found = students.find(s => s.id === e.target.value);
                      if (found) setSimulatedStudent(found);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({getStudentClassArm(s.intendedClass, s.id, students)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Soft 3D Mobile Phone Layout Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left Side: Soft 3D Mobile Phone Mockup */}
                <div className="bg-slate-900 rounded-[3rem] p-5 border-4 border-slate-800 shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative max-w-sm mx-auto w-full space-y-4">
                  
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto shadow-inner mb-2" />

                  {/* Phone Display Screen */}
                  <div className="bg-slate-950 rounded-[2rem] p-4 border border-slate-800 space-y-4 overflow-hidden shadow-inner">
                    
                    {/* App Header Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0f7343] to-emerald-400 flex items-center justify-center text-white font-black text-xs">
                          AI
                        </div>
                        <span className="text-xs font-black text-white">AI Academy Pickup</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        OFFLINE
                      </span>
                    </div>

                    {/* Camera Scanner Viewfinder Simulator */}
                    <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500/40 flex flex-col items-center justify-center p-3 text-center space-y-2">
                      <div className="absolute inset-4 border-2 border-dashed border-emerald-400/60 rounded-xl animate-pulse" />
                      
                      <Camera className="w-8 h-8 text-emerald-400 relative z-10" />
                      <p className="text-[10px] font-bold text-slate-300 relative z-10">
                        Point camera at Parent Pickup QR Code
                      </p>
                    </div>

                    {/* Verification Result Sheet (Soft 3D Popup Card) */}
                    {simulatedStudent && (
                      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-4 border border-emerald-500/40 shadow-xl space-y-3 animate-slide-up">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            AUTHENTICATED
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Just Now</span>
                        </div>

                        {/* Student Details */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-xl overflow-hidden bg-slate-800 border border-emerald-400/40 shrink-0">
                            {simulatedStudent.photo ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={simulatedStudent.photo} alt={simulatedStudent.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                                {simulatedStudent.firstName[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-sm text-white truncate">
                              {simulatedStudent.firstName} {simulatedStudent.lastName}
                            </h4>
                            <span className="text-[11px] font-black text-emerald-400 block">
                              {getStudentClassArm(simulatedStudent.intendedClass, simulatedStudent.id, students)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Adm No: {getStudentAdmissionNumber(simulatedStudent)}
                            </span>
                          </div>
                        </div>

                        {/* Parent Contact Details */}
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                          <p className="text-slate-300 truncate">
                            <strong className="text-slate-400">Parent:</strong> {simulatedStudent.fatherName || simulatedStudent.guardianName || 'N/A'}
                          </p>
                          <p className="text-slate-300 flex items-center justify-between">
                            <span><strong>Phone:</strong> {simulatedStudent.phone1 || 'N/A'}</span>
                            {simulatedStudent.phone1 && (
                              <a href={`tel:${simulatedStudent.phone1}`} className="text-emerald-400 font-bold underline flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Call
                              </a>
                            )}
                          </p>
                        </div>

                        {/* Soft 3D Release Button */}
                        <button
                          type="button"
                          onClick={() => handleApprovePickup(simulatedStudent)}
                          className={`w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,115,67,0.4)] transition-all cursor-pointer border ${
                            justApproved
                              ? 'bg-emerald-500 text-white border-emerald-300'
                              : 'bg-gradient-to-r from-emerald-600 via-[#0f7343] to-emerald-700 hover:from-emerald-500 hover:to-[#0b5c34] text-white border-emerald-400/40'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>{justApproved ? 'RELEASE APPROVED ✓' : 'APPROVE & RELEASE STUDENT'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Scan Audit History & Offline Sync Logs */}
                <div className="space-y-5">
                  <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span>Today&apos;s Gate Pickup Logs</span>
                      </h4>
                      <span className="text-xs font-mono font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-300">
                        {pickupLogs.length} Release(s)
                      </span>
                    </div>

                    {pickupLogs.length === 0 ? (
                      <div className="py-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                        <Scan className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-400">No pickup logs recorded yet today.</p>
                        <p className="text-[11px] text-slate-500">Select a student on the left and tap &quot;Approve & Release Student&quot; to test logging.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {pickupLogs.map((log, idx) => (
                          <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <h5 className="font-black text-white">{log.name}</h5>
                              <span className="text-[10px] text-emerald-400 font-bold">{log.status}</span>
                            </div>
                            <span className="font-mono text-slate-400 font-semibold">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flutter App Code Package Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 space-y-3">
                    <h4 className="text-sm font-black text-emerald-300 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>Flutter App Code Base Ready</span>
                    </h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      The Flutter offline mobile app source code is ready in your project directory at <code className="font-mono bg-slate-950 px-2 py-0.5 rounded text-emerald-400">/flutter_app</code>. You can build it to Android APK or iOS anytime!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print CSS Styles for Batch Printing CR80 Badges */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .id-card-wrapper, .id-card-wrapper * {
            visibility: visible;
          }
          .fixed {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/** Draw text scaled down to fit within maxWidth. Returns actual drawn width. */
function fillScaledText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
): void {
  const measured = ctx.measureText(text).width;
  if (measured > maxWidth) {
    // Save current font, compute scale
    const currentFont = ctx.font;
    const scale = maxWidth / measured;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    ctx.font = currentFont; // restore font reference
  } else {
    ctx.fillText(text, x, y);
  }
}

/** Draw a label–value row. Label in grey, value in dark/accent. */
function drawRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  colW: number,
  labelFont: string,
  valueFont: string,
  valueColor: string
): void {
  // Separator line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + colW, y - 8);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#334155';
  ctx.font = labelFont;
  ctx.fillText(label, x, y + 14);

  // Value
  ctx.fillStyle = valueColor;
  ctx.font = valueFont;
  const labelMeasured = ctx.measureText(label).width + 12;
  const valueMaxW = colW - labelMeasured;
  fillScaledText(ctx, value, x + labelMeasured, y + 14, valueMaxW);
}

// ─── Main ID card image renderer ────────────────────────────────────────────

async function generateIDCardImageBlob(
  student: Student,
  classArm: string,
  admissionNo: string,
  logoSrc: string
): Promise<Blob> {
  // CR80 card at 150 DPI (good resolution, half of 300 for performance)
  const W = 1011;
  const H = 560;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Safe field helpers ──────────────────────────────────────────────────
  const safeStr = (v: string | undefined | null, fallback = 'N/A') =>
    (v && v.trim()) ? v.trim() : fallback;

  const fullName   = `${safeStr(student.firstName, '')} ${safeStr(student.lastName, '')}`.trim() || 'N/A';
  const gender     = safeStr(student.gender);
  const dob        = safeStr(student.dateOfBirth, '');
  const genderDob  = dob ? `${gender}  •  ${dob}` : gender;
  const parentName = safeStr(student.fatherName || student.guardianName);
  const phone      = safeStr(student.phone1 || student.phone2);
  const admNoStr   = safeStr(admissionNo || student.admissionNumber || student.formNumber);
  const cls        = safeStr(classArm);

  // ── Background ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Subtle dot pattern on body
  ctx.fillStyle = '#e2e8f0';
  for (let dx = 20; dx < W; dx += 22) {
    for (let dy = 140; dy < H - 55; dy += 22) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Left accent bar (green → amber → green)
  const grad = ctx.createLinearGradient(0, 137, 0, H - 55);
  grad.addColorStop(0, '#0f7343');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#0f7343');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 137, 10, H - 137 - 55);

  // Outer border
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // ── Watermark logo (centered in body area) ─────────────────────────────
  if (logoSrc) {
    try {
      const wmImg = await loadImage(logoSrc);
      const WM = 220;
      const wmX = (W - WM) / 2;
      const wmY = 130 + (H - 130 - 55 - WM) / 2;
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.drawImage(wmImg, wmX, wmY, WM, WM);
      ctx.restore();
    } catch { /* skip */ }
  }

  // ── Top emerald banner with gradient ──────────────────────────────────
  const BANNER_H = 130;
  const bannerGrad = ctx.createLinearGradient(0, 0, W, 0);
  bannerGrad.addColorStop(0, '#0a5c33');
  bannerGrad.addColorStop(0.5, '#0f7343');
  bannerGrad.addColorStop(1, '#1a9456');
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, 0, W, BANNER_H);

  // Diagonal stripe overlay on banner
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffffff';
  for (let sx = -BANNER_H; sx < W + BANNER_H; sx += 18) {
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + BANNER_H, BANNER_H);
    ctx.lineTo(sx + BANNER_H + 8, BANNER_H);
    ctx.lineTo(sx + 8, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Gold accent stripe (thicker)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, BANNER_H, W, 9);

  // School logo (circular clip with white ring + amber ring)
  if (logoSrc) {
    try {
      const logoImg = await loadImage(logoSrc);
      // Amber outer ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(72, 65, 46, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.restore();
      // White inner ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(72, 65, 43, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      // Clip and draw logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(72, 65, 40, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, 32, 25, 80, 80);
      ctx.restore();
    } catch { /* skip on error */ }
  }

  // School name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  fillScaledText(ctx, 'AI INTEGRATED ACADEMY', 135, 60, W - 330);

  // Sub-title
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 18px sans-serif';
  fillScaledText(ctx, 'STUDENT IDENTITY CARD  •  ARGUNGU', 135, 98, W - 280);

  // Admission No pill (top right)
  const pillW = 240;
  const pillX = W - pillW - 20;
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(pillX, 44, pillW, 46, 10);
  } else {
    ctx.rect(pillX, 44, pillW, 46);
  }
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 20px monospace';
  fillScaledText(ctx, admNoStr, pillX + 12, 76, pillW - 20);

  // ── Student photo (left column) ────────────────────────────────────────
  const PX = 22;
  const PY = BANNER_H + 22;
  const PW = 195;
  const PH = 225;

  // Photo shadow
  ctx.save();
  ctx.shadowColor = 'rgba(15,115,67,0.3)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(PX - 3, PY - 3, PW + 6, PH + 6);
  ctx.restore();

  // Photo border (rounded via clip)
  ctx.save();
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(PX, PY, PW, PH, 10);
    ctx.clip();
  }

  let photoLoaded = false;
  if (student.photo) {
    try {
      const photoImg = await loadImage(student.photo);
      ctx.drawImage(photoImg, PX, PY, PW, PH);
      photoLoaded = true;
    } catch { photoLoaded = false; }
  }
  if (!photoLoaded) {
    const pgGrad = ctx.createLinearGradient(PX, PY, PX + PW, PY + PH);
    pgGrad.addColorStop(0, '#ecfdf5');
    pgGrad.addColorStop(1, '#d1fae5');
    ctx.fillStyle = pgGrad;
    ctx.fillRect(PX, PY, PW, PH);
    ctx.fillStyle = '#0f7343';
    ctx.font = 'bold 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((student.firstName || 'S')[0].toUpperCase(), PX + PW / 2, PY + PH / 2 + 30);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  // Green border around photo
  ctx.strokeStyle = '#0f7343';
  ctx.lineWidth = 4;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(PX, PY, PW, PH, 10);
    ctx.stroke();
  } else {
    ctx.strokeRect(PX, PY, PW, PH);
  }

  // Photo label pill below
  const lblW = 130;
  const lblX = PX + (PW - lblW) / 2;
  const lblY = PY + PH + 8;
  ctx.fillStyle = '#ecfdf5';
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(lblX, lblY, lblW, 22, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#0f7343';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PASSPORT PHOTO', PX + PW / 2, lblY + 15);
  ctx.textAlign = 'left';

  // ── Student details (middle column) ───────────────────────────────────
  const TX    = PX + PW + 30;  // text column start x
  const COL_W = W - TX - 220;  // width of middle column
  let   ty    = BANNER_H + 18; // running Y position

  // Section label
  ctx.fillStyle = '#0f7343';
  ctx.font      = 'bold 14px sans-serif';
  ctx.fillText('STUDENT DETAILS', TX, ty + 14);
  ty += 62;

  // Full name (big)
  ctx.fillStyle = '#0f172a';
  ctx.font      = 'bold 30px sans-serif';
  fillScaledText(ctx, fullName, TX, ty, COL_W);
  ty += 36;

  // Class arm pill
  const CLASS_PILL_H = 34;
  const CLASS_PILL_W = Math.min(COL_W, 260);
  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(TX, ty, CLASS_PILL_W, CLASS_PILL_H, 8);
  } else {
    ctx.rect(TX, ty, CLASS_PILL_W, CLASS_PILL_H);
  }
  ctx.fill();
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#065f46';
  ctx.font      = 'bold 22px sans-serif';
  fillScaledText(ctx, cls, TX + 12, ty + 24, CLASS_PILL_W - 20);
  ty += CLASS_PILL_H + 20;

  // ─ Detail rows ─
  const LABEL_FONT = 'bold 17px sans-serif';
  const VALUE_FONT = 'bold 20px sans-serif';
  const ROW_GAP    = 44;

  // Row 1: Gender & DoB
  drawRow(ctx, 'Gender / D.O.B:', genderDob,
    TX, ty, COL_W, LABEL_FONT, VALUE_FONT, '#1e293b');
  ty += ROW_GAP;

  // Row 2: Admission No
  drawRow(ctx, 'Adm. No:', admNoStr,
    TX, ty, COL_W, LABEL_FONT, 'bold 18px monospace', '#0f7343');
  ty += ROW_GAP;

  // Row 3: Parent / Guardian
  drawRow(ctx, 'Parent / Guardian:', parentName,
    TX, ty, COL_W, LABEL_FONT, 'bold 18px sans-serif', '#0f172a');
  ty += ROW_GAP;

  // Row 4: Phone
  drawRow(ctx, 'Phone:', phone,
    TX, ty, COL_W, LABEL_FONT, 'bold 18px monospace', '#0f7343');

  // ── QR Code (right column) ─────────────────────────────────────────────
  const QR_SIZE = 185;
  const QRX     = W - QR_SIZE - 22;
  const QRY     = BANNER_H + 28;

  const qrPayload = JSON.stringify({
    id:   student.id,
    fn:   student.firstName,
    ln:   student.lastName,
    admNo: admNoStr,
    form: safeStr(student.formNumber, ''),
    cls:  cls,
    fa:   parentName,
    ph:   phone
  });

  // QR background box
  ctx.fillStyle = '#f8fafc';
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(QRX - 8, QRY - 8, QR_SIZE + 16, QR_SIZE + 40, 8);
    ctx.fill();
  } else {
    ctx.fillRect(QRX - 8, QRY - 8, QR_SIZE + 16, QR_SIZE + 40);
  }
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(QRX - 8, QRY - 8, QR_SIZE + 16, QR_SIZE + 40);

  // Draw QR using the 'qrcode' npm package (fully offline)
  try {
    const QRCodeLib: typeof QRCode = (await import('qrcode')).default;
    const qrCanvas = document.createElement('canvas');
    await QRCodeLib.toCanvas(qrCanvas, qrPayload, {
      width: QR_SIZE,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#f8fafc' }
    });
    ctx.drawImage(qrCanvas, QRX, QRY);
  } catch {
    // Fallback: draw a placeholder cross-hatch to indicate QR position
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(QRX, QRY, QR_SIZE, QR_SIZE);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR CODE', QRX + QR_SIZE / 2, QRY + QR_SIZE / 2);
    ctx.textAlign = 'left';
  }

  // QR label
  ctx.fillStyle = '#0f7343';
  ctx.font      = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STUDENT QR ID', QRX + QR_SIZE / 2, QRY + QR_SIZE + 26);
  ctx.textAlign = 'left';

  // ── Footer ─────────────────────────────────────────────────────────────
  const FOOTER_Y = H - 52;
  const footerGrad = ctx.createLinearGradient(0, FOOTER_Y, W, FOOTER_Y);
  footerGrad.addColorStop(0, '#0a5c33');
  footerGrad.addColorStop(0.5, '#0f7343');
  footerGrad.addColorStop(1, '#1a9456');
  ctx.fillStyle = footerGrad;
  ctx.fillRect(0, FOOTER_Y, W, 52);

  ctx.fillStyle = '#fbbf24';
  ctx.font      = 'bold 19px sans-serif';
  ctx.fillText('AI Integrated Academy Argungu', 30, H - 16);

  ctx.fillStyle  = '#a7f3d0';
  ctx.font       = 'bold 16px sans-serif';
  ctx.textAlign  = 'right';
  ctx.fillText('Official Student Identity Card', W - 30, H - 16);
  ctx.textAlign  = 'left';

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ?? new Blob([], { type: 'image/png' }));
    }, 'image/png');
  });
}
