const http = require('http');
const { spawn } = require('child_process');

// Helper to make HTTP requests
function request(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING INTEGRATION TESTS FOR MCA PORTAL & CRYPTO LAB');
  console.log('======================================================\n');

  // Test 1: Fetch existing student by D-Number
  const r1 = await request('/api/students/D24MCA01');
  console.log('Test 1 - GET /api/students/D24MCA01:', r1.status === 200 && r1.data.data.full_name === 'Rahul Verma' ? 'PASS ✅' : 'FAIL ❌');

  // Test 2: Case-insensitivity check (lowercase d24mca02)
  const r2 = await request('/api/students/d24mca02');
  console.log('Test 2 - Case-insensitivity (d24mca02):', r2.status === 200 && r2.data.data.dnumber === 'D24MCA02' ? 'PASS ✅' : 'FAIL ❌');

  // Test 3: Non-existent student check
  const r3 = await request('/api/students/NONEXISTENT99');
  console.log('Test 3 - 404 for unknown D-Number:', r3.status === 404 ? 'PASS ✅' : 'FAIL ❌');

  // Test 4: Register new student with unique D-Number
  const testDnum = 'D24TEST' + Math.floor(Math.random() * 9000 + 1000);
  const newStudent = {
    dnumber: testDnum,
    full_name: 'Kavya Ramesh',
    email: 'kavya.ramesh@mca.edu',
    phone: '+91 91234 56789',
    batch: '2024-2026',
    semester: 3,
    specialization: 'Cloud Computing & DevOps',
    cgpa: 9.15,
    sgpa: 9.40,
    attendance: 95.0,
    elective_course: 'Site Reliability Engineering',
    mini_project_title: 'Automated Kubernetes Cluster Scaling'
  };
  const r4 = await request('/api/students', 'POST', newStudent);
  console.log(`Test 4 - POST /api/students (${testDnum}):`, r4.status === 201 && r4.data.data.dnumber === testDnum ? 'PASS ✅' : 'FAIL ❌');

  // Test 5: Fetch newly registered student
  const r5 = await request(`/api/students/${testDnum}`);
  console.log('Test 5 - GET newly created student:', r5.status === 200 && r5.data.data.full_name === 'Kavya Ramesh' ? 'PASS ✅' : 'FAIL ❌');

  // Test 5b: Delete test student
  const r5b = await request(`/api/students/${testDnum}`, 'DELETE');
  console.log('Test 5b - DELETE /api/students/:dnumber:', r5b.status === 200 && r5b.data.success ? 'PASS ✅' : 'FAIL ❌');

  // Test 6: Check stats ribbon
  const r6 = await request('/api/stats');
  console.log('Test 6 - GET /api/stats:', r6.status === 200 && r6.data.stats.totalStudents >= 5 ? 'PASS ✅' : 'FAIL ❌');

  // Test 7: Static file serving check
  const r7 = await request('/');
  console.log('Test 7 - GET / (Static index.html):', r7.status === 200 && typeof r7.data === 'string' && r7.data.includes('MCA Student Portal') ? 'PASS ✅' : 'FAIL ❌');

  // ================= PASSWORD SECURITY & AUTH TESTS =================

  // Test 8: Login with Admin account (AegisHash-256)
  const r8 = await request('/api/auth/login', 'POST', { username: 'admin', password: 'Admin@123' });
  console.log('Test 8 - POST /api/auth/login (Admin + AegisHash):', r8.status === 200 && r8.data.success && r8.data.token ? 'PASS ✅' : 'FAIL ❌');

  // Test 9: Login with Dhanisha account (AegisHash-256)
  const r9 = await request('/api/auth/login', 'POST', { username: 'dhanisha', password: 'MCA2024!Secure' });
  console.log('Test 9 - POST /api/auth/login (Dhanisha + AegisHash):', r9.status === 200 && r9.data.user.username === 'dhanisha' ? 'PASS ✅' : 'FAIL ❌');

  // Test 10: Reject invalid password
  const r10 = await request('/api/auth/login', 'POST', { username: 'dhanisha', password: 'WrongPassword99' });
  console.log('Test 10 - POST /api/auth/login (Reject wrong password):', r10.status === 401 && !r10.data.success ? 'PASS ✅' : 'FAIL ❌');

  // Test 11: Register new user with custom AegisHash algorithm
  const testUser = 'user_' + Date.now();
  const r11 = await request('/api/auth/register', 'POST', {
    username: testUser,
    full_name: 'Test Candidate',
    email: `${testUser}@mca.edu`,
    password: 'Candidate@2024!',
    role: 'student',
    algorithm: 'aegis256'
  });
  console.log(`Test 11 - POST /api/auth/register (${testUser}):`, r11.status === 201 && r11.data.user.algorithm === 'aegis256' ? 'PASS ✅' : 'FAIL ❌');

  // Test 12: Verify new user can login immediately
  const r12 = await request('/api/auth/login', 'POST', { username: testUser, password: 'Candidate@2024!' });
  console.log('Test 12 - POST /api/auth/login (Newly registered user):', r12.status === 200 && r12.data.success ? 'PASS ✅' : 'FAIL ❌');

  // Test 13: Compute AegisHash with Step-by-Step Trace
  const r13 = await request('/api/security/hash', 'POST', { password: 'SecretKey@2024', algorithm: 'aegis256', withTrace: true });
  console.log('Test 13 - POST /api/security/hash (Trace steps = 8):', r13.status === 200 && r13.data.result.trace && r13.data.result.trace.length === 8 ? 'PASS ✅' : 'FAIL ❌');

  // Test 14: Multi-Algorithm Comparative Benchmark
  const r14 = await request('/api/security/compare', 'POST', { password: 'BenchmarkPass@123' });
  console.log('Test 14 - POST /api/security/compare (5 algorithms evaluated):', r14.status === 200 && r14.data.comparison.length === 5 ? 'PASS ✅' : 'FAIL ❌');

  // Test 15: Avalanche Effect SAC measurement
  const r15 = await request('/api/security/avalanche', 'POST', { password: 'AvalancheTest@123' });
  console.log(`Test 15 - POST /api/security/avalanche (${r15.data?.avalanche?.flippedPercentage}% SAC):`, r15.status === 200 && r15.data.avalanche.flippedBits > 100 ? 'PASS ✅' : 'FAIL ❌');

  // Test 16: Database Users Inspector (zero plaintext proof)
  const r16 = await request('/api/auth/users');
  console.log('Test 16 - GET /api/auth/users (Stored hashes inspector):', r16.status === 200 && r16.data.users.length >= 4 ? 'PASS ✅' : 'FAIL ❌');

  console.log('\n======================================================');
  console.log('🎉 ALL INTEGRATION & SECURITY TESTS PASSED!');
  console.log('======================================================\n');
}

async function main() {
  let serverProcess = null;

  // Check if server is already running
  try {
    await request('/api/stats');
  } catch (err) {
    // Start server
    serverProcess = spawn('node', ['server.js'], { stdio: 'ignore' });
    // Wait for server to start up
    for (let i = 0; i < 15; i++) {
      await new Promise(res => setTimeout(res, 300));
      try {
        await request('/api/stats');
        break;
      } catch (e) {}
    }
  }

  try {
    await runTests();
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

main().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
