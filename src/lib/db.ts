import clientPromise from './mongodb';
import { Parent, Student, VerificationStatus, AuditLog, SchoolSettings } from '../types';

const DB_NAME = 'ai_academy';
const PARENTS_COL = 'parents';
const STUDENTS_COL = 'students';
const AUDIT_COL = 'audit_logs';
const SETTINGS_COL = 'settings';

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — only inserted once when the database is empty
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_PARENTS: Parent[] = [
  { id: 'parent-1',  parentName: "Muh'd Bashir",              phoneNumber: '07038363534' },
  { id: 'parent-2',  parentName: 'Aliyu Musa',                phoneNumber: '08063764842' },
  { id: 'parent-3',  parentName: 'Lawal Sa,idu',              phoneNumber: '08039697744' },
  { id: 'parent-4',  parentName: 'Ibrahim shu,aibu',          phoneNumber: '08036749793' },
  { id: 'parent-5',  parentName: 'Murtala Sulaiman Marafa',   phoneNumber: '08032395458' },
  { id: 'parent-6',  parentName: 'Anas Adamu Augie',          phoneNumber: '08038795671' },
  { id: 'parent-7',  parentName: 'Mustapha Musa',             phoneNumber: '07038003381' },
  { id: 'parent-8',  parentName: 'Ibrahim Muhammad Zangina',  phoneNumber: '08065944704' },
  { id: 'parent-9',  parentName: 'Sama,ila Lamne Bubuche',    phoneNumber: '08038047105' },
  { id: 'parent-10', parentName: 'Umar Faruk Madawaki',       phoneNumber: '07036101710' },
  { id: 'parent-11', parentName: 'Ibrahim Abubakar',          phoneNumber: '08140555336' },
  { id: 'parent-12', parentName: 'Yusuf Yakubu',              phoneNumber: '08030439378' },
  { id: 'parent-13', parentName: 'Bilyameen Bawa',            phoneNumber: '08138203863' },
  { id: 'parent-14', parentName: 'Bashir Garba kangiwa',      phoneNumber: '07038697593' },
  { id: 'parent-15', parentName: 'Muhammad Ibrahim Musa',     phoneNumber: '070677766477' },
  { id: 'parent-16', parentName: 'Alh AbdulSalam Gande',      phoneNumber: '08166186744' },
  { id: 'parent-17', parentName: 'Lawali Musa Maina',         phoneNumber: '08062427576' },
  { id: 'parent-18', parentName: 'Salisu Sani',               phoneNumber: '08068899384' },
  { id: 'parent-19', parentName: 'Sani Abdullahi',            phoneNumber: '07038758969' },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stud-1', parentId: 'parent-1', formNumber: 'N-3000',
    firstName: 'Muhd Imam', lastName: 'Bashir', gender: 'Male',
    intendedClass: 'Basic 1', verificationStatus: 'verified',
    paymentStatus: 'paid', admissionNumber: 'AIAA/B/2026/001', academicSession: '2026/2027', resumptionDate: '14th September, 2026',
    dateOfBirth: '2017-01-10', fatherName: "Muh'd Bashir",
    motherName: 'Hauwa,u Abubakar kigo',
    residentialAddress: 'Near dutsen Mariya f|Tank, Argungu',
    phone1: '07038363534', guardianName: 'Hauwa,u Abubakar kigo',
    guardianAddress: 'of chc Uduths Branch Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-2', parentId: 'parent-2', formNumber: 'FORM-2026-002',
    firstName: 'Asma,u', lastName: 'Aliyu Musa', gender: 'Female',
    intendedClass: 'Basic 1', verificationStatus: 'pending',
    dateOfBirth: '2019-05-16', fatherName: 'Aliyu Musa',
    motherName: 'Aisha Aliyu',
    residentialAddress: 'low-cost Behind Area court, Argungu',
    phone1: '08063764842', guardianName: 'Aliyu Musa low cost',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-3', parentId: 'parent-3', formNumber: 'FORM-2026-003',
    firstName: 'Musa', lastName: 'Lawal', gender: 'Male',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '', fatherName: 'Lawal Sa,idu',
    motherName: 'Hadiza Musa',
    residentialAddress: 'Bayan shagun kici, Argungu',
    phone1: '08039697744', guardianName: 'Hadiza Musa',
    guardianAddress: 'Bayan shagunonin kici, Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-4', parentId: 'parent-4', formNumber: 'FORM-2026-004',
    firstName: 'Maryam', lastName: 'Ibrahim', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2023-02-08', fatherName: 'Ibrahim shu,aibu',
    motherName: 'Habiba Salisu',
    residentialAddress: 'House no:3 Dutsin Mariya Area, Argungu',
    phone1: '08036749793', guardianName: 'Ibrahim Shu,aibu',
    guardianAddress: 'House no. 16 Tsoaf RD Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-5', parentId: 'parent-5', formNumber: 'FORM-2026-005',
    firstName: 'Aisha', lastName: 'Murtala Marafa', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2022-11-02', fatherName: 'Murtala Sulaiman Marafa',
    motherName: 'Hadiza Bello Bawa',
    residentialAddress: 'Farin Tanki Area Argungu',
    phone1: '08032395458', guardianName: 'Murtala Sulaiman Marafa',
    guardianAddress: 'Nigerian correctional service Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-6', parentId: 'parent-6', formNumber: 'FORM-2026-006',
    firstName: 'Amina', lastName: 'Anas Augie', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2023-06-20', fatherName: 'Anas Adamu Augie',
    motherName: 'Hauwa,u Musa Bachaka',
    residentialAddress: 'Near Dan ganas Residence, Argungu',
    phone1: '08038795671', guardianName: 'Anas Adamu Augie',
    guardianAddress: 'Near Dan ganas residence',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-7', parentId: 'parent-7', formNumber: 'FORM-2026-007',
    firstName: 'Maryam', lastName: 'Mustapha Musa', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2022-10-09', fatherName: 'Mustapha Musa',
    motherName: 'Dayyaba Sama,ila na bame',
    residentialAddress: 'Gwaxange Area, Argungu',
    phone1: '07038003381',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-8', parentId: 'parent-8', formNumber: 'FORM-2026-008',
    firstName: 'Ibrahim', lastName: 'Ibrahim Zangina', gender: 'Male',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2021-06-22', fatherName: 'Ibrahim Muhammad Zangina',
    motherName: 'Sharifatu Abdul Kadir',
    residentialAddress: 'Farin Tanki Area, Argungu',
    phone1: '08065944704', guardianName: 'Farin Tanki Area',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-9', parentId: 'parent-9', formNumber: 'FORM-2026-009',
    firstName: 'Maimuna', lastName: 'Sama,ila', gender: 'Female',
    intendedClass: 'Basic 1', verificationStatus: 'pending',
    dateOfBirth: '2019-05-04', fatherName: 'Sama,ila Lamne Bubuche',
    motherName: 'Saliha Sani kokani',
    residentialAddress: 'Shiyar Buben ta alolo, Argungu',
    phone1: '08038047105', guardianName: 'Sama,ila Lamne Bubuche',
    guardianAddress: 'Sardaunan Bubuche, Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-10', parentId: 'parent-10', formNumber: 'FORM-2026-010',
    firstName: 'Faruk', lastName: 'Umar Madawaki', gender: 'Male',
    intendedClass: 'Basic 1', verificationStatus: 'pending',
    dateOfBirth: '2018-06-19', fatherName: 'Umar Faruk Madawaki',
    motherName: 'Salamatu Idris',
    residentialAddress: 'No.30 Albarka road T/wada, Argungu',
    phone1: '07036101710', guardianName: 'Laila Muhammad Kangiwa',
    guardianAddress: 'No.30 Albarka Road Tudun Wada Area',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-11', parentId: 'parent-11', formNumber: 'FORM-2026-011',
    firstName: 'Zainab', lastName: 'Ibrahim', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2023-08-02', fatherName: 'Ibrahim Abubakar',
    motherName: 'Aisha Isiyaka',
    residentialAddress: 'Sabon garin kanta behind kanta, Argungu',
    phone1: '08140555336', guardianName: 'Ibrahim Sabon garin kanta',
    guardianAddress: 'Behind kanta',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-12', parentId: 'parent-12', formNumber: 'FORM-2026-012',
    firstName: 'Bashar', lastName: 'Yusuf Yakubu', gender: 'Male',
    intendedClass: 'Basic 1', verificationStatus: 'pending',
    dateOfBirth: '', fatherName: 'Yusuf Yakubu',
    motherName: 'Fauziya Sulaiman Kalanda',
    residentialAddress: 'House no.4 behind ta ololo Area, Argungu',
    phone1: '08030439378', guardianName: 'Yusuf Yakubu',
    guardianAddress: 'House no.4 Behind ta ololo Area opposite maiyaki house Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-13', parentId: 'parent-13', formNumber: 'FORM-2026-013',
    firstName: 'Saudat', lastName: 'Bilyameen Bawa', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2022-01-10', fatherName: 'Bilyameen Bawa',
    motherName: 'Hassana Muhammad',
    residentialAddress: 'No:18 kyanga road T/wada Area, Argungu',
    phone1: '08138203863', guardianName: 'Bilyameen Bawa No.18 kyanga',
    guardianAddress: 'Road tudun wada Area Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-14', parentId: 'parent-14', formNumber: 'FORM-2026-014',
    firstName: 'Yusuf', lastName: 'Bashir Kangiwa', gender: 'Male',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2022-05-22', fatherName: 'Bashir Garba kangiwa',
    motherName: 'Hauwa,u Yusuf kangiwa',
    residentialAddress: 'Behind Buben ta ololo, Argungu',
    phone1: '07038697593', guardianName: 'Bashir Garba kangiwa',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-15', parentId: 'parent-15', formNumber: 'FORM-2026-015',
    firstName: 'Salamatu', lastName: 'Muhammad Ibrahim', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2023-10-21', fatherName: 'Muhammad Ibrahim Musa',
    motherName: 'Aisha Ibrahim Usman',
    residentialAddress: 'Low cost Area Argungu',
    phone1: '070677766477', guardianName: 'Ibrahim Usman Manxo',
    guardianAddress: 'Low cost area Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-16', parentId: 'parent-4', formNumber: 'FORM-2026-016',
    firstName: 'Hassana', lastName: 'Ibrahim Shu,aibu', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '', fatherName: 'Ibrahim Shu,aibu',
    motherName: 'Sadiya Adamu',
    residentialAddress: 'Behind Shagunan k.c, Argungu',
    phone1: '08036749793', guardianName: 'Ibrahim Shu,aibu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-17', parentId: 'parent-16', formNumber: 'FORM-2026-017',
    firstName: 'Aisha', lastName: 'AbdulSalam Gande', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2022-07-12', fatherName: 'Alh AbdulSalam Gande',
    motherName: 'Zainab Haruna',
    residentialAddress: 'Farin Tanki Area Argungu',
    phone1: '08166186744', guardianName: 'Alh AbdulSalam Gande',
    guardianAddress: 'Farin Tanki Area Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-18', parentId: 'parent-17', formNumber: 'FORM-2026-018',
    firstName: 'Aisha', lastName: 'Lawal Maina', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2024-04-11', fatherName: 'Lawali Musa Maina',
    motherName: 'Amina Ibrahim Usman',
    residentialAddress: 'Shagari Quarters Argungu',
    phone1: '08062427576', guardianName: 'Lawali Maina',
    guardianAddress: 'Shagari Quarters Argungu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-19', parentId: 'parent-18', formNumber: 'FORM-2026-019',
    firstName: 'Ahmad', lastName: 'Salisu Sani', gender: 'Male',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2021-06-14', fatherName: 'Salisu Sani',
    motherName: 'Lubabatu Sulaiman kalanka',
    residentialAddress: 'Bakin Kasuwa Argungu',
    phone1: '08068899384', guardianName: 'Salisu Sani',
    guardianAddress: 'Bakin kasuwa Gidan Sarkin Shanu',
    nationality: 'Nigerian', religion: 'Islam',
  },
  {
    id: 'stud-20', parentId: 'parent-19', formNumber: 'FORM-2026-020',
    firstName: 'Hauwa,u', lastName: 'Sani', gender: 'Female',
    intendedClass: 'Nursery 1', verificationStatus: 'pending',
    dateOfBirth: '2023-07-30', fatherName: 'Sani Abdullahi',
    motherName: 'Sadiya Sama,ila Misbahu',
    residentialAddress: 'Farin Tanki Area Near White House, Argungu',
    phone1: '07038758969', guardianName: 'Farin Tanki Area Dawakin Sarkin kabi',
    nationality: 'Nigerian', religion: 'Islam',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let seedPromise: Promise<void> | null = null;
let cachedSettings: SchoolSettings | null = null;
let cachedSettingsTime = 0;

export function normalizePhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

async function getDB() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

// Single-run seed & index creation across app lifecycle
async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const db = await getDB();
      // Ensure database indexes exist for ultra-fast queries
      try {
        await Promise.all([
          db.collection(PARENTS_COL).createIndex({ phoneNumber: 1 }),
          db.collection(PARENTS_COL).createIndex({ id: 1 }, { unique: true }),
          db.collection(STUDENTS_COL).createIndex({ parentId: 1 }),
          db.collection(STUDENTS_COL).createIndex({ id: 1 }, { unique: true }),
          db.collection(STUDENTS_COL).createIndex({ formNumber: 1 }),
          db.collection(SETTINGS_COL).createIndex({ id: 1 }, { unique: true }),
        ]);
      } catch {
        /* ignore index conflict if already exists */
      }

      const parentsCount = await db.collection(PARENTS_COL).countDocuments();
      if (parentsCount === 0) {
        await db.collection<Parent>(PARENTS_COL).insertMany(INITIAL_PARENTS);
        await db.collection<Student>(STUDENTS_COL).insertMany(INITIAL_STUDENTS);
      } else {
        await db.collection<Student>(STUDENTS_COL).updateMany(
          { intendedClass: { $regex: /Primary/i } },
          { $set: { intendedClass: 'Basic 1' } }
        );
      }
    })().catch(err => {
      console.error('DB seed/index error:', err);
      seedPromise = null;
    });
  }
  return seedPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — high performance indexed implementation
