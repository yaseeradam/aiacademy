import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getAllStudents, getAllParents, getAllStudentPhotos } from '@/lib/db';
import { getStudentAdmissionNumber, getStudentClassArm } from '@/lib/classUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format')?.toLowerCase();
    const isExcel = format === 'xlsx' || format === 'excel';

    const students = await getAllStudents();
    const parents = await getAllParents();
    const parentMap = new Map(parents.map(p => [p.id, p]));

    let photoMap = new Map<string, string>();
    try {
      photoMap = await getAllStudentPhotos();
    } catch (err) {
      console.warn('Could not fetch student photos from DB for export, continuing without embedded images:', err);
    }

    // When ?format=xlsx is requested, generate rich Excel with embedded photo thumbnails
    if (isExcel) {

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Integrated Academy';
    workbook.lastModifiedBy = 'Admin Portal System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Student Register', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      }
    });

    // 1. Institution Title Banner
    worksheet.mergeCells('A1:V1');
    const r1 = worksheet.getCell('A1');
    r1.value = 'AI INTEGRATED ACADEMY (AIA)';
    r1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    r1.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // 2. Subtitle Banner
    worksheet.mergeCells('A2:V2');
    const r2 = worksheet.getCell('A2');
    r2.value = 'OFFICIAL STUDENT ENROLMENT & VERIFICATION REGISTER (WITH PASSPORT PHOTOS)';
    r2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F7343' } };
    r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    r2.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 22;

    // 3. Metadata Banner
    worksheet.mergeCells('A3:V3');
    const r3 = worksheet.getCell('A3');
    const dateFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    r3.value = `Export Date: ${dateFormatted} | Total Enrolled: ${students.length} | Passport Photos Available: ${photoMap.size}`;
    r3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    r3.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 18;

    // 4. Columns Definition
    const columns = [
      { header: 'S/N', key: 'sn', width: 6 },
      { header: 'Student Photo', key: 'photo', width: 14 },
      { header: 'Adm No', key: 'admNo', width: 15 },
      { header: 'First Name', key: 'firstName', width: 18 },
      { header: 'Last Name', key: 'lastName', width: 18 },
      { header: 'Class / Arm', key: 'className', width: 16 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Date of Birth', key: 'dob', width: 14 },
      { header: 'Father Name', key: 'fatherName', width: 22 },
      { header: 'Mother Name', key: 'motherName', width: 22 },
      { header: 'Residential Address', key: 'address', width: 28 },
      { header: 'Phone 1', key: 'phone1', width: 16 },
      { header: 'Phone 2', key: 'phone2', width: 16 },
      { header: 'Guardian Name', key: 'guardianName', width: 20 },
      { header: 'Guardian Address', key: 'guardianAddress', width: 24 },
      { header: 'Nationality', key: 'nationality', width: 14 },
      { header: 'Religion', key: 'religion', width: 12 },
      { header: 'Verification Status', key: 'status', width: 18 },
      { header: 'Payment Status', key: 'payment', width: 15 },
      { header: 'Academic Session', key: 'session', width: 16 },
      { header: 'Admission Date', key: 'admDate', width: 15 },
      { header: 'Photo Link', key: 'photoUrl', width: 24 },
    ];

    worksheet.getRow(4).values = columns.map(c => c.header);
    worksheet.getRow(4).height = 26;

    columns.forEach((col, idx) => {
      worksheet.getColumn(idx + 1).width = col.width;
      const cell = worksheet.getRow(4).getCell(idx + 1);
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F7343' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });

    let rowNumber = 5;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const parent = parentMap.get(student.parentId);
      const admNo = getStudentAdmissionNumber(student);
      const classArm = getStudentClassArm(student.intendedClass, student.id, students);
      const row = worksheet.getRow(rowNumber);
      row.height = 55; // Provide spacious height for passport photo thumbnail

      const photoUrl = `https://portal.academyhub.com.ng/api/student-photo?id=${student.id}`;

      row.values = [
        i + 1,
        '', // Cell B: Reserved for visually embedded passport photo
        admNo,
        student.firstName || '',
        student.lastName || '',
        classArm || student.intendedClass || '',
        student.gender || '',
        student.dateOfBirth || '',
        student.fatherName || parent?.parentName || '',
        student.motherName || '',
        student.residentialAddress || '',
        student.phone1 || parent?.phoneNumber || '',
        student.phone2 || '',
        student.guardianName || '',
        student.guardianAddress || '',
        student.nationality || '',
        student.religion || '',
        (student.verificationStatus || 'pending').toUpperCase(),
        (student.paymentStatus || 'pending').toUpperCase(),
        student.academicSession || '2024/2025',
        student.admissionDate || '',
        photoUrl
      ];

      const isEven = i % 2 === 1;
      const zebraBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

      for (let c = 1; c <= columns.length; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Calibri', size: 9.5 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Centered columns: S/N, Photo, Adm No, Class, Gender, DOB, Phones, Nat, Rel, Status, Pay, Session, Adm Date
        if ([1, 2, 3, 6, 7, 8, 12, 13, 16, 17, 18, 19, 20, 21].includes(c)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        // Highlight Adm No
        if (c === 3) {
          cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F7343' } };
        }

        // Verification Status styling
        if (c === 18) {
          const val = String(cell.value).toUpperCase();
          if (val === 'VERIFIED') cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF15803D' } };
          else if (val.includes('CORRECTION')) cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFDC2626' } };
          else cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFD97706' } };
        }

        // Payment Status styling
        if (c === 19) {
          const val = String(cell.value).toUpperCase();
          if (val === 'PAID') cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF15803D' } };
          else cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFDC2626' } };
        }

        // Clickable Photo Link
        if (c === 22) {
          cell.value = { text: 'View Online Photo', hyperlink: photoUrl };
          cell.font = { name: 'Calibri', size: 9, underline: true, color: { argb: 'FF2563EB' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }

      // Embed student photo directly into cell B (column index 1 in 0-indexed ExcelJS)
      const rawPhoto = photoMap.get(student.id);
      let photoEmbedded = false;

      if (rawPhoto && typeof rawPhoto === 'string' && rawPhoto.startsWith('data:')) {
        const match = rawPhoto.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
        if (match) {
          try {
            let ext = match[1].toLowerCase();
            if (ext === 'jpg') ext = 'jpeg';
            if (ext !== 'jpeg' && ext !== 'png' && ext !== 'gif') ext = 'jpeg';
            const imgId = workbook.addImage({
              base64: match[2],
              extension: ext as 'jpeg' | 'png' | 'gif',
            });

            // Anchor within cell B (0-based col index 1, row index rowNumber - 1)
            worksheet.addImage(imgId, {
              tl: { col: 1.15, row: (rowNumber - 1) + 0.08 },
              ext: { width: 50, height: 50 },
              editAs: 'oneCell',
            });
            photoEmbedded = true;
          } catch {
            photoEmbedded = false;
          }
        }
      }

      if (!photoEmbedded) {
        row.getCell(2).value = '[No Photo]';
        row.getCell(2).font = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF94A3B8' } };
      }

      rowNumber++;
    }

    const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="student_register_with_photos.xlsx"',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Default: Professional CSV export containing Base64 passport pictures & photo URLs
    const escapeCSV = (val: string | undefined | null) => {
      if (!val) return '';
      const stringVal = String(val).trim();
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const headers = [
      'Adm No',
      'Photo (Base64)',
      'Photo URL',
      'First Name',
      'Last Name',
      'Class',
      'Gender',
      'Date of Birth',
      'Father Name',
      'Mother Name',
      'Residential Address',
      'Phone 1',
      'Phone 2',
      'Guardian Name',
      'Guardian Address',
      'Nationality',
      'Religion',
      'Verification Status',
      'Correction Notes',
      'Payment Status',
      'Academic Session',
      'Resumption Date',
      'Admission Date',
    ];

    const csvRows = [headers.join(',')];

    for (const student of students) {
      const parent = parentMap.get(student.parentId);
      const admNo = getStudentAdmissionNumber(student);
      const classArm = getStudentClassArm(student.intendedClass, student.id, students);
      const rawPhoto = (photoMap.get(student.id) || '').trim().replace(/[\r\n]/g, '');
      let base64Photo = '';
      if (rawPhoto.startsWith('data:')) {
        base64Photo = rawPhoto;
      } else if (rawPhoto.length > 100 && !rawPhoto.startsWith('http') && !rawPhoto.startsWith('/')) {
        base64Photo = `data:image/jpeg;base64,${rawPhoto}`;
      }
      const photoUrl = `https://portal.academyhub.com.ng/api/student-photo?id=${student.id}`;

      const row = [
        escapeCSV(admNo),
        escapeCSV(base64Photo),
        escapeCSV(photoUrl),
        escapeCSV(student.firstName),
        escapeCSV(student.lastName),
        escapeCSV(classArm || student.intendedClass),
        escapeCSV(student.gender),
        escapeCSV(student.dateOfBirth),
        escapeCSV(student.fatherName || parent?.parentName),
        escapeCSV(student.motherName),
        escapeCSV(student.residentialAddress),
        escapeCSV(student.phone1 || parent?.phoneNumber),
        escapeCSV(student.phone2),
        escapeCSV(student.guardianName),
        escapeCSV(student.guardianAddress),
        escapeCSV(student.nationality),
        escapeCSV(student.religion),
        escapeCSV(student.verificationStatus),
        escapeCSV(student.correctionNotes),
        escapeCSV(student.paymentStatus),
        escapeCSV(student.academicSession),
        escapeCSV(student.resumptionDate),
        escapeCSV(student.admissionDate),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = '\ufeff' + csvRows.join('\r\n');
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="student_verification_data_with_photos.csv"',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Student register export error:', error);
    const message = error instanceof Error ? error.message : 'Failed to export student register data.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
