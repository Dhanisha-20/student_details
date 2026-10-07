const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { generateStudentWithAI, generateAcademicReport } = require('./gemini');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder as well as root
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// ======================== API ROUTES ========================

// 1. GET student by D-Number (case-insensitive)
app.get('/api/students/:dnumber', (req, res) => {
  try {
    const rawDnumber = req.params.dnumber.trim();
    const student = db.getStudent(rawDnumber);

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
    const search = req.query.search ? req.query.search.trim() : '';
    const students = db.getAllStudents(search);

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
    const { dnumber, full_name } = req.body;

    if (!dnumber || !dnumber.trim()) {
      return res.status(400).json({ success: false, message: 'D-Number is required.' });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Student Full Name is required.' });
    }

    const createdStudent = db.createStudent(req.body);

    res.status(201).json({
      success: true,
      message: `Student ${createdStudent.dnumber} registered successfully!`,
      data: createdStudent
    });
  } catch (error) {
    if (error.code === 'DUPLICATE_DNUMBER') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
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
    const updatedStudent = db.updateStudent(rawDnumber, req.body);

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: `Student with D-Number "${rawDnumber}" not found.`
      });
    }

    res.json({
      success: true,
      message: 'Student details updated successfully!',
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
    const deleted = db.deleteStudent(rawDnumber);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Student with D-Number "${rawDnumber}" not found.`
      });
    }

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
    const stats = db.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. AI: Generate Student Data with Google Gemini API
app.post('/api/ai/generate-student', async (req, res) => {
  try {
    const { apiKey, semester, specialization } = req.body;
    const generated = await generateStudentWithAI(apiKey, { semester, specialization });
    
    // Save generated student to database
    const saved = db.createStudent(generated);

    res.status(201).json({
      success: true,
      message: `Generated and registered student ${saved.dnumber} (${saved.full_name})!`,
      source: generated.source,
      data: saved
    });
  } catch (error) {
    console.error('Error generating AI student:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate student data with AI.'
    });
  }
});

// 8. AI: Generate Academic Report for Student
app.post('/api/ai/academic-report', async (req, res) => {
  try {
    const { apiKey, dnumber } = req.body;
    if (!dnumber) {
      return res.status(400).json({ success: false, message: 'D-Number is required.' });
    }

    const student = db.getStudent(dnumber);
    if (!student) {
      return res.status(404).json({ success: false, message: `Student ${dnumber} not found.` });
    }

    const report = await generateAcademicReport(apiKey, student);
    res.json({
      success: true,
      dnumber: student.dnumber,
      studentName: student.full_name,
      report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate academic report.'
    });
  }
});

// Fallback to index.html for SPA behavior
app.use((req, res) => {
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  res.sendFile(publicIndex);
});

// Start Server locally if not running on Vercel
if (!process.env.VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🎓 MCA Student Data Portal Backend Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`💾 Database: SQLite (students.db)`);
    console.log(`===============================================`);
  });
}

module.exports = app;
