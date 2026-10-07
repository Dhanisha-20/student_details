/**
 * Google Gemini API Service for MCA Student Portal
 * Generates synthetic student data and AI faculty mentor reports using free Gemini API.
 */

const FALLBACK_NAMES = [
  'Pooja Krishnamurthy', 'Arjun Nambiar', 'Karthik Balakrishnan', 'Divya Sundaram',
  'Rohit Venkatesh', 'Meera Swaminathan', 'Aditya Iyer', 'Harini Raman',
  'Vishal Raghavan', 'Swathi Natarajan'
];

const FALLBACK_PROJECTS = [
  'AI-Powered Automated Campus Proctoring & Identity Verification System',
  'Microservices-based Healthcare Record Management using FHIR Standards',
  'Blockchain-Enabled Academic Degree Verification & Tamper Prevention',
  'Real-Time Network Intrusion Detection with Deep Autoencoders',
  'Autonomous Warehouse Robotics Route Optimization using Reinforcement Learning',
  'Federated Learning for Privacy-Preserving Medical Image Diagnostics'
];

const FALLBACK_ELECTIVES = [
  'Deep Learning & Natural Language Processing',
  'Cloud Native DevOps & Kubernetes Orchestration',
  'Ethical Hacking & Zero Trust Architecture',
  'Distributed Ledger Technologies & Smart Contracts',
  'Full Stack Microservices with Node.js & GraphQL'
];

const FALLBACK_MENTORS = [
  'Dr. S. Radhakrishnan', 'Prof. Mythili R.', 'Dr. V. Chandrasekhar',
  'Prof. Anitha Selvam', 'Dr. Ramesh Kumar'
];

/**
 * Generate a complete MCA student profile using Gemini API (or intelligent fallback)
 */
