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
    paymentStatus: 'paid', admissionNumber: 'AIAA-B26-001', academicSession: '2026/2027', resumptionDate: '14th September, 2026',
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
  },
  {
    id: 'stud-b1g-1', parentId: 'parent-2', formNumber: 'FORM-2026-002', admissionNumber: 'AIAA/B/2026/009',
    firstName: 'Asma,u', lastName: 'Aliyu Musa', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '2019-05-16', fatherName: 'Aliyu Musa', phone1: '08063764842'
  },
  {
    id: 'stud-b1g-2', parentId: 'parent-12', formNumber: 'FORM-2026-012', admissionNumber: 'AIAA/B/2026/014',
    firstName: 'Bashar', lastName: 'Yusuf Yakubu', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '', fatherName: 'Yusuf Yakubu', phone1: '08030439366'
  },
  {
    id: 'stud-b1g-3', parentId: 'parent-9', formNumber: 'FORM-2026-009', admissionNumber: 'AIAA/B/2026/008',
    firstName: 'Maimuna', lastName: 'Sama,ila', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '2019-05-04', fatherName: 'Sama,ila Lamne Bubuche', phone1: '08038047105'
  },
  {
    id: 'stud-b1g-4', parentId: 'parent-10', formNumber: 'FORM-2026-010', admissionNumber: 'AIAA/B/2026/017',
    firstName: 'Faruk', lastName: 'Umar Madawaki', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'paid', dateOfBirth: '2018-06-19', fatherName: 'Umar Faruk Madawaki', phone1: '07036101710'
  },
  {
    id: 'stud-b1g-5', parentId: 'parent-b1g-5', formNumber: 'FORM-2026-M1982', admissionNumber: 'AIAA-B26-982',
    firstName: 'Ibrahim', lastName: 'Ibrahim Illo', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'pending', dateOfBirth: '15/03/2021', fatherName: 'Ibrahim Illo', phone1: '07066694804'
  },
  {
    id: 'stud-b1g-6', parentId: 'parent-b1g-6', formNumber: 'FORM-2026-M1490', admissionNumber: 'AIAA-B26-490',
    firstName: 'Balkisu', lastName: 'Abubakar', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '06/02/2019', fatherName: 'Abubakar Muhammad', phone1: '09037635390'
  },
  {
    id: 'stud-b1g-7', parentId: 'parent-b1g-7', formNumber: 'FORM-2026-M3755', admissionNumber: 'AIAA-B26-755',
    firstName: 'Aisha', lastName: 'Lukman Isah', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'pending', dateOfBirth: '07/06/2020', fatherName: 'Late Lukman Isah', phone1: '07066025971'
  },
  {
    id: 'stud-b1g-8', parentId: 'parent-b1g-8', formNumber: 'FORM-2026-M5312', admissionNumber: 'AIAA-B26-312',
    firstName: 'Aisha', lastName: 'Bello Bayawa', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '27/4/2021', fatherName: 'Bello Bayawa', phone1: '08031384393'
  },
  {
    id: 'stud-b1g-9', parentId: 'parent-b1g-9', formNumber: 'FORM-2026-M1720', admissionNumber: 'AIAA-B26-720',
    firstName: 'Aisha', lastName: 'Yanusa Muhammad', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '07/08/2020', fatherName: 'Yanusa Muhammad', phone1: '08104515983'
  },
  {
    id: 'stud-b1g-10', parentId: 'parent-b1g-10', formNumber: 'FORM-2026-M1209', admissionNumber: 'AIAA-B26-209',
    firstName: 'Amatu-Mannan', lastName: 'Abubakar Torankawa', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '9/5/2019', fatherName: 'Abubakar Hashimu Torankawa', phone1: '08135666185'
  },
  {
    id: 'stud-b1g-11', parentId: 'parent-b1g-11', formNumber: 'FORM-2026-M5124', admissionNumber: 'AIAA-B26-124',
    firstName: 'Abdulmalik', lastName: 'Yakubu Adamu', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '', fatherName: 'Yakubu Adamu Gulma', phone1: '07067781699'
  },
  {
    id: 'stud-b1g-12', parentId: 'parent-b1g-7', formNumber: 'FORM-2026-M4993', admissionNumber: 'AIAA-B26-993',
    firstName: 'Aisha', lastName: 'Lukman ISah', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'pending', dateOfBirth: '7/6/2020', fatherName: 'Late Lukman Isah', phone1: '07066025971'
  },
  {
    id: 'stud-b1g-13', parentId: 'parent-b1g-13', formNumber: 'FORM-2026-M1244', admissionNumber: 'AIAA-B26-244',
    firstName: 'ABDUL MALIK', lastName: 'YAKUBU ADAMU', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '', fatherName: 'YAKUBU ADAMU GULMA', phone1: '07067791659'
  },
  {
    id: 'stud-b1g-14', parentId: 'parent-b1g-14', formNumber: 'FORM-2026-M4674', admissionNumber: 'AIAA-B26-674',
    firstName: 'UmmulKhairi', lastName: 'Anas', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '28/11/2021', fatherName: 'Anas Abubakar', phone1: '08667616041'
  },
  {
    id: 'stud-b1g-15', parentId: 'parent-b1g-15', formNumber: 'FORM-2026-M3361', admissionNumber: 'AIAA/B/2026/018',
    firstName: 'HAUWA\'U', lastName: 'AL-MUSTAPHA', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '', fatherName: 'AL MUSTAPHA YUSUF', phone1: '09138242328'
  },
  {
    id: 'stud-b1g-16', parentId: 'parent-b1g-16', formNumber: 'FORM-2026-M0435', admissionNumber: 'AIAA-B26-435',
    firstName: 'ABDUL-malik YAKURU', lastName: 'Abubakar', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '24-4-2019', fatherName: 'YAKURU Abubakar', phone1: '070631065476'
  },
  {
    id: 'stud-b1g-17', parentId: 'parent-b1g-17', formNumber: 'FORM-2026-M1378', admissionNumber: 'AIAA/B/2026/011',
    firstName: 'AAREEF', lastName: 'IBNI-ALIYU ABUBAKAR', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'paid', dateOfBirth: '16/05/2021', fatherName: 'ALIYU ABUBAKAR', phone1: '08022972027'
  },
  {
    id: 'stud-b1g-18', parentId: 'parent-b1g-18', formNumber: 'FORM-2026-M3717', admissionNumber: 'AIAA-B26-717',
    firstName: 'Hauwau', lastName: 'Hamisu', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '25/6/2018', fatherName: 'Hamisu Ango', phone1: '08030851726'
  },
  {
    id: 'stud-b1g-19', parentId: 'parent-b1g-19', formNumber: 'FORM-2026-M2479', admissionNumber: 'AIAA/B/2026/015',
    firstName: 'KHADIJA', lastName: 'ISAH HALI', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'paid', dateOfBirth: '15-04-2016', fatherName: 'ISAH HALI', phone1: '08161592575'
  },
  {
    id: 'stud-b1g-20', parentId: 'parent-b1g-20', formNumber: 'FORM-2026-M5899', admissionNumber: 'AIAA-B26-899',
    firstName: 'FATIMA', lastName: 'NAFIU ALIYU', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'pending', dateOfBirth: '8/18/2019', fatherName: 'NAFIU ALIYU ARGUNGU', phone1: '07035785968'
  },
  {
    id: 'stud-b1g-21', parentId: 'parent-b1g-2', formNumber: 'FORM-2026-M4738', admissionNumber: 'AIAA-B26-002',
    firstName: 'SULEMAN', lastName: 'YUSUF YAKUBU', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '5/9/2017', fatherName: 'ALHAJI YUSUF YAKUBU', phone1: '08030439366'
  },
  {
    id: 'stud-b1g-22', parentId: 'parent-b1g-22', formNumber: 'FORM-2026-M5131', admissionNumber: 'AIAA/B/2026/004',
    firstName: 'AMEENAH', lastName: 'IMRANA SAMA', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '05-03-22', fatherName: 'MUHAMMAD IMRANA SAMA', phone1: '08069191244'
  },
  {
    id: 'stud-b1g-23', parentId: 'parent-b1g-23', formNumber: 'FORM-2026-M3277', admissionNumber: 'AIAA-B26-277',
    firstName: 'ABBAS', lastName: 'YUSUF', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'pending', dateOfBirth: '16/8/2015', fatherName: 'YUSUF ADAMU GULMA', phone1: '08030980100'
  },
  {
    id: 'stud-b1g-24', parentId: 'parent-b1g-24', formNumber: 'FORM-2026-M0454', admissionNumber: 'AIAA-B26-454',
    firstName: 'Ibrahim shuaibu', lastName: 'Magaji', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '', fatherName: 'Shuaibu magaji', phone1: '08146942222'
  },
  {
    id: 'stud-b1g-25', parentId: 'parent-b1g-25', formNumber: 'FORM-2026-M1648', admissionNumber: 'AIAA/B/2026/019',
    firstName: 'AISHA', lastName: 'BASHIR AMBURSA', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'paid', dateOfBirth: '11/18/2017', fatherName: 'BASHIR WASIR AMBURSA', phone1: '07034598889'
  },
  {
    id: 'stud-b1g-26', parentId: 'parent-b1g-26', formNumber: 'FORM-2026-M3090', admissionNumber: 'AIAA-B26-090',
    firstName: 'Maimunatu', lastName: 'Murtala Idris', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '12/4/ 2027', fatherName: 'Murtala Idris', phone1: '0706833348'
  },
  {
    id: 'stud-b1g-27', parentId: 'parent-b1g-27', formNumber: 'FORM-2026-M1768', admissionNumber: 'AIAA/B/2026/007',
    firstName: 'Jamila', lastName: 'Aminu Dalhatu', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '13-12-2019', fatherName: 'Aminu Dalhatu', phone1: '09066630320'
  },
  {
    id: 'stud-b1g-28', parentId: 'parent-b1g-28', formNumber: 'FORM-2026-M2658', admissionNumber: 'AIAA-B26-658',
    firstName: 'Muhammad Bashar Mubarak', lastName: 'Yakubu Maiarewa', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'pending', dateOfBirth: '10/07/2019', fatherName: 'Mubarak', phone1: '07034802362'
  },
  {
    id: 'stud-b1g-29', parentId: 'parent-b1g-29', formNumber: 'FORM-2026-M0370', admissionNumber: 'AIAA/B/2026/021',
    firstName: 'Hassana', lastName: 'Ibrahim Mu\'azu', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '04/29/2020', fatherName: 'Ibrahim Mu\'azu', phone1: '08069669798'
  },
  {
    id: 'stud-b1g-30', parentId: 'parent-b1g-29', formNumber: 'FORM-2026-M3792', admissionNumber: 'AIAA/B/2026/020',
    firstName: 'Hussaini', lastName: 'Ibrahim Mu\'azu', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'verified', paymentStatus: 'paid', dateOfBirth: '2020/04/29', fatherName: 'Ibrahim Mu\'azu', phone1: '08069669798'
  },
  {
    id: 'stud-b1g-31', parentId: 'parent-b1g-31', formNumber: 'FORM-2026-M5068', admissionNumber: 'AIAA-B26-068',
    firstName: 'Sumayya', lastName: 'Abdullahi Umar', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '30/12/2020', fatherName: 'Abdullahi Umar', phone1: '08133396332'
  },
  {
    id: 'stud-b1g-32', parentId: 'parent-b1g-32', formNumber: 'FORM-2026-M0074', admissionNumber: 'AIAA/B/2026/025',
    firstName: 'Ummulkhairi A', lastName: 'Bashar', gender: 'Female', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'requires_correction', paymentStatus: 'paid', dateOfBirth: '2019/08/3', fatherName: 'Bashar Ibrahim Dan ladi', phone1: '07035123518'
  },
  {
    id: 'stud-b1g-33', parentId: 'parent-b1g-33', formNumber: 'FORM-2026-M3827', admissionNumber: 'AIAA-B26-827',
    firstName: 'Sa, id', lastName: 'Nura Musa', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '3/5/2018', fatherName: 'Nura Musa', phone1: '07069117936'
  },
  {
    id: 'stud-b1g-34', parentId: 'parent-b1g-34', formNumber: 'FORM-2026-M3986', admissionNumber: 'AIAA-B26-986',
    firstName: 'Zubairu Ansar', lastName: 'Nasir Muhammad', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '09/15/2018', fatherName: 'Nasir Muhammad', phone1: '08100066802'
  },
  {
    id: 'stud-b1g-35', parentId: 'parent-b1g-35', formNumber: 'FORM-2026-M5115', admissionNumber: 'AIAA-B26-115',
    firstName: 'Al-Amin', lastName: 'Aliyu sani', gender: 'Male', intendedClass: 'Basic 1 Gold',
    verificationStatus: 'pending', paymentStatus: 'pending', dateOfBirth: '07/12/2021', fatherName: 'Aliyu sani', phone1: '08133331886'
  }
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
    })().catch(err => {
      console.error('DB seed/index error:', err);
      seedPromise = null;
    });
  }
  return seedPromise;
}

export async function restoreMissingSeedStudents(): Promise<number> {
  const db = await getDB();
  let count = 0;
  for (const p of INITIAL_PARENTS) {
    await db.collection<Parent>(PARENTS_COL).updateOne({ id: p.id }, { $setOnInsert: p }, { upsert: true });
  }
  for (const s of INITIAL_STUDENTS) {
    const filter = s.formNumber ? { $or: [{ id: s.id }, { formNumber: s.formNumber }] } : { id: s.id };
    const res = await db.collection<Student>(STUDENTS_COL).updateOne(
      filter,
      { $set: s },
      { upsert: true }
    );
    if (res.upsertedCount > 0 || res.modifiedCount > 0) {
      count++;
    }
  }
  return count;
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
