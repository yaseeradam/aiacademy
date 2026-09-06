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

const INITIAL_PARENTS: Parent[] = [];
const INITIAL_STUDENTS: Student[] = [];

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

      // Ensure initial parents and students exist without overwriting modified data
      for (const p of INITIAL_PARENTS) {
        await db.collection<Parent>(PARENTS_COL).updateOne({ id: p.id }, { $setOnInsert: p }, { upsert: true });
      }
      for (const s of INITIAL_STUDENTS) {
        await db.collection<Student>(STUDENTS_COL).updateOne({ id: s.id }, { $setOnInsert: s }, { upsert: true });
      }

      await db.collection<Student>(STUDENTS_COL).updateMany(
        { intendedClass: { $regex: /Primary/i } },
        { $set: { intendedClass: 'Basic 1' } }
      );

      await autoAssignBareClasses(db);
    })().catch(err => {
      console.error('DB seed/index error:', err);
      seedPromise = null;
    });
  }
  return seedPromise;
}

async function autoAssignBareClasses(db: any) {
  const students = await db.collection(STUDENTS_COL).find({}).toArray();
  const bareStudents = students.filter((s: any) => {
    if (!s.intendedClass) return true;
    const cls = s.intendedClass.trim();
    if (cls.includes('Unassigned') || cls.includes('Gold') || cls.includes('Silver') || cls.includes('Green') || cls.includes('Blue') || cls.includes('Diamond')) {
      return false;
    }
    return true;
  });

  if (bareStudents.length === 0) return;

  const groups: Record<string, any[]> = {};
  for (const s of bareStudents) {
    let baseClass = 'Nursery 1';
    const cls = (s.intendedClass || '').trim();
    if (/Basic 2|Primary 2/i.test(cls)) baseClass = 'Basic 2';
    else if (/Basic 1|Primary 1/i.test(cls)) baseClass = 'Basic 1';
    else if (/Nursery/i.test(cls)) baseClass = 'Nursery 1';

    if (!groups[baseClass]) groups[baseClass] = [];
    groups[baseClass].push(s);
  }

  const arms = ['Gold', 'Silver', 'Green', 'Gold 2', 'Silver 2', 'Green 2'];

  for (const [baseClass, list] of Object.entries(groups)) {
    list.sort((a: any, b: any) => (a.formNumber || a.id).localeCompare(b.formNumber || b.id));

    for (const student of list) {
      let assignedArm = `${baseClass} Gold`;
      for (const arm of arms) {
        const candidate = `${baseClass} ${arm}`;
        const count = students.filter((s: any) => s.intendedClass && s.intendedClass.trim() === candidate).length;
        if (count < 35) {
          assignedArm = candidate;
          break;
        }
      }

      student.intendedClass = assignedArm;
      await db.collection(STUDENTS_COL).updateOne(
        { id: student.id },
        { $set: { intendedClass: assignedArm } }
      );
    }
  }
}

export async function clearAllStudentsAndParents(): Promise<{ studentCount: number; parentCount: number }> {
  const db = await getDB();
  const resStudents = await db.collection(STUDENTS_COL).deleteMany({});
  const resParents = await db.collection(PARENTS_COL).deleteMany({});
  return {
    studentCount: resStudents.deletedCount || 0,
    parentCount: resParents.deletedCount || 0,
  };
}

export async function restoreMissingSeedStudents(): Promise<number> {
  return 0;
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
