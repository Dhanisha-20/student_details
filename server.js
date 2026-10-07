const express = require('express');
const cors = require('cors');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup using native node:sqlite
const dbPath = path.join(__dirname, 'students.db');
const db = new DatabaseSync(dbPath);

// Initialize Database Schema
function initializeDatabase() {
  db.exec(`
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

  // Check if seed data exists
  const countRow = db.prepare('SELECT COUNT(*) as count FROM students').get();
  if (countRow.count === 0) {
    console.log('Seeding initial MCA student records...');
    const insertStmt = db.prepare(`
      INSERT INTO students (
        dnumber, full_name, email, phone, gender, dob,
        batch, semester, section, specialization,
        cgpa, sgpa, attendance, elective_course,
        mini_project_title, mentor_name, address, blood_group
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialStudents = [
      [
        'D24MCA01',
        'Rahul Verma',
        'rahul.v@mca.edu',
        '+91 98765 43210',
        'Male',
        '2002-05-14',
        '2024-2026',
        3,
        'A',
        'Artificial Intelligence & Data Science',
        8.92,
        9.10,
        94.5,
        'Deep Learning & Neural Networks',
        'Automated Pneumonia Detection using CNN',
        'Dr. Priya Sharma',
        '42 Tech Park Road, Bengaluru',
        'O+'
      ],
      [
        'D24MCA02',
        'Dhanisha R',
        'dhanisha.r@mca.edu',
        '+91 98451 22334',
        'Female',
        '2002-11-20',
        '2024-2026',
        3,
        'A',
        'Full Stack Web Development',
        9.35,
        9.50,
        97.0,
        'Microservices Architecture & GraphQL',
        'Decentralized Campus Credential Verification System',
        'Prof. Anand Kumar',
        '18 Orchid Residency, Chennai',
        'B+'
      ],
      [
        'D24MCA15',
        'Sneha Kulkarni',
        'sneha.k@mca.edu',
        '+91 97654 88990',
        'Female',
        '2003-02-09',
        '2024-2026',
        2,
        'B',
        'Cloud Computing & DevOps',
        8.65,
        8.80,
        89.2,
        'Kubernetes & Multi-Cloud Infrastructure',
        'Serverless Event-Driven E-Commerce Pipeline',
        'Dr. Rajesh Menon',
        '77 Green Valley, Pune',
        'A+'
      ],
      [
        'D23MCA42',
        'Mohammed Farhan',
        'farhan.m@mca.edu',
        '+91 99123 77654',
        'Male',
        '2001-08-30',
        '2023-2025',
        4,
        'A',
        'Cyber Security & Cryptography',
        8.78,
        9.00,
        91.5,
        'Ethical Hacking & Penetration Testing',
        'Zero-Trust Network Access for Academic Portals',
        'Dr. Kavita Nair',
        '105 Marine Drive, Kochi',
        'AB+'
      ],
      [
        'D24MCA08',
        'Ananya Sen',
        'ananya.sen@mca.edu',
        '+91 98312 66543',
        'Female',
        '2002-09-17',
        '2024-2026',
        1,
        'A',
        'Software Systems & Design',
        8.40,
        8.60,
        86.0,
        'Object-Oriented Design Patterns',
        'Smart Student Attendance Monitoring with Face Recognition',
        'Prof. Suresh Reddy',
        '12 Lake View Road, Kolkata',
        'O-'
      ]
    ];

    for (const s of initialStudents) {
      insertStmt.run(...s);
    }
    console.log('Seeded 5 sample MCA student records successfully.');
  }
}

// Initialize database
initializeDatabase();

// ======================== API ROUTES ========================

// 1. GET student by D-Number (case-insensitive)
app.get('/api/students/:dnumber', (req, res) => {
  try {
    const rawDnumber = req.params.dnumber.trim();
    const student = db.prepare(`
      SELECT * FROM students 
      WHERE LOWER(dnumber) = LOWER(?)
    `).get(rawDnumber);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with D-Number "${rawDnumber}" not found.`
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student data.',
      error: error.message
    });
  }
});

// 2. GET all students (with optional search query)
app.get('/api/students', (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim().toLowerCase() : '';
    let students;

    if (search) {
      students = db.prepare(`
        SELECT * FROM students 
        WHERE LOWER(dnumber) LIKE ? 
           OR LOWER(full_name) LIKE ? 
           OR LOWER(specialization) LIKE ?
        ORDER BY dnumber ASC
      `).all(`%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      students = db.prepare(`
        SELECT * FROM students 
        ORDER BY dnumber ASC
      `).all();
    }

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error listing students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list students.',
      error: error.message
    });
  }
});

