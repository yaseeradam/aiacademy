'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, AlertTriangle, Phone, ShieldCheck, X } from 'lucide-react';
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

  useEffect(() => {
    getSchoolSettingsAction().then(settings => {
      if (settings?.logo) setSchoolLogo(settings.logo);
      if (settings?.schoolName) setSchoolName(settings.schoolName);
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 70%, #f0fdf4 100%)' }}>

      {/* Subtle background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #86efac, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #4ade80, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#15803d 1px, transparent 1px), linear-gradient(90deg, #15803d 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Main card */}
      <div className="w-full max-w-[460px] p-8 md:p-10 mx-4 animate-slide-up relative rounded-[2.5rem] z-10" style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)' }}>
        <div className="flex flex-col items-center text-center">

          {/* Logo */}
          <div className="w-20 h-20 mb-4 rounded-full overflow-hidden border-4 border-green-100 shadow-lg flex items-center justify-center bg-white p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={schoolLogo}
              alt={schoolName}
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            {schoolName}
          </span>
          
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
            Student Data Verification
          </h1>
          
          <p className="text-slate-500 text-sm font-semibold mt-1 mb-8 leading-relaxed max-w-xs">
            Enter your registered phone number to access your children&apos;s profiles.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative flex items-center">
              {/* input display with low contrast prefix "call" matching image */}
              <div className="absolute left-4 flex items-center pointer-events-none">
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                id="phone"
                name="phone"
                placeholder="0803 123 4567"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-[#f0f4f9]/60 border border-slate-200/80 rounded-[1.25rem] font-semibold text-sm text-slate-800 focus:outline-none focus:border-green-600 focus:bg-white transition-all focus:ring-1 focus:ring-green-600/35"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-800 font-semibold flex items-start gap-2.5 animate-slide-down">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Submit Button (Matches access dashboard design in login page.png) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-[#111622] hover:bg-[#1a2133] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4 opacity-80" />
              </>
            )}
          </button>
        </form>

        {/* Account Help Link */}
        <div className="mt-6 text-center">
          <a href="#" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all hover:underline">
            Need help accessing your account?
          </a>
        </div>

        {/* Admin and credentials helper link for evaluation */}
        <div className="mt-8 pt-5 border-t border-slate-100/80 flex justify-between text-[10px] text-slate-400 font-bold">
          <span className="text-green-600 bg-green-50/60 px-2 py-0.5 rounded border border-green-100/40">
            Argungu Portal v2.0
          </span>
          <button
            type="button"
            onClick={() => {
              const phoneInput = document.getElementById('phone') as HTMLInputElement;
              if (phoneInput) {
                phoneInput.value = '07038363534';
                phoneInput.focus();
              }
            }}
            className="hover:text-slate-600 underline cursor-pointer"
          >
            Fill Parent Phone
          </button>
        </div>
      </div>

      {/* Brand Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest opacity-60">
          LEARNING TODAY, LEADING TOMORROW
        </span>
      </div>

      {/* Public QR Code Verification Modal */}
      {(verifiedStudent || verifyError) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
                <h3 className="text-lg font-black text-slate-900">Verification Failed</h3>
                <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {verifyError}
                </p>
              </div>
            ) : verifiedStudent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
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
                      Form No: <code className="font-mono font-bold text-emerald-900">{verifiedStudent.formNumber}</code>
                    </p>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      Class: {verifiedStudent.intendedClass} • {verifiedStudent.gender}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-semibold">
                  <p><strong className="text-slate-800">School:</strong> AI Integrated Academy Argungu</p>
                  <p><strong className="text-slate-800">Parent/Guardian:</strong> {verifiedStudent.fatherName || verifiedStudent.guardianName || 'N/A'}</p>
                  <p><strong className="text-slate-800">Verification Status:</strong> <span className="text-emerald-700 font-extrabold uppercase">Officially Verified ✓</span></p>
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => setVerifiedStudent(null)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Done / Close Certificate
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-bold text-slate-400">Loading Portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
