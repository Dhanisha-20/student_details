/**
 * MCA Student Data Portal - Frontend Application
 * Handles D-Number lookup, student registration, directory browsing, and modal editing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Navigation & Status
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const statTotalStudents = document.getElementById('statTotalStudents');
  const statAvgCgpa = document.getElementById('statAvgCgpa');
  const statAvgAttendance = document.getElementById('statAvgAttendance');

  // DOM Elements - Search Section
  const dnumberInput = document.getElementById('dnumberInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const liveSearchToggle = document.getElementById('liveSearchToggle');
  const sampleChips = document.querySelectorAll('.chip');
  const searchLoading = document.getElementById('searchLoading');
  const searchInitialState = document.getElementById('searchInitialState');
  const searchNotFoundState = document.getElementById('searchNotFoundState');
  const notFoundMsg = document.getElementById('notFoundMsg');
  const btnRegisterMissing = document.getElementById('btnRegisterMissing');
  const studentResultCard = document.getElementById('studentResultCard');

  // DOM Elements - Student Result Card
  const studentAvatar = document.getElementById('studentAvatar');
  const studentFullName = document.getElementById('studentFullName');
  const studentDnumberBadge = document.getElementById('studentDnumberBadge');
  const studentDegreeSubtitle = document.getElementById('studentDegreeSubtitle');
  const studentSemesterTag = document.getElementById('studentSemesterTag');
  const studentSpecTag = document.getElementById('studentSpecTag');
  const studentGenderTag = document.getElementById('studentGenderTag');
  const studentCgpa = document.getElementById('studentCgpa');
  const cgpaGradeBadge = document.getElementById('cgpaGradeBadge');
  const cgpaProgressBar = document.getElementById('cgpaProgressBar');
  const studentSgpa = document.getElementById('studentSgpa');
  const sgpaProgressBar = document.getElementById('sgpaProgressBar');
  const studentAttendance = document.getElementById('studentAttendance');
  const attendanceStatusBadge = document.getElementById('attendanceStatusBadge');
  const attendanceProgressBar = document.getElementById('attendanceProgressBar');
  const infoSpecialization = document.getElementById('infoSpecialization');
  const infoElective = document.getElementById('infoElective');
  const infoProject = document.getElementById('infoProject');
  const infoMentor = document.getElementById('infoMentor');
  const infoEmail = document.getElementById('infoEmail');
  const infoPhone = document.getElementById('infoPhone');
  const infoBloodGroup = document.getElementById('infoBloodGroup');
  const infoDob = document.getElementById('infoDob');
  const infoAddress = document.getElementById('infoAddress');

  const btnPrintProfile = document.getElementById('btnPrintProfile');
  const btnEditCurrentStudent = document.getElementById('btnEditCurrentStudent');
  const btnDeleteCurrentStudent = document.getElementById('btnDeleteCurrentStudent');

  // DOM Elements - Registration Form
  const studentRegistrationForm = document.getElementById('studentRegistrationForm');
  const regDnumber = document.getElementById('regDnumber');
  const regFullName = document.getElementById('regFullName');

  // DOM Elements - Directory Table
  const directoryTableBody = document.getElementById('directoryTableBody');
  const directorySearchInput = document.getElementById('directorySearchInput');
  const refreshDirectoryBtn = document.getElementById('refreshDirectoryBtn');
  const directoryEmptyNotice = document.getElementById('directoryEmptyNotice');

  // DOM Elements - Edit Modal
  const editModal = document.getElementById('editModal');
  const editStudentForm = document.getElementById('editStudentForm');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalDnumber = document.getElementById('modalDnumber');
  const editDnumber = document.getElementById('editDnumber');
  const editFullName = document.getElementById('editFullName');
  const editBatch = document.getElementById('editBatch');
  const editSemester = document.getElementById('editSemester');
  const editSection = document.getElementById('editSection');
  const editSpecialization = document.getElementById('editSpecialization');
  const editCgpa = document.getElementById('editCgpa');
  const editSgpa = document.getElementById('editSgpa');
  const editAttendance = document.getElementById('editAttendance');
  const editEmail = document.getElementById('editEmail');
  const editPhone = document.getElementById('editPhone');
  const editElective = document.getElementById('editElective');
  const editMentor = document.getElementById('editMentor');
  const editProject = document.getElementById('editProject');

  // State
  let currentStudentData = null;
  let debounceTimer = null;
  let allDirectoryStudents = [];

  // =========================================================================
  // Tab Navigation
  // =========================================================================
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTabId = tab.dataset.tab;
      switchTab(targetTabId);
    });
  });

  function switchTab(tabId) {
    navTabs.forEach(t => {
      const isActive = t.dataset.tab === tabId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    if (tabId === 'directoryTab') {
      loadDirectory();
    }
  }

  // =========================================================================
  // D-Number Search & Live Lookup
  // =========================================================================

  // Input typing with debounce
  dnumberInput.addEventListener('input', (e) => {
    const value = e.target.value.trim().toUpperCase();
    e.target.value = value; // keep uppercase

    clearSearchBtn.style.display = value.length > 0 ? 'inline-block' : 'none';

    if (!liveSearchToggle.checked) return;

    clearTimeout(debounceTimer);
    if (value.length >= 3) {
      debounceTimer = setTimeout(() => {
        searchStudent(value);
      }, 350);
    } else if (value.length === 0) {
      showInitialState();
    }
  });

  // Enter key in input
  dnumberInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceTimer);
      const query = dnumberInput.value.trim();
      if (query) {
        searchStudent(query);
      }
    }
  });

  // Search button click
  searchBtn.addEventListener('click', () => {
    const query = dnumberInput.value.trim();
    if (!query) {
      showToast('Please enter a D-Number to search', 'info');
      dnumberInput.focus();
      return;
    }
    searchStudent(query);
  });

  // Clear button click
  clearSearchBtn.addEventListener('click', () => {
    dnumberInput.value = '';
    clearSearchBtn.style.display = 'none';
    showInitialState();
    dnumberInput.focus();
  });

  // Quick sample chips
  sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const dnum = chip.dataset.dnumber;
      dnumberInput.value = dnum;
      clearSearchBtn.style.display = 'inline-block';
      searchStudent(dnum);
    });
  });

  // Register missing student button
  btnRegisterMissing.addEventListener('click', () => {
    const missingDnum = dnumberInput.value.trim().toUpperCase();
    switchTab('registerTab');
    regDnumber.value = missingDnum;
    regFullName.focus();
    showToast(`D-Number ${missingDnum} pre-filled. Enter details to register.`, 'info');
  });

  // Copy D-Number on badge click
  studentDnumberBadge.addEventListener('click', () => {
    const dnum = studentDnumberBadge.textContent.trim();
    if (dnum) {
      navigator.clipboard.writeText(dnum).then(() => {
        showToast(`Copied ${dnum} to clipboard!`, 'success');
      }).catch(() => {
        showToast(`D-Number: ${dnum}`, 'info');
      });
    }
  });

  // Fetch Student from Backend API
  async function searchStudent(dnumber) {
    if (!dnumber) return;
    const cleanDnum = encodeURIComponent(dnumber.trim());

    // Show loading
    searchLoading.style.display = 'block';
    searchInitialState.style.display = 'none';
    searchNotFoundState.style.display = 'none';
    studentResultCard.style.display = 'none';

    try {
      const response = await fetch(`/api/students/${cleanDnum}`);
      const data = await response.json();

      searchLoading.style.display = 'none';

      if (response.ok && data.success && data.data) {
        currentStudentData = data.data;
        renderStudentCard(data.data);
      } else {
        currentStudentData = null;
        showNotFoundState(dnumber, data.message);
      }
    } catch (err) {
      console.error('Network error during student search:', err);
      searchLoading.style.display = 'none';
      showToast('Connection error to database server.', 'error');
    }
  }

  // Render Student Details to Result Card
  function renderStudentCard(s) {
    searchInitialState.style.display = 'none';
    searchNotFoundState.style.display = 'none';
    studentResultCard.style.display = 'block';

    // Avatar initials
    const initials = s.full_name
      ? s.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'ST';
    studentAvatar.textContent = initials;

    studentFullName.textContent = s.full_name;
    studentDnumberBadge.textContent = s.dnumber;
    studentDegreeSubtitle.textContent = `Master of Computer Applications (MCA) • Batch ${s.batch || '2024-2026'}`;

    studentSemesterTag.textContent = `Semester ${s.semester} (Sec ${s.section || 'A'})`;
    studentSpecTag.textContent = s.specialization || 'Computer Applications';
    studentGenderTag.textContent = s.gender || 'Not Specified';

    // CGPA Calculation & Bar
    const cgpaVal = parseFloat(s.cgpa) || 0.0;
    studentCgpa.textContent = cgpaVal.toFixed(2);
    cgpaProgressBar.style.width = `${Math.min(cgpaVal * 10, 100)}%`;
    cgpaGradeBadge.textContent = `Grade: ${getGradeEquivalent(cgpaVal)}`;

    // SGPA
    const sgpaVal = parseFloat(s.sgpa) || 0.0;
    studentSgpa.textContent = sgpaVal.toFixed(2);
    sgpaProgressBar.style.width = `${Math.min(sgpaVal * 10, 100)}%`;

    // Attendance
    const attVal = parseFloat(s.attendance) || 0.0;
    studentAttendance.textContent = attVal.toFixed(1);
    attendanceProgressBar.style.width = `${Math.min(attVal, 100)}%`;

    if (attVal >= 85) {
      attendanceStatusBadge.className = 'metric-badge badge-success';
      attendanceStatusBadge.textContent = 'Eligible (Good)';
      attendanceProgressBar.className = 'progress-bar progress-emerald';
    } else if (attVal >= 75) {
      attendanceStatusBadge.className = 'metric-badge badge-warning';
      attendanceStatusBadge.textContent = 'Eligible (Warning)';
      attendanceProgressBar.className = 'progress-bar progress-amber';
    } else {
      attendanceStatusBadge.className = 'metric-badge badge-danger';
      attendanceStatusBadge.textContent = 'Shortage (<75%)';
      attendanceProgressBar.className = 'progress-bar progress-rose';
    }

    // Detailed Info
    infoSpecialization.textContent = s.specialization || 'General MCA';
    infoElective.textContent = s.elective_course || 'None Assigned';
    infoProject.textContent = s.mini_project_title || 'Topic Selection in Progress';
    infoMentor.textContent = s.mentor_name || 'HOD / Department Faculty';

    // Contact
    infoEmail.textContent = s.email || 'Not Provided';
    infoEmail.href = s.email ? `mailto:${s.email}` : '#';

    infoPhone.textContent = s.phone || 'Not Provided';
    infoPhone.href = s.phone ? `tel:${s.phone}` : '#';

    infoBloodGroup.textContent = s.blood_group || 'N/A';
    infoDob.textContent = s.dob || 'Not Stored';
    infoAddress.textContent = s.address || 'Department Hostel / Day Scholar';
  }

  function getGradeEquivalent(cgpa) {
    if (cgpa >= 9.0) return 'O (Outstanding)';
    if (cgpa >= 8.0) return 'A+ (Excellent)';
    if (cgpa >= 7.0) return 'A (Very Good)';
    if (cgpa >= 6.0) return 'B+ (Good)';
    if (cgpa >= 5.0) return 'B (Above Average)';
    return 'C (Pass)';
  }

  function showInitialState() {
    searchLoading.style.display = 'none';
    searchNotFoundState.style.display = 'none';
    studentResultCard.style.display = 'none';
    searchInitialState.style.display = 'block';
  }

  function showNotFoundState(dnum, msg) {
    searchLoading.style.display = 'none';
    searchInitialState.style.display = 'none';
    studentResultCard.style.display = 'none';
    searchNotFoundState.style.display = 'block';
    notFoundMsg.textContent = msg || `No MCA student found with D-Number "${dnum}".`;
  }

  // Print Dossier
  btnPrintProfile.addEventListener('click', () => {
    window.print();
  });

  // Delete from Profile Card
  btnDeleteCurrentStudent.addEventListener('click', async () => {
    if (!currentStudentData) return;
    const confirmDelete = confirm(`Are you sure you want to permanently delete ${currentStudentData.full_name} (${currentStudentData.dnumber}) from the database?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(currentStudentData.dnumber)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        dnumberInput.value = '';
        clearSearchBtn.style.display = 'none';
        showInitialState();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to delete student.', 'error');
      }
    } catch (err) {
      showToast('Error communicating with database.', 'error');
    }
  });

  // Edit from Profile Card
  btnEditCurrentStudent.addEventListener('click', () => {
    if (!currentStudentData) return;
    openEditModal(currentStudentData);
  });

  // =========================================================================
  // Student Registration Form
  // =========================================================================
  studentRegistrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dnumber = regDnumber.value.trim().toUpperCase();
    const full_name = regFullName.value.trim();

    if (!dnumber) {
      showToast('Please provide a D-Number', 'error');
      regDnumber.focus();
      return;
    }
    if (!full_name) {
      showToast('Please enter the student\'s full name', 'error');
      regFullName.focus();
      return;
    }

    const payload = {
      dnumber: dnumber,
      full_name: full_name,
      gender: document.getElementById('regGender').value,
      dob: document.getElementById('regDob').value,
      blood_group: document.getElementById('regBloodGroup').value,
      batch: document.getElementById('regBatch').value.trim(),
      semester: parseInt(document.getElementById('regSemester').value, 10),
      section: document.getElementById('regSection').value.trim(),
      specialization: document.getElementById('regSpecialization').value,
      elective_course: document.getElementById('regElective').value.trim(),
      cgpa: parseFloat(document.getElementById('regCgpa').value) || 0.0,
      sgpa: parseFloat(document.getElementById('regSgpa').value) || 0.0,
      attendance: parseFloat(document.getElementById('regAttendance').value) || 0.0,
      mini_project_title: document.getElementById('regProject').value.trim(),
      mentor_name: document.getElementById('regMentor').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      phone: document.getElementById('regPhone').value.trim(),
      address: document.getElementById('regAddress').value.trim()
    };

    const submitBtn = document.getElementById('btnSubmitRegistration');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving to Database...';

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save Student to Database';

      if (response.ok && data.success) {
        showToast(data.message || 'Student saved successfully!', 'success');
        studentRegistrationForm.reset();

        // Switch to search view to display newly created record
        switchTab('searchTab');
        dnumberInput.value = payload.dnumber;
        clearSearchBtn.style.display = 'inline-block';
        searchStudent(payload.dnumber);
        fetchStats();
      } else {
        showToast(data.message || 'Failed to save student.', 'error');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save Student to Database';
      console.error('Error registering student:', err);
      showToast('Server connection failed.', 'error');
    }
  });

  // =========================================================================
  // MCA Directory Table
  // =========================================================================
  async function loadDirectory() {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();

      if (response.ok && data.success) {
        allDirectoryStudents = data.data || [];
        renderDirectoryTable(allDirectoryStudents);
      } else {
        showToast('Unable to fetch directory.', 'error');
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
      showToast('Network error loading directory.', 'error');
    }
  }

  refreshDirectoryBtn.addEventListener('click', () => {
    loadDirectory();
    showToast('Directory refreshed from database.', 'info');
  });

  directorySearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderDirectoryTable(allDirectoryStudents);
      return;
    }

    const filtered = allDirectoryStudents.filter(s =>
      (s.dnumber && s.dnumber.toLowerCase().includes(term)) ||
      (s.full_name && s.full_name.toLowerCase().includes(term)) ||
      (s.specialization && s.specialization.toLowerCase().includes(term))
    );

    renderDirectoryTable(filtered);
  });

  function renderDirectoryTable(students) {
    directoryTableBody.innerHTML = '';

    if (students.length === 0) {
      directoryEmptyNotice.style.display = 'block';
      return;
    }
    directoryEmptyNotice.style.display = 'none';

    students.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="dnumber-cell">${escapeHtml(s.dnumber)}</td>
        <td><strong>${escapeHtml(s.full_name)}</strong></td>
        <td>Sem ${s.semester} (${escapeHtml(s.batch || '2024-26')})</td>
        <td>${escapeHtml(s.specialization || 'MCA')}</td>
        <td><strong>${(parseFloat(s.cgpa) || 0).toFixed(2)}</strong></td>
        <td>
          <span class="tag ${s.attendance >= 85 ? 'tag-emerald' : s.attendance >= 75 ? 'tag-indigo' : 'tag-slate'}">
            ${(parseFloat(s.attendance) || 0).toFixed(1)}%
          </span>
        </td>
        <td class="table-actions">
          <button type="button" class="btn btn-secondary btn-sm btn-view-row" data-dnumber="${escapeHtml(s.dnumber)}" title="View Profile">
            👁️ View
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-edit-row" data-dnumber="${escapeHtml(s.dnumber)}" title="Edit Record">
            ✏️
          </button>
          <button type="button" class="btn btn-danger-outline btn-sm btn-delete-row" data-dnumber="${escapeHtml(s.dnumber)}" title="Delete">
            🗑️
          </button>
        </td>
      `;
      directoryTableBody.appendChild(tr);
    });

    // Wire up row action buttons
    document.querySelectorAll('.btn-view-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const dnum = btn.dataset.dnumber;
        switchTab('searchTab');
        dnumberInput.value = dnum;
        clearSearchBtn.style.display = 'inline-block';
        searchStudent(dnum);
      });
    });

    document.querySelectorAll('.btn-edit-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const dnum = btn.dataset.dnumber;
        const student = allDirectoryStudents.find(st => st.dnumber === dnum);
        if (student) openEditModal(student);
      });
    });

    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dnum = btn.dataset.dnumber;
        const confirmDel = confirm(`Are you sure you want to delete student ${dnum}?`);
        if (!confirmDel) return;

        try {
          const res = await fetch(`/api/students/${encodeURIComponent(dnum)}`, { method: 'DELETE' });
          const resData = await res.json();
          if (res.ok && resData.success) {
            showToast(`Student ${dnum} deleted.`, 'success');
            loadDirectory();
            fetchStats();
          } else {
            showToast(resData.message || 'Delete failed', 'error');
          }
        } catch (e) {
          showToast('Failed to delete student.', 'error');
        }
      });
    });
  }

  // =========================================================================
  // Edit Student Modal
  // =========================================================================
  function openEditModal(s) {
    modalDnumber.textContent = s.dnumber;
    editDnumber.value = s.dnumber;
    editFullName.value = s.full_name || '';
    editBatch.value = s.batch || '2024-2026';
    editSemester.value = s.semester || '1';
    editSection.value = s.section || 'A';
    editSpecialization.value = s.specialization || '';
    editCgpa.value = s.cgpa || '';
    editSgpa.value = s.sgpa || '';
    editAttendance.value = s.attendance || '';
    editEmail.value = s.email || '';
    editPhone.value = s.phone || '';
    editElective.value = s.elective_course || '';
    editMentor.value = s.mentor_name || '';
    editProject.value = s.mini_project_title || '';

    editModal.style.display = 'flex';
  }

  function closeEditModal() {
    editModal.style.display = 'none';
  }

  modalCloseBtn.addEventListener('click', closeEditModal);
  modalCancelBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  editStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dnum = editDnumber.value;

    const payload = {
      full_name: editFullName.value.trim(),
      batch: editBatch.value.trim(),
      semester: parseInt(editSemester.value, 10),
      section: editSection.value.trim(),
      specialization: editSpecialization.value.trim(),
      cgpa: parseFloat(editCgpa.value) || 0.0,
      sgpa: parseFloat(editSgpa.value) || 0.0,
      attendance: parseFloat(editAttendance.value) || 0.0,
      email: editEmail.value.trim(),
      phone: editPhone.value.trim(),
      elective_course: editElective.value.trim(),
      mentor_name: editMentor.value.trim(),
      mini_project_title: editProject.value.trim()
    };

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(dnum)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Student updated successfully!', 'success');
        closeEditModal();
        if (currentStudentData && currentStudentData.dnumber === dnum) {
          searchStudent(dnum);
        }
        loadDirectory();
        fetchStats();
      } else {
        showToast(data.message || 'Update failed.', 'error');
      }
    } catch (err) {
      showToast('Error updating student.', 'error');
    }
  });

  // =========================================================================
  // Stats Ribbon
  // =========================================================================
  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (res.ok && data.success && data.stats) {
        statTotalStudents.textContent = data.stats.totalStudents;
        statAvgCgpa.textContent = `${data.stats.averageCgpa} / 10`;
        statAvgAttendance.textContent = `${data.stats.averageAttendance}%`;
      }
    } catch (e) {
      console.warn('Could not fetch stats ribbon data');
    }
  }

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Data Fetch
  fetchStats();

  // Focus search input by default
  dnumberInput.focus();
});