// 3. POST new student
app.post('/api/students', (req, res) => {
  try {
    const {
      dnumber,
      full_name,
      email,
      phone,
      gender,
      dob,
      batch,
      semester,
      section,
      specialization,
      cgpa,
      sgpa,
      attendance,
      elective_course,
      mini_project_title,
      mentor_name,
      address,
      blood_group
    } = req.body;

    if (!dnumber || !dnumber.trim()) {
      return res.status(400).json({ success: false, message: 'D-Number is required.' });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Student Full Name is required.' });
    }

    const cleanDnumber = dnumber.trim().toUpperCase();

    // Check for existing D-Number
    const existing = db.prepare('SELECT id FROM students WHERE LOWER(dnumber) = LOWER(?)').get(cleanDnumber);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student with D-Number "${cleanDnumber}" already exists in the database.`
      });
    }

    const insertStmt = db.prepare(`
      INSERT INTO students (
        dnumber, full_name, email, phone, gender, dob,
        batch, semester, section, specialization,
        cgpa, sgpa, attendance, elective_course,
        mini_project_title, mentor_name, address, blood_group
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      cleanDnumber,
      full_name.trim(),
      email ? email.trim() : '',
      phone ? phone.trim() : '',
      gender || 'Other',
      dob || '',
      batch ? batch.trim() : '2024-2026',
      parseInt(semester, 10) || 1,
      section ? section.trim().toUpperCase() : 'A',
      specialization ? specialization.trim() : 'Computer Applications',
      parseFloat(cgpa) || 0.0,
      parseFloat(sgpa) || 0.0,
      parseFloat(attendance) || 0.0,
      elective_course ? elective_course.trim() : '',
      mini_project_title ? mini_project_title.trim() : '',
      mentor_name ? mentor_name.trim() : '',
      address ? address.trim() : '',
      blood_group ? blood_group.trim() : ''
    );

    const createdStudent = db.prepare('SELECT * FROM students WHERE dnumber = ?').get(cleanDnumber);

    res.status(201).json({
      success: true,
      message: `Student ${cleanDnumber} registered successfully!`,
      data: createdStudent
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student record.',
      error: error.message
    });
  }
});

// 4. PUT update student by D-Number
app.put('/api/students/:dnumber', (req, res) => {
  try {
    const rawDnumber = req.params.dnumber.trim();
    const existing = db.prepare('SELECT * FROM students WHERE LOWER(dnumber) = LOWER(?)').get(rawDnumber);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Student with D-Number "${rawDnumber}" not found.`
      });
    }

    const b = req.body;
    const updateStmt = db.prepare(`
      UPDATE students SET
        full_name = ?,
        email = ?,
        phone = ?,
        gender = ?,
        dob = ?,
        batch = ?,
        semester = ?,
        section = ?,
        specialization = ?,
        cgpa = ?,
        sgpa = ?,
        attendance = ?,
        elective_course = ?,
        mini_project_title = ?,
        mentor_name = ?,
        address = ?,
        blood_group = ?
      WHERE id = ?
    `);

    updateStmt.run(
      b.full_name !== undefined ? b.full_name.trim() : existing.full_name,
      b.email !== undefined ? b.email.trim() : existing.email,
      b.phone !== undefined ? b.phone.trim() : existing.phone,
      b.gender !== undefined ? b.gender : existing.gender,
      b.dob !== undefined ? b.dob : existing.dob,
      b.batch !== undefined ? b.batch.trim() : existing.batch,
      b.semester !== undefined ? parseInt(b.semester, 10) : existing.semester,
      b.section !== undefined ? b.section.trim().toUpperCase() : existing.section,
      b.specialization !== undefined ? b.specialization.trim() : existing.specialization,
      b.cgpa !== undefined ? parseFloat(b.cgpa) : existing.cgpa,
      b.sgpa !== undefined ? parseFloat(b.sgpa) : existing.sgpa,
      b.attendance !== undefined ? parseFloat(b.attendance) : existing.attendance,
      b.elective_course !== undefined ? b.elective_course.trim() : existing.elective_course,
      b.mini_project_title !== undefined ? b.mini_project_title.trim() : existing.mini_project_title,
      b.mentor_name !== undefined ? b.mentor_name.trim() : existing.mentor_name,
      b.address !== undefined ? b.address.trim() : existing.address,
      b.blood_group !== undefined ? b.blood_group.trim() : existing.blood_group,
      existing.id
    );

    const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(existing.id);

    res.json({
      success: true,
      message: `Student details updated successfully!`,
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student.',
      error: error.message
    });
  }
});

// 5. DELETE student
app.delete('/api/students/:dnumber', (req, res) => {
  try {
    const rawDnumber = req.params.dnumber.trim();
    const existing = db.prepare('SELECT id FROM students WHERE LOWER(dnumber) = LOWER(?)').get(rawDnumber);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Student with D-Number "${rawDnumber}" not found.`
      });
    }

    db.prepare('DELETE FROM students WHERE id = ?').run(existing.id);

    res.json({
      success: true,
      message: `Student with D-Number "${rawDnumber}" has been removed.`
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student.',
      error: error.message
    });
  }
});

// 6. Analytics/Stats summary
app.get('/api/stats', (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM students').get();
    const avgCgpaRow = db.prepare('SELECT AVG(cgpa) as avgCgpa FROM students WHERE cgpa > 0').get();
    const avgAttRow = db.prepare('SELECT AVG(attendance) as avgAttendance FROM students WHERE attendance > 0').get();

    res.json({
      success: true,
      stats: {
        totalStudents: totalRow.total,
        averageCgpa: avgCgpaRow.avgCgpa ? avgCgpaRow.avgCgpa.toFixed(2) : '0.00',
        averageAttendance: avgAttRow.avgAttendance ? avgAttRow.avgAttendance.toFixed(1) : '0.0'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback to index.html for SPA behavior
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎓 MCA Student Data Portal Backend Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💾 Database: SQLite (students.db)`);
  console.log(`===============================================`);
});
