/**
 * MCA Student Database Inspector
 * Run via terminal: npm run db:view  or  node view_db.js
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'students.db');

try {
  const db = new DatabaseSync(dbPath);

  console.log('\n======================================================');
  console.log('📊 MCA STUDENT DATABASE INSPECTOR (students.db)');
  console.log('======================================================\n');

  // 1. Get Total Count
  const countRow = db.prepare('SELECT COUNT(*) as total FROM students').get();
  console.log(`📌 Total Registered Students in SQLite: ${countRow.total}\n`);

  // 2. Fetch all student records
  const students = db.prepare(`
    SELECT 
      dnumber AS "D-Number",
      full_name AS "Student Name",
      batch AS "Batch",
      semester AS "Sem",
      specialization AS "Specialization",
      cgpa AS "CGPA",
      attendance AS "Attendance %"
    FROM students
    ORDER BY dnumber ASC
  `).all();

  if (students.length > 0) {
    console.table(students);
  } else {
    console.log('No student records found in the database.');
  }

  console.log('\n💡 Tip: To view detailed columns for any student:');
  console.log('   node -e "const {DatabaseSync}=require(\'node:sqlite\'); const db=new DatabaseSync(\'students.db\'); console.log(db.prepare(\'SELECT * FROM students WHERE dnumber=?\').get(\'D24MCA01\'));"\n');

} catch (err) {
  console.error('Error reading students.db:', err.message);
}
