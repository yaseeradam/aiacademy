import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents, getAllParents, addOrUpdateStudent, addOrUpdateParent, normalizePhone } from '@/lib/db';
import { Student, Parent, VerificationStatus } from '@/types';
import { resolveAutoSubgroup } from '@/app/actions';

// Helper to generate a unique ID
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 11)}`;

// Helper to parse CSV lines handling quoted strings containing commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    let csvText = '';
    
    // Check content type to see how data is sent
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded in the request.' }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      // Fallback to text body
      csvText = await request.text();
    }

    if (!csvText || csvText.trim() === '') {
      return NextResponse.json({ error: 'Empty CSV data received.' }, { status: 400 });
    }

    // Load current DB state
    const parents = await getAllParents();
    const students = await getAllStudents();

    const parentsToSave = new Map<string, Parent>();
    const studentsToSave = new Map<string, Student>();

    // Basic CSV Parser
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must contain a header and at least one data row.' }, { status: 400 });
    }

    // Read header to map columns dynamically (case-insensitive, trimming spaces)
    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    
    let importCount = 0;
    let skippedDuplicateCount = 0;
    
    // Process each data line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty rows

      // Parse quoted CSV line values
      const values = parseCSVLine(line);
      if (values.length < header.length) continue; // Skip malformed rows

      // Create a key-value record based on headers
      const row: Record<string, string> = {};
      header.forEach((col, index) => {
        row[col] = values[index] || '';
      });

      // Map columns to student/parent properties
      const formNumber = row['form number'] || row['formno'] || row['form_number'] || `FORM-${1000 + i}`;
      const firstName = row['first name'] || row['firstname'] || row['first_name'] || row['student name']?.split(' ')[0] || 'Unknown';
      const lastName = row['last name'] || row['lastname'] || row['last_name'] || row['student name']?.split(' ').slice(1).join(' ') || 'Student';
      let rawClass = row['class'] || row['intended class'] || row['intendedclass'] || 'Nursery 1';
      const intendedClass = await resolveAutoSubgroup(rawClass, students);
      const gender = (row['gender'] || row['sex'] || 'Male').toLowerCase().startsWith('f') ? 'Female' : 'Male';
      const dateOfBirth = row['date of birth'] || row['dob'] || row['date_of_birth'] || '';
      const fatherName = row['father name'] || row['fathername'] || row['father_name'] || '';
      const motherName = row['mother name'] || row['mothername'] || row['mother_name'] || '';
      const residentialAddress = row['address'] || row['residential address'] || row['residential_address'] || '';
      
      // Phone numbers
      const phone1 = row['phone'] || row['phone 1'] || row['phone1'] || row['phone_number'] || row['parent phone'] || '';
      const phone2 = row['phone 2'] || row['phone2'] || '';
      
      const guardianName = row['guardian name'] || row['guardianname'] || '';
      const guardianAddress = row['guardian address'] || row['guardian_address'] || '';
      const nationality = row['nationality'] || 'Nigerian';
      const religion = row['religion'] || 'Islam';
      const status = (row['status'] || row['verification status'] || 'pending') as VerificationStatus;
      const correctionNotes = row['notes'] || row['correction notes'] || row['correction_notes'] || '';

      if (!phone1) continue; // Skip if no parent phone number is provided

      // Check if student already exists (duplicate check by formNumber or Name+Phone)
      const isDuplicate = students.some(s => 
        (formNumber && s.formNumber.trim().toLowerCase() === formNumber.trim().toLowerCase()) ||
        (firstName && lastName && s.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() && s.lastName.trim().toLowerCase() === lastName.trim().toLowerCase() && normalizePhone(s.phone1 || '') === normalizePhone(phone1))
      );

      if (isDuplicate) {
        skippedDuplicateCount++;
        continue;
      }

      // 1. Find or create the parent
      let parent = parents.find(p => normalizePhone(p.phoneNumber) === normalizePhone(phone1));
      let parentUpdated = false;
      if (!parent) {
        parent = {
          id: generateId('parent'),
          parentName: fatherName || motherName || guardianName || `Parent of ${firstName} ${lastName}`,
          phoneNumber: phone1
        };
        parents.push(parent);
        parentUpdated = true;
      } else {
        // Update parent name if we have a better one now
        if (!parent.parentName.includes('Parent of') && (fatherName || motherName)) {
          parent.parentName = fatherName || motherName;
          parentUpdated = true;
        }
      }
      if (parentUpdated) {
        parentsToSave.set(parent.id, parent);
      }

      // 2. Create the student
      const studentData: Student = {
        id: generateId('stud'),
        parentId: parent.id,
        formNumber,
        firstName,
        lastName,
        gender,
        intendedClass,
        verificationStatus: status,
        correctionNotes,
        dateOfBirth,
        fatherName,
        motherName,
        residentialAddress,
        phone1,
        phone2,
        guardianName,
        guardianAddress,
        nationality,
        religion
      };

      students.push(studentData);
      studentsToSave.set(studentData.id, studentData);
      importCount++;
    }

    // Save updated DB state
    for (const parent of parentsToSave.values()) {
      await addOrUpdateParent(parent);
    }
    for (const student of studentsToSave.values()) {
      await addOrUpdateStudent(student);
    }

    const message = skippedDuplicateCount > 0
      ? `Successfully imported ${importCount} new student records. Skipped ${skippedDuplicateCount} duplicate records.`
      : `Successfully imported ${importCount} student records.`;

    return NextResponse.json({
      success: true,
      message,
      count: importCount,
      skippedDuplicates: skippedDuplicateCount
    });
  } catch (error: unknown) {
    console.error('CSV import error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process CSV file.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
