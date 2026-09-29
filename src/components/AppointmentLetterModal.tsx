'use client';

import { useState, useEffect } from 'react';
import { Staff, SchoolSettings } from '@/types';
import { X, Printer, FileText, CheckCircle2, ChevronDown, ChevronUp, RotateCcw, User, Eye, Sliders } from 'lucide-react';
import { numberToNairaWords } from '@/lib/numberToWords';

interface AppointmentLetterModalProps {
  staff: Staff;
  isOpen: boolean;
  onClose: () => void;
  allStaff?: Staff[];
  schoolSettings?: SchoolSettings;
}

export interface PrintAppointmentLetterOptions {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  salary?: string | number;
  salaryWords?: string;
  date?: string;
  position?: string;
  employmentType?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  probationPeriod?: string;
  noticePeriod?: string;
}

/**
 * Common stylesheet for printing A4 Appointment Letters.
 * Enforces exact 1-page fit on standard A4 paper with zero overflow.
 */
export function getAppointmentLetterPrintStyles(): string {
  return `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      background: white;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      margin: 0;
      padding: 0;
    }
    @media screen {
      body {
        background: #e2e8f0;
        padding: 20px 0;
      }
      .page {
        margin: 0 auto 20px auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      padding: 9mm 14mm 8mm 14mm;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
      background: white;
    }
    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.04;
      pointer-events: none;
      z-index: 0;
    }
    .watermark img {
      width: 440px;
      height: 440px;
      object-fit: contain;
    }
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      flex: 1;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 4px;
      width: 100%;
    }
    .logo-circle {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid #e2e8f0;
    }
    .logo-circle img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .school-info {
      flex: 1;
    }
    .school-info h1 {
      font-size: 24px;
      font-weight: 900;
      color: #1B3A6B;
      text-transform: uppercase;
      line-height: 1.1;
      letter-spacing: -0.3px;
    }
    .motto-banner {
      display: inline-block;
      background: #D4851F;
      color: white;
      padding: 2.5px 14px;
      font-size: 11px;
      font-weight: 700;
      font-style: italic;
      border-radius: 3px;
      margin-top: 3px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .contact-row {
      margin-top: 4px;
      font-size: 10px;
      color: #334155;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .contact-row div {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .contact-row svg {
      flex-shrink: 0;
      width: 12px;
      height: 12px;
    }
    .divider {
      margin-top: 4px;
      margin-bottom: 6px;
    }
    .divider .line1 {
      height: 2.5px;
      background: #1B3A6B;
      border-radius: 1px;
    }
    .divider .line2 {
      height: 2.5px;
      background: #D4851F;
      border-radius: 1px;
      margin-top: 1.5px;
    }
    .recipient-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .label-to {
      font-weight: 700;
      color: #475569;
    }
    .teacher-name {
      font-weight: 900;
      font-size: 13.5px;
      color: #0f172a;
    }
    .staff-id {
      color: #334155;
      font-size: 10.5px;
      margin-top: 1px;
    }
    .staff-id strong {
      font-family: monospace;
      font-size: 11px;
    }
    .salutation {
      font-weight: 700;
      color: #1e293b;
      margin-top: 2px;
    }
    .date-col {
      text-align: right;
    }
    .date-val {
      font-weight: 800;
      font-size: 11px;
      border-bottom: 1px solid #94a3b8;
      padding-bottom: 1px;
    }
    .subject {
      text-align: center;
      font-size: 13px;
      font-weight: 900;
      text-decoration: underline;
      text-underline-offset: 3px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 4px 0 5px;
      color: #020617;
    }
    .letter-body {
      font-size: 10.5px;
      line-height: 1.38;
      text-align: justify;
      color: #1e293b;
    }
    .letter-body p {
      margin-bottom: 3.5px;
    }
    .terms-lead {
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
      margin-bottom: 2.5px !important;
    }
    .terms-list {
      padding-left: 17px;
      margin-bottom: 3.5px;
    }
    .terms-list li {
      margin-bottom: 2px;
    }
    .resp-list {
      padding-left: 15px;
      margin-top: 1px;
      margin-bottom: 1px;
      list-style-type: square;
    }
    .resp-list li {
      margin-bottom: 1px;
    }
    .closing-p {
      margin-top: 3.5px;
      margin-bottom: 2px !important;
    }
    .congrats-p {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px !important;
    }
    .signoff-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 5px;
      padding-top: 3px;
    }
    .signoff {
      font-size: 10.5px;
    }
    .signoff .yours {
      font-weight: 600;
      margin-bottom: 16px;
    }
    .signoff .sig-line {
      width: 150px;
      border-bottom: 2px solid #1e293b;
      margin-bottom: 2px;
    }
    .signoff .name {
      font-weight: 800;
      font-size: 12px;
      color: #020617;
    }
    .signoff .title {
      font-weight: 600;
      color: #475569;
      font-size: 10px;
    }
    .signoff .school {
      font-weight: 700;
      font-size: 10px;
      color: #0f172a;
    }
    .acceptance-slip {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 5px 9px;
      background: #f8fafc;
      width: 235px;
      font-size: 9.5px;
    }
    .slip-title {
      font-weight: 800;
      font-size: 9.5px;
      color: #1e293b;
      margin-bottom: 1.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .slip-text {
      color: #64748b;
      margin-bottom: 4px;
      line-height: 1.2;
      font-size: 8.5px;
    }
    .slip-fields {
      display: flex;
      flex-direction: column;
      gap: 3.5px;
    }
    .slip-col {
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 700;
    }
    .slip-line {
      flex: 1;
      border-bottom: 1px solid #64748b;
      height: 9px;
    }
  `;
}

