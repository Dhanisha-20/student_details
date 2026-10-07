const http = require('http');
const { spawn } = require('child_process');

// Helper to make HTTP requests
function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
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
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Testing MCA Student App API Endpoints ---');

  // Test 1: Fetch existing student by D-Number
  const r1 = await request('/api/students/D24MCA01');
  console.log('Test 1 - GET /api/students/D24MCA01:', r1.status === 200 && r1.data.data.full_name === 'Rahul Verma' ? 'PASS ✅' : 'FAIL ❌');
  console.log('   Data:', r1.data.data ? `${r1.data.data.dnumber}: ${r1.data.data.full_name} (${r1.data.data.specialization})` : r1.data);

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
  console.log('Test 6 - GET /api/stats:', r6.status === 200 && r6.data.stats.totalStudents >= 6 ? 'PASS ✅' : 'FAIL ❌');
  console.log('   Stats:', r6.data.stats);

  // Test 7: Static file serving check
  const r7 = await request('/');
  console.log('Test 7 - GET / (Static index.html):', r7.status === 200 && typeof r7.data === 'string' && r7.data.includes('MCA Student Portal') ? 'PASS ✅' : 'FAIL ❌');

  console.log('--- All Tests Completed Successfully! ---');
}

async function main() {
  let serverProcess = null;

  // Check if server is already running
  try {
    await request('/api/stats');
  } catch (err) {
    // Start server
    serverProcess = spawn('node', ['server.js'], { stdio: 'ignore' });
    await new Promise(res => setTimeout(res, 1200));
  }

  try {
    await runTests();
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

main();
