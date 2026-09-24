'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Star, CheckCircle2, ChevronRight, MessageSquareHeart, 
  Sparkles, ArrowLeft, Send, ShieldCheck, HeartHandshake,
  AlertCircle, Users, Check, RefreshCw
} from 'lucide-react';
import { getPublicSurveyDataAction, submitParentSurveyAction } from '@/app/actions';
import { SurveyConfig, SurveyQuestion, SurveyResponse } from '@/types';

function SurveyContent() {
  const searchParams = useSearchParams();
  const urlPhone = searchParams.get('phone') || '';

  const [phone, setPhone] = useState<string>(urlPhone);
  const [phoneSubmitted, setPhoneSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [config, setConfig] = useState<SurveyConfig | null>(null);
  const [parentInfo, setParentInfo] = useState<{
    name: string;
    phone: string;
    studentNames: string[];
    classes: string[];
  } | null>(null);
  const [existingResponse, setExistingResponse] = useState<SurveyResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Initial load
  useEffect(() => {
    let initialPhone = urlPhone;
    if (!initialPhone && typeof document !== 'undefined') {
      const match = document.cookie.match(/parent_phone=([^;]+)/);
      if (match && match[1] && match[1] !== 'admin') {
        initialPhone = match[1];
      }
    }

    if (initialPhone) {
      setPhone(initialPhone);
      loadSurvey(initialPhone);
    } else {
      loadSurvey();
    }
  }, [urlPhone]);

  const loadSurvey = async (lookupPhone?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await getPublicSurveyDataAction(lookupPhone);
      if (res.success && res.config) {
        setConfig(res.config);
        if (res.parent) {
          setParentInfo(res.parent);
          setPhoneSubmitted(true);
        }
        if (res.existingResponse) {
          setExistingResponse(res.existingResponse);
          setAnswers(res.existingResponse.answers || {});
        }
      } else {
        setErrorMessage(res.error || 'Failed to load survey');
      }
    } catch {
      setErrorMessage('Could not load survey. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setErrorMessage('Please enter a valid phone number (e.g. 08012345678).');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await getPublicSurveyDataAction(phone.trim());
      if (res.success) {
        setConfig(res.config);
        if (res.parent) {
          setParentInfo(res.parent);
        }
        if (res.existingResponse) {
          setExistingResponse(res.existingResponse);
          setAnswers(res.existingResponse.answers || {});
        }
        setPhoneSubmitted(true);
      } else {
        setErrorMessage(res.error || 'Failed to verify phone number');
      }
    } catch {
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const answeredCount = useMemo(() => {
    if (!config?.questions) return 0;
    return config.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;
  }, [config, answers]);

  const progressPct = useMemo(() => {
    if (!config?.questions || config.questions.length === 0) return 0;
    return Math.round((answeredCount / config.questions.length) * 100);
  }, [config, answeredCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setErrorMessage('Phone number is missing.');
      return;
    }

    // Check required fields
    if (config?.questions) {
      for (const q of config.questions) {
        if (q.required && (answers[q.id] === undefined || answers[q.id] === '')) {
          setErrorMessage(`Please answer required question: "${q.question}"`);
          return;
        }
      }
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await submitParentSurveyAction(phone.trim(), answers);
      if (res.success) {
        setSubmitSuccess(true);
        setStatusMessage(res.message);
      } else {
        setErrorMessage(res.error || 'Failed to submit survey. Please try again.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center max-w-sm w-full space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0f7343] flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">Loading School Survey...</h3>
          <p className="text-xs text-slate-400 font-semibold">Connecting to AI Integrated Academy Argungu</p>
        </div>
      </div>
    );
  }

  if (config && !config.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Survey Currently Closed</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            The parent feedback survey for {config.term || 'this term'} is currently closed. Thank you for your continued partnership with AI Integrated Academy Argungu!
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      
      {/* Top Brand Banner */}
      <header className="bg-gradient-to-r from-[#07361e] via-[#0f7343] to-[#145a35] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-emerald-200 hover:text-white text-xs font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </Link>
            <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-100 font-bold text-[10px] uppercase tracking-wider border border-white/15">
              Official Parent Survey
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shrink-0 flex items-center justify-center overflow-hidden border border-emerald-400/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="AI Academy Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                AI INTEGRATED ACADEMY ARGUNGU
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {config?.title || 'Parent Satisfaction & Experience Survey'}
              </h1>
              <p className="text-xs text-emerald-100 font-medium mt-1">
                {config?.session || '2025/2026 Session'} • {config?.term || '1st Term'} Roster Feedback
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 -mt-3">
        
        {/* Step 1: Phone Login / Identification Card */}
        {!phoneSubmitted ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 animate-scale-in">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f7343] flex items-center justify-center mx-auto border border-emerald-100">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome to Parent Voice</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {config?.description || 'Your feedback helps us continuously improve the learning environment, teacher quality, and student care for your children.'}
              </p>
            </div>

            <form onSubmit={handlePhoneLookup} className="max-w-md mx-auto space-y-4 pt-2">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Enter Your Registered Phone Number:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08069676697 or 08012345678"
                    className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f7343] focus:bg-white transition-all shadow-inner"
                    autoFocus
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
                  Use the phone number you registered during admission.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#0f7343] to-emerald-600 hover:from-[#0b5c34] hover:to-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Record...</span>
                  </>
                ) : (
                  <>
                    <span>Start Survey</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : submitSuccess ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 text-center space-y-6 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#0f7343] flex items-center justify-center mx-auto shadow-inner border-4 border-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Feedback Submitted!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {statusMessage || 'Thank you for your valuable feedback! Your insights directly help us elevate our teaching quality, facilities, and student care.'}
              </p>
            </div>

            {parentInfo && (
              <div className="max-w-md mx-auto p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Parent: {parentInfo.name}</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Verified</span>
                </div>
                {parentInfo.studentNames.length > 0 && (
                  <div className="text-[11px] text-emerald-800 font-medium">
                    Students: {parentInfo.studentNames.join(', ')} ({parentInfo.classes.join(', ')})
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-md text-center"
              >
                Go to Parent Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all text-center cursor-pointer"
              >
                Review My Answers
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: The Google Forms / Typeform Styled Questionnaire */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Parent Identity Header Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0f7343] flex items-center justify-center shrink-0 font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      {parentInfo?.name || 'Verified Parent'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                      {phone}
                    </span>
                  </div>
                  {parentInfo && parentInfo.studentNames.length > 0 && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Children: {parentInfo.studentNames.join(', ')} • {parentInfo.classes.join(', ') || 'Enrolled'}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPhoneSubmitted(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Change Phone
              </button>
            </div>

            {/* Existing Submission Alert */}
            {existingResponse && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black text-amber-950">You previously completed this survey!</strong>
                  <span>
                    Your previous responses are loaded below. You may update any answers and click &quot;Update Feedback&quot; to submit changes.
                  </span>
                </div>
              </div>
            )}

            {/* Progress Sticky Bar */}
            <div className="sticky top-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 px-4 shadow-md border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                <MessageSquareHeart className="w-4 h-4 text-[#0f7343]" />
                <span>Survey Progress</span>
              </div>
              <div className="flex-1 max-w-xs bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0f7343] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {answeredCount}/{config?.questions.length || 0} ({progressPct}%)
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {config?.questions.map((q: SurveyQuestion, idx: number) => {
                const currentVal = answers[q.id];
                const isAnswered = currentVal !== undefined && currentVal !== '';

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-3xl p-5 sm:p-7 shadow-xs border transition-all ${
                      isAnswered 
                        ? 'border-slate-200' 
                        : 'border-slate-200/90 hover:border-emerald-300'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="space-y-1">
                        {q.category && (
                          <span className="text-[10px] font-black text-[#0f7343] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                            {q.category}
                          </span>
                        )}
                        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                          <span className="text-slate-400 font-mono mr-2">{idx + 1}.</span>
                          {q.question}
                          {q.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                        </h3>
                      </div>

                      {isAnswered && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Question Input Type Renderers */}
                    <div className="pt-2">
                      {/* TYPE 1: 5-STAR RATING */}
                      {q.type === 'rating_5' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const active = typeof currentVal === 'number' ? currentVal >= star : parseInt(String(currentVal), 10) >= star;
                              const isExact = Number(currentVal) === star;

                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleAnswerChange(q.id, star)}
                                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer flex-1 min-w-[55px] ${
                                    isExact 
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40' 
                                      : active 
                                      ? 'bg-amber-50 text-amber-500 border-amber-200' 
                                      : 'bg-slate-50 text-slate-300 border-slate-200 hover:border-amber-300 hover:text-amber-400'
                                  }`}
                                >
                                  <Star className={`w-6 h-6 sm:w-7 sm:h-7 ${active || isExact ? 'fill-current' : ''}`} />
                                  <span className={`text-[10px] font-black ${isExact ? 'text-white' : 'text-slate-600'}`}>
                                    {star} {star === 1 ? 'Star' : 'Stars'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                            <span>1 - Poor / Unsatisfied</span>
                            <span>5 - Excellent / Highly Satisfied</span>
                          </div>
                        </div>
                      )}

                      {/* TYPE 2: SINGLE CHOICE (Radio Pills) */}
                      {q.type === 'single_choice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(q.options || []).map((option) => {
                            const selected = currentVal === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => handleAnswerChange(q.id, option)}
                                className={`text-left p-3.5 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                  selected 
                                    ? 'bg-emerald-50 text-emerald-950 border-[#0f7343] ring-2 ring-[#0f7343]/20 shadow-xs' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white'
                                }`}
                              >
                                <span>{option}</span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  selected ? 'border-[#0f7343] bg-[#0f7343] text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* TYPE 3: 1-10 NPS SCALE */}
                      {q.type === 'nps_10' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                              const selected = Number(currentVal) === score;
                              const isPromoter = score >= 9;
                              const isPassive = score >= 7 && score <= 8;
                              
                              let activeBg = 'bg-rose-500 text-white border-rose-600';
                              if (isPromoter) activeBg = 'bg-emerald-600 text-white border-emerald-700';
                              else if (isPassive) activeBg = 'bg-amber-500 text-white border-amber-600';

                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => handleAnswerChange(q.id, score)}
                                  className={`py-3 rounded-xl border text-xs sm:text-sm font-black transition-all flex items-center justify-center cursor-pointer ${
                                    selected 
                                      ? `${activeBg} shadow-md ring-2 ring-slate-900/20` 
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                  }`}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                            <span>0 - Not at all likely</span>
                            <span>10 - Extremely likely</span>
                          </div>
                        </div>
                      )}

                      {/* TYPE 4: SHORT TEXT / COMMENT */}
                      {q.type === 'text' && (
                        <div>
                          <textarea
                            rows={3}
                            value={String(currentVal || '')}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Type your feedback, appreciation, or suggestions here..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0f7343] focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Bar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
                <span>By submitting, your feedback goes directly to AI Academy leadership.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0f7343] via-[#0b5c34] to-emerald-700 hover:from-[#084326] hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{existingResponse ? 'Update My Feedback' : 'Submit Survey'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md text-xs font-bold text-slate-500">
          Loading Parent Survey...
        </div>
      </div>
    }>
      <SurveyContent />
    </Suspense>
  );
}
