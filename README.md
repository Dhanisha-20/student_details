# 🎓 MCA Student Data Portal

A full-stack web application designed for the **Department of Computer Applications (MCA)** to store student data in a SQLite database and instantly retrieve student dossiers when a **D-Number** (e.g. `D24MCA01`, `D24MCA02`) is typed in the frontend.

Built with **HTML5, CSS3, JavaScript** on the frontend and **Node.js, Express, and SQLite** on the backend.

---

## 🌟 Key Features

1. **Instant D-Number Search & Live Lookup (`public/index.html` & `public/js/app.js`)**:
   - Type any MCA D-Number to instantly fetch and display the complete student dossier.
   - **Real-time / Instant Lookup Toggle**: Automatically searches as you type (with debouncing) or on pressing Enter / clicking Search.
   - **Case-Insensitive**: Searches work whether you type `d24mca01` or `D24MCA01`.
   - **Quick Sample Chips**: 1-click test pills (`D24MCA01`, `D24MCA02`, `D24MCA15`, etc.) to quickly preview records.

2. **Comprehensive MCA Student Dossier**:
   - **Profile Header**: Initials avatar, Student Full Name, D-Number badge (click to copy), MCA Batch & Semester.
   - **Academic Performance Cards**:
     - **CGPA**: Grade equivalent (e.g. *O / Outstanding*, *A+ / Excellent*) with visual progress bar.
     - **SGPA**: Current semester SGPA.
     - **Attendance Rate (%)**: Color-coded progress bar (Green for $\ge 85\%$, Amber for $75-84\%$, Red for $<75\%$).
   - **MCA Curriculum Details**: Specialization track, Elective Course, Mini / Capstone Project title, Faculty Mentor / Guide.
   - **Personal & Contact Info**: Email (clickable mailto), Phone (clickable tel), DOB, Blood Group, Address.
   - **Actions**: 🖨️ Print Student Slip (formatted print stylesheet), ✏️ Edit Details, 🗑️ Delete Record.

3. **Store Student Data into Database (`POST /api/students`)**:
   - Clean, validated student registration form with sections for Identification, MCA Program Information, Performance, and Contact.
   - Automatically saves to the `students.db` SQLite database.
   - Prevents duplicate D-Numbers.
   - On successful save, automatically transitions to the search view and loads the newly added student.

4. **MCA Directory & Student Roster**:
   - Live roster table showing all registered MCA students.
   - Real-time search/filter across Name, D-Number, and Specialization.
   - Direct "View", "Edit", and "Delete" buttons for each student.

5. **✨ Free AI Data Generation & Mentor Reports (Google Gemini API)**:
   - **AI Student Data Generator**: Use a free Gemini API key (from [Google AI Studio](https://aistudio.google.com)) to dynamically generate authentic MCA student profiles and automatically insert them into SQLite.
   - **AI Mentor Assessment**: Click **"✨ AI Mentor Report"** on any student dossier to generate a personalized faculty assessment, project evaluation, semester advice, and placement readiness forecast.

6. **Department Stats Ribbon**:
   - Live summary ribbon showing Total Enrolled Students, Average CGPA, and Average Attendance.

---

## 📁 Project Structure

```
Student_data/
├── server.js              # Express REST API & SQLite database initialization
├── students.db            # SQLite database file (auto-created on first run)
├── package.json           # Dependencies and run scripts
├── test_endpoints.js      # Automated test suite for backend API
├── README.md              # Documentation
└── public/                # Frontend (HTML, CSS, Vanilla JavaScript)
    ├── index.html         # Main MCA Portal UI
    ├── css/
    │   └── style.css      # Modern, responsive styles & print layout
    └── js/
        └── app.js         # Frontend controller (Search, Register, Directory, Modal)
```

---

## 🚀 How to Run the Application

### Prerequisites
- Node.js (v18 or higher; tested on Node.js v24)
- No external database installation needed! SQLite is built-in.

### 1. Start the Server
Open your terminal in this directory (`c:\Users\Dhanisha R\Downloads\Student_data`) and run:

```bash
npm start
```

You should see:
```text
===============================================
🎓 MCA Student Data Portal Backend Running
📡 URL: http://localhost:3000
💾 Database: SQLite (students.db)
===============================================
```

### 2. Open the Frontend
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 Sample D-Numbers to Test Immediately

The database is pre-seeded with sample MCA students:

| D-Number | Student Name | Semester & Batch | Specialization | CGPA | Attendance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `D24MCA01` | Rahul Verma | Sem 3 (2024-26) | Artificial Intelligence & Data Science | 8.92 | 94.5% |
| `D24MCA02` | Dhanisha R | Sem 3 (2024-26) | Full Stack Web Development | 9.35 | 97.0% |
| `D24MCA15` | Sneha Kulkarni | Sem 2 (2024-26) | Cloud Computing & DevOps | 8.65 | 89.2% |
| `D23MCA42` | Mohammed Farhan | Sem 4 (2023-25) | Cyber Security & Cryptography | 8.78 | 91.5% |
| `D24MCA08` | Ananya Sen | Sem 1 (2024-26) | Software Systems & Design | 8.40 | 86.0% |

You can also click on the sample chips in the UI or type any D-number in the search bar.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/students/:dnumber` | Fetch student by D-Number (case-insensitive) |
| `GET` | `/api/students` | Get all students (supports `?search=` filter) |
| `POST` | `/api/students` | Add/store a new student into the SQLite database |
| `PUT` | `/api/students/:dnumber` | Update existing student records |
| `DELETE` | `/api/students/:dnumber` | Remove a student from the database |
| `GET` | `/api/stats` | Aggregate department stats (total, avg CGPA, avg attendance) |

---

## 🧪 Running Automated Tests

To verify that all endpoints and database operations are working properly:

```bash
npm test
```
All 8 integration test scenarios will run and report status.

---

## ☁️ Deploying to Vercel

The repository is configured for 1-click Vercel deployment:

1. Import your GitHub repository (`Dhanisha-20/student_details`) into **Vercel**.
2. Keep the Framework Preset as **Other** (Vercel automatically detects `vercel.json` and `api/index.js`).
3. Click **Deploy**.
4. Vercel will:
   - Serve static frontend assets (`public/index.html`, `public/css/style.css`, `public/js/app.js`) at the root `/`.
   - Route all `/api/*` endpoints to the serverless function (`api/index.js`).
   - Run the database engine with fallback for serverless environments.

