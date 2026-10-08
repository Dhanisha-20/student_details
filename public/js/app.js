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

    const portalScreenEl = document.getElementById('portalScreen');
    if (portalScreenEl && portalScreenEl.style.display === 'none') {
      portalScreenEl.style.display = 'block';
    }

    if (tabId === 'directoryTab') {
      loadDirectory();
    }
    if (tabId === 'securityTab') {
      loadSecurityLab();
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

  // =========================================================================
  // Google Gemini AI Data Generator & Academic Reports
  // =========================================================================
  const geminiApiKey = document.getElementById('geminiApiKey');
  const btnToggleApiKey = document.getElementById('btnToggleApiKey');
  const btnSaveApiKey = document.getElementById('btnSaveApiKey');
  const aiSemester = document.getElementById('aiSemester');
  const aiSpecialization = document.getElementById('aiSpecialization');
  const btnGenerateAiStudent = document.getElementById('btnGenerateAiStudent');
  const aiBtnSpinner = document.getElementById('aiBtnSpinner');
  const aiBtnText = document.getElementById('aiBtnText');
  const aiResultPreview = document.getElementById('aiResultPreview');
  const aiPreviewBody = document.getElementById('aiPreviewBody');
  const aiSourceBadge = document.getElementById('aiSourceBadge');
  const btnViewAiStudent = document.getElementById('btnViewAiStudent');
  const btnGenerateAnotherAi = document.getElementById('btnGenerateAnotherAi');

  const btnAiMentorReport = document.getElementById('btnAiMentorReport');
  const aiReportBox = document.getElementById('aiReportBox');
  const aiReportLoading = document.getElementById('aiReportLoading');
  const aiReportContent = document.getElementById('aiReportContent');
  const btnCloseAiReport = document.getElementById('btnCloseAiReport');

  let lastGeneratedAiDnumber = null;

  // Load saved API key from localStorage
  const savedApiKey = localStorage.getItem('mca_gemini_api_key');
  if (savedApiKey && geminiApiKey) {
    geminiApiKey.value = savedApiKey;
  }

  // Toggle API key visibility
  if (btnToggleApiKey) {
    btnToggleApiKey.addEventListener('click', () => {
      const isPass = geminiApiKey.type === 'password';
      geminiApiKey.type = isPass ? 'text' : 'password';
      btnToggleApiKey.textContent = isPass ? '🔒' : '👁️';
    });
  }

  // Save API key
  if (btnSaveApiKey) {
    btnSaveApiKey.addEventListener('click', () => {
      const val = geminiApiKey.value.trim();
      localStorage.setItem('mca_gemini_api_key', val);
      showToast(val ? 'Gemini API Key saved in browser storage!' : 'API Key cleared.', 'success');
    });
  }

  // Generate Student via AI
  if (btnGenerateAiStudent) {
    btnGenerateAiStudent.addEventListener('click', async () => {
      const apiKey = geminiApiKey ? geminiApiKey.value.trim() : '';
      const semester = aiSemester ? aiSemester.value : '3';
      const specialization = aiSpecialization ? aiSpecialization.value : 'Artificial Intelligence & Data Science';

      btnGenerateAiStudent.disabled = true;
      aiBtnSpinner.style.display = 'inline-block';
      aiBtnText.textContent = 'Generating via Gemini AI...';

      try {
        const response = await fetch('/api/ai/generate-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, semester, specialization })
        });
        const data = await response.json();

        btnGenerateAiStudent.disabled = false;
        aiBtnSpinner.style.display = 'none';
        aiBtnText.textContent = '✨ Generate & Save Student to Database';

        if (response.ok && data.success && data.data) {
          const s = data.data;
          lastGeneratedAiDnumber = s.dnumber;
          aiSourceBadge.textContent = data.source || 'Google Gemini AI';

          aiPreviewBody.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; color: var(--primary);">${escapeHtml(s.dnumber)}</span>
              <strong style="font-size: 1.15rem;">${escapeHtml(s.full_name)}</strong>
              <span class="tag tag-indigo">Semester ${s.semester} (${escapeHtml(s.batch)})</span>
            </div>
            <div style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 0.75rem;">
              Track: <strong>${escapeHtml(s.specialization)}</strong> • Guide: <strong>${escapeHtml(s.mentor_name)}</strong>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
              <div><small style="color: var(--text-muted); display: block;">CGPA</small><strong>${s.cgpa} / 10</strong></div>
              <div><small style="color: var(--text-muted); display: block;">SGPA</small><strong>${s.sgpa} / 10</strong></div>
              <div><small style="color: var(--text-muted); display: block;">Attendance</small><strong>${s.attendance}%</strong></div>
            </div>
            <div style="font-size: 0.85rem;">
              <strong>Project:</strong> <em>${escapeHtml(s.mini_project_title)}</em>
            </div>
          `;

          aiResultPreview.style.display = 'block';
          showToast(`Student ${s.dnumber} created and saved to SQLite!`, 'success');
          fetchStats();
        } else {
          showToast(data.message || 'Generation failed.', 'error');
        }
      } catch (err) {
        btnGenerateAiStudent.disabled = false;
        aiBtnSpinner.style.display = 'none';
        aiBtnText.textContent = '✨ Generate & Save Student to Database';
        console.error('Error generating student via AI:', err);
        showToast('Connection to AI service failed.', 'error');
      }
    });
  }

  if (btnViewAiStudent) {
    btnViewAiStudent.addEventListener('click', () => {
      if (lastGeneratedAiDnumber) {
        switchTab('searchTab');
        dnumberInput.value = lastGeneratedAiDnumber;
        clearSearchBtn.style.display = 'inline-block';
        searchStudent(lastGeneratedAiDnumber);
      }
    });
  }

  if (btnGenerateAnotherAi) {
    btnGenerateAnotherAi.addEventListener('click', () => {
      aiResultPreview.style.display = 'none';
      if (btnGenerateAiStudent) btnGenerateAiStudent.click();
    });
  }

  // AI Mentor Report Generation
  if (btnAiMentorReport) {
    btnAiMentorReport.addEventListener('click', async () => {
      if (!currentStudentData) return;
      const apiKey = geminiApiKey ? geminiApiKey.value.trim() : (localStorage.getItem('mca_gemini_api_key') || '');

      aiReportBox.style.display = 'block';
      aiReportLoading.style.display = 'block';
      aiReportContent.innerHTML = '';
      aiReportBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      try {
        const response = await fetch('/api/ai/academic-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: apiKey,
            dnumber: currentStudentData.dnumber
          })
        });
        const data = await response.json();

        aiReportLoading.style.display = 'none';

        if (response.ok && data.success && data.report) {
          // Parse basic markdown to HTML
          const formattedHtml = parseMarkdownToHtml(data.report);
          aiReportContent.innerHTML = formattedHtml;
          showToast('AI Mentor Assessment generated!', 'success');
        } else {
          aiReportContent.innerHTML = `<p style="color: var(--danger);">Unable to generate report: ${escapeHtml(data.message || 'Error')}</p>`;
        }
      } catch (err) {
        aiReportLoading.style.display = 'none';
        aiReportContent.innerHTML = `<p style="color: var(--danger);">Network error contacting AI service.</p>`;
      }
    });
  }

  if (btnCloseAiReport) {
    btnCloseAiReport.addEventListener('click', () => {
      aiReportBox.style.display = 'none';
    });
  }

  // Basic markdown formatter for AI reports
  function parseMarkdownToHtml(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    // Headers
    html = html.replace(/### (.*?)(?:\n|$)/g, '<h3>$1</h3>');
    html = html.replace(/## (.*?)(?:\n|$)/g, '<h3>$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italics
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points
    html = html.replace(/(?:^|\n)- (.*?)(?=(?:\n- )|(?:\n\n)|$)/g, '\n<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    // Paragraph breaks
    html = html.replace(/\n\n+/g, '<br><br>');

    return html;
  }

  // =========================================================================
  // USER AUTHENTICATION & SESSION MANAGEMENT
  // =========================================================================

  const authSection = document.getElementById('authSection');
  const portalScreen = document.getElementById('portalScreen');
  const userHeaderProfile = document.getElementById('userHeaderProfile');
  const userHeaderAvatar = document.getElementById('userHeaderAvatar');
  const userHeaderName = document.getElementById('userHeaderName');
  const userHeaderRole = document.getElementById('userHeaderRole');
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const btnBypassToLab = document.getElementById('btnBypassToLab');

  const tabBtnSignIn = document.getElementById('tabBtnSignIn');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const signInForm = document.getElementById('signInForm');
  const registerForm = document.getElementById('registerForm');

  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const loginSpinner = document.getElementById('loginSpinner');
  const toggleLoginPassVisibility = document.getElementById('toggleLoginPassVisibility');

  const regUsername = document.getElementById('regUsername');
  const regUserFullName = document.getElementById('regUserFullName');
  const regEmail = document.getElementById('regEmail');
  const regRole = document.getElementById('regRole');
  const regPassword = document.getElementById('regPassword');
  const regAlgorithm = document.getElementById('regAlgorithm');
  const btnRegisterSubmit = document.getElementById('btnRegisterSubmit');
  const regSpinner = document.getElementById('regSpinner');
  const toggleRegPassVisibility = document.getElementById('toggleRegPassVisibility');
  const passStrengthBar = document.getElementById('passStrengthBar');
  const passStrengthLabel = document.getElementById('passStrengthLabel');

  const demoPills = document.querySelectorAll('.demo-pill');

  let currentAuthUser = null;

  // Toggle Login vs Register Tabs
  if (tabBtnSignIn && tabBtnRegister) {
    tabBtnSignIn.addEventListener('click', () => {
      tabBtnSignIn.classList.add('active');
      tabBtnRegister.classList.remove('active');
      if (signInForm) signInForm.style.display = 'flex';
      if (registerForm) registerForm.style.display = 'none';
    });

    tabBtnRegister.addEventListener('click', () => {
      tabBtnRegister.classList.add('active');
      tabBtnSignIn.classList.remove('active');
      if (registerForm) registerForm.style.display = 'flex';
      if (signInForm) signInForm.style.display = 'none';
    });
  }

  // Quick Demo Pills 1-click login
  demoPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const user = pill.dataset.user;
      const pass = pill.dataset.pass;
      if (tabBtnSignIn) tabBtnSignIn.click();
      if (loginUsername) loginUsername.value = user;
      if (loginPassword) loginPassword.value = pass;
      if (btnLoginSubmit) btnLoginSubmit.click();
    });
  });

  // Password Visibility Toggles
  function setupPassToggle(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🔒' : '👁️';
    });
  }
  setupPassToggle(toggleLoginPassVisibility, loginPassword);
  setupPassToggle(toggleRegPassVisibility, regPassword);

  // Live Registration Password Strength Meter
  if (regPassword) {
    regPassword.addEventListener('input', () => {
      const val = regPassword.value;
      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 10) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      if (val.length === 0) {
        if (passStrengthBar) {
          passStrengthBar.style.width = '0%';
          passStrengthBar.style.backgroundColor = 'var(--danger)';
        }
        if (passStrengthLabel) passStrengthLabel.textContent = 'Password strength: Empty';
        return;
      }

      if (score <= 2) {
        if (passStrengthBar) {
          passStrengthBar.style.width = '30%';
          passStrengthBar.style.backgroundColor = 'var(--danger)';
        }
        if (passStrengthLabel) passStrengthLabel.textContent = 'Password strength: Weak (easy to dictionary attack)';
      } else if (score <= 4) {
        if (passStrengthBar) {
          passStrengthBar.style.width = '65%';
          passStrengthBar.style.backgroundColor = 'var(--warning)';
        }
        if (passStrengthLabel) passStrengthLabel.textContent = 'Password strength: Moderate';
      } else {
        if (passStrengthBar) {
          passStrengthBar.style.width = '100%';
          passStrengthBar.style.backgroundColor = 'var(--success)';
        }
        if (passStrengthLabel) passStrengthLabel.textContent = 'Password strength: Very Strong (high entropy)';
      }
    });
  }

  // Sign In Handler
  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener('click', async () => {
      const username = loginUsername ? loginUsername.value.trim() : '';
      const password = loginPassword ? loginPassword.value : '';

      if (!username || !password) {
        showToast('Please enter both username and password.', 'warning');
        return;
      }

      if (loginSpinner) loginSpinner.style.display = 'inline-block';
      btnLoginSubmit.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (loginSpinner) loginSpinner.style.display = 'none';
        btnLoginSubmit.disabled = false;

        if (res.ok && data.success) {
          localStorage.setItem('mca_auth_token', data.token);
          localStorage.setItem('mca_auth_user', JSON.stringify(data.user));
          setLoggedInState(data.user, data.algorithmUsed);
          showToast(`Welcome ${data.user.full_name}! Authenticated via ${data.algorithmUsed ? data.algorithmUsed.toUpperCase() : 'AegisHash'}.`, 'success');
        } else {
          showToast(data.message || 'Login failed.', 'error');
        }
      } catch (err) {
        if (loginSpinner) loginSpinner.style.display = 'none';
        btnLoginSubmit.disabled = false;
        showToast('Network error during login.', 'error');
      }
    });
  }

  // Register Handler
  if (btnRegisterSubmit) {
    btnRegisterSubmit.addEventListener('click', async () => {
      const username = regUsername ? regUsername.value.trim() : '';
      const full_name = regUserFullName ? regUserFullName.value.trim() : '';
      const email = regEmail ? regEmail.value.trim() : '';
      const password = regPassword ? regPassword.value : '';
      const role = regRole ? regRole.value : 'student';
      const algorithm = regAlgorithm ? regAlgorithm.value : 'aegis256';

      if (!username || !full_name || !email || !password) {
        showToast('Please complete all required fields.', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'warning');
        return;
      }

      if (regSpinner) regSpinner.style.display = 'inline-block';
      btnRegisterSubmit.disabled = true;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, full_name, email, password, role, algorithm })
        });
        const data = await res.json();

        if (regSpinner) regSpinner.style.display = 'none';
        btnRegisterSubmit.disabled = false;

        if (res.ok && data.success) {
          localStorage.setItem('mca_auth_token', data.token);
          localStorage.setItem('mca_auth_user', JSON.stringify(data.user));
          setLoggedInState(data.user, data.user.algorithm);
          showToast(`Account created & password hashed via ${data.user.algorithm.toUpperCase()}!`, 'success');
          loadDatabaseUsers();
        } else {
          showToast(data.message || 'Registration failed.', 'error');
        }
      } catch (err) {
        if (regSpinner) regSpinner.style.display = 'none';
        btnRegisterSubmit.disabled = false;
        showToast('Network error during registration.', 'error');
      }
    });
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const token = localStorage.getItem('mca_auth_token');
      if (token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (_) {}
      }
      localStorage.removeItem('mca_auth_token');
      localStorage.removeItem('mca_auth_user');
      setLoggedOutState();
      showToast('Logged out successfully.', 'info');
    });
  }

  // Header Sign In button
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', () => {
      if (!authSection) return;
      authSection.style.display = authSection.style.display === 'none' ? 'block' : 'none';
      if (authSection.style.display === 'block') {
        authSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Bypass directly to Password Security Lab
  if (btnBypassToLab) {
    btnBypassToLab.addEventListener('click', () => {
      if (authSection) authSection.style.display = 'none';
      if (portalScreen) portalScreen.style.display = 'block';
      switchTab('securityTab');
    });
  }

  function setLoggedInState(user, algo) {
    currentAuthUser = user;
    if (authSection) authSection.style.display = 'none';
    if (portalScreen) portalScreen.style.display = 'block';
    if (headerLoginBtn) headerLoginBtn.style.display = 'none';
    if (userHeaderProfile) {
      userHeaderProfile.style.display = 'flex';
      const initials = (user.full_name || user.username || 'U')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      if (userHeaderAvatar) userHeaderAvatar.textContent = initials;
      if (userHeaderName) userHeaderName.textContent = user.full_name || user.username;
      if (userHeaderRole) {
        userHeaderRole.textContent = `${(user.role || 'user').toUpperCase()} • ${user.algorithm || algo || 'AEGIS256'}`;
      }
    }
  }

  function setLoggedOutState() {
    currentAuthUser = null;
    if (authSection) authSection.style.display = 'block';
    if (portalScreen) portalScreen.style.display = 'block';
    if (headerLoginBtn) headerLoginBtn.style.display = 'inline-flex';
    if (userHeaderProfile) userHeaderProfile.style.display = 'none';
  }

  async function checkInitialAuth() {
    const token = localStorage.getItem('mca_auth_token');
    const cachedUser = localStorage.getItem('mca_auth_user');

    if (!token) {
      setLoggedOutState();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setLoggedInState(data.user, data.user.algorithm);
      } else {
        localStorage.removeItem('mca_auth_token');
        localStorage.removeItem('mca_auth_user');
        setLoggedOutState();
      }
    } catch (_) {
      if (cachedUser) {
        try {
          setLoggedInState(JSON.parse(cachedUser));
        } catch (e) {
          setLoggedOutState();
        }
      } else {
        setLoggedOutState();
      }
    }
  }

  // =========================================================================
  // PASSWORD SECURITY LAB & NOVEL ALGORITHM BENCHMARK CONTROLLER
  // =========================================================================

  const labPasswordInput = document.getElementById('labPasswordInput');
  const labAlgoSelect = document.getElementById('labAlgoSelect');
  const labRoundsSelect = document.getElementById('labRoundsSelect');
  const btnCalculateHash = document.getElementById('btnCalculateHash');
  const btnHashSpinner = document.getElementById('btnHashSpinner');
  const toggleLabPassVisibility = document.getElementById('toggleLabPassVisibility');

  const outputAlgoPill = document.getElementById('outputAlgoPill');
  const metricLatency = document.getElementById('metricLatency');
  const metricBitLength = document.getElementById('metricBitLength');
  const metricSaltSize = document.getElementById('metricSaltSize');
  const outputSalt = document.getElementById('outputSalt');
  const outputFormattedHash = document.getElementById('outputFormattedHash');
  const verificationText = document.getElementById('verificationText');
  const copySaltBtn = document.getElementById('copySaltBtn');
  const copyHashBtn = document.getElementById('copyHashBtn');
  const traceStepsContainer = document.getElementById('traceStepsContainer');

  const btnRunBenchmark = document.getElementById('btnRunBenchmark');
  const benchmarkTableBody = document.getElementById('benchmarkTableBody');

  const btnRunAvalanche = document.getElementById('btnRunAvalanche');
  const avalancheOrigPass = document.getElementById('avalancheOrigPass');
  const avalancheOrigHash = document.getElementById('avalancheOrigHash');
  const avalancheModPass = document.getElementById('avalancheModPass');
  const avalancheModHash = document.getElementById('avalancheModHash');
  const sacBitsFlippedText = document.getElementById('sacBitsFlippedText');
  const sacPercentageBadge = document.getElementById('sacPercentageBadge');
  const sacProgressBar = document.getElementById('sacProgressBar');
  const sacVerdictText = document.getElementById('sacVerdictText');

  const btnRefreshDbUsers = document.getElementById('btnRefreshDbUsers');
  const dbUsersTableBody = document.getElementById('dbUsersTableBody');
  const btnPrintAssignmentReport = document.getElementById('btnPrintAssignmentReport');

  const presetBtns = document.querySelectorAll('.preset-btn');

  setupPassToggle(toggleLabPassVisibility, labPasswordInput);

  // Preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (labPasswordInput) {
        labPasswordInput.value = btn.dataset.pass;
        computePasswordHash();
      }
    });
  });

  // Copy Salt & Copy Hash
  if (copySaltBtn && outputSalt) {
    copySaltBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(outputSalt.textContent);
      showToast('Salt copied to clipboard!', 'success');
    });
  }
  if (copyHashBtn && outputFormattedHash) {
    copyHashBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(outputFormattedHash.textContent);
      showToast('Formatted hash token copied to clipboard!', 'success');
    });
  }

  // Compute Password Hash
  async function computePasswordHash() {
    if (!labPasswordInput) return;
    const password = labPasswordInput.value || 'MCA2024!Secure';
    const algorithm = labAlgoSelect ? labAlgoSelect.value : 'aegis256';
    const rounds = labRoundsSelect ? parseInt(labRoundsSelect.value, 10) : 12000;

    if (btnHashSpinner) btnHashSpinner.style.display = 'inline-block';
    if (btnCalculateHash) btnCalculateHash.disabled = true;

    try {
      const res = await fetch('/api/security/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, algorithm, rounds, withTrace: true })
      });
      const data = await res.json();

      if (btnHashSpinner) btnHashSpinner.style.display = 'none';
      if (btnCalculateHash) btnCalculateHash.disabled = false;

      if (res.ok && data.success && data.result) {
        renderHashResult(data.result);
      } else {
        showToast(data.message || 'Hashing failed.', 'error');
      }
    } catch (err) {
      if (btnHashSpinner) btnHashSpinner.style.display = 'none';
      if (btnCalculateHash) btnCalculateHash.disabled = false;
      showToast('Error connecting to cryptographic service.', 'error');
    }
  }

  function renderHashResult(res) {
    if (outputAlgoPill) {
      outputAlgoPill.textContent = res.algorithm.toUpperCase();
      outputAlgoPill.className = res.algorithm === 'aegis256' ? 'badge-success highlight' : 'badge-primary';
    }
    if (metricLatency) metricLatency.textContent = `${res.executionTimeMs} ms`;
    if (metricBitLength) metricBitLength.textContent = `${res.bitLength || 256} bits`;
    if (metricSaltSize) metricSaltSize.textContent = res.salt ? `${(res.salt.length / 2) * 8} bits (${res.salt.length / 2} B)` : 'None (Unsalted)';
    if (outputSalt) outputSalt.textContent = res.salt || 'None (Legacy unsalted)';
    if (outputFormattedHash) outputFormattedHash.textContent = res.formattedHash;

    if (verificationText) {
      verificationText.textContent = res.algorithm === 'aegis256'
        ? 'Stored in SQLite • Timing-Safe Constant-Time Verification'
        : `Verified via ${res.algorithm.toUpperCase()}`;
    }

    // Render step-by-step trace
    if (traceStepsContainer && res.trace && res.trace.length > 0) {
      traceStepsContainer.innerHTML = res.trace.map(t => `
        <div class="trace-step-card">
          <div class="trace-num">${t.step}</div>
          <div class="trace-info">
            <strong>${escapeHtml(t.title)}</strong>
            <p>${escapeHtml(t.detail)}</p>
            <code>${escapeHtml(t.value)}</code>
          </div>
        </div>
      `).join('');
    } else if (traceStepsContainer) {
      traceStepsContainer.innerHTML = `
        <div class="trace-step-card">
          <div class="trace-num">✓</div>
          <div class="trace-info">
            <strong>${escapeHtml(res.algorithm.toUpperCase())} Execution</strong>
            <p>${escapeHtml(res.notes || 'Executed standard hash transformation.')}</p>
            <code>${escapeHtml(res.rawHash)}</code>
          </div>
        </div>
      `;
    }
  }

  if (btnCalculateHash) {
    btnCalculateHash.addEventListener('click', computePasswordHash);
  }

  // Multi-Algorithm Benchmark
  async function runAlgorithmBenchmark() {
    if (!labPasswordInput) return;
    const password = labPasswordInput.value || 'MCA2024!Secure';

    if (benchmarkTableBody) {
      benchmarkTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">⚡ Computing benchmarks across all 5 algorithms...</td></tr>`;
    }

    try {
      const res = await fetch('/api/security/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (res.ok && data.success && data.comparison) {
        benchmarkTableBody.innerHTML = data.comparison.map(c => `
          <tr style="${c.algorithm === 'aegis256' ? 'background: #f0fdf4; font-weight: 600;' : ''}">
            <td>
              <strong>${c.algorithm === 'aegis256' ? '⭐ ' : ''}${c.algorithm.toUpperCase()}</strong>
            </td>
            <td>${c.algorithm === 'aegis256' ? 'Dynamic Salt-Matrix Diffusion' : c.algorithm === 'pbkdf2' ? 'PBKDF2 Key Stretching' : c.algorithm === 'sha256_salt' ? 'Salted Hash' : c.algorithm === 'hmac_sha512' ? 'Keyed HMAC' : 'Legacy Unsalted'}</td>
            <td>${c.hasSalt ? `✅ ${c.saltLengthBytes * 8}-bit CSPRNG` : '❌ None'}</td>
            <td>${c.rounds.toLocaleString()}</td>
            <td><code>${c.executionTimeMs} ms</code></td>
            <td>${c.rainbowTableImmune ? '<span style="color:var(--success); font-weight:700;">✅ Immune</span>' : '<span style="color:var(--danger); font-weight:700;">❌ Vulnerable</span>'}</td>
            <td>${c.gpuResistance}</td>
            <td>${c.securityRating}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      if (benchmarkTableBody) {
        benchmarkTableBody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);">Error running benchmark.</td></tr>`;
      }
    }
  }

  if (btnRunBenchmark) {
    btnRunBenchmark.addEventListener('click', runAlgorithmBenchmark);
  }

  // Avalanche Effect Test
  async function runAvalancheTest() {
    if (!labPasswordInput) return;
    const password = labPasswordInput.value || 'MCA2024!Secure';

    try {
      const res = await fetch('/api/security/avalanche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (res.ok && data.success && data.avalanche) {
        const a = data.avalanche;
        if (avalancheOrigPass) avalancheOrigPass.textContent = a.originalPassword;
        if (avalancheOrigHash) avalancheOrigHash.textContent = a.originalHash;
        if (avalancheModPass) avalancheModPass.textContent = a.modifiedPassword;
        if (avalancheModHash) avalancheModHash.textContent = a.modifiedHash;
        if (sacBitsFlippedText) sacBitsFlippedText.textContent = `${a.flippedBits} out of ${a.totalBits} bits flipped`;
        if (sacPercentageBadge) {
          sacPercentageBadge.textContent = `${a.flippedPercentage}% SAC Diffusion`;
          sacPercentageBadge.className = a.passedSacCriteria ? 'badge-success highlight' : 'badge-warning';
        }
        if (sacProgressBar) sacProgressBar.style.width = `${a.flippedPercentage}%`;
        if (sacVerdictText) {
          sacVerdictText.textContent = `✅ Result: ${a.verdict}`;
        }
      }
    } catch (err) {
      showToast('Error testing avalanche effect.', 'error');
    }
  }

  if (btnRunAvalanche) {
    btnRunAvalanche.addEventListener('click', runAvalancheTest);
  }

  // SQLite Database Users Inspector
  async function loadDatabaseUsers() {
    if (!dbUsersTableBody) return;

    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();

      if (res.ok && data.success && data.users) {
        dbUsersTableBody.innerHTML = data.users.map(u => `
          <tr>
            <td><code>#${u.id}</code></td>
            <td><strong>${escapeHtml(u.username)}</strong></td>
            <td>${escapeHtml(u.full_name)}</td>
            <td><span class="user-role-badge">${escapeHtml(u.role)}</span></td>
            <td><span class="badge-success" style="font-size:0.75rem;">${escapeHtml(u.algorithm.toUpperCase())}</span></td>
            <td><code>${escapeHtml(u.salt)}</code></td>
            <td><code title="${escapeHtml(u.fullFormattedHash || '')}">${escapeHtml(u.maskedHash)}</code></td>
            <td><small>${u.created_at ? u.created_at.split('T')[0] : 'Seeded'}</small></td>
          </tr>
        `).join('');
      }
    } catch (err) {
      if (dbUsersTableBody) {
        dbUsersTableBody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);">Error loading users from database.</td></tr>`;
      }
    }
  }

  if (btnRefreshDbUsers) {
    btnRefreshDbUsers.addEventListener('click', loadDatabaseUsers);
  }

  // Print Assignment Report
  if (btnPrintAssignmentReport) {
    btnPrintAssignmentReport.addEventListener('click', () => {
      document.body.classList.add('printing-assignment');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-assignment');
      }, 1000);
    });
  }

  function loadSecurityLab() {
    computePasswordHash();
    runAlgorithmBenchmark();
    runAvalancheTest();
    loadDatabaseUsers();
  }

  // Initialize Auth state
  checkInitialAuth();

  // Initial Data Fetch
  fetchStats();

  // Focus search input by default
  dnumberInput.focus();
});
