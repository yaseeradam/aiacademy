import { NextResponse } from 'next/server';
import { getAllStudents, getAllParents } from '@/lib/db';

export async function GET() {
  try {
    const students = await getAllStudents();
    const parents = await getAllParents();

    // Helper to escape values containing commas or quotes for CSV format
    const escapeCSV = (val: string | undefined | null) => {
      if (!val) return '';
      const stringVal = String(val).trim();
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    // Columns/Headers
    const headers = [
      'Form Number',
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
      'Correction Notes'
    ];

    const csvRows = [headers.join(',')];

    for (const student of students) {
      // Find parent just in case
      const parent = parents.find(p => p.id === student.parentId);
      
      const row = [
        escapeCSV(student.formNumber),
        escapeCSV(student.firstName),
        escapeCSV(student.lastName),
        escapeCSV(student.intendedClass),
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
        escapeCSV(student.correctionNotes)
      ];
      csvRows.push(row.join(','));
    }

    // Add UTF-8 Byte Order Mark (BOM) so Excel opens it with correct encoding instantly
    const csvContent = '\ufeff' + csvRows.join('\r\n');

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="student_verification_data.csv"',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    return response;
  } catch (error: any) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export CSV data.' }, { status: 500 });
  }
}