/**
 * Builds the inner HTML of a single official A4 Appointment Letter.
 */
export function generateSingleAppointmentLetterHTML(
  staff: Staff,
  options?: PrintAppointmentLetterOptions,
  logoSrc: string = '/logo.jpg',
  schoolInfo?: { name?: string; address?: string; phone?: string; email?: string }
): string {
  const schoolName = options?.name || schoolInfo?.name || 'AI INTEGRATED ACADEMY ARGUNGU';
  const schoolAddress = options?.address || schoolInfo?.address || "Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu, Kebbi State";
  const schoolPhone = options?.phone || schoolInfo?.phone || '08069676697, 07034784861';
  const schoolEmail = options?.email || schoolInfo?.email || 'alijabahintegratedacademyarg@gmail.com';
  
  const currentDate = options?.date || new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rawSalary = options?.salary !== undefined
    ? String(options.salary).replace(/[^0-9]/g, '')
    : (staff.salary ? String(staff.salary).replace(/[^0-9]/g, '') : '50000');
  const salaryAmount = rawSalary ? Number(rawSalary).toLocaleString() : '50,000';
  const salaryWords = options?.salaryWords || (numberToNairaWords(rawSalary || 50000) || 'Fifty Thousand Naira Only');
  const position = options?.position || staff.role || 'Teacher';
  const staffId = staff.idNumber || 'AIA-STF26';
  const employmentType = options?.employmentType || 'Full-Time';
  const signatoryName = options?.signatoryName || "Prof. Murtala Ahmed Rufa'i";
  const signatoryTitle = options?.signatoryTitle || "Executive Director";
  const probationPeriod = options?.probationPeriod || "6 months";
  const noticePeriod = options?.noticePeriod || "one month";

  return `
    <div class="page">
      <div class="watermark">
        <img src="${logoSrc}" alt="" />
      </div>
      <div class="content">
        <!-- Header -->
        <div class="header">
          <div class="logo-circle">
            <img src="${logoSrc}" alt="School Logo" />
          </div>
          <div class="school-info">
            <h1>${schoolName.replace(/ARGUNGU/i, '<br>ARGUNGU')}</h1>
            <div class="motto-banner">Motto: <em>Learning Today Leading Tomorrow</em></div>
          </div>
        </div>

        <!-- Contact with Vector SVG Icons -->
        <div class="contact-row">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${schoolAddress}</span>
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>${schoolPhone}</span>
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span>${schoolEmail}</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider">
          <div class="line1"></div>
          <div class="line2"></div>
        </div>

        <!-- Recipient & Date Row -->
        <div class="recipient-row">
          <div>
            <div class="label-to">To:</div>
            <div class="teacher-name">${staff.name}</div>
            <div class="staff-id">Staff ID / Adm No: <strong>${staffId}</strong></div>
            <div class="salutation">Dear Sir/Ma,</div>
          </div>
          <div class="date-col">
            <div class="date-val">${currentDate}</div>
          </div>
        </div>

        <!-- Subject -->
        <div class="subject">OFFER OF PROVISIONAL APPOINTMENT</div>

        <!-- Body -->
        <div class="letter-body">
          <p>
            With reference to your application for employment and subsequent interaction and interview, we are pleased to offer you a <strong>${employmentType}</strong> position as <strong>${position}</strong> in our ever-progressive school.
          </p>
          <p>
            Your employment is based on our confidence in your competence, dedication, and commitment to effective teaching, moral upbringing of learners, and the overall progress of the school.
          </p>
          <p class="terms-lead">The terms and conditions of your appointment are as follows:</p>

          <ol class="terms-list">
            <li><strong>Commencement Date:</strong> Your appointment takes effect from ${currentDate}.</li>
            <li><strong>Probationary Period:</strong> You will serve a ${probationPeriod} probationary period starting from your date of resumption. Within this period, there will be monthly performance appraisals over defined agreed tasks.</li>
            <li><strong>Confirmation:</strong> Confirmation of this offer is subject to the satisfactory completion of your ${probationPeriod} probationary period.</li>
            <li>
              <strong>Core Responsibilities:</strong>
              <ul class="resp-list">
                <li>Planning and delivering lessons effectively.</li>
                <li>Maintaining a safe, nurturing, and productive learning environment.</li>
                <li>Supporting the holistic development and moral upbringing of the learners.</li>
                <li>Assessing and recording learners' progress and providing feedback.</li>
                <li>Participating in school activities as directed by the administration.</li>
              </ul>
            </li>
            <li><strong>Salary:</strong> Your role shall be indemnified with a monthly salary of (${salaryWords}) (₦${salaryAmount}).</li>
            <li><strong>Holiday & Leave:</strong> You will be entitled to official school holidays during term breaks, except when required for scheduled staff development trainings.</li>
            <li><strong>Maternity Leave:</strong> Female staff are entitled to 12 weeks of maternity leave in line with the school's employment policy.</li>
            <li><strong>Termination:</strong> Either you or the school can end this appointment by giving ${noticePeriod} written notice. If notice is not given, ${noticePeriod} salary will be paid in lieu.</li>
          </ol>

          <p class="closing-p">
            Kindly indicate your acceptance of this offer by endorsing and returning the attached copy of this letter. Please also submit one recent passport photograph for your file along with the signed last page of the <strong>CODE OF CONDUCT POLICY FOR EMPLOYEES</strong>.
          </p>
          <p class="congrats-p">Do accept our warm congratulations.</p>
        </div>

        <!-- Sign-off Block -->
        <div class="signoff-row">
          <div class="signoff">
            <p class="yours">Yours Faithfully,</p>
            <div class="sig-line"></div>
            <p class="name">${signatoryName}</p>
            <p class="title">${signatoryTitle}</p>
            <p class="school">${schoolName}</p>
          </div>

          <!-- Acceptance Endorsement Slip -->
          <div class="acceptance-slip">
            <div class="slip-title">ACCEPTANCE ENDORSEMENT</div>
            <div class="slip-text">I accept the offer of provisional appointment under the stated terms.</div>
            <div class="slip-fields">
              <div class="slip-col"><span>Signature:</span><div class="slip-line"></div></div>
              <div class="slip-col"><span>Date:</span><div class="slip-line"></div></div>
            </div>
          </div>
        </div>

      </div>
    </div>`;
}