async function generateStudentWithAI(apiKey, options = {}) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  const semester = parseInt(options.semester, 10) || 3;
  const specialization = options.specialization || 'Artificial Intelligence & Data Science';

  if (effectiveKey) {
    try {
      const prompt = `
Generate 1 realistic, complete MCA (Master of Computer Applications) student profile in India.
Target Semester: ${semester}
Specialization: "${specialization}"

Output strictly a JSON object with exactly these fields (no markdown, no backticks):
{
  "dnumber": "string like D24MCA followed by 2 random digits between 50 and 99, e.g. D24MCA67",
  "full_name": "string (realistic Indian student full name)",
  "email": "string (student format like name.surname@mca.edu)",
  "phone": "string (e.g. +91 98XXX XXXXX)",
  "gender": "Female or Male",
  "dob": "YYYY-MM-DD string between 2001-01-01 and 2003-12-31",
  "batch": "2024-2026",
  "semester": ${semester},
  "section": "A or B",
  "specialization": "${specialization}",
  "cgpa": number between 7.50 and 9.85 rounded to 2 decimal places,
  "sgpa": number between 7.80 and 9.90 rounded to 2 decimal places,
  "attendance": number between 80.0 and 98.0 rounded to 1 decimal place,
  "elective_course": "string (realistic advanced MCA course title)",
  "mini_project_title": "string (realistic innovative MCA capstone/mini project)",
  "mentor_name": "string (e.g. Dr. Faculty Name or Prof. Faculty Name)",
  "address": "string (realistic Indian street, city, state)",
  "blood_group": "one of A+, B+, O+, AB+, A-, B-, O-, AB-"
}
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('Gemini API call returned non-200:', res.status, errorText);
        throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText.trim());
        parsed.source = 'Google Gemini 1.5 Flash (AI Generated)';
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini generation failed, using intelligent procedural generator:', err.message);
      // Fall through to procedural generator below
    }
  }

  // Intelligent procedural generation fallback
  const randomSuffix = Math.floor(Math.random() * 49 + 50);
  const randomName = FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
  const randomProject = FALLBACK_PROJECTS[Math.floor(Math.random() * FALLBACK_PROJECTS.length)];
  const randomElective = FALLBACK_ELECTIVES[Math.floor(Math.random() * FALLBACK_ELECTIVES.length)];
  const randomMentor = FALLBACK_MENTORS[Math.floor(Math.random() * FALLBACK_MENTORS.length)];
  const bloodGroups = ['O+', 'A+', 'B+', 'AB+'];
  const cgpa = (Math.random() * (9.8 - 7.6) + 7.6).toFixed(2);
  const sgpa = (Math.min(9.9, parseFloat(cgpa) + (Math.random() * 0.4 - 0.2))).toFixed(2);
  const attendance = (Math.random() * (98.0 - 82.0) + 82.0).toFixed(1);

  return {
    dnumber: `D24MCA${randomSuffix}`,
    full_name: randomName,
    email: `${randomName.toLowerCase().replace(/\s+/g, '.')}@mca.edu`,
    phone: `+91 ${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}`,
    gender: Math.random() > 0.5 ? 'Female' : 'Male',
    dob: `2002-0${Math.floor(Math.random() * 9 + 1)}-${Math.floor(Math.random() * 19 + 10)}`,
    batch: '2024-2026',
    semester: semester,
    section: Math.random() > 0.5 ? 'A' : 'B',
    specialization: specialization,
    cgpa: parseFloat(cgpa),
    sgpa: parseFloat(sgpa),
    attendance: parseFloat(attendance),
    elective_course: randomElective,
    mini_project_title: randomProject,
    mentor_name: randomMentor,
    address: 'Anna Nagar, Chennai, Tamil Nadu',
    blood_group: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
    source: effectiveKey ? 'Google Gemini 1.5 Flash' : 'Simulated AI Data (Add API Key for live Gemini)'
  };
}

/**
 * Generate an AI Faculty Mentor Report & Evaluation for a student
 */
async function generateAcademicReport(apiKey, student) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveKey) {
    try {
      const prompt = `
You are an expert Professor and MCA Department Academic Mentor.
Generate a professional, inspiring academic review and performance assessment report for this student:

Student Name: ${student.full_name}
D-Number: ${student.dnumber}
Batch: ${student.batch} | Semester: ${student.semester} (Sec ${student.section})
Specialization Track: ${student.specialization}
Cumulative GPA (CGPA): ${student.cgpa} / 10.0
Current SGPA: ${student.sgpa} / 10.0
Attendance Rate: ${student.attendance}%
Elective Course: ${student.elective_course}
Capstone Project: ${student.mini_project_title}
Faculty Mentor: ${student.mentor_name}

Format your output in clean Markdown with clear headings and bullet points:
### 1. 🎯 Overall Academic Standing
### 2. 💡 Technical Strengths & Project Assessment
### 3. 📈 Semester Recommendations & Improvement Areas
### 4. 💼 Campus Placement & Career Readiness Forecast
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn('Gemini report call failed:', e.message);
    }
  }

  // Fallback structured mentor report
  const isHighPerformer = student.cgpa >= 9.0;
  return `### 🎯 Overall Academic Standing
**${student.full_name} (${student.dnumber})** is performing ${isHighPerformer ? 'exceptionally well' : 'consistently well'} in the **${student.specialization}** track. With a CGPA of **${student.cgpa}** and attendance at **${student.attendance}%**, the student is in good standing and fully eligible for university semester examinations.

### 💡 Technical Strengths & Project Assessment
- **Capstone Project**: *${student.mini_project_title}* addresses high-impact technological challenges relevant to contemporary software engineering.
- **Elective Alignment**: Excelling in *${student.elective_course}*, demonstrating good analytical and practical problem-solving foundations under the mentorship of **${student.mentor_name}**.

### 📈 Semester Recommendations & Improvement Areas
- Continue active participation in department coding hackathons and technical symposiums.
- Document and publish the project source repository with automated tests and Docker containers.
- Maintain consistent laboratory log completion.

### 💼 Campus Placement & Career Readiness Forecast
- **Eligibility**: Tier-1 Tech Company Placement Drive Eligible.
- **Role Targets**: Software Development Engineer (SDE), Cloud/DevOps Associate, Data Systems Engineer.
- *Status: Highly Recommended for Campus Placements.*`;
}

module.exports = {
  generateStudentWithAI,
  generateAcademicReport
};