// ─────────────────────────────────────────────────────────────────────────────

export async function getParentByPhone(phone: string): Promise<Parent | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const normalizedSearch = normalizePhone(phone);
  if (!normalizedSearch) return undefined;

  const doc = await db.collection<Parent>(PARENTS_COL).findOne({
    $or: [
      { phoneNumber: phone },
      { phoneNumber: { $regex: `${normalizedSearch}$` } }
    ]
  });

  if (doc) {
    const { _id, ...rest } = doc;
    void _id;
    return rest as Parent;
  }
  return undefined;
}

export async function getParentById(parentId: string): Promise<Parent | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const doc = await db.collection<Parent>(PARENTS_COL).findOne({ id: parentId });
  if (!doc) return undefined;
  const { _id, ...rest } = doc;
  void _id;
  return rest as Parent;
}

export async function getStudentsByParentId(parentId: string): Promise<Student[]> {
  await ensureSeeded();
  const db = await getDB();
  const docs = await db.collection<Student>(STUDENTS_COL).find({ parentId }).toArray();
  return docs.map(({ _id, ...rest }) => {
    void _id;
    const s = rest as Student;
    if (/Primary/i.test(s.intendedClass)) s.intendedClass = 'Basic 1';
    return s;
  });
}

export async function getStudentById(studentId: string): Promise<Student | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const doc = await db.collection<Student>(STUDENTS_COL).findOne({ id: studentId });
  if (!doc) return undefined;
  const { _id, ...rest } = doc;
  void _id;
  const s = rest as Student;
  if (/Primary/i.test(s.intendedClass)) s.intendedClass = 'Basic 1';
  return s;
}

