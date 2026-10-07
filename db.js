/**
 * Database abstraction layer for MCA Student Data Portal.
 * Supports:
 * 1. Native SQLite via node:sqlite (Node 22+)
 *    - Uses writable /tmp on serverless environments (Vercel)
 *    - Uses students.db on local environments
 * 2. In-memory fallback if node:sqlite is unavailable on older runtimes.
 */

const path = require('path');
const fs = require('fs');

const SEED_STUDENTS = [
  {
    dnumber: 'D24MCA01',
    full_name: 'Rahul Verma',
    email: 'rahul.v@mca.edu',
    phone: '+91 98765 43210',
    gender: 'Male',
    dob: '2002-05-14',
    batch: '2024-2026',
    semester: 3,
    section: 'A',
    specialization: 'Artificial Intelligence & Data Science',
    cgpa: 8.92,
    sgpa: 9.10,
    attendance: 94.5,
    elective_course: 'Deep Learning & Neural Networks',
    mini_project_title: 'Automated Pneumonia Detection using CNN',
    mentor_name: 'Dr. Priya Sharma',
    address: '42 Tech Park Road, Bengaluru',
    blood_group: 'O+'
  },
  {
    dnumber: 'D24MCA02',
    full_name: 'Dhanisha R',
    email: 'dhanisha.r@mca.edu',
    phone: '+91 98451 22334',
    gender: 'Female',
    dob: '2002-11-20',
    batch: '2024-2026',
    semester: 3,
    section: 'A',
    specialization: 'Full Stack Web Development',
    cgpa: 9.35,
    sgpa: 9.50,
    attendance: 97.0,
    elective_course: 'Microservices Architecture & GraphQL',
    mini_project_title: 'Decentralized Campus Credential Verification System',
    mentor_name: 'Prof. Anand Kumar',
    address: '18 Orchid Residency, Chennai',
    blood_group: 'B+'
  },
  {
    dnumber: 'D24MCA15',
    full_name: 'Sneha Kulkarni',
    email: 'sneha.k@mca.edu',
    phone: '+91 97654 88990',
    gender: 'Female',
    dob: '2003-02-09',
    batch: '2024-2026',
    semester: 2,
    section: 'B',
    specialization: 'Cloud Computing & DevOps',
    cgpa: 8.65,
    sgpa: 8.80,
    attendance: 89.2,
    elective_course: 'Kubernetes & Multi-Cloud Infrastructure',
    mini_project_title: 'Serverless Event-Driven E-Commerce Pipeline',
    mentor_name: 'Dr. Rajesh Menon',
    address: '77 Green Valley, Pune',
    blood_group: 'A+'
  },
  {
    dnumber: 'D23MCA42',
    full_name: 'Mohammed Farhan',
    email: 'farhan.m@mca.edu',
    phone: '+91 99123 77654',
    gender: 'Male',
    dob: '2001-08-30',
    batch: '2023-2025',
    semester: 4,
    section: 'A',
    specialization: 'Cyber Security & Cryptography',
    cgpa: 8.78,
    sgpa: 9.00,
    attendance: 91.5,
    elective_course: 'Ethical Hacking & Penetration Testing',
    mini_project_title: 'Zero-Trust Network Access for Academic Portals',
    mentor_name: 'Dr. Kavita Nair',
    address: '105 Marine Drive, Kochi',
    blood_group: 'AB+'
  },
  {
    dnumber: 'D24MCA08',
    full_name: 'Ananya Sen',
    email: 'ananya.sen@mca.edu',
    phone: '+91 98312 66543',
    gender: 'Female',
    dob: '2002-09-17',
    batch: '2024-2026',
    semester: 1,
    section: 'A',
    specialization: 'Software Systems & Design',
    cgpa: 8.40,
    sgpa: 8.60,
    attendance: 86.0,
    elective_course: 'Object-Oriented Design Patterns',
    mini_project_title: 'Smart Student Attendance Monitoring with Face Recognition',
    mentor_name: 'Prof. Suresh Reddy',
    address: '12 Lake View Road, Kolkata',
    blood_group: 'O-'
  }
];

class DatabaseManager {
  constructor() {
    this.sqliteDb = null;
    this.memoryStore = [];
    this.useMemoryFallback = false;
    this.init();
  }

