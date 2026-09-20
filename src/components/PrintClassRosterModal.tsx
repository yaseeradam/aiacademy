'use client';

import React, { useState, useMemo } from 'react';
import { Student } from '@/types';
import { 
  X, Printer, GraduationCap, CheckCircle2, 
  Users, Filter, Eye, Phone, Sparkles 
} from 'lucide-react';
import { getStudentClassArm, getStudentAdmissionNumber } from '@/lib/classUtils';
import { printStudentsByClassRoster, printOfficialClassEnrolmentRoster } from '@/lib/printUtils';

interface PrintClassRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classList: string[];
  classStudentMap: Record<string, Student[]>;
  schoolSettings: {
    name?: string;
    schoolName?: string;
    logo?: string;
    [key: string]: unknown;
  };
}

export default function PrintClassRosterModal({
  isOpen,
  onClose,
  students,
  classList,
  classStudentMap,
  schoolSettings,
}: PrintClassRosterModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showParentContact, setShowParentContact] = useState<boolean>(true);
  const [showPaymentStatus, setShowPaymentStatus] = useState<boolean>(true);
  const [showGender, setShowGender] = useState<boolean>(true);

  if (!isOpen) return null;

  // Filter students based on selection
  const previewStudents = useMemo(() => {
    if (selectedClass === 'all') return students;
    return students.filter(s => {
      const arm = getStudentClassArm(s.intendedClass, s.id, students);
      return arm === selectedClass || arm.startsWith(selectedClass);
    });
  }, [students, selectedClass]);

  const handlePrint = (classToPrint = selectedClass) => {
    printStudentsByClassRoster({
      students,
      logoSrc: schoolSettings.logo || '/logo.jpg',
      schoolName: schoolSettings.schoolName || schoolSettings.name || 'AI INTEGRATED ACADEMY ARGUNGU',
      selectedClass: classToPrint,
      showParentContact,
      showPaymentStatus,
      showGender,
      academicSession: '2026/2027',
    });
  };

  const handlePrintOfficialRoster = (armName: string) => {
    const armStudents = students.filter(s => {
      const arm = getStudentClassArm(s.intendedClass, s.id, students);
      return arm === armName;
    });
    printOfficialClassEnrolmentRoster({
      subgroupName: armName,
      students: armStudents,
      schoolName: schoolSettings.schoolName || schoolSettings.name || 'AI ACADEMY ARGUNGU',
      logoSrc: schoolSettings.logo || '/logo.jpg',
      academicSession: '2025/2026',
      term: '1st Term Regular Roster',
      directorate: 'Primary & Early Years Directorate',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0a5c33] via-[#0f7343] to-[#168a4f] text-white p-5 sm:p-6 flex items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black border border-white/20 shadow-inner">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Print Student Lists by Class
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
                  Official A4
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Generate clean, official student name rosters grouped by class arms.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/20"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Total Students</span>
              <span className="text-xl font-black text-[#0f7343] block mt-0.5">{students.length}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3.5">
              <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">Class Arms</span>
              <span className="text-xl font-black text-blue-700 block mt-0.5">{classList.length}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">Selected For Print</span>
              <span className="text-xl font-black text-amber-700 block mt-0.5">
                {selectedClass === 'all' ? `${students.length} (All)` : `${previewStudents.length}`}
              </span>
            </div>
          </div>

          {/* Class Selector Dropdown & Quick Badges */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#0f7343]" />
              <span>Select Class to Print:</span>
            </label>
            
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#0f7343] focus:bg-white transition-all cursor-pointer shadow-xs"
            >
              <option value="all">⭐ Print All Classes & Arms ({students.length} Total Students)</option>
              {classList.map(cls => (
                <option key={cls} value={cls}>
                  {cls} — ({classStudentMap[cls]?.length || 0} Students)
                </option>
              ))}
            </select>

            {/* Quick Class Pills for faster 1-click filtering */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => setSelectedClass('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedClass === 'all'
                    ? 'bg-[#0f7343] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Classes
              </button>
              {classList.slice(0, 6).map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedClass === cls
                      ? 'bg-[#0f7343] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cls.replace(/Nursery|Basic/g, (m) => m === 'Nursery' ? 'Nur' : 'Bas')} ({classStudentMap[cls]?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Print Column Options */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider block">
              Customize Table Columns to Include:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300">
                <input
                  type="checkbox"
                  checked={showGender}
                  onChange={(e) => setShowGender(e.target.checked)}
                  className="rounded text-[#0f7343] focus:ring-[#0f7343] cursor-pointer"
                />
                <span>Gender Column</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300">
                <input
                  type="checkbox"
                  checked={showParentContact}
                  onChange={(e) => setShowParentContact(e.target.checked)}
                  className="rounded text-[#0f7343] focus:ring-[#0f7343] cursor-pointer"
                />
                <span>Parent & Phone</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300">
                <input
                  type="checkbox"
                  checked={showPaymentStatus}
                  onChange={(e) => setShowPaymentStatus(e.target.checked)}
                  className="rounded text-[#0f7343] focus:ring-[#0f7343] cursor-pointer"
                />
                <span>Fee Paid Status</span>
              </label>
            </div>
          </div>

          {/* Quick Preview Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Roster Preview ({previewStudents.length} student{previewStudents.length !== 1 ? 's' : ''}):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Adm No format: AIAA-B26-XXX
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 text-xs shadow-inner">
              {previewStudents.length === 0 ? (
                <div className="p-4 text-center text-slate-400 font-medium">No students found in this selection.</div>
              ) : (
                previewStudents.slice(0, 10).map((s, idx) => {
                  const arm = getStudentClassArm(s.intendedClass, s.id, students);
                  const admNo = getStudentAdmissionNumber(s);
                  return (
                    <div key={s.id} className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-400 font-mono w-5 shrink-0 text-right">{idx + 1}.</span>
                        <span className="font-bold text-slate-800 truncate">{s.firstName} {s.lastName}</span>
                        <span className="text-[10px] font-mono text-[#0f7343] font-black bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                          {admNo}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        {arm}
                      </span>
                    </div>
                  );
                })
              )}
              {previewStudents.length > 10 && (
                <div className="p-2 text-center text-[11px] font-bold text-slate-400 bg-slate-50">
                  + {previewStudents.length - 10} more students will be included in the printout
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {selectedClass !== 'all' && (
              <>
                <button
                  type="button"
                  onClick={() => handlePrintOfficialRoster(selectedClass)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0b2545] hover:bg-[#133a6b] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-[#1e487d] shadow-xs"
                  title="Print Official A4 Roster with Signatures & Stamp"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Official PDF Roster</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint('all')}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Print all classes at once"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Print All ({students.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handlePrint(selectedClass)}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-[#0f7343] to-emerald-600 hover:from-[#0b5c34] hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-[0_4px_16px_rgba(15,115,67,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>
                {selectedClass === 'all' 
                  ? `Print All Classes (${students.length} Students)` 
                  : `Print ${selectedClass} (${previewStudents.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
