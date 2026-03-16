(() => {
  // ─── Utility ────────────────────────────────────────────────────────────────
  const escapeHtml = (v) =>
    String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  // ─── Modal helpers ───────────────────────────────────────────────────────────
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.style.display = 'flex';
    requestAnimationFrame(() => m.classList.add('modal-visible'));
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('modal-visible');
    m.addEventListener('transitionend', () => { m.style.display = 'none'; }, { once: true });
  }

  // Close on backdrop click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      const m = e.target.closest('.modal-backdrop');
      if (m) closeModal(m.id);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.modal-visible').forEach((m) => closeModal(m.id));
    }
  });

  // ─── Policies page ───────────────────────────────────────────────────────────
  const policiesTbody = document.getElementById('policies-tbody');
  if (policiesTbody) {
    // Seed data
    const policies = [
      { name: 'National ICT Policy 2012',   category: 'National',        year: '2012', agency: 'ICT Ministry',        indicators: '6', statusLabel: 'Active',       statusClass: 'badge-active'  },
      { name: 'Broadband Expansion Strategy', category: 'Infrastructure', year: '2018', agency: 'ICT Ministry',        indicators: '5', statusLabel: 'Active',       statusClass: 'badge-active'  },
      { name: 'Digital Inclusion Roadmap',  category: 'Inclusion',        year: '2020', agency: 'Social Dev. Ministry', indicators: '4', statusLabel: 'Under review', statusClass: 'badge-review'  },
      { name: 'Cybersecurity Framework',    category: 'Security',         year: '2019', agency: 'ICT Ministry',        indicators: '5', statusLabel: 'Active',       statusClass: 'badge-active'  },
    ];

    function renderPolicies() {
      policiesTbody.innerHTML = policies.map((p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${escapeHtml(p.year)}</td>
          <td>${escapeHtml(p.agency)}</td>
          <td>${escapeHtml(p.indicators)}</td>
          <td><span class="badge ${escapeHtml(p.statusClass)}">${escapeHtml(p.statusLabel)}</span></td>
          <td><button class="btn btn-secondary btn-sm">View</button></td>
        </tr>`).join('');
    }

    renderPolicies();

    // Open modal
    const addPolicyBtn = document.getElementById('btn-add-policy');
    if (addPolicyBtn) addPolicyBtn.addEventListener('click', () => openModal('modal-add-policy'));

    // Cancel
    const cancelPolicy = document.getElementById('cancel-policy');
    if (cancelPolicy) cancelPolicy.addEventListener('click', () => closeModal('modal-add-policy'));

    // Submit
    const policyForm = document.getElementById('form-add-policy');
    if (policyForm) {
      policyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(policyForm));
        const statusMap = {
          active:  { label: 'Active',       cls: 'badge-active'  },
          review:  { label: 'Under review', cls: 'badge-review'  },
          inactive:{ label: 'Inactive',      cls: 'badge-inactive'},
        };
        const st = statusMap[data.status] || statusMap.active;
        policies.push({
          name:        data.policy_name  || '',
          category:    data.category     || '',
          year:        data.year         || '',
          agency:      data.agency       || '',
          indicators:  data.indicators   || '0',
          statusLabel: st.label,
          statusClass: st.cls,
        });
        renderPolicies();
        policyForm.reset();
        closeModal('modal-add-policy');
      });
    }
  }

  // ─── Users page ──────────────────────────────────────────────────────────────
  const usersTbody = document.getElementById('users-tbody');
  if (usersTbody) {
    const users = [
      { name: 'Michael Franklyn',   email: 'michael@example.org',    role: 'admin',      roleLabel: 'Admin',    roleCls: 'badge-admin',      status: 'Active',   statusCls: 'badge-active',   lastLogin: 'Today, 09:21' },
      { name: 'Policy Analyst One', email: 'analyst1@example.org',   role: 'analyst',    roleLabel: 'Analyst',  roleCls: 'badge-analyst',    status: 'Active',   statusCls: 'badge-active',   lastLogin: 'Yesterday, 16:04' },
      { name: 'Researcher One',     email: 'researcher1@example.org', role: 'researcher', roleLabel: 'Researcher',roleCls:'badge-researcher', status: 'Active',   statusCls: 'badge-active',   lastLogin: '12 Feb 2026, 11:37' },
      { name: 'Inactive Analyst',   email: 'analyst2@example.org',   role: 'analyst',    roleLabel: 'Analyst',  roleCls: 'badge-analyst',    status: 'Disabled', statusCls: 'badge-inactive', lastLogin: '03 Jan 2026, 08:15' },
    ];

    function renderUsers() {
      usersTbody.innerHTML = users.map((u) => `
        <tr>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge ${escapeHtml(u.roleCls)}">${escapeHtml(u.roleLabel)}</span></td>
          <td><span class="badge ${escapeHtml(u.statusCls)}">${escapeHtml(u.status)}</span></td>
          <td>${escapeHtml(u.lastLogin)}</td>
          <td><a href="user-details.html" class="btn btn-secondary btn-sm">View</a></td>
        </tr>`).join('');
    }

    renderUsers();

    // Open modal
    const addUserBtn = document.getElementById('btn-add-user');
    if (addUserBtn) addUserBtn.addEventListener('click', () => openModal('modal-add-user'));

    // Cancel
    const cancelUser = document.getElementById('cancel-user');
    if (cancelUser) cancelUser.addEventListener('click', () => closeModal('modal-add-user'));

    // Submit
    const userForm = document.getElementById('form-add-user');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(userForm));
        const roleMap = {
          admin:      { label: 'Admin',      cls: 'badge-admin'      },
          analyst:    { label: 'Analyst',    cls: 'badge-analyst'    },
          researcher: { label: 'Researcher', cls: 'badge-researcher' },
        };
        const r = roleMap[data.role] || roleMap.researcher;
        users.push({
          name:       data.full_name || '',
          email:      data.email     || '',
          role:       data.role      || '',
          roleLabel:  r.label,
          roleCls:    r.cls,
          status:     'Active',
          statusCls:  'badge-active',
          lastLogin:  '—',
        });
        renderUsers();
        userForm.reset();
        closeModal('modal-add-user');
      });
    }
  }

  // ─── Export CSV (results page) ───────────────────────────────────────────────
  const exportBtn = document.getElementById('btn-export-csv') ||
    Array.from(document.querySelectorAll('button.btn.btn-secondary')).find(
      (b) => b.textContent.trim() === 'Export CSV'
    );
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const table = Array.from(document.querySelectorAll('table')).find((t) =>
        t.querySelector('thead')?.textContent?.includes('Run ID')
      );
      if (!table) return;
      const rows = Array.from(table.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.children).map((c) => `"${(c.textContent || '').trim().replaceAll('"', '""')}"`)
      );
      const csv = rows.map((r) => r.join(',')).join('\n');
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
        download: 'ipipes_results.csv',
      });
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // ─── Suppress all other form submits ────────────────────────────────────────
  document.querySelectorAll('form:not(#form-add-policy):not(#form-add-user)').forEach((f) => {
    f.addEventListener('submit', (e) => e.preventDefault());
  });

})();
