import { Student } from '@/types';
import { getStudentClassArm, getStudentAdmissionNumber } from './classUtils';

export interface PrintClassRosterOptions {
  students: Student[];
  logoSrc?: string;
  schoolName?: string;
  selectedClass?: string; // 'all' or specific class arm like 'Nursery 1 Gold'
  showParentContact?: boolean;
  showPaymentStatus?: boolean;
  showGender?: boolean;
  academicSession?: string;
}

export function printStudentsByClassRoster({
  students,
  logoSrc = '/logo.jpg',
  schoolName = 'AI INTEGRATED ACADEMY ARGUNGU',
  selectedClass = 'all',
  showParentContact = true,
  showPaymentStatus = true,
  showGender = true,
  academicSession = '2026/2027',
}: PrintClassRosterOptions) {
  if (!students || students.length === 0) {
    alert('No student records found to print.');
    return;
  }

  // Group students by class arm
  const classGroups: Record<string, Student[]> = {};
  students.forEach(student => {
    const arm = getStudentClassArm(student.intendedClass, student.id, students);
    if (!classGroups[arm]) classGroups[arm] = [];
    classGroups[arm].push(student);
  });

  // Filter if a specific class is chosen
  let armsToPrint = Object.keys(classGroups).sort((a, b) => a.localeCompare(b));
  if (selectedClass && selectedClass !== 'all') {
    armsToPrint = armsToPrint.filter(arm => arm === selectedClass || arm.startsWith(selectedClass));
  }

  if (armsToPrint.length === 0) {
    alert(`No students found for class "${selectedClass}".`);
    return;
  }

  const totalFilteredStudents = armsToPrint.reduce((acc, arm) => acc + (classGroups[arm]?.length || 0), 0);
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Roster by Class - ${schoolName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #0f7343;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: contain;
      border: 2px solid #0f7343;
      background: white;
    }
    .school-title {
      font-size: 19px;
      font-weight: 900;
      color: #0f7343;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      line-height: 1.15;
    }
    .motto {
      font-size: 10px;
      font-weight: 700;
      color: #b45309;
      margin-top: 2px;
      letter-spacing: 0.3px;
    }
    .address {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .doc-meta {
      text-align: right;
      font-size: 10px;
      color: #475569;
      display: flex;
      flex-direction: column;
      gap: 3px;
      align-items: flex-end;
    }
    .doc-badge {
      display: inline-block;
      background: #0f7343;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
    }

    /* Summary Bar */
    .summary-bar {
      display: flex;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
      align-items: center;
      justify-content: space-between;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-val {
      font-size: 13px;
      font-weight: 900;
      color: #0f7343;
    }

    /* Class Section */
    .class-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .class-header {
      background: #0f7343;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px 6px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .class-name {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .class-count {
      font-size: 10px;
      font-weight: 800;
      background: #fef08a;
      color: #713f12;
      padding: 2px 8px;
      border-radius: 12px;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      border: 1px solid #cbd5e1;
      border-top: none;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
      color: #1e293b;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .sn-col {
      width: 32px;
      text-align: center;
      font-weight: 700;
      color: #64748b;
    }
    .name-col {
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .adm-col {
      font-family: 'Courier New', monospace;
      font-weight: 900;
      color: #0f7343;
    }
    .gender-col {
      width: 60px;
    }
    .gender-badge {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .gender-male {
      background: #e0f2fe;
      color: #0369a1;
    }
    .gender-female {
      background: #fce7f3;
      color: #be185d;
    }
    .paid-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
      font-size: 8.5px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .pending-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      font-size: 8.5px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    /* Footer */
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      min-width: 140px;
    }
    .sig-line {
      border-bottom: 1px solid #475569;
      height: 30px;
      margin-bottom: 4px;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <img src="${logoSrc}" class="logo" alt="Logo" />
        <div>
          <div class="school-title">${schoolName}</div>
          <div class="motto">Motto: Learning Today, Leading Tomorrow</div>
          <div class="address">Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu, Kebbi State</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-badge">OFFICIAL CLASS ROSTER</div>
        <div>Date: <strong>${currentDate}</strong></div>
        <div>Session: <strong>${academicSession}</strong></div>
      </div>
    </div>

    <!-- Summary Bar -->
    <div class="summary-bar">
      <div class="stat-card">
        <span class="stat-label">Total Listed Students</span>
        <span class="stat-val">${totalFilteredStudents} Students</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Classes / Arms Displayed</span>
        <span class="stat-val">${armsToPrint.length} Class Arm(s)</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Filter Mode</span>
        <span class="stat-val">${selectedClass === 'all' ? 'All Classes' : selectedClass}</span>
      </div>
    </div>

    <!-- Class Roster Tables -->
    ${armsToPrint.map(arm => {
      const armStudents = classGroups[arm] || [];
      return `
        <div class="class-section">
          <div class="class-header">
            <span class="class-name">CLASS: ${arm}</span>
            <span class="class-count">${armStudents.length} Enrolled Student(s)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th class="sn-col">S/N</th>
                <th>Student Full Name</th>
                <th>Adm No</th>
                ${showGender ? '<th class="gender-col">Gender</th>' : ''}
                ${showParentContact ? '<th>Parent / Guardian & Phone</th>' : ''}
                ${showPaymentStatus ? '<th style="text-align: right;">Fee Status</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${armStudents.map((s, idx) => {
                const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'N/A';
                const admNo = getStudentAdmissionNumber(s);
                const gender = s.gender || 'N/A';
                const parentName = s.fatherName || s.guardianName || s.motherName || 'N/A';
                const phone = s.phone1 || s.phone2 || '';
                const parentDisplay = phone ? `${parentName} (${phone})` : parentName;
                const isPaid = s.paymentStatus === 'paid';

                return `
                  <tr>
                    <td class="sn-col">${idx + 1}</td>
                    <td class="name-col">${fullName}</td>
                    <td class="adm-col">${admNo}</td>
                    ${showGender ? `
                      <td class="gender-col">
                        <span class="gender-badge ${gender.toLowerCase() === 'female' ? 'gender-female' : 'gender-male'}">
                          ${gender}
                        </span>
                      </td>` : ''}
                    ${showParentContact ? `<td>${parentDisplay}</td>` : ''}
                    ${showPaymentStatus ? `
                      <td style="text-align: right;">
                        <span class="${isPaid ? 'paid-badge' : 'pending-badge'}">
                          ${isPaid ? 'PAID ✓' : 'PENDING'}
                        </span>
                      </td>` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('')}

    <!-- Footer with Sign-off -->
    <div class="footer">
      <div>
        <div>Official Record • AI Integrated Academy Argungu, Kebbi State</div>
        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Printed via Admin Portal • Document verification valid for session ${academicSession}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div>School Authority / Principal</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=950,height=1000');
  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
  }
}
