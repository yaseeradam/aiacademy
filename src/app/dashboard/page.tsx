import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getParentByPhone, getStudentsByParentId, getAllStudents } from '@/lib/db';
import VerificationCard from '@/components/VerificationCard';
import AdminControl from '@/components/AdminControl';
import { logoutAction } from '../actions';
import { LogOut, Info, ShieldAlert, Award } from 'lucide-react';

export const revalidate = 0; // Dynamic rendering

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('parent_phone')?.value;

  if (!phone) {
    redirect('/');
  }

  const isAdmin = phone === 'admin';
  const displayPhone = phone || '';
  let parentName = '';
  let studentsData = [];

  if (isAdmin) {
    parentName = 'School Administrator';
    studentsData = await getAllStudents();
  } else {
    const parent = await getParentByPhone(phone);
    if (!parent) {
      redirect('/');
    }
    parentName = parent.parentName;
    studentsData = await getStudentsByParentId(parent.id);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {isAdmin ? (
        <AdminControl
          students={studentsData}
        />
      ) : (
        /* ================= PARENT PORTAL LAYOUT (Matches children list.png) ================= */
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-14">
                {/* Logo and school name exactly matches children list.png */}
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                    <Image
                      src="/logo.jpg"
                      alt="AI Integrated Academy Logo"
                      fill
                      className="object-contain rounded-full"
                    />
                  </div>
                  <span className="font-bold text-slate-900 text-lg md:text-xl tracking-tight">
                    AI Integrated Academy Argungu
                  </span>
                </div>

                {/* Logged in parent display & Logout (Matches layout) */}
                <div className="flex items-center gap-5">
                  <div className="text-right leading-tight">
                    <span className="block text-[11px] font-semibold text-slate-400">
                      Logged in as Parent
                    </span>
                    <span className="block text-sm font-bold text-slate-800">
                      {displayPhone}
                    </span>
                  </div>

                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all cursor-pointer bg-white"
                    >
                      <span>Logout</span>
                      <LogOut className="w-4 h-4 text-slate-400" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </header>

          {/* Profiles Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Profiles</h1>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">Review and confirm your children's enrollment details.</p>
                </div>
                <div className="inline-flex items-center gap-2 p-2.5 px-4 rounded-xl bg-[#f8fafc] border border-slate-200 text-slate-700 text-xs font-bold shrink-0">
                  <Info className="w-3.5 h-3.5 text-[#137333]" />
                  <span>Action required by Aug 15th</span>
                </div>
              </div>

              {/* Profiles Grid */}
              {studentsData.length > 0 ? (
                <div className={
                  studentsData.length === 1 
                    ? "max-w-2xl mx-auto w-full" 
                    : "grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto"
                }>
                  {studentsData.map((student) => (
                    <VerificationCard
                      key={student.id}
                      student={student}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              ) : (
                <div className="soft-card p-12 text-center bg-white border border-slate-200 rounded-[2rem]">
                  <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No Child Profiles Found</h3>
                  <p className="text-slate-400 text-sm font-semibold mb-6">
                    There are no student profiles registered under this phone number ({phone}).
                  </p>
                  <div className="max-w-md mx-auto text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    Please contact the school administration office to register or correct your phone number:
                    <strong className="block text-slate-600 mt-1">08069676697, 07034784861</strong>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200/80 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:justify-between sm:items-center text-xs text-slate-400 font-semibold space-y-2 sm:space-y-0">
              <div>
                &copy; {new Date().getFullYear()} AI Integrated Academy Argungu. All rights reserved.
              </div>
              <div className="flex justify-center items-center gap-1.5 text-slate-400">
                <Award className="w-4 h-4 text-green-600" />
                <span>Learning Today, Leading Tomorrow</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
