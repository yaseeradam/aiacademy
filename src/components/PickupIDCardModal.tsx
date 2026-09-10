'use client';

import React, { useState } from 'react';
import { Student } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, ShieldCheck, Phone, User, GraduationCap, 
  Scan, Camera, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Download, Clock
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

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-slate-400">
                  Showing {displayStudents.length} card(s)
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-[#0f7343] hover:from-emerald-500 hover:to-[#0b5c34] text-white font-black text-xs rounded-xl shadow-[0_6px_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-2 border border-emerald-400/30"
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
                    form: student.formNumber || admissionNo,
                    cls: classArm,
                    fa: student.fatherName || student.guardianName || 'N/A',
                    mo: student.motherName || 'N/A',
                    ph: student.phone1 || student.phone2 || 'N/A'
                  });

                  return (
                    <div 
                      key={student.id} 
                      className="id-card-wrapper relative bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden flex flex-col justify-between text-slate-900 group hover:border-[#0f7343] transition-all print:border-2 print:border-slate-800 print:shadow-none print:rounded-2xl print:break-inside-avoid"
                      style={{ minHeight: '280px' }}
                    >
                      {/* Lanyard Hole Punch Slot Graphic */}
                      <div className="w-10 h-2 bg-slate-200 rounded-full mx-auto mt-2 border border-slate-300 shadow-inner" />

                      {/* Header Emerald Banner */}
                      <div className="bg-[#0f7343] text-white px-4 py-2.5 mt-1 border-b-2 border-amber-400 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoSrc} alt="School Logo" className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 border border-emerald-300 shadow-xs shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-white leading-none truncate">
                              AI INTEGRATED ACADEMY
                            </h4>
                            <span className="text-[8px] font-black text-amber-300 uppercase tracking-widest block mt-0.5">
                              PARENT PICKUP PASS • ARGUNGU
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono font-black bg-emerald-950/80 text-amber-300 px-2 py-0.5 rounded-md border border-emerald-400/40 shrink-0">
                          {student.formNumber || admissionNo}
                        </span>
                      </div>

                      {/* Main Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="flex items-start gap-3.5">
                          {/* Student Passport Photo */}
                          <div className="w-20 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-[#0f7343] shadow-md shrink-0 relative">
                            {student.photo ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#0f7343] font-black text-2xl">
                                {student.firstName[0]}{student.lastName?.[0] || ''}
                              </div>
                            )}
                          </div>

                          {/* Student Name & Class Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#0f7343] block">
                              STUDENT DETAILS
                            </span>
                            <h3 className="font-black text-base text-slate-900 tracking-tight leading-snug truncate">
                              {student.firstName} {student.lastName}
                            </h3>

                            <div className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-300 text-[#0f7343] text-[10px] font-black tracking-wide">
                              {classArm}
                            </div>

                            <div className="text-[10px] text-slate-600 font-semibold space-y-0.5 pt-1 border-t border-slate-100">
                              <p className="truncate">
                                <span className="text-slate-400 font-bold">Authorized Parent:</span> <strong className="text-slate-800 font-extrabold">{student.fatherName || student.guardianName || 'N/A'}</strong>
                              </p>
                              <p className="truncate">
                                <span className="text-slate-400 font-bold">Emergency Phone:</span> <strong className="font-mono text-[#0f7343] font-black">{student.phone1 || 'N/A'}</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* QR Code & Scan Footer */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#0f7343]" />
                            <div>
                              <span className="text-[9px] font-black text-slate-900 block leading-tight">OFFLINE SECURITY PASS</span>
                              <span className="text-[8px] font-bold text-slate-400">Authorized Gate Release</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                            <QRCodeSVG 
                              value={qrPayload} 
                              size={56} 
                              level="M" 
                              includeMargin={false}
                            />
                            <div className="pr-1 text-right">
                              <span className="text-[7px] font-black uppercase text-[#0f7343] block">SCAN AT GATE</span>
                              <span className="text-[7px] font-mono text-slate-400 block">100% Offline</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Stripe */}
                      <div className="h-1.5 bg-[#0f7343]" />
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
                            <span className="text-[10px] font-mono text-slate-400">
                              Form: {simulatedStudent.formNumber || 'AIA/2026'}
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
