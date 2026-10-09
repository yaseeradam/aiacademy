import { Staff } from '@/types';

export interface PayrollRecord {
  sn: number;
  name: string;
  idNumber: string;
  bankName: string;
  accountNumber: string;
  salary: number | null;
  section: string;
  role: string;
  classAllocated?: string;
  phone?: string;
}

export const OFFICIAL_PAYROLL_SCHEDULE: PayrollRecord[] = [
  { sn: 1, name: 'Yasir Kabir Adamu', idNumber: 'AIA/26/P002', bankName: 'Jaiz Bank', accountNumber: '0003974412', salary: 60000, section: 'Primary', role: 'Teacher', classAllocated: 'Basic 2 Gold', phone: '08104827838' },
  { sn: 2, name: 'Ibrahim Musa Gulma', idNumber: 'AIA/26/P001', bankName: 'UBA', accountNumber: '2001511574', salary: 70000, section: 'Primary', role: 'Teacher', classAllocated: 'Basic 1 Gold', phone: '07034784861' },
  { sn: 3, name: 'Hassana Sahabi', idNumber: 'AIA/26/N003', bankName: 'Access Bank', accountNumber: '1946222455', salary: 40000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 4, name: 'Abida Abdullahi Kangiwa', idNumber: 'AIA/26/N006', bankName: 'UBA', accountNumber: '2163468237', salary: 45000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 5, name: 'Aminu Yusuf', idNumber: 'AIA/26/P004', bankName: 'UBA', accountNumber: '2068642583', salary: 40000, section: 'Primary', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 6, name: 'Amina Ismail Ibrahim', idNumber: 'AIA/26/P003', bankName: 'Jaiz Bank', accountNumber: '0000780201', salary: 50000, section: 'Primary', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 7, name: 'Sakina Hussaini', idNumber: 'AIA/26/N010', bankName: 'UBA', accountNumber: '2121712213', salary: 40000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 8, name: 'Victoria Dada', idNumber: 'AIA/26/N002', bankName: 'UBA', accountNumber: '2130372770', salary: 60000, section: 'Nursery', role: 'Teacher', classAllocated: 'Nursery 1 Gold', phone: '08103210187' },
  { sn: 9, name: 'Hafsat Aminu Musa', idNumber: 'AIA/26/N013', bankName: 'UBA', accountNumber: '2202680754', salary: 40000, section: 'Nursery', role: 'Teacher', classAllocated: 'Nursery 1 Silver', phone: '07025487381' },
  { sn: 10, name: 'Abdulmalik Muhammad', idNumber: 'AIA/26/N005', bankName: 'UBA', accountNumber: '2048733867', salary: 50000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 11, name: "Muhd Rabi'u Sani", idNumber: 'AIA/26/P007', bankName: 'Eco bank', accountNumber: 'Pending', salary: 50000, section: 'Primary', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 12, name: 'Muslim Abubakar Muhammad', idNumber: 'AIA/26/N007', bankName: 'FCMB', accountNumber: '1035255516', salary: 40000, section: 'Nursery', role: 'Teacher', classAllocated: 'Basic 1 Silver', phone: '09030339615' },
  { sn: 13, name: 'Nafisa Abdullahi', idNumber: 'AIA/26/N008', bankName: 'UBA', accountNumber: '2249713093', salary: 40000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 14, name: 'Isah Balarabe (Director)', idNumber: 'AIA/26/DIR001', bankName: 'UBA', accountNumber: '2056831467', salary: 60000, section: 'Administration', role: 'Director', classAllocated: '', phone: '08034243090' },
  { sn: 15, name: 'Bashar Bala Musa', idNumber: 'AIA/26/P008', bankName: 'UBA', accountNumber: '2140813832', salary: 50000, section: 'Primary', role: 'Teacher', classAllocated: 'Basic 1 Silver', phone: '08063636975' },
  { sn: 16, name: 'Abdullahi Suleiman', idNumber: 'AIA/26/P009', bankName: 'UBA', accountNumber: '2124151547', salary: 50000, section: 'Primary', role: 'Teacher', classAllocated: 'Basic 1 Gold', phone: '08140512226' },
  { sn: 17, name: 'Wasila Ibrahim Alkali', idNumber: 'AIA/26/N009', bankName: 'UBA', accountNumber: '2152648338', salary: 50000, section: 'Primary', role: 'Teacher', classAllocated: 'Basic 2 Gold', phone: '07066944323' },
  { sn: 18, name: 'Muiza Aliyu', idNumber: 'AIA/26/N014', bankName: 'UBA', accountNumber: '2221457784', salary: 50000, section: 'Nursery', role: 'Teacher', classAllocated: 'Nursery 1 Green', phone: '09168028899' },
  { sn: 19, name: 'Fauziyya Suleman Kalanda', idNumber: 'AIA/26/N015', bankName: 'UBA', accountNumber: '2081005538', salary: 40000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 20, name: 'Hussaini Ibrahim', idNumber: 'AIA/26/P011', bankName: 'UBA', accountNumber: '2223472457', salary: 25000, section: 'Primary', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 21, name: 'Mariya Ibrahim Illo', idNumber: 'AIA/26/N012', bankName: 'GT Bank', accountNumber: '0262372744', salary: 50000, section: 'Nursery', role: 'Teacher', classAllocated: 'Nursery 1 Gold', phone: '07068127677' },
  { sn: 22, name: 'Hussai Abubakar', idNumber: 'AIA/26/N016', bankName: 'Eco bank', accountNumber: '5663062746', salary: 15000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 23, name: 'Olorunfemi Glory Victoria', idNumber: 'AIA/26/N018', bankName: 'UBA', accountNumber: 'Pending', salary: null, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 24, name: 'Samira Lawal Ibrahim', idNumber: 'AIA/26/N019', bankName: 'Access Bank', accountNumber: 'Pending', salary: null, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 25, name: 'Aisha Bashir', idNumber: 'AIA/26/P012', bankName: 'Pending', accountNumber: 'Pending', salary: 25000, section: 'Primary', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 26, name: 'Usman Habiba Adabo', idNumber: 'AIA/26/P013', bankName: 'GT Bank', accountNumber: '0198423309', salary: 60000, section: 'Primary', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 27, name: 'Samira Adamu', idNumber: 'AIA/26/N023', bankName: 'UBA', accountNumber: '2084907059', salary: 55000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 28, name: 'Fatima Usman', idNumber: 'AIA/26/N017', bankName: 'UBA', accountNumber: '2235463692', salary: 35000, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
  { sn: 29, name: 'Yakubu Rukayat Anavami', idNumber: 'AIA/26/N020', bankName: 'Access Bank', accountNumber: '1990250486', salary: null, section: 'Nursery', role: 'Teacher', classAllocated: '', phone: '' },
];

export function calculatePayrollTotals(records: PayrollRecord[] = OFFICIAL_PAYROLL_SCHEDULE) {
  let totalSalary = 0;
  let countWithSalary = 0;
  let verifiedAccounts = 0;

  for (const r of records) {
    if (r.salary && typeof r.salary === 'number' && !isNaN(r.salary)) {
      totalSalary += r.salary;
      countWithSalary++;
    }
    const acct = (r.accountNumber || '').trim().toLowerCase();
    if (acct && acct !== 'pending' && acct !== 'none') {
      verifiedAccounts++;
    }
  }

  const averageSalary = countWithSalary > 0 ? Math.round(totalSalary / countWithSalary) : 0;

  return {
    totalStaff: records.length,
    totalMonthlyPayroll: totalSalary,
    averageMonthlySalary: averageSalary,
    countWithSalary,
    verifiedAccounts,
    pendingAccounts: records.length - verifiedAccounts,
  };
}
