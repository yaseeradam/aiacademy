'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getSchoolSettingsAction } from '@/app/actions';

interface VerificationSlipModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  initialFormat?: 'slip' | 'id-card';
}

export default function VerificationSlipModal({ student, isOpen, onClose, initialFormat = 'slip' }: VerificationSlipModalProps) {
  const [activeFormat, setActiveFormat] = useState<'slip' | 'id-card'>(initialFormat);
  const [prevInitialFormat, setPrevInitialFormat] = useState(initialFormat);

  if (initialFormat !== prevInitialFormat) {
    setPrevInitialFormat(initialFormat);
    setActiveFormat(initialFormat);
  }

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

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard?verify=${student.formNumber}`
    : `https://ai-academy.edu/verify?form=${student.formNumber}`;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      
      {/* Modal Card Container */}
      <div className="bg-white md:rounded-3xl max-w-4xl w-full h-full md:h-auto md:max-h-[92vh] shadow-2xl overflow-hidden flex flex-col animate-slide-down">
        
        {/* Modal Top Bar (Non-Printable) */}
        <div className="p-4 md:p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black tracking-tight leading-tight">Official Verification Certificate</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Form No: {student.formNumber}</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 md:hidden hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Controls Row (Format Selector + Download/Print Button) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Format Toggle */}
            <div className="bg-slate-800 p-1 rounded-xl grid grid-cols-2 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setActiveFormat('slip')}
                className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                  activeFormat === 'slip' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                📄 Slip
              </button>
              <button
                type="button"
                onClick={() => setActiveFormat('id-card')}
                className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                  activeFormat === 'id-card' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                🪪 ID Card
              </button>
            </div>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            {/* Desktop Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="hidden md:block p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Container */}
        <div id="printable-slip-area" className="p-3 sm:p-6 md:p-8 overflow-y-auto overflow-x-auto flex-1 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          
          {/* FORMAT 1: OFFICIAL FULL VERIFICATION SLIP */}
          {activeFormat === 'slip' && (
            <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto print:border-0 print:shadow-none print:p-0">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-green-700 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-0.5 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoSrc}
                      alt="AI Integrated Academy Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                      AI INTEGRATED ACADEMY ARGUNGU
                    </h1>
                    <p className="text-xs text-green-700 font-bold mt-1">
                      Behind Buben Ta&apos;Ololo&apos;s Residence, Tudun Wada, Argungu
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Motto: Learning Today, Leading Tomorrow | Tel: 08069676697, 07034784861
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Title & Badge */}
              <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    DOCUMENT TYPE
                  </span>
                  <h2 className="text-base font-black text-slate-800">
                    STUDENT ENROLLMENT VERIFICATION SLIP
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-800 border border-green-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>OFFICIALLY VERIFIED</span>
                </div>
              </div>

              {/* Student Main Details & Photo */}
              <div className="flex gap-6 mb-6">
                {/* Photo */}
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xl uppercase relative shadow-inner">
                  {student.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{student.firstName[0]}{student.lastName?.[0]}</span>
                  )}
                </div>

                {/* Main Fields Grid */}
                <div className="flex-1 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Form Serial No.</span>
                    <span className="font-extrabold text-slate-900 text-sm font-mono">{student.formNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Class Intended</span>
                    <span className="font-extrabold text-slate-900 text-sm">{student.intendedClass}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Student Full Name</span>
                    <span className="font-black text-slate-900 text-base">{student.firstName} {student.lastName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                    <span className="font-bold text-slate-800">{student.gender}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                    <span className="font-bold text-slate-800">{formatDate(student.dateOfBirth)}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 text-xs">
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-500 w-1/3">Father&apos;s Name:</td>
                      <td className="p-2.5 font-extrabold text-slate-800">{student.fatherName || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-2.5 font-bold text-slate-500">Mother&apos;s Name:</td>
                      <td className="p-2.5 font-extrabold text-slate-800">{student.motherName || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-500">Registered Parent Phone:</td>
                      <td className="p-2.5 font-extrabold text-slate-800">{student.phone1} {student.phone2 ? `/ ${student.phone2}` : ''}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-2.5 font-bold text-slate-500">Residential Address:</td>
                      <td className="p-2.5 font-bold text-slate-800">{student.residentialAddress || 'N/A'}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-500">Guardian Name & Address:</td>
                      <td className="p-2.5 font-bold text-slate-800">{student.guardianName || 'N/A'} ({student.guardianAddress || 'N/A'})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* QR Code & Verification Seal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <QRCodeSVG value={verificationUrl} size={70} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-tight">
                    <span className="font-bold text-slate-700 block">Scan to Verify Authenticity</span>
                    Serial: {student.formNumber}<br />
                    Verified: {new Date().toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block border-2 border-green-700 text-green-800 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border-dashed">
                    AI INTEGRATED ACADEMY<br />OFFICIAL SEAL & STAMP
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 2: COMPACT STUDENT ID CARD */}
          {activeFormat === 'id-card' && (
            <div className="flex justify-center items-center py-6">
              <div className="w-[340px] h-[520px] bg-white rounded-3xl border-2 border-slate-300 shadow-xl overflow-hidden flex flex-col justify-between relative print:shadow-none print:border-2">
                
                {/* ID Header */}
                <div className="bg-gradient-to-r from-green-800 to-green-600 text-white p-4 text-center relative">
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shrink-0 p-0.5 border border-white/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoSrc} alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <h3 className="font-black text-sm tracking-tight leading-tight uppercase">
                      AI INTEGRATED ACADEMY
                    </h3>
                  </div>
                  <p className="text-[9px] text-green-100 font-semibold mt-0.5">ARGUNGU, KEBBI STATE</p>
                </div>

                {/* ID Photo */}
                <div className="flex flex-col items-center my-2">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-green-600 shadow-md flex items-center justify-center font-bold text-slate-400 text-xl uppercase">
                    {student.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{student.firstName[0]}{student.lastName?.[0]}</span>
                    )}
                  </div>
                  
                  <h2 className="text-base font-black text-slate-900 mt-2 text-center">
                    {student.firstName} {student.lastName}
                  </h2>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-green-100 text-green-800 font-bold text-[10px] mt-0.5">
                    {student.intendedClass}
                  </span>
                </div>

                {/* ID Details */}
                <div className="px-5 text-[11px] space-y-1.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400 font-semibold">Form Serial No:</span>
                    <span className="font-black text-slate-800 font-mono">{student.formNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400 font-semibold">Gender:</span>
                    <span className="font-bold text-slate-800">{student.gender}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400 font-semibold">Parent Phone:</span>
                    <span className="font-bold text-slate-800">{student.phone1}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400 font-semibold">Status:</span>
                    <span className="font-extrabold text-green-700">VERIFIED</span>
                  </div>
                </div>

                {/* ID Footer with QR */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[8px] text-slate-400 font-bold leading-tight">
                    Official Student Identity Card<br />
                    AI Integrated Academy Argungu
                  </div>
                  <div className="p-1 bg-white border border-slate-200 rounded-md shadow-2xs">
                    <QRCodeSVG value={verificationUrl} size={42} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