  init() {
    try {
      const { DatabaseSync } = require('node:sqlite');
      
      // On Vercel / AWS Lambda, use /tmp which is the only writable directory
      const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
      const dbPath = isVercel ? path.join('/tmp', 'students.db') : path.join(__dirname, 'students.db');

      this.sqliteDb = new DatabaseSync(dbPath);

      // Create schema
      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dnumber TEXT UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          gender TEXT,
          dob TEXT,
          batch TEXT NOT NULL,
          semester INTEGER NOT NULL,
          section TEXT DEFAULT 'A',
          specialization TEXT,
          cgpa REAL DEFAULT 0.0,
          sgpa REAL DEFAULT 0.0,
          attendance REAL DEFAULT 0.0,
          elective_course TEXT,
          mini_project_title TEXT,
          mentor_name TEXT,
          address TEXT,
          blood_group TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Seed if empty
      const count = this.sqliteDb.prepare('SELECT COUNT(*) as c FROM students').get().c;
      if (count === 0) {
        const stmt = this.sqliteDb.prepare(`
          INSERT INTO students (
            dnumber, full_name, email, phone, gender, dob,
            batch, semester, section, specialization,
            cgpa, sgpa, attendance, elective_course,
            mini_project_title, mentor_name, address, blood_group
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const s of SEED_STUDENTS) {
          stmt.run(
            s.dnumber, s.full_name, s.email, s.phone, s.gender, s.dob,
            s.batch, s.semester, s.section, s.specialization,
            s.cgpa, s.sgpa, s.attendance, s.elective_course,
            s.mini_project_title, s.mentor_name, s.address, s.blood_group
          );
        }
      }
    } catch (err) {
      console.warn('SQLite init warning (falling back to in-memory store):', err.message);
      this.useMemoryFallback = true;
      this.memoryStore = JSON.parse(JSON.stringify(SEED_STUDENTS));
    }
  }

  getStudent(dnumber) {
    const cleanD = dnumber.trim().toLowerCase();
    if (!this.useMemoryFallback && this.sqliteDb) {
      return this.sqliteDb.prepare('SELECT * FROM students WHERE LOWER(dnumber) = ?').get(cleanD) || null;
    }
    return this.memoryStore.find(s => s.dnumber.toLowerCase() === cleanD) || null;
  }

  getAllStudents(search) {
    const term = search ? search.trim().toLowerCase() : '';
    if (!this.useMemoryFallback && this.sqliteDb) {
      if (term) {
        return this.sqliteDb.prepare(`
          SELECT * FROM students 
          WHERE LOWER(dnumber) LIKE ? 
             OR LOWER(full_name) LIKE ? 
             OR LOWER(specialization) LIKE ?
          ORDER BY dnumber ASC
        `).all(`%${term}%`, `%${term}%`, `%${term}%`);
      }
      return this.sqliteDb.prepare('SELECT * FROM students ORDER BY dnumber ASC').all();
    }

    let list = this.memoryStore;
    if (term) {
      list = list.filter(s =>
        (s.dnumber && s.dnumber.toLowerCase().includes(term)) ||
        (s.full_name && s.full_name.toLowerCase().includes(term)) ||
        (s.specialization && s.specialization.toLowerCase().includes(term))
      );
    }
    return list.sort((a, b) => a.dnumber.localeCompare(b.dnumber));
  }

  createStudent(data) {
    const cleanD = data.dnumber.trim().toUpperCase();
    const existing = this.getStudent(cleanD);
    if (existing) {
      const err = new Error(`Student with D-Number "${cleanD}" already exists.`);
      err.code = 'DUPLICATE_DNUMBER';
      throw err;
    }

    if (!this.useMemoryFallback && this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(`
        INSERT INTO students (
          dnumber, full_name, email, phone, gender, dob,
          batch, semester, section, specialization,
          cgpa, sgpa, attendance, elective_course,
          mini_project_title, mentor_name, address, blood_group
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        cleanD,
        data.full_name.trim(),
        data.email || '',
        data.phone || '',
        data.gender || 'Other',
        data.dob || '',
        data.batch || '2024-2026',
        parseInt(data.semester, 10) || 1,
        data.section || 'A',
        data.specialization || 'Computer Applications',
        parseFloat(data.cgpa) || 0.0,
        parseFloat(data.sgpa) || 0.0,
        parseFloat(data.attendance) || 0.0,
        data.elective_course || '',
        data.mini_project_title || '',
        data.mentor_name || '',
        data.address || '',
        data.blood_group || ''
      );
      return this.getStudent(cleanD);
    }

    const newObj = {
      id: Date.now(),
      dnumber: cleanD,
      full_name: data.full_name.trim(),
      email: data.email || '',
      phone: data.phone || '',
      gender: data.gender || 'Other',
      dob: data.dob || '',
      batch: data.batch || '2024-2026',
      semester: parseInt(data.semester, 10) || 1,
      section: data.section || 'A',
      specialization: data.specialization || 'Computer Applications',
      cgpa: parseFloat(data.cgpa) || 0.0,
      sgpa: parseFloat(data.sgpa) || 0.0,
      attendance: parseFloat(data.attendance) || 0.0,
      elective_course: data.elective_course || '',
      mini_project_title: data.mini_project_title || '',
      mentor_name: data.mentor_name || '',
      address: data.address || '',
      blood_group: data.blood_group || '',
      created_at: new Date().toISOString()
    };
    this.memoryStore.push(newObj);
    return newObj;
  }

  updateStudent(dnumber, data) {
    const cleanD = dnumber.trim().toLowerCase();
    const existing = this.getStudent(cleanD);
    if (!existing) return null;

    if (!this.useMemoryFallback && this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(`
        UPDATE students SET
          full_name = ?,
          batch = ?,
          semester = ?,
          section = ?,
          specialization = ?,
          cgpa = ?,
          sgpa = ?,
          attendance = ?,
          email = ?,
          phone = ?,
          elective_course = ?,
          mentor_name = ?,
          mini_project_title = ?
        WHERE LOWER(dnumber) = ?
      `);
      stmt.run(
        data.full_name !== undefined ? data.full_name.trim() : existing.full_name,
        data.batch !== undefined ? data.batch.trim() : existing.batch,
        data.semester !== undefined ? parseInt(data.semester, 10) : existing.semester,
        data.section !== undefined ? data.section.trim() : existing.section,
        data.specialization !== undefined ? data.specialization.trim() : existing.specialization,
        data.cgpa !== undefined ? parseFloat(data.cgpa) : existing.cgpa,
        data.sgpa !== undefined ? parseFloat(data.sgpa) : existing.sgpa,
        data.attendance !== undefined ? parseFloat(data.attendance) : existing.attendance,
        data.email !== undefined ? data.email.trim() : existing.email,
        data.phone !== undefined ? data.phone.trim() : existing.phone,
        data.elective_course !== undefined ? data.elective_course.trim() : existing.elective_course,
        data.mentor_name !== undefined ? data.mentor_name.trim() : existing.mentor_name,
        data.mini_project_title !== undefined ? data.mini_project_title.trim() : existing.mini_project_title,
        cleanD
      );
      return this.getStudent(cleanD);
    }

    Object.assign(existing, data);
    return existing;
  }

  deleteStudent(dnumber) {
    const cleanD = dnumber.trim().toLowerCase();
    const existing = this.getStudent(cleanD);
    if (!existing) return false;

    if (!this.useMemoryFallback && this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM students WHERE LOWER(dnumber) = ?').run(cleanD);
      return true;
    }

    const idx = this.memoryStore.findIndex(s => s.dnumber.toLowerCase() === cleanD);
    if (idx !== -1) {
      this.memoryStore.splice(idx, 1);
      return true;
    }
    return false;
  }

  getStats() {
    const all = this.getAllStudents('');
    const total = all.length;
    const validCgpa = all.filter(s => s.cgpa > 0);
    const validAtt = all.filter(s => s.attendance > 0);

    const avgCgpa = validCgpa.length > 0 
      ? (validCgpa.reduce((sum, s) => sum + s.cgpa, 0) / validCgpa.length).toFixed(2)
      : '0.00';

    const avgAtt = validAtt.length > 0
      ? (validAtt.reduce((sum, s) => sum + s.attendance, 0) / validAtt.length).toFixed(1)
      : '0.0';

    return {
      totalStudents: total,
      averageCgpa: avgCgpa,
      averageAttendance: avgAtt
    };
  }
}

module.exports = new DatabaseManager();
