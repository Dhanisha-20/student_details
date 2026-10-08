const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { MultiAlgorithmEngine, AegisHash256 } = require('./crypto_algo');
const { generateStudentWithAI, generateAcademicReport } = require('./gemini');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory session store
const SESSIONS = new Map();

function createSession(user) {
  const token = 'mca_token_' + crypto.randomBytes(24).toString('hex');
  const sessionData = {
    userId: user.id,
    username: user.username,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  };
  SESSIONS.set(token, sessionData);
  return token;
}

function getSessionUser(token) {
  if (!token) return null;
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }
  return db.getUserById(session.userId);
}

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

// ======================== USER AUTHENTICATION API ROUTES ========================

// 9. POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const cleanUser = username.trim().toLowerCase();
    const user = db.getUserByUsername(cleanUser) || db.getUserByEmail(cleanUser);
    if (!user) {
      return res.status(401).json({ success: false, message: `Account "${username}" was not found.` });
    }

    const isValid = MultiAlgorithmEngine.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password provided.' });
    }

    db.updateUserLastLogin(user.id);
    const token = createSession(user);
    const safeUser = db.sanitizeUser(user);

    res.json({
      success: true,
      message: `Welcome back, ${safeUser.full_name}!`,
      token,
      user: safeUser,
      algorithmUsed: user.algorithm
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed.', error: error.message });
  }
});

// 10. POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, full_name, email, password, role, algorithm } = req.body;

    if (!username || !password || !email || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Username, Full Name, Email, and Password are all required.'
      });
    }

    const created = db.createUser({
      username,
      full_name,
      email,
      password,
      role: role || 'student',
      algorithm: algorithm || 'aegis256'
    });

    const token = createSession(created);

    res.status(201).json({
      success: true,
      message: `User ${created.username} registered successfully using ${created.algorithm.toUpperCase()} algorithm!`,
      token,
      user: created
    });
  } catch (error) {
    if (error.code === 'DUPLICATE_USER') {
      return res.status(409).json({ success: false, message: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
});

// 11. GET /api/auth/me (Check active session)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No authentication token provided.' });
  }

  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }

  res.json({ success: true, user });
});

// 12. POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    SESSIONS.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 13. GET /api/auth/users (Public user inspector for academic demonstration)
app.get('/api/auth/users', (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user list.', error: error.message });
  }
});

// ======================== PASSWORD SECURITY & ALGORITHM LAB ========================

// 14. POST /api/security/hash (Calculate hash with step-by-step trace)
app.post('/api/security/hash', (req, res) => {
  try {
    const { password, algorithm, withTrace } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to compute hash.' });
    }

    const algo = algorithm || 'aegis256';
    const result = MultiAlgorithmEngine.hashPassword(algo, password, null, Boolean(withTrace));

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Hashing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 15. POST /api/security/compare (Multi-algorithm comparative benchmark)
app.post('/api/security/compare', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required for comparative benchmark.' });
    }

    const comparison = MultiAlgorithmEngine.runComparativeBenchmark(password);
    res.json({
      success: true,
      passwordLength: password.length,
      comparison
    });
  } catch (error) {
    console.error('Benchmark error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 16. POST /api/security/avalanche (Avalanche effect test)
app.post('/api/security/avalanche', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required for avalanche test.' });
    }

    const avalanche = MultiAlgorithmEngine.calculateAvalancheEffect(password);
    res.json({
      success: true,
      avalanche
    });
  } catch (error) {
    console.error('Avalanche error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 17. GET /api/security/assignment-report (Academic submission documentation)
app.get('/api/security/assignment-report', (req, res) => {
  res.json({
    success: true,
    title: 'Create a new Algorithm for securing a Password',
    candidate: 'MCA Student (D24MCA02 - Dhanisha R)',
    department: 'Department of Computer Applications',
    algorithmName: 'AegisHash-256 (Adaptive Entropy-Guided Iterative Salt-Matrix Hashing)',
    problemStatement: 'Storing passwords in HTML or plaintext files directly exposes sensitive user credentials to any client-side inspector, browser cache, or network packet sniffer. Furthermore, unsalted hashes like legacy MD5 are trivial to invert using precomputed Rainbow Tables containing billions of known hashes.',
    stages: [
      {
        step: 1,
        title: 'CSPRNG Cryptographic Salting (128-bit)',
        desc: 'A unique 16-byte cryptographically secure pseudo-random salt is generated per password. Defeats Rainbow Tables and identical password correlation across accounts.'
      },
      {
        step: 2,
        title: 'Dynamic Salt-Keyed S-Box',
        desc: 'A 256-byte non-linear substitution box is constructed dynamically for each credential using modular prime arithmetic and salt byte seeding.'
      },
      {
        step: 3,
        title: '8x8 State Matrix Avalanche Bit Diffusion',
        desc: 'Diffuses entropy across a 64-byte state matrix through circular row bit-shifts and diagonal XOR transposition, ensuring strict avalanche diffusion (SAC ~50%).'
      },
      {
        step: 4,
        title: 'Time-Hardened Key Stretching (12,000 Rounds)',
        desc: 'Applies 12,000 iterated HMAC-SHA256 compression rounds with dynamic round keys derived from state XORs, making brute-force attacks computationally prohibitive on GPUs.'
      },
      {
        step: 5,
        title: 'Timing-Safe Constant Time Verification',
        desc: 'Compares digests using constant-time byte equality (crypto.timingSafeEqual), completely neutralizing side-channel timing attacks.'
      }
    ],
    storageStandard: 'Modular Crypt Format: $aegis256$v=1$r=12000$s=<salt>$h=<digest>',
    storageLocation: 'SQLite database table (users) - Zero passwords in HTML or client files.'
  });
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
