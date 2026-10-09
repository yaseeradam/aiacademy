'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowRight, AlertTriangle, Phone, ShieldCheck, X, 
  GraduationCap, Award, Lock, CheckCircle2, School, HelpCircle 
} from 'lucide-react';
import { loginAction, publicVerifyStudentAction, getSchoolSettingsAction } from './actions';
import { Student } from '@/types';

function LoginContent() {
  const searchParams = useSearchParams();
  const verifyParam = searchParams.get('verify') || searchParams.get('form');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [schoolLogo, setSchoolLogo] = useState<string>('/logo.jpg');
  const [schoolName, setSchoolName] = useState<string>('AI INTEGRATED ACADEMY ARGUNGU');
  const [schoolMotto, setSchoolMotto] = useState<string>('Learning Today, Leading Tomorrow');
  const [schoolPhones, setSchoolPhones] = useState<string>('08069676697, 07034784861');

  useEffect(() => {
    getSchoolSettingsAction().then(settings => {
      if (settings?.logo) setSchoolLogo(settings.logo);
      if (settings?.schoolName) setSchoolName(settings.schoolName);
      if (settings?.motto) setSchoolMotto(settings.motto);
      if (settings?.phones) setSchoolPhones(settings.phones);
    });
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    if (verifyParam) {
      publicVerifyStudentAction(verifyParam).then(res => {
        if (!isSubscribed) return;
        if (res.success && res.student) {
          setVerifiedStudent(res.student);
        } else {
          setVerifyError(res.error || 'Student serial number not found.');
        }
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [verifyParam]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await loginAction(formData);
      if (result && result.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'digest' in err && typeof (err as { digest: unknown }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')) throw err;
      const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-900 overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Graphic Patterns */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 filter blur-xs"
          style={{ backgroundImage: `radial-gradient(circle at 50% 50%, #065f46 0%, #064e3b 50%, #022c22 100%)` }}
        />
        <div 
          className="absolute inset-0 opacity-[0.06]" 
          style={{ 
            backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', 
            backgroundSize: '48px 48px' 
          }} 
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-teal-600/5 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* Top Header / Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={schoolLogo}
              alt={schoolName}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <span className="text-white font-extrabold text-sm sm:text-base tracking-tight block leading-tight">
              {schoolName}
            </span>
            <span className="text-emerald-400 text-[11px] font-semibold tracking-wider uppercase block">
              Student Information Portal
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>2025/2026 Academic Session</span>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px] animate-slide-up">
          {/* Card Wrapper */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 border border-slate-100/90 overflow-hidden">
            {/* Card Header Strip */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-6 py-6 text-white text-center relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center mb-3 border-2 border-emerald-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                Data Verification Portal
              </h1>
              <p className="text-emerald-100/90 text-xs font-medium mt-1">
                AI INTEGRATED ACADEMY ARGUNGU
              </p>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Parent & Staff Portal</span>
                  <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Secure Verification
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Enter your registered phone number to verify enrollment details, class allocations, and download official documents.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      placeholder="e.g. 0803 123 4567"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Error Alert Box */}
                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-start gap-2.5 animate-slide-down">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{error}</div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 hover:from-emerald-600 hover:to-teal-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-lg shadow-emerald-950/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In & Verify Profiles</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Help & Support */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    256-bit Encrypted Session
                  </span>
                  <span className="text-slate-400">Argungu, Kebbi State</span>
                </div>
                <div className="text-[11px] text-slate-400 text-center mt-1">
                  Need assistance? Contact School Desk: <span className="text-slate-700 font-bold">{schoolPhones}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
            &quot;{schoolMotto}&quot;
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>&copy; {new Date().getFullYear()} AI Integrated Academy Argungu. Official Portal.</span>
        </div>
      </footer>

      {/* Public QR Code Verification Modal */}
      {(verifiedStudent || verifyError) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-slide-up space-y-5 relative">
            <button
              onClick={() => {
                setVerifiedStudent(null);
                setVerifyError(null);
              }}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {verifyError ? (
              <div className="py-6 text-center space-y-3">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">Verification Not Found</h3>
                <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {verifyError}
                </p>
              </div>
            ) : verifiedStudent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">
                      OFFICIAL ENROLLMENT CERTIFICATE
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      Authentic Student Record
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80">
                  <div className="w-14 h-14 rounded-xl bg-white border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-emerald-800 text-lg uppercase shadow-xs">
                    {verifiedStudent.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={verifiedStudent.photo} alt={verifiedStudent.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{verifiedStudent.firstName[0]}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                      {verifiedStudent.firstName} {verifiedStudent.lastName}
                    </h4>
                    <p className="text-xs font-semibold text-slate-600">
                      Admission No: <code className="font-mono font-bold text-emerald-900">{verifiedStudent.admissionNumber || verifiedStudent.formNumber}</code>
                    </p>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      Class: {verifiedStudent.intendedClass} • {verifiedStudent.gender}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-semibold">
                  <p><strong className="text-slate-800">School:</strong> AI Integrated Academy Argungu</p>
                  <p><strong className="text-slate-800">Parent/Guardian:</strong> {verifiedStudent.fatherName || verifiedStudent.guardianName || 'N/A'}</p>
                  <p>
                    <strong className="text-slate-800">Status:</strong>{' '}
                    {verifiedStudent.verificationStatus === 'verified' ? (
                      <span className="text-emerald-700 font-extrabold uppercase">Officially Verified ✓</span>
                    ) : verifiedStudent.verificationStatus === 'requires_correction' ? (
                      <span className="text-amber-700 font-extrabold uppercase">Pending Correction ⚠</span>
                    ) : (
                      <span className="text-slate-500 font-extrabold uppercase">Pending Review</span>
                    )}
                  </p>
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => setVerifiedStudent(null)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Close Verification Seal
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-xs font-bold text-slate-400">Loading Portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