/**
 * Bulletproof print function that opens a dedicated, properly sized window,
 * writes the A4 letter HTML with full media styles, and triggers native print.
 */
export function printHTMLDocument(htmlContent: string) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    const trigger = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.error('Error invoking printWindow.print()', e);
        }
      }, 350);
    };

    if (printWindow.document.readyState === 'complete') {
      trigger();
    } else {
      printWindow.onload = trigger;
      // Fallback timer
      setTimeout(trigger, 1000);
    }
    return;
  }

  // Fallback if popup is blocked: use an off-screen iframe with true A4 dimensions
  try {
    let iframe = document.getElementById('ai-appointment-print-iframe') as HTMLIFrameElement | null;
    if (iframe) iframe.remove();

    iframe = document.createElement('iframe');
    iframe.id = 'ai-appointment-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (e) {
          console.error('Iframe fallback print failed', e);
        }
      }, 500);
    }
  } catch (err) {
    console.error('Could not print appointment letter', err);
    alert('Please allow popups to print official appointment letters.');
  }
}

/**
 * 1-click function to directly print an appointment letter for an individual staff member.
 */
export function printIndividualAppointmentLetter(
  staff: Staff,
  logoSrc: string = '/logo.jpg',
  schoolInfo?: { name?: string; address?: string; phone?: string; email?: string },
  customOptions?: PrintAppointmentLetterOptions
) {
  if (!staff) {
    alert('No staff record selected to generate appointment letter.');
    return;
  }
  return printBulkAppointmentLetters([staff], logoSrc, schoolInfo, customOptions);
}

