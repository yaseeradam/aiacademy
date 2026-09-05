import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents, getAllParents, addOrUpdateStudent, addOrUpdateParent, normalizePhone } from '@/lib/db';
import { Student, Parent, VerificationStatus, PaymentStatus } from '@/types';
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

    // Strip UTF-8 BOM if present
    csvText = csvText.replace(/^\uFEFF/, '').trim();

    // Load current DB state
    const parents = await getAllParents();
    const students = await getAllStudents();

    const parentsToSave = new Map<string, Parent>();
    const studentsToSave = new Map<string, Student>();

    // Basic CSV Parser
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must contain a header and at least one data row.' }, { status: 400 });
    }

    // Read header to map columns dynamically (case-insensitive, trimming spaces and BOMs)
    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/^\uFEFF/, '').trim());
    
    let importCount = 0;
    let skippedDuplicateCount = 0;
    
    // Process each data line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Parse quoted CSV line values
      const values = parseCSVLine(line);

      // Create a key-value record based on headers
      const row: Record<string, string> = {};
      header.forEach((col, index) => {
        row[col] = values[index] ? values[index].trim() : '';
      });

      // Map columns to student/parent properties with extensive header alias coverage
      const formNumber = (
        row['form number'] || row['formnumber'] || row['formno'] || row['form_number'] || row['form #'] || row['form_#'] || ''
      ).trim();

      const admissionNumber = (
        row['admission number'] || row['admissionnumber'] || row['admission_number'] || row['admission_no'] || row['admission no'] || row['adm no'] || row['adm_no'] || ''
      ).trim();

      let firstName = (row['first name'] || row['firstname'] || row['first_name'] || '').trim();
      let lastName = (row['last name'] || row['lastname'] || row['last_name'] || '').trim();
      const rawFullName = (row['full name'] || row['fullname'] || row['full_name'] || row['student name'] || row['studentname'] || row['student_name'] || row['name'] || '').trim();

      if (!firstName && rawFullName) {
        const parts = rawFullName.split(/\s+/);
        firstName = parts[0] || 'Unknown';
        lastName = parts.slice(1).join(' ') || 'Student';
      }

      if (!firstName) firstName = 'Student';
      if (!lastName && !rawFullName) lastName = '';

      const rawClass = (
        row['class'] || row['intended class'] || row['intendedclass'] || row['intended_class'] || row['subclass arm'] || row['subclass_arm'] || row['subclass'] || 'Nursery 1'
      ).trim();

      // If rawClass is a base class name like "Nursery 1", auto-assign subgroup arm
      let intendedClass = rawClass;
      if (['Nursery 1', 'Basic 1', 'Basic 2'].includes(rawClass)) {
        intendedClass = await resolveAutoSubgroup(rawClass, [...students, ...Array.from(studentsToSave.values())]);
      }

      const gender = (row['gender'] || row['sex'] || 'Male').toLowerCase().startsWith('f') ? 'Female' : 'Male';
      const dateOfBirth = (row['date of birth'] || row['dob'] || row['date_of_birth'] || '').trim();
      const fatherName = (row['father name'] || row['fathername'] || row['father_name'] || '').trim();
      const motherName = (row['mother name'] || row['mothername'] || row['mother_name'] || '').trim();
      const residentialAddress = (row['address'] || row['residential address'] || row['residential_address'] || '').trim();
      
      // Phone numbers
      const phone1 = (
        row['phone 1'] || row['phone1'] || row['phone_1'] || row['phone'] || row['phone number'] || row['phone_number'] || row['phonenumber'] || row['parent phone'] || row['parent_phone'] || row['contact phone'] || row['contact_phone'] || ''
      ).trim();
      const phone2 = (row['phone 2'] || row['phone2'] || row['phone_2'] || '').trim();
      
      const guardianName = (row['parent / guardian name'] || row['parent/guardian name'] || row['guardian name'] || row['guardianname'] || row['guardian_name'] || row['parent name'] || '').trim();
      const guardianAddress = (row['guardian address'] || row['guardian_address'] || '').trim();
      const nationality = (row['nationality'] || 'Nigerian').trim();
      const religion = (row['religion'] || 'Islam').trim();
      const status = ((row['verification status'] || row['verification_status'] || row['status'] || 'pending').toLowerCase()) as VerificationStatus;
      const rawPayment = (row['fee payment status'] || row['payment status'] || row['payment_status'] || row['fee_payment_status'] || row['paymentstatus'] || '').toLowerCase();
      const paymentStatus: PaymentStatus = rawPayment.includes('paid') ? 'paid' : 'pending';
      const correctionNotes = (row['notes'] || row['correction notes'] || row['correction_notes'] || '').trim();

      const finalPhone1 = phone1 || 'N/A';

      // Duplicate check: skip ONLY if student already exists in active DB or staged queue
      const existingStudent = [...students, ...Array.from(studentsToSave.values())].find(s => {
        if (formNumber && s.formNumber && s.formNumber.trim().toLowerCase() === formNumber.toLowerCase()) {
          return true;
        }
        if (admissionNumber && s.admissionNumber && s.admissionNumber.trim().toLowerCase() === admissionNumber.toLowerCase()) {
          return true;
        }
        const isNameMatch = s.firstName.trim().toLowerCase() === firstName.toLowerCase() && 
                            s.lastName.trim().toLowerCase() === lastName.toLowerCase();
        const isPhoneMatch = phone1 && s.phone1 && normalizePhone(s.phone1) === normalizePhone(phone1);
        if (isNameMatch && isPhoneMatch) {
          return true;
        }
        return false;
      });

      if (existingStudent) {
        skippedDuplicateCount++;
        continue;
      }

      // Generate a non-conflicting form number if missing
      const finalFormNumber = formNumber || `FORM-${Date.now().toString().slice(-5)}-${i}`;

      // 1. Find or create the parent
      let parent = [...parents, ...Array.from(parentsToSave.values())].find(p => finalPhone1 !== 'N/A' && normalizePhone(p.phoneNumber) === normalizePhone(finalPhone1));
      let parentUpdated = false;
      if (!parent) {
        parent = {
          id: generateId('parent'),
          parentName: fatherName || motherName || guardianName || `Parent of ${firstName} ${lastName}`,
          phoneNumber: finalPhone1
        };
        parents.push(parent);
        parentUpdated = true;
      } else {
        // Update parent name if we have a better name now
        if (parent.parentName.startsWith('Parent of') && (fatherName || motherName || guardianName)) {
          parent.parentName = fatherName || motherName || guardianName;
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
        formNumber: finalFormNumber,
        admissionNumber: admissionNumber || undefined,
        firstName,
        lastName,
        gender,
        intendedClass,
        verificationStatus: ['verified', 'requires_correction', 'pending'].includes(status) ? status : 'pending',
        paymentStatus,
        correctionNotes,
        dateOfBirth,
        fatherName,
        motherName,
        residentialAddress,
        phone1: finalPhone1,
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

    // Save updated DB state to MongoDB
    for (const parent of parentsToSave.values()) {
      await addOrUpdateParent(parent);
    }
    for (const student of studentsToSave.values()) {
      await addOrUpdateStudent(student);
    }

    const message = skippedDuplicateCount > 0
      ? `Successfully imported ${importCount} student records into the database (${skippedDuplicateCount} duplicates skipped).`
      : `Successfully imported ${importCount} student records into the database.`;

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