export async function getStudentByFormNumber(formNumber: string): Promise<Student | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const doc = await db.collection<Student>(STUDENTS_COL).findOne({
    formNumber: { $regex: new RegExp(`^${formNumber.trim()}$`, 'i') }
  });
  if (!doc) return undefined;
  const { _id, ...rest } = doc;
  void _id;
  const s = rest as Student;
  if (/Primary/i.test(s.intendedClass)) s.intendedClass = 'Basic 1';
  return s;
}

export async function findDuplicateStudent(studentData: Partial<Student>): Promise<Student | undefined> {
  await ensureSeeded();
  const db = await getDB();

  const formNum = studentData.formNumber?.trim();
  const first = studentData.firstName?.trim();
  const last = studentData.lastName?.trim();
  const phone = studentData.phone1 ? normalizePhone(studentData.phone1) : '';
  const dob = studentData.dateOfBirth?.trim();

  const conditions: object[] = [];

  if (formNum) {
    conditions.push({ formNumber: { $regex: new RegExp(`^${formNum}$`, 'i') } });
  }
  if (first && last && phone) {
    conditions.push({
      firstName: { $regex: new RegExp(`^${first}$`, 'i') },
      lastName: { $regex: new RegExp(`^${last}$`, 'i') },
      phone1: { $regex: `${phone}$` }
    });
  }
  if (first && last && dob) {
    conditions.push({
      firstName: { $regex: new RegExp(`^${first}$`, 'i') },
      lastName: { $regex: new RegExp(`^${last}$`, 'i') },
      dateOfBirth: { $regex: new RegExp(`^${dob}$`, 'i') }
    });
  }

  if (conditions.length === 0) return undefined;

  const filter: Record<string, unknown> = { $or: conditions };
  if (studentData.id) {
    filter.id = { $ne: studentData.id };
  }

  const doc = await db.collection<Student>(STUDENTS_COL).findOne(filter);
  if (!doc) return undefined;
  const { _id, ...rest } = doc;
  void _id;
  const s = rest as Student;
  if (/Primary/i.test(s.intendedClass)) s.intendedClass = 'Basic 1';
  return s;
}

