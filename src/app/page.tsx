'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, AlertTriangle, Phone } from 'lucide-react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
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
          <div className="w-20 h-20 mb-4 rounded-full overflow-hidden border-4 border-green-100 shadow-lg">
            <Image
              src="/logo.jpg"
              alt="AI Integrated Academy Logo"
              width={80}
              height={80}
              className="object-cover w-full h-full"
              priority
            />
          </div>

          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            AI INTEGRATED ACADEMY ARGUNGU
          </span>
          
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
            Student Data Verification
          </h1>
          
          <p className="text-slate-500 text-sm font-semibold mt-1 mb-8 leading-relaxed max-w-xs">
            Enter your registered phone number to access your children's profiles.
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
    </div>
  );
}
