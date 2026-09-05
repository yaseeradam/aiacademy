'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/types';
import { X, Printer, FileText, CheckCircle2, MapPin, Phone, Mail } from 'lucide-react';
import { getSchoolSettingsAction } from '@/app/actions';

interface AdmissionLetterModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  allStudents?: Student[];
}

import { getStudentClassArm } from '@/lib/classUtils';
export { getStudentClassArm };

export function getStudentAdmissionNumber(student: Student): string {
  if (student.admissionNumber && (student.admissionNumber.startsWith('AIAA-B') || student.admissionNumber.startsWith('AIAA/'))) {
    return student.admissionNumber;
  }
  const currentYearShort = new Date().getFullYear().toString().slice(-2);
  const digits = (student.formNumber || student.id || '').replace(/\D/g, '');
  const num = digits ? String(parseInt(digits.slice(-3), 10) || 1).padStart(3, '0') : '001';
  return `AIAA-B${currentYearShort}-${num}`;
}

export function printBulkAdmissionLetters(students: Student[], logoSrc: string = '/logo.jpg', allStudents?: Student[]) {
  if (!students || students.length === 0) {
    alert('No student records found to generate admission letters.');
    return;
  }

  const pagesHTML = students.map(student => {
    const formattedDate = student.admissionDate || new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const academicSession = student.academicSession || '2026/2027';
    const resumptionDate = student.resumptionDate || '14th September, 2026';
    const admissionNumber = getStudentAdmissionNumber(student);
    const studentClassArm = getStudentClassArm(student.intendedClass, student.id, allStudents || students);
    const studentName = `${student.firstName} ${student.lastName}`;
    const photoSrc = student.photo || '';

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
            <h1>AI INTEGRATED<br>ACADEMY ARGUNGU</h1>
            <div class="motto-banner">Motto: <em>Learning Today Leading Tomorrow</em></div>
          </div>
        </div>

        <!-- Contact with Vector SVG Icons -->
        <div class="contact-row">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu, Kebbi State</span>
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>08069676697, 07034784861</span>
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span>alijabaintegratedacademyarg@gmail.com</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider">
          <div class="line1"></div>
          <div class="line2"></div>
        </div>

        <!-- Info Row -->
        <div class="info-row">
          <div class="meta-info">
            <div><span class="label">Student Name: </span><span class="value">${studentName}</span></div>
            <div><span class="label">Admission Number: </span><span class="value">${admissionNumber}</span></div>
            <div><span class="label">Class: </span><span class="value">${studentClassArm}</span></div>
          </div>
          <div class="right-col">
            <div class="date-line">Date: <span class="value">${formattedDate}</span></div>
            <div class="passport-box">
              ${photoSrc ? `<img src="${photoSrc}" alt="Passport" />` : '<div class="passport-placeholder">Passport<br>Photograph</div>'}
            </div>
          </div>
        </div>

        <!-- Subject -->
        <div class="subject">SUBJECT: ADMISSION LETTER</div>

        <!-- Body -->
        <div class="letter-body">
          <p class="greeting">Dear Parent/Guardian,</p>
          <p>We are pleased to inform you that your child has been offered admission into <strong>AI Integrated Academy Argungu</strong> into <strong>${studentClassArm.toUpperCase()}</strong> for the <strong>${academicSession}</strong> Academic Session.</p>
          <p>The admission is offered based on the assessment and admission requirements of the school. We are delighted to welcome your child into our learning community and look forward to supporting his/her academic, moral, and personal development.</p>
          <p>Please complete the registration process and settle the applicable school fees and other required charges on or before the stated deadline. Admission is subject to compliance with the school's rules, regulations, and code of conduct.</p>
          <p>We kindly request that the parent/guardian report to the school for final registration and submission of the required documents.</p>
          <p>We congratulate you and your child on this opportunity and look forward to a successful and rewarding academic journey together.</p>
        </div>

        <!-- Summary Table -->
        <table class="summary-table">
          <tr><td class="label-cell">Student Name</td><td class="value-cell">${studentName.toUpperCase()}</td></tr>
          <tr><td class="label-cell">Class / Level / Arm</td><td class="value-cell">${studentClassArm.toUpperCase()}</td></tr>
          <tr><td class="label-cell">Academic Session</td><td class="value-cell">${academicSession}</td></tr>
          <tr><td class="label-cell">Resumption Date</td><td class="value-cell">${resumptionDate}</td></tr>
        </table>

        <!-- Sign-off -->
        <div class="signoff">
          <p class="yours">Yours faithfully,</p>
          <div class="sig-line"></div>
          <p class="name">Prof. Murtala Ahmed Rufa'i</p>
          <p class="title">Executive Director</p>
          <p class="school">AI Integrated Academy Argungu</p>
        </div>


      </div>
    </div>`;
  }).join('\n');

  const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      background: white;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page {
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 15mm;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
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
      opacity: 0.06;
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
      flex: 1;
      height: 100%;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 22px;
      margin-bottom: 10px;
      width: 100%;
    }
    .logo-circle {
      width: 145px;
      height: 145px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
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
      font-size: 37px;
      font-weight: 900;
      color: #1B3A6B;
      text-transform: uppercase;
      line-height: 1.12;
      letter-spacing: -0.5px;
    }
    .motto-banner {
      display: inline-block;
      background: #D4851F;
      color: white;
      padding: 5px 20px;
      font-size: 14px;
      font-weight: 700;
      font-style: italic;
      border-radius: 3px;
      margin-top: 8px;
    }
    .contact-row {
      margin-top: 8px;
      font-size: 13px;
      color: #333;
    }
    .contact-row div {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 4px;
    }
    .contact-row svg {
      flex-shrink: 0;
      width: 15px;
      height: 15px;
    }
    .divider {
      margin-top: 8px;
      margin-bottom: 12px;
    }
    .divider .line1 {
      height: 4px;
      background: #1B3A6B;
      border-radius: 1px;
    }
    .divider .line2 {
      height: 4px;
      background: #D4851F;
      border-radius: 1px;
      margin-top: 3px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .meta-info {
      font-size: 13px;
    }
    .meta-info div {
      margin-bottom: 5px;
    }
    .meta-info .label {
      color: #555;
      font-weight: 600;
    }
    .meta-info .value {
      font-weight: 800;
      color: #111;
      border-bottom: 1px solid #999;
      padding-bottom: 2px;
      padding-left: 4px;
      padding-right: 4px;
      text-transform: uppercase;
    }
    .right-col {
      text-align: right;
    }
    .date-line {
      font-size: 13px;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }
    .date-line .value {
      border-bottom: 1px solid #999;
      padding-bottom: 2px;
      padding-left: 6px;
      font-weight: 600;
    }
    .passport-box {
      width: 96px;
      height: 112px;
      border: 2px solid #333;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
    }
    .passport-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .passport-placeholder {
      font-size: 10px;
      color: #999;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
    }
    .subject {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 10px 0 14px;
    }
    .letter-body {
      font-size: 13px;
      line-height: 1.65;
      text-align: justify;
      color: #222;
    }
    .letter-body p {
      margin-bottom: 9px;
    }
    .letter-body .greeting {
      font-weight: 700;
      margin-bottom: 9px;
    }
    .letter-body strong {
      font-weight: 700;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin: 12px 0;
    }
    .summary-table td {
      padding: 7px 10px;
      border: 1px solid #888;
    }
    .summary-table .label-cell {
      font-weight: 700;
      color: #333;
      background: #f5f5f5;
      width: 45%;
    }
    .summary-table .value-cell {
      font-weight: 800;
      color: #111;
    }
    .signoff {
      margin-top: 20px;
      font-size: 13px;
    }
    .signoff .yours {
      font-weight: 600;
      margin-bottom: 28px;
    }
    .signoff .sig-line {
      width: 190px;
      border-bottom: 2px solid #333;
      margin-bottom: 4px;
    }
    .signoff .name {
      font-weight: 800;
      font-size: 14px;
    }
    .signoff .title {
      font-weight: 600;
      color: #444;
      font-size: 12px;
    }
    .signoff .school {
      font-weight: 700;
      font-size: 12px;
    }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #888;
    }
    .footer .approved {
      color: #047857;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .footer .ref {
      font-family: monospace;
    }
  </style>
</head>
<body>
  ${pagesHTML}
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=850,height=1050');
  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    setTimeout(() => {
      printWindow.print();
    }, 1800);
  }
}

export default function AdmissionLetterModal({ student, isOpen, onClose, allStudents }: AdmissionLetterModalProps) {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_academy_school_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.logo) return parsed.logo;
        } catch {}
      }
    }
    return '/logo.jpg';
  });

  useEffect(() => {
    let isSubscribed = true;
    getSchoolSettingsAction().then(settings => {
      if (isSubscribed && settings?.logo) {
        setLogoSrc(settings.logo);
      }
    });
    return () => {
      isSubscribed = false;
    };
  }, []);

  if (!isOpen) return null;

  const formattedDate = student.admissionDate || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const academicSession = student.academicSession || '2026/2027';
  const resumptionDate = student.resumptionDate || '14th September, 2026';
  const admissionNumber = getStudentAdmissionNumber(student);
  const studentClassArm = getStudentClassArm(student.intendedClass, student.id, allStudents);
  const studentName = `${student.firstName} ${student.lastName}`;
  const photoSrc = student.photo || '';

  const handlePrint = () => {
    // Build standalone HTML with inline vector SVGs (matching Lucide icons exactly)
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      background: white;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page {
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 15mm;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Watermark */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.06;
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
      flex: 1;
      height: 100%;
    }
    /* Header */
    .header {
      display: flex;
      align-items: center;
      gap: 22px;
      margin-bottom: 10px;
      width: 100%;
    }
    .logo-circle {
      width: 145px;
      height: 145px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
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
      font-size: 37px;
      font-weight: 900;
      color: #1B3A6B;
      text-transform: uppercase;
      line-height: 1.12;
      letter-spacing: -0.5px;
    }
    .motto-banner {
      display: inline-block;
      background: #D4851F;
      color: white;
      padding: 5px 20px;
      font-size: 14px;
      font-weight: 700;
      font-style: italic;
      border-radius: 3px;
      margin-top: 8px;
    }
    /* Contact */
    .contact-row {
      margin-top: 8px;
      font-size: 13px;
      color: #333;
    }
    .contact-row div {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 4px;
    }
    .contact-row svg {
      flex-shrink: 0;
      width: 15px;
      height: 15px;
    }
    .divider {
      margin-top: 8px;
      margin-bottom: 12px;
    }
    .divider .line1 {
      height: 4px;
      background: #1B3A6B;
      border-radius: 1px;
    }
    .divider .line2 {
      height: 4px;
      background: #D4851F;
      border-radius: 1px;
      margin-top: 3px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .meta-info {
      font-size: 13px;
    }
    .meta-info div {
      margin-bottom: 5px;
    }
    .meta-info .label {
      color: #555;
      font-weight: 600;
    }
    .meta-info .value {
      font-weight: 800;
      color: #111;
      border-bottom: 1px solid #999;
      padding-bottom: 2px;
      padding-left: 4px;
      padding-right: 4px;
      text-transform: uppercase;
    }
    .right-col {
      text-align: right;
    }
    .date-line {
      font-size: 13px;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }
    .date-line .value {
      border-bottom: 1px solid #999;
      padding-bottom: 2px;
      padding-left: 6px;
      font-weight: 600;
    }
    .passport-box {
      width: 96px;
      height: 112px;
      border: 2px solid #333;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
    }
    .passport-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .passport-placeholder {
      font-size: 10px;
      color: #999;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
    }
    .subject {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 10px 0 14px;
    }
    .letter-body {
      font-size: 13px;
      line-height: 1.65;
      text-align: justify;
      color: #222;
    }
    .letter-body p {
      margin-bottom: 9px;
    }
    .letter-body .greeting {
      font-weight: 700;
      margin-bottom: 9px;
    }
    .letter-body strong {
      font-weight: 700;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin: 12px 0;
    }
    .summary-table td {
      padding: 7px 10px;
      border: 1px solid #888;
    }
    .summary-table .label-cell {
      font-weight: 700;
      color: #333;
      background: #f5f5f5;
      width: 45%;
    }
    .summary-table .value-cell {
      font-weight: 800;
      color: #111;
    }
    .signoff {
      margin-top: 20px;
      font-size: 13px;
    }
    .signoff .yours {
      font-weight: 600;
      margin-bottom: 28px;
    }
    .signoff .sig-line {
      width: 190px;
      border-bottom: 2px solid #333;
      margin-bottom: 4px;
    }
    .signoff .name {
      font-weight: 800;
      font-size: 14px;
    }
    .signoff .title {
      font-weight: 600;
      color: #444;
      font-size: 12px;
    }
    .signoff .school {
      font-weight: 700;
      font-size: 12px;
    }
    /* Divider */
    .divider {
      margin-top: 10px;
      margin-bottom: 14px;
    }
    .divider .line1 {
      height: 4px;
      background: #1B3A6B;
      border-radius: 1px;
    }
    .divider .line2 {
      height: 4px;
      background: #D4851F;
      border-radius: 1px;
      margin-top: 3px;
    }
    /* Info row */
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .meta-info {
      font-size: 13px;
    }
    .meta-info div {
      margin-bottom: 6px;
    }
    .meta-info .label {
      color: #555;
      font-weight: 600;
    }
    .meta-info .value {
      font-weight: 800;
      color: #111;
      border-bottom: 1px solid #999;
      padding-bottom: 2px;
      padding-left: 4px;
      padding-right: 4px;
      text-transform: uppercase;
    }
    .right-col {
      text-align: right;
    }
    .date-line {
      font-size: 13px;
      font-weight: 700;
      color: #333;
      margin-bottom: 10px;
    }
    .date-line .value {
      border-bottom: 1px solid #999;
      padding-bottom: 2px;
      padding-left: 6px;
      font-weight: 600;
    }
    .passport-box {
      width: 100px;
      height: 115px;
      border: 2px solid #333;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
    }
    .passport-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .passport-placeholder {
      font-size: 10px;
      color: #999;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
    }
    /* Subject */
    .subject {
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 8px 0 12px;
    }
    /* Body */
    .letter-body {
      font-size: 13px;
      line-height: 1.7;
      text-align: justify;
      color: #222;
    }
    .letter-body p {
      margin-bottom: 10px;
    }
    .letter-body .greeting {
      font-weight: 700;
      margin-bottom: 10px;
    }
    .letter-body strong {
      font-weight: 700;
    }
    /* Table */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin: 12px 0;
    }
    .summary-table td {
      padding: 8px 10px;
      border: 1px solid #888;
    }
    .summary-table .label-cell {
      font-weight: 700;
      color: #333;
      background: #f5f5f5;
      width: 45%;
    }
    .summary-table .value-cell {
      font-weight: 800;
      color: #111;
    }
    /* Sign-off */
    .signoff {
      margin-top: 20px;
      font-size: 13px;
    }
    .signoff .yours {
      font-weight: 600;
      margin-bottom: 30px;
    }
    .signoff .sig-line {
      width: 200px;
      border-bottom: 2px solid #333;
      margin-bottom: 4px;
    }
    .signoff .name {
      font-weight: 800;
      font-size: 14px;
    }
    .signoff .title {
      font-weight: 600;
      color: #444;
      font-size: 12px;
    }
    .signoff .school {
      font-weight: 700;
      font-size: 12px;
    }
    /* Footer */
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #888;
    }
    .footer .approved {
      color: #047857;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .footer .ref {
      font-family: monospace;
    }
  </style>
</head>
<body>
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
          <h1>AI INTEGRATED<br>ACADEMY ARGUNGU</h1>
          <div class="motto-banner">Motto: <em>Learning Today Leading Tomorrow</em></div>
        </div>
      </div>

      <!-- Contact with Vector SVG Icons -->
      <div class="contact-row">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu, Kebbi State</span>
        </div>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>08069676697, 07034784861</span>
        </div>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <span>alijabaintegratedacademyarg@gmail.com</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider">
        <div class="line1"></div>
        <div class="line2"></div>
      </div>

      <!-- Info Row -->
      <div class="info-row">
        <div class="meta-info">
          <div><span class="label">Student Name: </span><span class="value">${studentName}</span></div>
          <div><span class="label">Admission Number: </span><span class="value">${admissionNumber}</span></div>
          <div><span class="label">Class: </span><span class="value">${studentClassArm.toUpperCase()}</span></div>
        </div>
        <div class="right-col">
          <div class="date-line">Date: <span class="value">${formattedDate}</span></div>
          <div class="passport-box">
            ${photoSrc ? `<img src="${photoSrc}" alt="Passport" />` : '<div class="passport-placeholder">Passport<br>Photograph</div>'}
          </div>
        </div>
      </div>

      <!-- Subject -->
      <div class="subject">SUBJECT: ADMISSION LETTER</div>

      <!-- Body -->
      <div class="letter-body">
        <p class="greeting">Dear Parent/Guardian,</p>
        <p>We are pleased to inform you that your child has been offered admission into <strong>AI INTEGRATED ACADEMY ARGUNGU</strong> into <strong>${studentClassArm.toUpperCase()}</strong> for the <strong>${academicSession}</strong> Academic Session.</p>
        <p>The admission is offered based on the assessment and admission requirements of the school. We are delighted to welcome your child into our learning community and look forward to supporting his/her academic, moral, and personal development.</p>
        <p>Please complete the registration process and settle the applicable school fees and other required charges on or before the stated deadline. Admission is subject to compliance with the school's rules, regulations, and code of conduct.</p>
        <p>We kindly request that the parent/guardian report to the school for final registration and submission of the required documents.</p>
        <p>We congratulate you and your child on this opportunity and look forward to a successful and rewarding academic journey together.</p>
      </div>

      <!-- Summary Table -->
      <table class="summary-table">
        <tr><td class="label-cell">Student Name</td><td class="value-cell">${studentName.toUpperCase()}</td></tr>
        <tr><td class="label-cell">Class / Level / Arm</td><td class="value-cell">${studentClassArm.toUpperCase()}</td></tr>
        <tr><td class="label-cell">Academic Session</td><td class="value-cell">${academicSession}</td></tr>
        <tr><td class="label-cell">Resumption Date</td><td class="value-cell">${resumptionDate}</td></tr>
      </table>

      <!-- Sign-off -->
      <div class="signoff">
        <p class="yours">Yours faithfully,</p>
        <div class="sig-line"></div>
        <p class="name">Prof. Murtala Ahmed Rufa'i</p>
        <p class="title">Executive Director</p>
        <p class="school">AI Integrated Academy Argungu</p>
      </div>


    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 400);
      };
      setTimeout(() => {
        printWindow.print();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      
      {/* Modal Container */}
      <div className="bg-white md:rounded-3xl max-w-4xl w-full h-full md:h-auto md:max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-slide-down">
        
        {/* Top Control Bar */}
        <div className="p-4 md:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black tracking-tight leading-tight">Official A4 Admission Letter</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Student: {student.firstName} {student.lastName} ({admissionNumber})</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:hidden hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Document Body */}
        <div className="p-4 sm:p-8 md:p-12 overflow-y-auto flex-1 bg-slate-100">
          
          {/* A4 Paper Preview */}
          <div className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl border border-slate-200 shadow-md max-w-3xl mx-auto relative overflow-hidden">
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] select-none z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="" className="w-[500px] h-[500px] object-contain" />
            </div>

            {/* Main Letter Content */}
            <div className="relative z-10 space-y-6 text-slate-900 font-serif">
              
              {/* 1. Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-5 sm:gap-7">
                  <div className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} alt="School Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div className="font-sans">
                    <h1 className="text-[28px] sm:text-[38px] md:text-[42px] font-black text-[#1B3A6B] tracking-tight uppercase leading-[1.1]">
                      AI INTEGRATED<br />ACADEMY ARGUNGU
                    </h1>
                    <div className="mt-2.5 inline-block bg-[#D4851F] text-white px-5 py-1.5 text-[12px] sm:text-[14px] font-semibold italic rounded-[3px] shadow-sm">
                      Motto: <em className="font-semibold">Learning Today Leading Tomorrow</em>
                    </div>
                  </div>
                </div>

                <div className="pl-1 text-[12px] sm:text-[13px] text-[#333] font-sans space-y-1.5 leading-snug">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#1B3A6B] shrink-0" strokeWidth={2.5} />
                    <span>Behind Buben Ta&apos;Ololo&apos;s Residence, Tudun Wada, Argungu, Kebbi State</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#1B3A6B] shrink-0" strokeWidth={2.5} />
                    <span>08069676697, 07034784861</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#1B3A6B] shrink-0" strokeWidth={2.5} />
                    <span>alijabaintegratedacademyarg@gmail.com</span>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="h-[4px] bg-[#1B3A6B] w-full rounded-sm" />
                  <div className="h-[4px] bg-[#D4851F] w-full mt-[3px] rounded-sm" />
                </div>
              </div>

              {/* 2. Info Row */}
              <div className="font-sans flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Student Name:</span>
                    <span className="font-black text-slate-900 border-b border-slate-400 pb-0.5 px-1 min-w-[200px] inline-block uppercase">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Admission Number:</span>
                    <span className="font-black text-slate-900 font-mono border-b border-slate-400 pb-0.5 px-1 min-w-[180px] inline-block">
                      {admissionNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Class:</span>
                    <span className="font-black text-slate-900 border-b border-slate-400 pb-0.5 px-1 min-w-[150px] inline-block">
                      {studentClassArm}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    <span>Date: </span>
                    <span className="border-b border-slate-400 pb-0.5 px-2 font-semibold">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="w-28 h-32 border-2 border-slate-700 p-1 bg-white shadow-xs rounded-sm flex flex-col items-center justify-center shrink-0 relative">
                    {student.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={student.photo} alt="Student Passport" className="w-full h-full object-cover rounded-xs" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-center p-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">PASSPORT</span>
                        <span className="text-[9px] font-semibold text-slate-400 mt-1">PHOTOGRAPH</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Subject */}
              <div className="text-center pt-2 pb-1 font-sans">
                <h2 className="text-base sm:text-lg font-black text-slate-900 underline uppercase tracking-wide">
                  SUBJECT: ADMISSION LETTER
                </h2>
              </div>

              {/* 4. Body */}
              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-800 font-normal text-justify">
                <p className="font-bold font-sans">Dear Parent/Guardian,</p>
                <p>
                  We are pleased to inform you that your child has been offered admission into{' '}
                  <strong className="font-bold font-sans">AI Integrated Academy Argungu</strong> into{' '}
                  <strong className="font-bold font-sans uppercase text-slate-900 border-b border-slate-400 px-1">{studentClassArm}</strong> for the{' '}
                  <span className="font-bold border-b border-slate-400 px-1">{academicSession}</span> Academic Session.
                </p>
                <p>
                  The admission is offered based on the assessment and admission requirements of the school. We are
                  delighted to welcome your child into our learning community and look forward to supporting his/her
                  academic, moral, and personal development.
                </p>
                <p>
                  Please complete the registration process and settle the applicable school fees and other required charges on
                  or before the stated deadline. Admission is subject to compliance with the school&apos;s rules, regulations, and
                  code of conduct.
                </p>
                <p>
                  We kindly request that the parent/guardian report to the school for final registration and submission of the
                  required documents.
                </p>
                <p>
                  We congratulate you and your child on this opportunity and look forward to a successful and rewarding
                  academic journey together.
                </p>
              </div>

              {/* 5. Table */}
              <div className="pt-2 font-sans">
                <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm">
                  <tbody>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 w-1/2 border-r border-slate-400">Student Name</td>
                      <td className="p-2.5 font-extrabold text-slate-900 uppercase">{student.firstName} {student.lastName}</td>
                    </tr>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-400">Class / Level / Arm</td>
                      <td className="p-2.5 font-extrabold text-slate-900 uppercase">{studentClassArm}</td>
                    </tr>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-400">Academic Session</td>
                      <td className="p-2.5 font-bold text-slate-900">{academicSession}</td>
                    </tr>
                    <tr className="border border-slate-400">
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-400">Resumption Date</td>
                      <td className="p-2.5 font-bold text-slate-900">{resumptionDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 6. Sign-off */}
              <div className="pt-6 font-sans space-y-4">
                <p className="text-xs sm:text-sm font-semibold text-slate-800">Yours faithfully,</p>
                <div className="pt-4">
                  <div className="w-56 border-b-2 border-slate-800 mb-1" />
                  <p className="font-extrabold text-sm text-slate-900">Prof. Murtala Ahmed Rufa&apos;i</p>
                  <p className="text-xs font-semibold text-slate-700">Executive Director</p>
                  <p className="text-xs font-bold text-slate-800">AI Integrated Academy Argungu</p>
                </div>
              </div>



            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
