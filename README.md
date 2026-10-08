# 🎓 MCA Student Data Portal & Password Security Laboratory

A full-stack web application designed for the **Department of Computer Applications (MCA)** to manage student data in SQLite and demonstrate advanced cryptography for the assignment: **"Create a new Algorithm for securing a Password"**.

Built with **HTML5, CSS3, Vanilla JavaScript** on the frontend and **Node.js, Express, and SQLite** on the backend.

---

## 🌟 Key Features

### 1. 🔐 User Authentication & Password Hashing (Assignment Feature)
- **Zero Plaintext Storage (CWE-312 Remediation):** Passwords are **never** stored in HTML files, client-side scripts, or plaintext database fields.
- **Login & Registration Screen:**
  - Modern role-based sign in and account registration.
  - **1-Click Demo Accounts:** Log in immediately as Administrator, Student, Faculty, or Demo Guest.
  - **Algorithm Selector on Registration:** Users can choose which cryptographic algorithm hashes their credentials (default: **AegisHash-256**).
  - **Live Password Strength Meter:** Evaluates entropy in real time.
  - Session verification via `/api/auth/me` with header profile and Logout button.

### 2. ⭐ Novel Cryptographic Algorithm: `AegisHash-256`
Designed specifically for the academic assignment **"Create a new Algorithm for securing a Password"**:
- **Phase 1: 128-bit CSPRNG Salt** — Unique 16-byte random salt per user eliminates precomputed Rainbow Tables.
- **Phase 2: Dynamic Non-Linear S-Box** — A 256-byte substitution box generated per-credential using salt bytes and modular arithmetic.
- **Phase 3: 8×8 State Matrix Transposition** — Circular row bit-shifts and diagonal XOR folding guarantee spatial diffusion satisfying the **Strict Avalanche Criterion (SAC ~50%)**.
- **Phase 4: Time-Hardened Key Stretching** — 12,000 iterated HMAC compression rounds thwart GPU/ASIC parallel brute-force attacks.
- **Phase 5: Constant-Time Verification** — Timing-safe buffer comparison (`crypto.timingSafeEqual`) prevents side-channel timing attacks.
- **Modular Crypt Format:** Stored as `$aegis256$v=1$r=12000$s=<salt>$h=<digest>`.

### 3. 🧪 Interactive Password Security Lab
A dedicated UI tab within the portal (`public/index.html` $\rightarrow$ **Password Security Lab**):
- **Live Algorithm Playground:** Input test passwords, choose algorithms and work factors, and inspect the real-time execution trace step-by-step.
- **Multi-Algorithm Benchmark:** Side-by-side comparison of **AegisHash-256**, **PBKDF2-HMAC-SHA256**, **Salted SHA-256**, **Keyed HMAC-SHA512**, and **Legacy MD5**.
- **Avalanche Effect Test Bench:** Measures how many bits flip when 1 single bit in the password changes.
- **SQLite Database Inspector:** Proves that credentials are encrypted in `students.db` and zero passwords exist in HTML.
- **Printable Academic Report:** Formatted academic paper with a 1-click **"🖨️ Print / Save Assignment Report as PDF"** button.

### 4. 🔍 Instant D-Number Search & Live Lookup
- Type any MCA D-Number (e.g. `D24MCA01`, `D24MCA02`) to instantly retrieve the complete student dossier.
- **Case-Insensitive:** Works with lowercase (`d24mca02`) or uppercase.
- **Real-time Toggle:** Instant lookup with debounced keystrokes or manual search button.
- **Sample Chips:** 1-click pills for quick testing.

### 5. 📋 Comprehensive MCA Student Dossier & Directory
- View CGPA, SGPA, attendance progress bars, curriculum electives, capstone projects, and faculty guides.
- Add new students into the SQLite database with duplicate D-Number prevention.
- Roster table with live search and filter across Name, D-Number, and Specialization.
- Formatted Print Student Slip stylesheet.

### 6. ✨ Free AI Data Generator & Mentor Reports (Google Gemini API)
- Generate authentic MCA student profiles using a free Gemini API key and save them to SQLite.
- Generate personalized AI Academic Mentor Reports for any student dossier.

---

## 🔑 Demo Login Accounts in SQLite

The database is pre-seeded with test accounts. Zero passwords are in HTML files:

| Username | Password | Role | Algorithm Applied | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `Admin@123` | Administrator | ⭐ `AegisHash-256` | Custom novel algorithm |
| `dhanisha` | `MCA2024!Secure` | MCA Student | ⭐ `AegisHash-256` | Custom novel algorithm |
| `faculty_kumar` | `Faculty@2024` | Faculty Guide | `PBKDF2` | NIST SP 800-132 Standard |
| `demo_sha256` | `Student#Pass1` | Guest | `Salted SHA-256` | Single-pass baseline |

*(You can also register a new account with your own custom password and algorithm!)*

---

## 📁 Project Structure

```
Student_data/
├── crypto_algo.js               # Novel AegisHash-256 algorithm & multi-algorithm suite
├── db.js                        # SQLite database layer (students & users tables)
├── server.js                    # Express API (Student routes, Auth routes, Security Lab)
├── students.db                  # SQLite database file (seeded with students & users)
├── test_endpoints.js            # Automated integration test suite (16 tests)
├── view_db.js                   # Terminal database inspector (students & hashed users)
├── PASSWORD_ALGORITHM_ASSIGNMENT.md # Formal academic assignment paper for submission
├── package.json                 # Project dependencies and npm scripts
├── README.md                    # Project documentation
└── public/                      # Frontend client
    ├── index.html               # Main UI (Login card, Student Portal, Security Lab)
    ├── css/
    │   └── style.css            # Stylesheet (Responsive design, crypto cards, print rules)
    └── js/
        └── app.js               # Frontend controller (Auth, D-Number search, Crypto Lab)
```

---

## 🚀 How to Run the Application

### 1. Start the Server
Open terminal in `c:\Users\Dhanisha R\Downloads\Student_data` and run:

```bash
npm start
```

Output:
```text
===============================================
🎓 MCA Student Data Portal Backend Running
📡 URL: http://localhost:3000
💾 Database: SQLite (students.db)
===============================================
```

### 2. Open the Frontend
Navigate your browser to:
```
http://localhost:3000
```
- Click any **1-Click Demo Account** pill to sign in.
- Click **"🔐 Password Security Lab"** in the top navigation to test the custom algorithm, benchmark comparisons, and print your assignment paper.

---

## 🧪 Running Automated Tests

Run the full integration test suite:

```bash
npm test
```

All 16 test cases will execute:
- ✅ Student D-Number lookup, case-insensitivity, 404 handling
- ✅ Student registration, deletion, stats ribbon
- ✅ User login with custom AegisHash-256 algorithm
- ✅ User registration with dynamic hash generation
- ✅ Password hashing with 8-stage step-by-step trace
- ✅ 5-algorithm comparative benchmark
- ✅ Strict Avalanche Criterion (SAC) measurement
- ✅ SQLite database users inspector

---

## 📊 Database Terminal Inspector

To view all students and hashed user credentials in the terminal:

```bash
npm run db:view
```

Displays both the student roster and the `users` table showing stored salts and masked hashes.

---

## 📄 Assignment Paper

Read the complete academic submission paper at [`PASSWORD_ALGORITHM_ASSIGNMENT.md`](PASSWORD_ALGORITHM_ASSIGNMENT.md).
