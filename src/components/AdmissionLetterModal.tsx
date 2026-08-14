'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/types';
import { X, Printer, FileText, CheckCircle2, MapPin, Phone, Mail } from 'lucide-react';
import { getSchoolSettingsAction } from '@/app/actions';

interface AdmissionLetterModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdmissionLetterModal({ student, isOpen, onClose }: AdmissionLetterModalProps) {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_academy_school_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.logo) return parsed.logo;
        } catch {}
      }
    }
    return '/logo.jpg';
  });

  useEffect(() => {
    let isSubscribed = true;
    getSchoolSettingsAction().then(settings => {
      if (isSubscribed && settings?.logo) {
        setLogoSrc(settings.logo);
      }
    });
    return () => {
      isSubscribed = false;
    };
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = student.admissionDate || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const academicSession = student.academicSession || '2026/2027';
  const resumptionDate = student.resumptionDate || '15th September, 2026';

  return (
    <>
      {/* Print-only styles to ensure clean single-page A4 PDF */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide everything on the page */
          body > * {
            display: none !important;
          }
          /* Show only the modal root and its contents */
          body > #__next,
          body > div[data-nextjs-scroll-focus-boundary] {
            display: block !important;
          }
          #__next > * {
            display: none !important;
          }
          #__next main,
          #__next > div {
            display: block !important;
          }
          /* The actual print target */
          #admission-letter-print-root {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          #admission-letter-print-root * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
          #admission-letter-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: auto !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div id="admission-letter-print-root" className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      
      {/* Modal Container */}
      <div className="bg-white md:rounded-3xl max-w-4xl w-full h-full md:h-auto md:max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-slide-down">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 md:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black tracking-tight leading-tight">Official A4 Admission Letter</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Student: {student.firstName} {student.lastName} ({student.formNumber})</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:hidden hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body Area */}
        <div id="printable-admission-letter" className="p-4 sm:p-8 md:p-12 overflow-y-auto flex-1 bg-slate-100">
          
          {/* A4 Paper Sheet Container */}
          <div id="admission-letter-sheet" className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl border border-slate-200 shadow-md max-w-3xl mx-auto relative overflow-hidden">
            
            {/* Watermark background logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] select-none z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="" className="w-[500px] h-[500px] object-contain" />
            </div>

            {/* Main Letter Content (Above Watermark) */}
            <div className="relative z-10 space-y-6 text-slate-900 font-serif">
              
              {/* 1. Header Section — Matching Letterhead Design */}
              <div className="space-y-3">
                {/* Logo + School Name + Motto */}
                <div className="flex items-center gap-5 sm:gap-7">
                  {/* Circular Logo Badge */}
                  <div className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} alt="School Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                  
                  {/* School Name + Motto */}
                  <div className="font-sans">
                    <h1 className="text-[28px] sm:text-[38px] md:text-[42px] font-black text-[#1B3A6B] tracking-tight uppercase leading-[1.1]">
                      AI INTEGRATED<br />ACADEMY ARGUNGU
                    </h1>
                    <div className="mt-2.5 inline-block bg-[#D4851F] text-white px-5 py-1.5 text-[12px] sm:text-[14px] font-semibold italic rounded-[3px] shadow-sm">
                      Motto: <em className="font-semibold">Learning Today Leading Tomorrow</em>
                    </div>
                  </div>
                </div>

                {/* Contact Details — Each on its own row with icons */}
                <div className="pl-1 text-[12px] sm:text-[13px] text-[#333] font-sans space-y-1.5 leading-snug">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#1B3A6B] shrink-0" strokeWidth={2.5} />
                    <span>Behind Buben Ta&apos;Ololo&apos;s Residence, Tudun Wada, Argungu, Kebbi State</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#1B3A6B] shrink-0" strokeWidth={2.5} />
                    <span>08069676697, 07034784861</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#1B3A6B] shrink-0" strokeWidth={2.5} />
                    <span>alijabaintegratedacademyarg@gmail.com</span>
                  </div>
                </div>

                {/* Double Divider — Navy Blue top, Orange bottom */}
                <div className="pt-1">
                  <div className="h-[4px] bg-[#1B3A6B] w-full rounded-sm" />
                  <div className="h-[4px] bg-[#D4851F] w-full mt-[3px] rounded-sm" />
                </div>
              </div>

              {/* 2. Top Info Row: Date, Student Meta & Passport Photograph */}
              <div className="font-sans flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                
                {/* Left Meta Info */}
                <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Student Name:</span>
                    <span className="font-black text-slate-900 border-b border-slate-400 pb-0.5 px-1 min-w-[200px] inline-block uppercase">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Admission Number:</span>
                    <span className="font-black text-slate-900 font-mono border-b border-slate-400 pb-0.5 px-1 min-w-[180px] inline-block">
                      {student.admissionNumber || student.formNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Class:</span>
                    <span className="font-black text-slate-900 border-b border-slate-400 pb-0.5 px-1 min-w-[150px] inline-block">
                      {student.intendedClass}
                    </span>
                  </div>
                </div>

                {/* Right Column: Date & Passport Photograph */}
                <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    <span>Date: </span>
                    <span className="border-b border-slate-400 pb-0.5 px-2 font-semibold">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Passport Photo Box (User Prompt Requirement) */}
                  <div className="w-28 h-32 border-2 border-slate-700 p-1 bg-white shadow-xs rounded-sm flex flex-col items-center justify-center shrink-0 relative">
                    {student.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={student.photo} alt="Student Passport" className="w-full h-full object-cover rounded-xs" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-center p-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">PASSPORT</span>
                        <span className="text-[9px] font-semibold text-slate-400 mt-1">PHOTOGRAPH</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Letter Subject Line */}
              <div className="text-center pt-2 pb-1 font-sans">
                <h2 className="text-base sm:text-lg font-black text-slate-900 underline uppercase tracking-wide">
                  SUBJECT: ADMISSION LETTER
                </h2>
              </div>

              {/* 4. Letter Body Paragraphs */}
              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-800 font-normal text-justify">
                <p className="font-bold font-sans">Dear Parent/Guardian,</p>

                <p>
                  We are pleased to inform you that your child has been offered admission into{' '}
                  <strong className="font-bold font-sans">AI Integrated Academy Argungu</strong> for the{' '}
                  <span className="font-bold border-b border-slate-400 px-1">{academicSession}</span> Academic Session.
                </p>

                <p>
                  The admission is offered based on the assessment and admission requirements of the school. We are
                  delighted to welcome your child into our learning community and look forward to supporting his/her
                  academic, moral, and personal development.
                </p>

                <p>
                  Please complete the registration process and settle the applicable school fees and other required charges on
                  or before the stated deadline. Admission is subject to compliance with the school&apos;s rules, regulations, and
                  code of conduct.
                </p>

                <p>
                  We kindly request that the parent/guardian report to the school for final registration and submission of the
                  required documents.
                </p>

                <p>
                  We congratulate you and your child on this opportunity and look forward to a successful and rewarding
                  academic journey together.
                </p>
              </div>

              {/* 5. Summary Table */}
              <div className="pt-2 font-sans">
                <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm">
                  <tbody>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 w-1/2 border-r border-slate-400">Student Name</td>
                      <td className="p-2.5 font-extrabold text-slate-900 uppercase">{student.firstName} {student.lastName}</td>
                    </tr>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-400">Class / Level</td>
                      <td className="p-2.5 font-extrabold text-slate-900">{student.intendedClass}</td>
                    </tr>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-400">Academic Session</td>
                      <td className="p-2.5 font-bold text-slate-900">{academicSession}</td>
                    </tr>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-400">Resumption Date</td>
                      <td className="p-2.5 font-bold text-slate-900">{resumptionDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 6. Sign-off Block */}
              <div className="pt-6 font-sans space-y-4">
                <p className="text-xs sm:text-sm font-semibold text-slate-800">Yours faithfully,</p>
                
                <div className="pt-4">
                  <div className="w-56 border-b-2 border-slate-800 mb-1" />
                  <p className="font-extrabold text-sm text-slate-900">Prof. Murtala Ahmed Rufa&apos;i</p>
                  <p className="text-xs font-semibold text-slate-700">Executive Director</p>
                  <p className="text-xs font-bold text-slate-800">AI Integrated Academy Argungu</p>
                </div>
              </div>

              {/* Official Seal / Paid Stamp */}
              <div className="pt-4 flex justify-between items-center border-t border-slate-200 font-sans text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>OFFICIALLY APPROVED & ISSUED BY SCHOOL ADMINISTRATION</span>
                </div>
                <div className="font-mono">
                  REF: {student.admissionNumber || student.formNumber}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