/**
 * Bulk prints appointment letters for an array of staff members.
 */
export function printBulkAppointmentLetters(
  staffList: Staff[],
  logoSrc: string = '/logo.jpg',
  schoolInfo?: { name?: string; address?: string; phone?: string; email?: string },
  customOptions?: PrintAppointmentLetterOptions
) {
  if (!staffList || staffList.length === 0) {
    alert('No staff records selected to generate appointment letters.');
    return;
  }

  const schoolName = customOptions?.name || schoolInfo?.name || 'AI INTEGRATED ACADEMY ARGUNGU';
  const pagesHTML = staffList
    .map(staff => generateSingleAppointmentLetterHTML(staff, customOptions, logoSrc, schoolInfo))
    .join('\n');

  const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Official Appointment Letters - ${schoolName}</title>
  <style>
    ${getAppointmentLetterPrintStyles()}
  </style>
</head>
<body>
  ${pagesHTML}
</body>
</html>`;

  printHTMLDocument(printHTML);
}

export default function AppointmentLetterModal({
  staff,
  isOpen,
  onClose,
  allStaff,
  schoolSettings,
}: AppointmentLetterModalProps) {
  // Configurable fields state
  const [teacherName, setTeacherName] = useState(staff.name || '');
  const [staffId, setStaffId] = useState(staff.idNumber || 'AIA-STF26-001');
  const [salaryAmount, setSalaryAmount] = useState(() => {
    const raw = staff.salary ? String(staff.salary).replace(/[^0-9]/g, '') : '50000';
    return raw ? Number(raw).toLocaleString() : '50,000';
  });
  const [salaryWords, setSalaryWords] = useState(() => {
    const raw = staff.salary ? String(staff.salary).replace(/[^0-9]/g, '') : '50000';
    return numberToNairaWords(raw || 50000) || 'Fifty Thousand Naira Only';
  });
  const [appointmentDate, setAppointmentDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });
  const [position, setPosition] = useState(staff.role || 'Teacher');
  const [employmentType, setEmploymentType] = useState<'Full-Time' | 'Part-Time'>('Full-Time');
  const [signatoryName, setSignatoryName] = useState("Prof. Murtala Ahmed Rufa'i");
  const [signatoryTitle, setSignatoryTitle] = useState('Executive Director');

  // Terms customization
  const [probationPeriod, setProbationPeriod] = useState('6 months');
  const [noticePeriod, setNoticePeriod] = useState('one month');
  const [showAdvancedTerms, setShowAdvancedTerms] = useState(false);

  // Mobile View Switcher (between Customize Form and Preview)
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('preview');

  // Sync state when staff changes
  useEffect(() => {
    setTeacherName(staff.name || '');
    setStaffId(staff.idNumber || 'AIA-STF26-001');
    const raw = staff.salary ? String(staff.salary).replace(/[^0-9]/g, '') : '50000';
    setSalaryAmount(raw ? Number(raw).toLocaleString() : '50,000');
    setSalaryWords(numberToNairaWords(raw || 50000) || 'Fifty Thousand Naira Only');
    setPosition(staff.role || 'Teacher');
  }, [staff]);

  // Handle salary figures input change with auto-conversion to words
  const handleSalaryChange = (val: string) => {
    const digitsOnly = val.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
      setSalaryAmount('');
      setSalaryWords('');
      return;
    }
    const num = Number(digitsOnly);
    setSalaryAmount(num.toLocaleString());
    setSalaryWords(numberToNairaWords(num));
  };

  const schoolName = schoolSettings?.schoolName || 'AI INTEGRATED ACADEMY ARGUNGU';
  const schoolAddress = schoolSettings?.address || "Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu, Kebbi State";
  const schoolPhone = schoolSettings?.phones || '08069676697, 07034784861';
  const schoolEmail = 'alijabahintegratedacademyarg@gmail.com';
  const logoSrc = schoolSettings?.logo || '/logo.jpg';

  const handlePrint = () => {
    const currentOptions: PrintAppointmentLetterOptions = {
      name: schoolName,
      address: schoolAddress,
      phone: schoolPhone,
      email: schoolEmail,
      salary: salaryAmount,
      salaryWords: salaryWords,
      date: appointmentDate,
      position: position,
      employmentType: employmentType,
      signatoryName: signatoryName,
      signatoryTitle: signatoryTitle,
      probationPeriod: probationPeriod,
      noticePeriod: noticePeriod,
    };

    const currentStaff: Staff = {
      ...staff,
      name: teacherName || staff.name,
      idNumber: staffId || staff.idNumber,
      role: position || staff.role,
    };

    const singlePageHTML = generateSingleAppointmentLetterHTML(
      currentStaff,
      currentOptions,
      logoSrc,
      { name: schoolName, address: schoolAddress, phone: schoolPhone, email: schoolEmail }
    );

    const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Appointment Letter - ${teacherName}</title>
  <style>
    ${getAppointmentLetterPrintStyles()}
  </style>
</head>
<body>
  ${singlePageHTML}
</body>
</html>`;

    printHTMLDocument(printHTML);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white md:rounded-3xl max-w-7xl w-full h-full md:h-[95vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Control Bar */}
        <div className="p-4 md:px-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm md:text-base font-black tracking-tight leading-tight flex items-center gap-2 truncate">
                  <span className="truncate">Teacher Appointment Letter</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                    Provisional
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 font-semibold truncate">
                  {teacherName} ({staffId}) • Standard 1-Page A4 Letter
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:hidden hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer shrink-0 ml-2"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Mobile view toggle */}
            <div className="flex lg:hidden bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMobileTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mobileTab === 'edit' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mobileTab === 'preview' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {allStaff && allStaff.length > 1 && (
              <button
                type="button"
                onClick={() => printBulkAppointmentLetters(allStaff, logoSrc, { name: schoolName, address: schoolAddress, phone: schoolPhone, email: schoolEmail })}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 whitespace-nowrap"
                title="Print letters for all staff in directory"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All ({allStaff.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 sm:px-5 bg-gradient-to-r from-emerald-600 to-[#0f7343] hover:from-emerald-700 hover:to-[#0b5c34] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Print A4 Letter</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split into Settings Editor (Left) & A4 Preview (Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-100 min-h-0">
          
          {/* LEFT: Configuration Panel (4 cols) */}
          <div className={`lg:col-span-4 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-4 min-h-0 ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Letter Parameters</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTeacherName(staff.name || '');
                  setStaffId(staff.idNumber || 'AIA-STF26-001');
                  const raw = staff.salary ? String(staff.salary).replace(/[^0-9]/g, '') : '50000';
                  setSalaryAmount(raw ? Number(raw).toLocaleString() : '50,000');
                  setSalaryWords(numberToNairaWords(raw || 50000) || 'Fifty Thousand Naira Only');
                  setPosition(staff.role || 'Teacher');
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                title="Reset to default staff record values"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Field: Teacher Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Teacher / Staff Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Fatima Abubakar"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            {/* Field: Staff ID / Adm No */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Staff ID / Adm No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. AIA-STF26-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            {/* Field: Monthly Salary Figures */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Monthly Salary (₦) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-emerald-600 font-semibold">Auto-converts to words</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">₦</span>
                <input
                  type="text"
                  value={salaryAmount}
                  onChange={(e) => handleSalaryChange(e.target.value)}
                  placeholder="50,000"
                  className="w-full pl-8 pr-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Field: Monthly Salary in Words */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Salary in Words
              </label>
              <textarea
                rows={2}
                value={salaryWords}
                onChange={(e) => setSalaryWords(e.target.value)}
                placeholder="Fifty Thousand Naira Only"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white resize-none"
              />
            </div>

            {/* Field: Date / Commencement Date */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Commencement / Appointment Date
              </label>
              <input
                type="text"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                placeholder="e.g. 1 September 2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            {/* Field: Position & Employment Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Role / Position
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Class Teacher"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Employment
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as 'Full-Time' | 'Part-Time')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                </select>
              </div>
            </div>

            {/* Advanced Terms Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedTerms(!showAdvancedTerms)}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <span>Terms & Signatory Controls</span>
                {showAdvancedTerms ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showAdvancedTerms && (
                <div className="p-3 bg-white space-y-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Probation Period</label>
                    <input
                      type="text"
                      value={probationPeriod}
                      onChange={(e) => setProbationPeriod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Notice Period</label>
                    <input
                      type="text"
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Signatory Name</label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Signatory Title</label>
                    <input
                      type="text"
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-800 font-semibold space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Single-Page A4 Precision</span>
              </div>
              <p className="text-[10.5px] text-emerald-700">
                Formatted to fit cleanly on 1 page with no overflowing text or cutoffs.
              </p>
            </div>
          </div>

          {/* RIGHT: Document Preview (8 cols) */}
          <div className={`lg:col-span-8 p-3 sm:p-6 overflow-y-auto flex items-start justify-center min-h-0 ${
            mobileTab === 'edit' ? 'hidden lg:flex' : 'flex'
          }`}>
            
            {/* A4 Paper Sheet Preview */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-[740px] w-full p-6 sm:p-8 relative overflow-hidden text-slate-900 font-sans">
              
              {/* Subtle Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt="" className="w-[380px] h-[380px] object-contain" />
              </div>

              {/* Main Document Content */}
              <div className="relative z-10 space-y-3">
                
                {/* Header */}
                <div className="flex items-center gap-4 pb-1">
                  <div className="w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center border border-slate-100 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} alt="School Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-[20px] sm:text-[24px] font-black text-[#1B3A6B] uppercase leading-tight tracking-tight">
                      AI INTEGRATED<br />ACADEMY ARGUNGU
                    </h1>
                    <div className="mt-1.5 inline-block bg-[#D4851F] text-white px-3 py-0.5 text-[10px] sm:text-[11px] font-bold italic rounded-[3px] shadow-xs">
                      Motto: Learning Today Leading Tomorrow
                    </div>
                  </div>
                </div>

                {/* Contact Row */}
                <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-[#1B3A6B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>${schoolAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-[#1B3A6B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>${schoolPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-[#1B3A6B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <span>${schoolEmail}</span>
                  </div>
                </div>

                {/* Dual Color Divider Lines */}
                <div>
                  <div className="h-0.5 bg-[#1B3A6B] rounded-xs" />
                  <div className="h-0.5 bg-[#D4851F] rounded-xs mt-0.5" />
                </div>

                {/* Recipient & Date */}
                <div className="flex justify-between items-start text-[11px] pt-0.5">
                  <div>
                    <span className="font-bold text-slate-500 block">To:</span>
                    <span className="font-black text-sm text-slate-900 block">${teacherName || '[Staff Name]'}</span>
                    <span className="font-semibold text-slate-600 block text-[10.5px]">
                      Staff ID / Adm No: <strong className="font-mono text-slate-900">${staffId || 'AIA-STF26'}</strong>
                    </span>
                    <span className="font-bold text-slate-800 block mt-0.5">Dear Sir/Ma,</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-[11px] text-slate-900 border-b border-slate-300 pb-0.5">
                      ${appointmentDate}
                    </span>
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center py-0.5">
                  <h2 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wide underline underline-offset-4">
                    OFFER OF PROVISIONAL APPOINTMENT
                  </h2>
                </div>

                {/* Document Clauses */}
                <div className="text-[10.5px] leading-relaxed text-justify text-slate-800 space-y-1.5">
                  <p>
                    With reference to your application for employment and subsequent interaction and interview, we are pleased to offer you a <strong>${employmentType}</strong> position as <strong>${position}</strong> in our ever-progressive school.
                  </p>
                  <p>
                    Your employment is based on our confidence in your competence, dedication, and commitment to effective teaching, moral upbringing of learners, and the overall progress of the school.
                  </p>
                  <p className="font-bold text-slate-900 pt-0.5">
                    The terms and conditions of your appointment are as follows:
                  </p>

                  <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                    <li>
                      <strong>Commencement Date:</strong> Your appointment takes effect from ${appointmentDate}.
                    </li>
                    <li>
                      <strong>Probationary Period:</strong> You will serve a ${probationPeriod} probationary period starting from your date of resumption. Within this period, there will be monthly performance appraisals over defined agreed tasks.
                    </li>
                    <li>
                      <strong>Confirmation:</strong> Confirmation of this offer is subject to the satisfactory completion of your ${probationPeriod} probationary period.
                    </li>
                    <li>
                      <strong>Core Responsibilities:</strong>
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                        <li>Planning and delivering lessons effectively.</li>
                        <li>Maintaining a safe, nurturing, and productive learning environment.</li>
                        <li>Supporting the holistic development and moral upbringing of the learners.</li>
                        <li>Assessing and recording learners' progress and providing feedback.</li>
                        <li>Participating in school activities as directed by the administration.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Salary:</strong> Your role shall be indemnified with a monthly salary of (${salaryWords || 'N/A'}) (₦${salaryAmount || '0'}).
                    </li>
                    <li>
                      <strong>Holiday & Leave:</strong> You will be entitled to official school holidays during term breaks, except when required for scheduled staff development trainings.
                    </li>
                    <li>
                      <strong>Maternity Leave:</strong> Female staff are entitled to 12 weeks of maternity leave in line with the school's employment policy.
                    </li>
                    <li>
                      <strong>Termination:</strong> Either you or the school can end this appointment by giving ${noticePeriod} written notice. If notice is not given, ${noticePeriod} salary will be paid in lieu.
                    </li>
                  </ol>

                  <p className="pt-0.5">
                    Kindly indicate your acceptance of this offer by endorsing and returning the attached copy of this letter. Please also submit one recent passport photograph for your file along with the signed last page of the <strong>CODE OF CONDUCT POLICY FOR EMPLOYEES</strong>.
                  </p>
                  <p className="font-bold text-slate-900">
                    Do accept our warm congratulations.
                  </p>
                </div>

                {/* Sign-off & Acceptance Slip */}
                <div className="pt-2 flex items-end justify-between border-t border-slate-100">
                  <div className="text-[10.5px]">
                    <p className="font-semibold text-slate-700 mb-3.5">Yours Faithfully,</p>
                    <div className="w-36 border-b-2 border-slate-800 mb-1" />
                    <p className="font-black text-xs text-slate-950">{signatoryName}</p>
                    <p className="font-semibold text-slate-600 text-[10px]">{signatoryTitle}</p>
                    <p className="font-bold text-[#1B3A6B] text-[10px]">{schoolName}</p>
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-lg p-2.5 bg-slate-50/80 w-60 text-[9.5px]">
                    <span className="font-black text-slate-800 block uppercase tracking-wide">ACCEPTANCE ENDORSEMENT</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">I accept the offer under the stated terms.</span>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-600">Signature:</span>
                        <div className="flex-1 border-b border-slate-400 h-2.5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-600">Date:</span>
                        <div className="flex-1 border-b border-slate-400 h-2.5" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
