import clientPromise from './mongodb';
import { Parent, Student, VerificationStatus, AuditLog, SchoolSettings, Staff, SurveyConfig, SurveyQuestion, SurveyResponse } from '../types';
import { normalizeAdmissionNumber } from './classUtils';

const DB_NAME = 'ai_academy';
const PARENTS_COL = 'parents';
const STUDENTS_COL = 'students';
const AUDIT_COL = 'audit_logs';
const SETTINGS_COL = 'settings';
const COUNTERS_COL = 'counters';
const STAFF_COL = 'staff';
const SURVEY_CONFIG_COL = 'survey_config';
const SURVEY_RESPONSES_COL = 'survey_responses';

// Escape a string so it is safe to embed inside a MongoDB $regex
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — only inserted once when the database is empty
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_PARENTS: Parent[] = [];
const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_STAFF: Staff[] = [
  { id: 'staff_1', name: 'Yasir Kabir Adamu', idNumber: 'AIA/26/P002', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: 'Jaiz Bank', accountNumber: '0003974412', salary: '60000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_2', name: 'Ibrahim Musa Gulma', idNumber: 'AIA/26/P001', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2001511574', salary: '70000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_3', name: 'Hassana Sahabi', idNumber: 'AIA/26/N003', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'Access Bank', accountNumber: '1946222455', salary: '40000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_4', name: 'Abida Abdullahi Kangiwa', idNumber: 'AIA/26/N006', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2163468237', salary: '45000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_5', name: 'Aminu Yusuf', idNumber: 'AIA/26/P004', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2068642583', salary: '40000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_6', name: 'Amina Ismail Ibrahim', idNumber: 'AIA/26/P003', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: 'Unity Bank', accountNumber: '0004827117', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_7', name: 'Sakina Hussaini', idNumber: 'AIA/26/N010', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2121712213', salary: '40000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_8', name: 'Victoria Dada', idNumber: 'AIA/26/N002', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2130372770', salary: '60000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_9', name: 'Hafsat Aminu Musa', idNumber: 'AIA/26/N013', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2202680754', salary: '40000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_10', name: 'Abdulmalik Muhammad', idNumber: 'AIA/26/N005', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2048733867', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_11', name: "Muhd Rabi'u Sani", idNumber: 'AIA/26/P007', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: '', accountNumber: '', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_12', name: 'Muslim Abubakar Muhammad', idNumber: 'AIA/26/N007', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'FCMB', accountNumber: '1035255516', salary: '40000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_13', name: 'Nafisa Abdullahi', idNumber: 'AIA/26/N008', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2249713093', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_14', name: 'Isah Balarabe', idNumber: 'AIA/26/DIR001', phone: '', section: 'Administration', role: 'Director', classAllocated: '', bankName: 'UBA', accountNumber: '2056831467', salary: '60000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_15', name: 'Bashar Bala Musa', idNumber: 'AIA/26/P008', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2140813832', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_16', name: 'Abdullahi Suleiman', idNumber: 'AIA/26/P009', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2124151547', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_17', name: 'Wasila Ibrahim Alkali', idNumber: 'AIA/26/N009', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2152648338', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_18', name: 'Muiza Aliyu', idNumber: 'AIA/26/N014', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2221457784', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_19', name: 'Fauziyya Suleman Kalanda', idNumber: 'AIA/26/N015', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2081005538', salary: '30000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_20', name: 'Hussaini Ibrahim', idNumber: 'AIA/26/P011', phone: '', section: 'Primary', role: 'Teacher', classAllocated: '', bankName: 'UBA', accountNumber: '2223472457', salary: '25000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_21', name: 'Mariya Ibrahim Illo', idNumber: 'AIA/26/N012', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'GT Bank', accountNumber: '0262372744', salary: '50000', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: 'staff_22', name: 'Hussai Abubakar', idNumber: 'AIA/26/N016', phone: '', section: 'Nursery', role: 'Teacher', classAllocated: '', bankName: 'Eco bank', accountNumber: '5663062746', salary: '15000', createdAt: '2026-09-01T08:00:00.000Z' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let seedPromise: Promise<void> | null = null;
let seedFailed = false;  // prevents infinite retry loops on persistent DB errors
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
  if (seedFailed) return;  // Don't retry after a persistent failure
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
          db.collection(COUNTERS_COL).createIndex({ _id: 1 }),
          db.collection(AUDIT_COL).createIndex({ timestamp: -1 }),
          db.collection(STAFF_COL).createIndex({ id: 1 }, { unique: true }),
          db.collection(STAFF_COL).createIndex({ idNumber: 1 }),
          db.collection(STAFF_COL).createIndex({ classAllocated: 1 }),
        ]);
      } catch {
        /* ignore index conflict if already exists */
      }

      // Ensure initial parents, students, and staff exist without overwriting modified data
      for (const p of INITIAL_PARENTS) {
        await db.collection<Parent>(PARENTS_COL).updateOne({ id: p.id }, { $setOnInsert: p }, { upsert: true });
      }
      for (const s of INITIAL_STUDENTS) {
        await db.collection<Student>(STUDENTS_COL).updateOne({ id: s.id }, { $setOnInsert: s }, { upsert: true });
      }
      // Ensure initial staff exist via fast bulkWrite
      if (INITIAL_STAFF.length > 0) {
        const staffBulkOps = INITIAL_STAFF.map(st => ({
          updateOne: {
            filter: { idNumber: st.idNumber },
            update: { $setOnInsert: st },
            upsert: true
          }
        }));
        await db.collection(STAFF_COL).bulkWrite(staffBulkOps, { ordered: false }).catch(() => {});
      }

      // Fix migration: only run class-name migrations once (skip on subsequent cold starts)
      const migrationDoc = await db.collection(SETTINGS_COL).findOne({ id: 'migration_version' });
      const migrationVersion = (migrationDoc as Record<string, unknown> | null)?.version as number | undefined ?? 0;

      if (migrationVersion < 1) {
        await db.collection<Student>(STUDENTS_COL).updateMany(
          { intendedClass: { $regex: /Primary 2/i } },
          { $set: { intendedClass: 'Basic 2' } }
        );
        await db.collection<Student>(STUDENTS_COL).updateMany(
          { intendedClass: { $regex: /Primary 1/i } },
          { $set: { intendedClass: 'Basic 1' } }
        );
        await autoAssignBareClasses(db);
        await db.collection(SETTINGS_COL).updateOne(
          { id: 'migration_version' },
          { $set: { id: 'migration_version', version: 1 } },
          { upsert: true }
        );
      }

      if (migrationVersion < 2) {
        await fixDuplicateAndMissingAdmissionNumbers();
        await db.collection(SETTINGS_COL).updateOne(
          { id: 'migration_version' },
          { $set: { id: 'migration_version', version: 2 } },
          { upsert: true }
        );
      }

      if (migrationVersion < 3) {
        await db.collection(SETTINGS_COL).updateOne(
          { id: 'migration_version' },
          { $set: { id: 'migration_version', version: 3 } },
          { upsert: true }
        );
      }

      if (migrationVersion < 4) {
        // Automatically normalize all legacy B2026 / 2026 / slash admission numbers in MongoDB to AIAA-B26-XXX
        const allStudentsInDb = await db.collection<Student>(STUDENTS_COL).find({}).toArray();
        for (const s of allStudentsInDb) {
          if (s.admissionNumber && (s.admissionNumber.includes('2026') || s.admissionNumber.includes('/') || !/^AIAA-B26-\d{3,}$/i.test(s.admissionNumber))) {
            const normalized = normalizeAdmissionNumber(s.admissionNumber);
            if (normalized && normalized !== s.admissionNumber) {
              await db.collection<Student>(STUDENTS_COL).updateOne(
                { id: s.id },
                { $set: { admissionNumber: normalized } }
              );
            }
          }
        }
        await db.collection(SETTINGS_COL).updateOne(
          { id: 'migration_version' },
          { $set: { id: 'migration_version', version: 4 } },
          { upsert: true }
        );
      }
    })().catch(err => {
      console.error('DB seed/index error (will not retry):', err);
      seedFailed = true;  // stop silent retry loop
      seedPromise = null;
    });
  }
  return seedPromise;
}

