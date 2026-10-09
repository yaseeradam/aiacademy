import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getParentByPhone, getStudentsByParentId, getAllStudents, getSchoolSettings, getAllStaff, INITIAL_STAFF } from '@/lib/db';
import VerificationCard from '@/components/VerificationCard';
import AdminControl from '@/components/AdminControl';
import { logoutAction } from '../actions';
import { LogOut, Info, ShieldAlert, Award, MessageSquareHeart, ArrowRight, School, User, CheckCircle2 } from 'lucide-react';

export const revalidate = 0; // Dynamic rendering

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('parent_phone')?.value;

  if (!phone) {
    redirect('/');
  }

  const isAdmin = phone === 'admin';
  const displayPhone = phone || '';

  if (isAdmin) {
    // Run settings + students + staff in parallel with safe error fallbacks
    const [settings, allStudents, allStaff] = await Promise.all([
      getSchoolSettings().catch(() => ({ 
        schoolName: 'AI INTEGRATED ACADEMY ARGUNGU', 
        motto: 'Learning Today, Leading Tomorrow', 
        address: "Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu", 
        phones: '08069676697, 07034784861', 
        logo: '/logo.jpg',
        customClasses: ['Nursery 1', 'Basic 1', 'Basic 2'],
        customSubclasses: [
          'Nursery 1 Gold', 'Nursery 1 Silver', 'Nursery 1 Green',
          'Basic 1 Gold', 'Basic 1 Silver', 'Basic 1 Green',
          'Basic 2 Gold', 'Basic 2 Silver', 'Basic 2 Green'
        ]
      })),
      getAllStudents().catch(err => {
        console.error('Error fetching students for admin:', err);
        return [];
      }),
      getAllStaff().catch(() => INITIAL_STAFF),
    ]);
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <AdminControl students={allStudents || []} initialStaff={allStaff || INITIAL_STAFF} settings={settings} />
      </div>
    );
  }

  // Parent portal: fetch settings + parent in parallel
  const [settings, parent] = await Promise.all([
    getSchoolSettings(),
    getParentByPhone(phone),
  ]);

  if (!parent) {
    redirect('/');
  }

  const studentsData = await getStudentsByParentId(parent.id);

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* PARENT PORTAL LAYOUT */}
      <div className="flex flex-col flex-1">
        {/* Institutional Top Bar */}
        <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and school crest */}
              <div className="flex items-center gap-3.5">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-1 bg-white shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logo || '/logo.jpg'}
                    alt={settings.schoolName || "AI Integrated Academy Logo"}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight block leading-tight">
                    {settings.schoolName || 'AI Integrated Academy Argungu'}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                    Official Parent & Guardian Portal • 2025/2026 Session
                  </span>
                </div>
              </div>

              {/* Logged in parent display & Logout */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Logged in as Parent
                  </span>
                  <span className="text-sm font-black text-slate-800 flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {parent.parentName || displayPhone}
                  </span>
                </div>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer bg-white shadow-2xs hover:border-slate-300"
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-4 h-4 text-slate-400" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {/* Profiles Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-6">
            {/* Academic Greeting & Instructions Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200/60 mb-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student Enrollment Verification Active</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome, {parent.parentName || 'Parent / Guardian'}
                </h1>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Please carefully review the personal information, class arm allocation, and date of birth for each registered child below. If correct, confirm the profile to authorize issuance of the Official A4 Admission Letter.
                </p>
              </div>

              {/* Progress Summary Pill */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 shrink-0 sm:min-w-[220px]">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Profiles on Record
                </div>
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                  <span>{studentsData.length}</span>
                  <span className="text-xs font-bold text-slate-400">Child{studentsData.length !== 1 ? 'ren' : ''} Listed</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified phone: {displayPhone}</span>
                </div>
              </div>
            </div>

            {/* Parent Feedback Survey Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                  <MessageSquareHeart className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-white tracking-tight">Parent Experience & Quality Survey</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      2 Min
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-0.5 max-w-xl">
                    Your direct feedback helps the School Governing Board maintain high educational standards.
                  </p>
                </div>
              </div>
              <a
                href={`/survey?phone=${encodeURIComponent(phone)}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
              >
                <span>Complete Survey</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Profiles Grid */}
            {studentsData.length > 0 ? (
              <div className={
                studentsData.length === 1 
                  ? "max-w-2xl mx-auto w-full" 
                  : "grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto"
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
              <div className="soft-card p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Child Profiles Found</h3>
                <p className="text-slate-400 text-sm font-semibold mb-6">
                  There are no student profiles registered under this phone number ({phone}).
                </p>
                <div className="max-w-md mx-auto text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  Please contact the school administration office to register or correct your phone number:
                  <strong className="block text-slate-800 mt-1">{settings.phones || '08069676697, 07034784861'}</strong>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* School Standard Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-semibold space-y-3">
            <div className="sm:flex sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <div>
                &copy; {new Date().getFullYear()} AI Integrated Academy Argungu. Official Portal.
              </div>
              <div className="flex justify-center items-center gap-1.5 text-slate-600 font-bold">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>Learning Today, Leading Tomorrow</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              {settings.address || "Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu"} • Helpline: {settings.phones || '08069676697, 07034784861'}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
