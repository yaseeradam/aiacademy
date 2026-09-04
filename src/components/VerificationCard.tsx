'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Student, VerificationStatus } from '@/types';
import { Check, Edit3, Info, Camera, Loader2, FileText, CheckCircle2, CreditCard } from 'lucide-react';
import { confirmStudentAction, submitCorrectionAction, updateStudentPhotoAction, adminTogglePaymentStatusAction } from '@/app/actions';
import AdmissionLetterModal from './AdmissionLetterModal';

interface VerificationCardProps {
  student: Student;
  isAdmin?: boolean;
}

export default function VerificationCard({ student, isAdmin = false }: VerificationCardProps) {
  const router = useRouter();
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState(student.correctionNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isTogglingPayment, setIsTogglingPayment] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  const isPaid = student.paymentStatus === 'paid';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmStudentAction(student.id);
      if (isPaid) {
        setIsLetterOpen(true);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleTogglePayment = async () => {
    setIsTogglingPayment(true);
    try {
      const newStatus = isPaid ? 'pending' : 'paid';
      await adminTogglePaymentStatusAction(student.id, newStatus);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingPayment(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionNotes.trim()) return;
    setIsSubmitting(true);
    try {
      await submitCorrectionAction(student.id, correctionNotes);
      setIsCorrecting(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const compressedBase64 = await compressImage(file);
      await updateStudentPhotoAction(student.id, compressedBase64);
      router.refresh();
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Failed to upload photo. Please try a different image.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Verified Profile
          </span>
        );
      case 'requires_correction':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Info className="w-3.5 h-3.5" />
            Correction Req.
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f0f4f9] text-[#3c4043] border border-[#e8eaed]">
            <span className="w-2 h-2 rounded-full bg-[#5f6368]" />
            Review Pending
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr || !dateStr.trim()) return 'None Listed';
    const trimmed = dateStr.trim();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      const year = parseInt(dmyMatch[3], 10);
      if (month >= 1 && month <= 12) {
        return `${day} ${months[month - 1]} ${year}`;
      }
    }

    // Handle YYYY-MM-DD (ISO format)
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      if (month >= 1 && month <= 12) {
        return `${day} ${months[month - 1]} ${year}`;
      }
    }

    // Fallback: try native Date parsing
    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
      }
    } catch { /* ignore */ }

    // If nothing works, return the raw string
    return trimmed;
  };

  const AvatarIcon = () => {
    return (
      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 group shadow-md bg-slate-100">
        {student.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={student.photo} alt={`${student.firstName}`} className="w-full h-full object-cover" />
        ) : student.gender === 'Female' ? (
          <div className="w-full h-full bg-pink-50 flex items-center justify-center">
            <svg className="w-20 h-20 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm4.5 9.5c0-.83-.67-1.5-1.5-1.5H9c-.83 0-1.5.67-1.5 1.5V17c0 .55.45 1 1 1h7c.55 0 1-.45 1-1v-5.5zM12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm7.5 7v-1.5c0-1.93-1.57-3.5-3.5-3.5h-8c-1.93 0-3.5 1.57-3.5 3.5V15c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2z" />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full bg-blue-50 flex items-center justify-center">
            <svg className="w-20 h-20 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}

        {isAdmin && (
          <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
            {isUploadingPhoto ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <>
                <Camera className="w-6 h-6 mb-1 text-white" />
                <span>Change Photo</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="soft-card p-4 md:p-6 bg-white flex flex-col justify-between h-full rounded-[2rem]">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <AvatarIcon />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(student.verificationStatus)}
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Fees Paid ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <CreditCard className="w-3 h-3 text-amber-600" />
                  Fee Unpaid
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-800 leading-tight mt-1">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Form: <span className="text-slate-600 font-mono font-bold">{student.formNumber}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 text-sm mb-4">
          <div>
            <span className="block text-xs font-semibold text-slate-400">Intended Class</span>
            <span className="font-bold text-slate-800">{student.intendedClass}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Gender</span>
            <span className="font-bold text-slate-800">{student.gender}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Date of Birth</span>
            <span className="font-bold text-slate-800">{formatDate(student.dateOfBirth)}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Admission Letter Status</span>
            <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isPaid ? 'Approved & Ready' : 'Awaiting Payment Approval'}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="block text-slate-400 font-semibold mb-0.5">Father&apos;s Name</span>
              <span className="font-bold text-slate-700">{student.fatherName || 'None Listed'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-semibold mb-0.5">Mother&apos;s Name</span>
              <span className="font-bold text-slate-700">{student.motherName || 'None Listed'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-slate-400 font-semibold mb-0.5">Residential Address</span>
              <span className="font-bold text-slate-700 leading-relaxed">{student.residentialAddress || 'None Listed'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-semibold mb-0.5">Guardian Name</span>
              <span className="font-bold text-slate-700">{student.guardianName || 'None Listed'}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-semibold mb-0.5">Phone numbers</span>
              <span className="font-bold text-slate-700">{student.phone1} {student.phone2 ? `/ ${student.phone2}` : ''}</span>
            </div>
          </div>
        </div>

        {student.verificationStatus === 'requires_correction' && student.correctionNotes && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">Submitted Correction Notes:</span>
              <p className="leading-relaxed italic">&quot;{student.correctionNotes}&quot;</p>
            </div>
          </div>
        )}

        {/* Notice if Payment is Pending */}
        {!isPaid && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold block mb-0.5">Admission Letter Download Notice:</strong>
              The A4 Admission Letter will be unlocked for download once school fees/payment is approved by the school administrator.
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 pt-5 border-t border-slate-100 space-y-3">
        {isAdmin && (
          <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between text-xs text-white">
            <span className="font-bold">Admin Fee & Admission Control:</span>
            <button
              type="button"
              onClick={handleTogglePayment}
              disabled={isTogglingPayment}
              className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                isPaid ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isTogglingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isPaid ? 'Revoke Payment Approval' : 'Approve Fee Payment & Issue Letter'}</span>
            </button>
          </div>
        )}

        {!isCorrecting ? (
          <div className="flex flex-col sm:flex-row gap-3">
            {isPaid ? (
              <button
                onClick={() => setIsLetterOpen(true)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#0f7343] hover:bg-[#0b5c34] text-white font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
              >
                <FileText className="w-4.5 h-4.5 text-white" />
                <span>Download A4 Admission Letter</span>
              </button>
            ) : student.verificationStatus !== 'verified' ? (
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#137333] hover:bg-[#0f6229] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer shadow-sm"
              >
                {isConfirming ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                Confirm Details are Correct
              </button>
            ) : (
              <div className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs text-center border border-slate-200">
                Profile Verified • Awaiting Admin Payment Approval
              </div>
            )}
            
            <button
              onClick={() => setIsCorrecting(true)}
              className="py-3.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Edit3 className="w-4 h-4 text-slate-400" />
              Request Correction
            </button>
          </div>
        ) : (
          <form onSubmit={handleCorrectionSubmit} className="animate-slide-down border-t border-slate-100 pt-5 mt-2">
            <div className="mb-4">
              <label htmlFor={`correction-${student.id}`} className="block text-sm font-bold text-slate-800 mb-2">
                What needs to be corrected?
              </label>
              <textarea
                id={`correction-${student.id}`}
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="e.g., misspelled name, wrong date of birth..."
                required
                rows={4}
                className="w-full soft-input resize-none focus:ring-1 focus:ring-[#137333] border-slate-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !correctionNotes.trim()}
                className="flex-1 py-3 rounded-xl bg-[#1a2332] hover:bg-[#111721] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                Submit Correction Request
              </button>
              <button
                type="button"
                onClick={() => setIsCorrecting(false)}
                className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {(isConfirming || isSubmitting || isUploadingPhoto || isTogglingPayment) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center space-y-4 animate-slide-down">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <Loader2 className="w-8 h-8 text-[#0f7343] animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {isConfirming && 'Confirming Student Details...'}
                {isSubmitting && 'Submitting Correction Request...'}
                {isUploadingPhoto && 'Uploading Student Photo...'}
                {isTogglingPayment && 'Updating Payment & Admission Status...'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Please wait while we process your request...</p>
            </div>
          </div>
        </div>
      )}

      {/* Admission Letter Modal Component */}
      <AdmissionLetterModal
        student={student}
        isOpen={isLetterOpen}
        onClose={() => setIsLetterOpen(false)}
      />
    </div>
  );
}