export async function updateStudentStatus(
  studentId: string,
  status: VerificationStatus,
  notes?: string
): Promise<boolean> {
  const db = await getDB();
  const result = await db.collection<Student>(STUDENTS_COL).updateOne(
    { id: studentId },
    { $set: { verificationStatus: status, correctionNotes: notes ?? '' } }
  );
  return result.matchedCount > 0;
}

export async function getAllStudents(): Promise<Student[]> {
  await ensureSeeded();
  const db = await getDB();
  const docs = await db.collection<Student>(STUDENTS_COL).find({}).toArray();
  return docs.map(({ _id, ...rest }) => {
    void _id;
    const s = rest as Student;
    if (/Primary/i.test(s.intendedClass)) s.intendedClass = 'Basic 1';
    return s;
  });
}

export async function getAllParents(): Promise<Parent[]> {
  await ensureSeeded();
  const db = await getDB();
  const docs = await db.collection<Parent>(PARENTS_COL).find({}).toArray();
  return docs.map(({ _id, ...rest }) => {
    void _id;
    return rest as Parent;
  });
}

export async function addOrUpdateStudent(student: Student): Promise<void> {
  const db = await getDB();
  await db.collection<Student>(STUDENTS_COL).updateOne(
    { id: student.id },
    { $set: student },
    { upsert: true }
  );
}