async function autoAssignBareClasses(db: any) {
  const bareStudents = await db.collection(STUDENTS_COL).find({
    $or: [
      { intendedClass: null },
      { intendedClass: 'Nursery' },
      { intendedClass: 'Nursery 1' },
      { intendedClass: 'Basic 1' },
      { intendedClass: 'Primary 1' },
      { intendedClass: 'Basic 2' },
      { intendedClass: 'Primary 2' },
    ]
  }).toArray();

  if (bareStudents.length === 0) return;

  const allStudents = await db.collection(STUDENTS_COL).find({}, { projection: { intendedClass: 1, formNumber: 1, id: 1 } }).toArray();

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
  const bulkOps: any[] = [];

  for (const [baseClass, list] of Object.entries(groups)) {
    list.sort((a: any, b: any) => (a.formNumber || a.id).localeCompare(b.formNumber || b.id));

    const armCounts: Record<string, number> = {};
    for (const arm of arms) {
      const candidate = `${baseClass} ${arm}`;
      armCounts[candidate] = allStudents.filter((s: any) => s.intendedClass && s.intendedClass.trim() === candidate).length;
    }

    for (const student of list) {
      let assignedArm = `${baseClass} Gold`;
      for (const arm of arms) {
        const candidate = `${baseClass} ${arm}`;
        if ((armCounts[candidate] || 0) < 36) {
          assignedArm = candidate;
          armCounts[candidate] = (armCounts[candidate] || 0) + 1;
          break;
        }
      }

      student.intendedClass = assignedArm;
      bulkOps.push({
        updateOne: {
          filter: { id: student.id },
          update: { $set: { intendedClass: assignedArm } },
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await db.collection(STUDENTS_COL).bulkWrite(bulkOps);
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
    if (s.admissionNumber) s.admissionNumber = normalizeAdmissionNumber(s.admissionNumber);
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
  if (s.admissionNumber) s.admissionNumber = normalizeAdmissionNumber(s.admissionNumber);
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
  if (s.admissionNumber) s.admissionNumber = normalizeAdmissionNumber(s.admissionNumber);
  return s;
}

export async function findDuplicateStudent(studentData: Partial<Student>): Promise<Student | undefined> {
  await ensureSeeded();
  const db = await getDB();

  const formNum = studentData.formNumber?.trim();
  const first = studentData.firstName?.trim();
  const last = studentData.lastName?.trim();

  const conditions: object[] = [];

  // Escape user-supplied strings before embedding in regex
  if (formNum) {
    conditions.push({ formNumber: { $regex: new RegExp(`^${escapeRegex(formNum)}$`, 'i') } });
  }
  if (first && last) {
    conditions.push({
      firstName: { $regex: new RegExp(`^${escapeRegex(first)}$`, 'i') },
      lastName:  { $regex: new RegExp(`^${escapeRegex(last)}$`, 'i') }
    });
  } else if (first && first.length > 2) {
    conditions.push({
      firstName: { $regex: new RegExp(`^${escapeRegex(first)}$`, 'i') }
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
  if (/Primary 1/i.test(s.intendedClass)) s.intendedClass = 'Basic 1';
  else if (/Primary 2/i.test(s.intendedClass)) s.intendedClass = 'Basic 2';
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
    if (s.admissionNumber) s.admissionNumber = normalizeAdmissionNumber(s.admissionNumber);
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
  await db.collection<Parent>(PARENTS_COL).updateOne(
    { id: parent.id },
    { $set: parent },
    { upsert: true }
  );
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.collection<Student>(STUDENTS_COL).deleteOne({ id: studentId });
  return result.deletedCount > 0;
}

/** Batch-delete multiple students in a single MongoDB round-trip */
export async function bulkDeleteStudents(studentIds: string[]): Promise<number> {
  if (studentIds.length === 0) return 0;
  const db = await getDB();
  const result = await db.collection<Student>(STUDENTS_COL).deleteMany({ id: { $in: studentIds } });
  return result.deletedCount;
}

/** Batch-fetch students by ID array in a single MongoDB round-trip */
export async function getStudentsByIds(studentIds: string[]): Promise<Student[]> {
  if (studentIds.length === 0) return [];
  await ensureSeeded();
  const db = await getDB();
  const docs = await db.collection<Student>(STUDENTS_COL).find({ id: { $in: studentIds } }).toArray();
  return docs.map(({ _id, ...rest }) => {
    void _id;
    const s = rest as Student;
    if (/Primary/i.test(s.intendedClass)) s.intendedClass = 'Basic 1';
    return s;
  });
}

/** Batch-update intendedClass for multiple students using bulkWrite */
export async function bulkUpdateStudentClasses(updates: Array<{ id: string; intendedClass: string }>): Promise<number> {
  if (updates.length === 0) return 0;
  const db = await getDB();
  const ops = updates.map(u => ({
    updateOne: {
      filter: { id: u.id },
      update: { $set: { intendedClass: u.intendedClass } },
    },
  }));
  const result = await db.collection<Student>(STUDENTS_COL).bulkWrite(ops, { ordered: false });
  return result.modifiedCount;
}


/**
 * Fix #5: Atomically increment and return the next admission number sequence.
 * Using MongoDB $inc on a counters document guarantees uniqueness even under
 * concurrent requests — no two admins can get the same number.
 */
export async function getNextAdmissionSequence(yearShort: string): Promise<number> {
  const db = await getDB();
  const counterId = `admission_seq_${yearShort}`;
  interface CounterDoc { _id: string; seq: number; }
  const result = await db.collection<CounterDoc>(COUNTERS_COL).findOneAndUpdate(
    { _id: counterId } as unknown as import('mongodb').Filter<CounterDoc>,
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return (result as unknown as CounterDoc | null)?.seq ?? 1;
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

/**
 * Automatically inspect all student records in MongoDB.
 * Reassign unique sequential admission numbers to any students missing an admission number
 * OR sharing a duplicate admission number with another student.
 */
export async function fixDuplicateAndMissingAdmissionNumbers(): Promise<{
  fixedCount: number;
  updatedStudents: { id: string; name: string; oldAdm: string; newAdm: string }[];
}> {
  const db = await getDB();
  const students = await db.collection<Student>(STUDENTS_COL).find({}).toArray();
  const currentYearShort = new Date().getFullYear().toString().slice(-2);

  const seenAdmNumbers = new Set<string>();
  const updatedStudents: { id: string; name: string; oldAdm: string; newAdm: string }[] = [];

  for (const s of students) {
    const rawAdm = s.admissionNumber?.trim();
    let isDuplicateOrMissing = false;

    if (!rawAdm) {
      isDuplicateOrMissing = true;
    } else if (rawAdm.includes('2026') || rawAdm.includes('/') || !/^AIAA-B26-\d{3,}$/i.test(rawAdm)) {
      // Standardize to B26 format: AIAA-B26-XXX
      const standardized = normalizeAdmissionNumber(rawAdm);
      if (standardized && !seenAdmNumbers.has(standardized.toLowerCase())) {
        seenAdmNumbers.add(standardized.toLowerCase());
        await db.collection<Student>(STUDENTS_COL).updateOne(
          { id: s.id },
          { $set: { admissionNumber: standardized } }
        );
        updatedStudents.push({
          id: s.id,
          name: `${s.firstName} ${s.lastName || ''}`.trim(),
          oldAdm: rawAdm,
          newAdm: standardized
        });
        continue;
      } else {
        isDuplicateOrMissing = true;
      }
    } else {
      const normalized = rawAdm.toLowerCase();
      if (seenAdmNumbers.has(normalized)) {
        isDuplicateOrMissing = true;
      } else {
        seenAdmNumbers.add(normalized);
      }
    }

    if (isDuplicateOrMissing) {
      let candidate = '';
      do {
        const seq = await getNextAdmissionSequence(currentYearShort);
        const nextNumStr = String(seq).padStart(3, '0');
        candidate = `AIAA-B${currentYearShort}-${nextNumStr}`;
      } while (seenAdmNumbers.has(candidate.toLowerCase()));

      seenAdmNumbers.add(candidate.toLowerCase());

      const oldAdm = rawAdm || '(None)';
      const name = `${s.firstName} ${s.lastName || ''}`.trim();

      await db.collection<Student>(STUDENTS_COL).updateOne(
        { id: s.id },
        { $set: { admissionNumber: candidate } }
      );

      updatedStudents.push({
        id: s.id,
        name,
        oldAdm,
        newAdm: candidate
      });
    }
  }

  return {
    fixedCount: updatedStudents.length,
    updatedStudents
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff Operations
// ─────────────────────────────────────────────────────────────────────────────

export async function getNextStaffSequence(): Promise<number> {
  const db = await getDB();
  const counter = await db.collection(COUNTERS_COL).findOneAndUpdate(
    { _id: 'staff_sequence' as unknown as import('mongodb').ObjectId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return counter?.seq || 1;
}

export async function getAllStaff(): Promise<Staff[]> {
  try {
    const db = await getDB();
    const rawList = await db.collection(STAFF_COL).find({}).toArray();

    if (!rawList || rawList.length === 0) {
      if (INITIAL_STAFF.length > 0) {
        const ops = INITIAL_STAFF.map(st => ({
          updateOne: {
            filter: { idNumber: st.idNumber },
            update: { $setOnInsert: st },
            upsert: true
          }
        }));
        await db.collection(STAFF_COL).bulkWrite(ops, { ordered: false }).catch(() => {});
      }
      return INITIAL_STAFF;
    }

    return rawList.map(doc => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...staff } = doc as unknown as Staff & { _id?: unknown };
      return {
        id: String(staff.id || `staff_${doc._id}`),
        name: String(staff.name || ''),
        phone: String(staff.phone || ''),
        idNumber: String(staff.idNumber || ''),
        section: String(staff.section || 'General'),
        classAllocated: String(staff.classAllocated || ''),
        role: String(staff.role || 'Teacher'),
        bankName: String(staff.bankName || ''),
        accountNumber: String(staff.accountNumber || ''),
        salary: String(staff.salary || ''),
        createdAt: String(staff.createdAt || new Date().toISOString()),
      };
    });
  } catch (err) {
    console.error('Error fetching staff from DB, falling back to INITIAL_STAFF:', err);
    return INITIAL_STAFF;
  }
}

export async function getStaffById(id: string): Promise<Staff | null> {
  await ensureSeeded();
  const db = await getDB();
  const doc = await db.collection(STAFF_COL).findOne({ id });
  if (!doc) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...staff } = doc as unknown as Staff & { _id?: unknown };
  return staff;
}

export async function addOrUpdateStaff(staff: Staff): Promise<Staff> {
  await ensureSeeded();
  const db = await getDB();
  await db.collection(STAFF_COL).updateOne(
    { id: staff.id },
    { $set: staff },
    { upsert: true }
  );
  return staff;
}

export async function deleteStaff(id: string): Promise<boolean> {
  await ensureSeeded();
  const db = await getDB();
  const res = await db.collection(STAFF_COL).deleteOne({ id });
  return res.deletedCount > 0;
}

export async function bulkAddOrUpdateStaff(staffList: Staff[]): Promise<{ count: number }> {
  await ensureSeeded();
  const db = await getDB();
  if (staffList.length === 0) return { count: 0 };

  const ops = staffList.map(s => ({
    updateOne: {
      filter: { id: s.id },
      update: { $set: s },
      upsert: true,
    }
  }));

  const res = await db.collection(STAFF_COL).bulkWrite(ops);
  return { count: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
}

export async function syncStaffFromExcelList(records: Array<{
  name: string;
  phone?: string;
  idNumber?: string;
  section?: string;
  classAllocated?: string;
  role?: string;
  bankName?: string;
  accountNumber?: string;
  salary?: string;
}>): Promise<{ importedCount: number; updatedStaff: Staff[] }> {
  await ensureSeeded();
  const db = await getDB();
  let count = 0;
  const updatedStaff: Staff[] = [];

  for (const item of records) {
    const name = (item.name || '').trim();
    if (!name) continue;

    const idNumber = (item.idNumber || '').trim();
    let query: Record<string, unknown> = {};
    if (idNumber) {
      query = { idNumber };
    } else {
      query = { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } };
    }

    const existing = await db.collection<Staff>(STAFF_COL).findOne(query);

    const staffData: Staff = {
      id: existing ? existing.id : `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      phone: item.phone !== undefined && item.phone.trim() !== '' ? item.phone.trim() : (existing?.phone || ''),
      idNumber: idNumber || existing?.idNumber || '',
      section: item.section && item.section.trim() !== '' ? item.section.trim() : (existing?.section || 'General'),
      classAllocated: item.classAllocated !== undefined ? item.classAllocated.trim() : (existing?.classAllocated || ''),
      role: item.role && item.role.trim() !== '' ? item.role.trim() : (existing?.role || 'Teacher'),
      bankName: item.bankName !== undefined && item.bankName.trim() !== '' ? item.bankName.trim() : (existing?.bankName || ''),
      accountNumber: item.accountNumber !== undefined && item.accountNumber.trim() !== '' ? item.accountNumber.trim() : (existing?.accountNumber || ''),
      salary: item.salary !== undefined && item.salary.trim() !== '' ? item.salary.trim() : (existing?.salary || ''),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await db.collection(STAFF_COL).updateOne(
      { id: staffData.id },
      { $set: staffData },
      { upsert: true }
    );
    count++;
    updatedStaff.push(staffData);
  }

  return { importedCount: count, updatedStaff };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parent Survey & Feedback Operations
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q_academics',
    question: "How satisfied are you with your child's academic learning progress and classroom teaching?",
    type: 'rating_5',
    category: 'Academics & Teaching',
    required: true,
  },
  {
    id: 'q_communication',
    question: "How would you rate the communication from teachers and the school administration?",
    type: 'single_choice',
    options: ['Excellent - Very responsive & clear', 'Good - Satisfactory updates', 'Fair - Could be more frequent', 'Poor - Difficult to get information'],
    category: 'Communication',
    required: true,
  },
  {
    id: 'q_environment',
    question: "How would you rate the school environment, cleanliness, safety, and child care?",
    type: 'rating_5',
    category: 'Safety & Environment',
    required: true,
  },
  {
    id: 'q_discipline',
    question: "How satisfied are you with moral guidance, student discipline, and Islamic & character values at AI Academy?",
    type: 'single_choice',
    options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Needs Improvement'],
    category: 'Discipline & Values',
    required: true,
  },
  {
    id: 'q_nps',
    question: "How likely are you to recommend AI Integrated Academy to friends, relatives, and colleagues?",
    type: 'nps_10',
    category: 'General Recommendation',
    required: true,
  },
  {
    id: 'q_doing_well',
    question: "What is one thing you love most about AI Academy or that the school is doing very well?",
    type: 'text',
    category: 'Feedback',
    required: false,
  },
  {
    id: 'q_improvements',
    question: "What is one area where the school can improve to serve your child better?",
    type: 'text',
    category: 'Feedback',
    required: false,
  },
];

export async function getSurveyConfig(): Promise<SurveyConfig> {
  await ensureSeeded();
  const db = await getDB();
  const doc = await db.collection<SurveyConfig>(SURVEY_CONFIG_COL).findOne({ id: 'survey_default' });
  if (doc) {
    const { _id, ...rest } = doc as any;
    return rest as SurveyConfig;
  }
  return {
    id: 'survey_default',
    title: 'Parent Satisfaction & Experience Survey',
    description: 'Dear Parents & Guardians, your feedback is crucial in shaping our academy and providing the best education and care for your children. Please take 2 minutes to answer these questions.',
    isActive: true,
    term: '1st Term',
    session: '2025/2026',
    questions: DEFAULT_SURVEY_QUESTIONS,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateSurveyConfig(config: Partial<SurveyConfig>): Promise<void> {
  await ensureSeeded();
  const db = await getDB();
  await db.collection<SurveyConfig>(SURVEY_CONFIG_COL).updateOne(
    { id: 'survey_default' },
    { $set: { ...config, id: 'survey_default', updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function saveSurveyResponse(response: SurveyResponse): Promise<void> {
  await ensureSeeded();
  const db = await getDB();
  await db.collection<SurveyResponse>(SURVEY_RESPONSES_COL).updateOne(
    { id: response.id },
    { $set: response },
    { upsert: true }
  );
}

export async function getSurveyResponseByPhone(phone: string): Promise<SurveyResponse | null> {
  await ensureSeeded();
  const db = await getDB();
  const normalized = normalizePhone(phone);
  const doc = await db.collection<SurveyResponse>(SURVEY_RESPONSES_COL).findOne({
    $or: [
      { parentPhone: phone },
      { parentPhone: normalized },
      { parentPhone: { $regex: new RegExp(`${escapeRegex(normalized)}$`) } }
    ]
  });
  if (!doc) return null;
  const { _id, ...rest } = doc as any;
  return rest as SurveyResponse;
}

export async function getAllSurveyResponses(): Promise<SurveyResponse[]> {
  await ensureSeeded();
  const db = await getDB();
  const docs = await db.collection<SurveyResponse>(SURVEY_RESPONSES_COL).find({}).sort({ submittedAt: -1 }).toArray();
  return docs.map(({ _id, ...rest }: any) => rest as SurveyResponse);
}

export async function deleteSurveyResponse(id: string): Promise<boolean> {
  await ensureSeeded();
  const db = await getDB();
  const res = await db.collection(SURVEY_RESPONSES_COL).deleteOne({ id });
  return res.deletedCount > 0;
}


