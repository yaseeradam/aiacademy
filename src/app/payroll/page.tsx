'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Filter, 
  Building2, Users, CheckCircle2, AlertCircle, FileSpreadsheet,
  Printer, TrendingUp, ShieldCheck, Banknote, RefreshCw
} from 'lucide-react';
import { OFFICIAL_PAYROLL_SCHEDULE, calculatePayrollTotals, PayrollRecord } from '@/lib/payrollData';

export default function PayrollPage() {
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [records] = useState<PayrollRecord[]>(OFFICIAL_PAYROLL_SCHEDULE);
  const [isExporting, setIsExporting] = useState(false);

  const banks = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      const b = (r.bankName || '').trim();
      if (b && b.toLowerCase() !== 'pending') set.add(b);
    });
    return Array.from(set).sort();
  }, [records]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.section) set.add(r.section);
    });
    return Array.from(set).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.idNumber.toLowerCase().includes(search.toLowerCase()) ||
        (r.accountNumber && r.accountNumber.includes(search)) ||
        (r.bankName && r.bankName.toLowerCase().includes(search.toLowerCase()));

      const matchesBank = 
        selectedBank === 'ALL' || 
        (selectedBank === 'PENDING' ? (!r.bankName || r.bankName.toLowerCase() === 'pending') : r.bankName === selectedBank);

      const matchesSection =
        selectedSection === 'ALL' || r.section === selectedSection;

      return matchesSearch && matchesBank && matchesSection;
    });
  }, [records, search, selectedBank, selectedSection]);

  const totals = useMemo(() => calculatePayrollTotals(filteredRecords), [filteredRecords]);
  const overallTotals = useMemo(() => calculatePayrollTotals(records), [records]);

  const formatNaira = (amount: number | null) => {
    if (amount === null || isNaN(amount)) return 'Pending';
    return '₦' + amount.toLocaleString('en-NG');
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    window.location.href = '/api/export-payroll-excel';
    setTimeout(() => setIsExporting(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white print:bg-white print:text-black">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard?tab=staff"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Portal
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 font-black text-sm">
                ₦
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                  Staff Payroll & Remuneration
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">
                    2025/2026 Session
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 leading-none">AI Integrated Academy • Financial Schedule</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition shadow-sm cursor-pointer"
              title="Print Schedule"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print A4</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-50 border border-emerald-500/50"
              title="Export Modern Finance Excel (.xlsx)"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>Export Modern Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Printable Official Letterhead for Print Mode */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight">AI INTEGRATED ACADEMY (AIA)</h1>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bursary & Accounts Directorate • Staff Remuneration Schedule</p>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
            <span>Session: 2025/2026 Academic Year</span>
            <span>Generated: {new Date().toLocaleDateString('en-GB')}</span>
            <span>Status: Verified Official Disbursement</span>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          {/* Card 1: Total Payroll */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-slate-800/80 p-5 shadow-xl shadow-black/20 group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Monthly Payroll</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ₦
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatNaira(overallTotals.totalMonthlyPayroll)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Full active faculty disbursement</span>
            </div>
          </div>

          {/* Card 2: Total Staff */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-slate-800/80 p-5 shadow-xl shadow-black/20 group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Staff on Roll</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {overallTotals.totalStaff} <span className="text-sm font-normal text-slate-400">members</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-400">
              <span>{overallTotals.countWithSalary} budgeted • 3 pending review</span>
            </div>
          </div>

          {/* Card 3: Average Salary */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-slate-800/80 p-5 shadow-xl shadow-black/20 group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Monthly Salary</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatNaira(overallTotals.averageMonthlySalary)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-400">
              <span>Base scale across primary & nursery</span>
            </div>
          </div>

          {/* Card 4: NUBAN Accounts Status */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-slate-800/80 p-5 shadow-xl shadow-black/20 group hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">NUBAN Accounts</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span>{overallTotals.verifiedAccounts}</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Verified</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{overallTotals.pendingAccounts} account details awaiting update</span>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between print:hidden">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID number, bank or account number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400">Bank:</span>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Banks</option>
                {banks.map(b => (
                  <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                ))}
                <option value="PENDING" className="bg-slate-900 text-amber-400">Pending Banks</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-slate-400">Section:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Sections</option>
                {sections.map(s => (
                  <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-400 font-semibold px-2 py-1">
              Showing {filteredRecords.length} of {records.length}
            </span>
          </div>
        </section>

        {/* Corporate Financial Schedule Table */}
        <section className="bg-slate-950/70 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 print:border-none print:shadow-none">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40 print:hidden">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Official Disbursement Schedule</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  Excel Compatible
                </span>
              </h2>
              <p className="text-xs text-slate-400">Master payroll list matching school account register</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Schedule Filter Total: </span>
              <span className="text-sm font-black text-emerald-400">{formatNaira(totals.totalMonthlyPayroll)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider print:bg-slate-200 print:text-black">
                  <th className="py-3.5 px-4 text-center w-12">S/N</th>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">ID Number</th>
                  <th className="py-3.5 px-4">Section / Role</th>
                  <th className="py-3.5 px-4">Bank Name</th>
                  <th className="py-3.5 px-4 font-mono">NUBAN Account</th>
                  <th className="py-3.5 px-4 text-right">Monthly Salary</th>
                  <th className="py-3.5 px-4 text-center w-28 print:hidden">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                {filteredRecords.map((r, index) => {
                  const isPendingAccount = !r.accountNumber || r.accountNumber.trim().toLowerCase() === 'pending';
                  const hasSalary = r.salary !== null && !isNaN(r.salary);

                  return (
                    <tr 
                      key={r.idNumber || index}
                      className="hover:bg-slate-900/50 transition-colors print:hover:bg-transparent"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {r.sn}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-200 print:text-black">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-xs print:text-black">{r.name}</span>
                          {r.phone && (
                            <span className="text-[10px] text-slate-400 font-mono">{r.phone}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 font-semibold print:text-black">
                        <span className="bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded border border-slate-800 text-[11px] print:border-none">
                          {r.idNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 print:text-black">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{r.section}</span>
                          <span className="text-[10px] text-slate-400">
                            {r.classAllocated ? `${r.role} (${r.classAllocated})` : r.role}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-medium print:text-black">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{r.bankName || 'Pending'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold print:text-black">
                        {isPendingAccount ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] border border-amber-400/20 font-sans">
                            <AlertCircle className="w-3 h-3" />
                            Pending Account
                          </span>
                        ) : (
                          <span className="text-slate-100 font-mono tracking-wider text-[12px] bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/80">
                            {r.accountNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-[13px]">
                        {hasSalary ? (
                          formatNaira(r.salary)
                        ) : (
                          <span className="text-slate-500 text-[11px] font-sans italic">Pending Scale</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center print:hidden">
                        {isPendingAccount ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Needs NUBAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 print:bg-slate-100 print:text-black">
                  <td colSpan={6} className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-300 print:text-black">
                    Total Monthly Schedule ({filteredRecords.length} Staff):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-black text-sm print:text-black border-b-4 border-double border-emerald-500/50">
                    {formatNaira(totals.totalMonthlyPayroll)}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
                <tr className="bg-slate-900/60 text-slate-400 text-[11px]">
                  <td colSpan={6} className="py-2 px-4 text-right">
                    Average Monthly Salary:
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-slate-300 font-semibold">
                    {formatNaira(totals.averageMonthlySalary)}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Excel Formatting Information Card */}
        <section className="rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Corporate Banking & Modern Finance Excel Formatting
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                The downloaded workbook includes frozen header panes, Nigerian Naira currency formatting (<code className="text-emerald-400 font-mono">[$₦-470] #,##0</code>), formula-driven sums (<code className="text-emerald-400 font-mono">=SUM(...)</code>), accounting double-underlines on totals, zebra-striped rows, and signatory blocks for Bursar and Director approval.
              </p>
            </div>
          </div>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40 shrink-0 cursor-pointer"
          >
            Download .XLSX Now
          </button>
        </section>
      </main>
    </div>
  );
}