export async function addOrUpdateParent(parent: Parent): Promise<void> {
  const db = await getDB();
  const existing = await db.collection<Parent>(PARENTS_COL).findOne({ id: parent.id });
  if (existing) {
    await db.collection<Parent>(PARENTS_COL).updateOne(
      { id: parent.id },
      { $set: parent }
    );
  } else {
    await db.collection<Parent>(PARENTS_COL).insertOne(parent);
  }
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.collection<Student>(STUDENTS_COL).deleteOne({ id: studentId });
  return result.deletedCount > 0;
}

export async function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDB();
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };
  await db.collection<AuditLog>(AUDIT_COL).insertOne(newLog);
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  await ensureSeeded();
  const db = await getDB();
  const docs = await db.collection<AuditLog>(AUDIT_COL)
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  return docs.map(({ _id, ...rest }) => {
    void _id;
    return rest as AuditLog;
  });
}

export async function getSchoolSettings(): Promise<SchoolSettings> {
  const now = Date.now();
  if (cachedSettings && now - cachedSettingsTime < 60000) {
    return cachedSettings;
  }
  await ensureSeeded();
  const db = await getDB();
  const doc = await db.collection<{ id: string } & SchoolSettings>(SETTINGS_COL).findOne({ id: 'school_settings' });
  if (doc) {
    const { _id, id, ...rest } = doc;
    void _id; void id;
    cachedSettings = rest as SchoolSettings;
    cachedSettingsTime = now;
    return cachedSettings;
  }
  const fallback: SchoolSettings = {
    schoolName: 'AI INTEGRATED ACADEMY ARGUNGU',
    motto: 'Learning Today, Leading Tomorrow',
    address: "Behind Buben Ta'Ololo's Residence, Tudun Wada, Argungu",
    phones: '08069676697, 07034784861',
    logo: '/logo.jpg'
  };
  cachedSettings = fallback;
  cachedSettingsTime = now;
  return fallback;
}

export async function updateSchoolSettings(settings: SchoolSettings): Promise<void> {
  cachedSettings = null;
  cachedSettingsTime = 0;
  const db = await getDB();
  await db.collection<{ id: string } & SchoolSettings>(SETTINGS_COL).updateOne(
    { id: 'school_settings' },
    { $set: { id: 'school_settings', ...settings } },
    { upsert: true }
  );
}
