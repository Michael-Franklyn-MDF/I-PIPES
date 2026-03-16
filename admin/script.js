(() => {

  // ─── Utility ────────────────────────────────────────────────────────────────
  const escapeHtml = (v) =>
    String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  // ─── localStorage ────────────────────────────────────────────────────────────
  const KEYS = {
    policies: 'ipipes_policies',
    users:    'ipipes_users',
    evals:    'ipipes_evals',
  };

  const defaultPolicies = [
    { name: 'National ICT Policy 2012',    category: 'National',        year: '2012', agency: 'ICT Ministry',        indicators: '6', statusLabel: 'Active',       statusClass: 'badge-active' },
    { name: 'Broadband Expansion Strategy', category: 'Infrastructure', year: '2018', agency: 'ICT Ministry',        indicators: '5', statusLabel: 'Active',       statusClass: 'badge-active' },
    { name: 'Digital Inclusion Roadmap',   category: 'Inclusion',       year: '2020', agency: 'Social Dev. Ministry', indicators: '4', statusLabel: 'Under review', statusClass: 'badge-review' },
    { name: 'Cybersecurity Framework',     category: 'Security',        year: '2019', agency: 'ICT Ministry',        indicators: '5', statusLabel: 'Active',       statusClass: 'badge-active' },
  ];

  const defaultUsers = [
    { name: 'Michael Franklyn',   email: 'michael@example.org',     roleLabel: 'Admin',      roleCls: 'badge-admin',      status: 'Active',   statusCls: 'badge-active',   lastLogin: 'Today, 09:21' },
    { name: 'Policy Analyst One', email: 'analyst1@example.org',    roleLabel: 'Analyst',    roleCls: 'badge-analyst',    status: 'Active',   statusCls: 'badge-active',   lastLogin: 'Yesterday, 16:04' },
    { name: 'Researcher One',     email: 'researcher1@example.org', roleLabel: 'Researcher', roleCls: 'badge-researcher', status: 'Active',   statusCls: 'badge-active',   lastLogin: '12 Feb 2026, 11:37' },
    { name: 'Inactive Analyst',   email: 'analyst2@example.org',    roleLabel: 'Analyst',    roleCls: 'badge-analyst',    status: 'Disabled', statusCls: 'badge-inactive', lastLogin: '03 Jan 2026, 08:15' },
  ];

  const defaultEvals = [
    { runId: 'EV-2026-012', policy: 'National ICT Policy 2012',     period: '2024 (Annual)', runType: 'Full evaluation',      dataset: 'ITU ICT Indicators',           score: '71.4', date: '12 Feb 2026', notes: '' },
    { runId: 'EV-2026-011', policy: 'Broadband Expansion Strategy', period: 'Q4 2024',       runType: 'Quick check',          dataset: 'World Bank Open Data',         score: '67.9', date: '05 Feb 2026', notes: '' },
    { runId: 'EV-2026-010', policy: 'Digital Inclusion Roadmap',    period: '2023 (Annual)', runType: 'Full evaluation',      dataset: 'National Bureau of Statistics', score: '74.2', date: '28 Jan 2026', notes: '' },
    { runId: 'EV-2026-009', policy: 'Cybersecurity Framework',      period: 'Q3 2024',       runType: 'Sensitivity analysis', dataset: 'ITU ICT Indicators',           score: '62.1', date: '16 Jan 2026', notes: '' },
  ];

  function load(key, defaults) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    save(key, defaults);
    return [...defaults];
  }

  function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  }

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

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal(e.target.id);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape')
      document.querySelectorAll('.modal-backdrop.modal-visible').forEach((m) => closeModal(m.id));
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function generateRunId(evals) {
    const year = new Date().getFullYear();
    const nums = evals
      .map(e => parseInt((e.runId || '').split('-')[2] || '0', 10))
      .filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `EV-${year}-${String(next).padStart(3, '0')}`;
  }

  function mockScore(policy, period, dataset) {
    const str = `${policy}${period}${dataset}`;
    let hash = 0;
    for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    const base = 45 + (Math.abs(hash) % 45);
    return (base + (Math.abs(hash >> 8) % 10) / 10).toFixed(1);
  }

  function bandFor(score) {
    const s = parseFloat(score);
    if (s >= 70) return { label: 'High',     cls: 'badge-high'     };
    if (s >= 50) return { label: 'Moderate', cls: 'badge-moderate' };
    return               { label: 'Low',      cls: 'badge-low'      };
  }

  // ─── Policies page ───────────────────────────────────────────────────────────
  const policiesTbody = document.getElementById('policies-tbody');
  if (policiesTbody) {
    const policies = load(KEYS.policies, defaultPolicies);

    function renderPolicies() {
      policiesTbody.innerHTML = policies.map((p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${escapeHtml(p.year)}</td>
          <td>${escapeHtml(p.agency)}</td>
          <td>${escapeHtml(p.indicators)}</td>
          <td><span class="badge ${escapeHtml(p.statusClass)}">${escapeHtml(p.statusLabel)}</span></td>
          <td>
            <a href="policy-details.html?name=${encodeURIComponent(p.name)}" class="btn btn-secondary btn-sm">View</a>
          </td>
        </tr>`).join('');
    }

    renderPolicies();

    document.getElementById('btn-add-policy')?.addEventListener('click', () => openModal('modal-add-policy'));
    document.getElementById('cancel-policy')?.addEventListener('click', () => closeModal('modal-add-policy'));

    document.getElementById('form-add-policy')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      const statusMap = {
        active:   { label: 'Active',       cls: 'badge-active'   },
        review:   { label: 'Under review', cls: 'badge-review'   },
        inactive: { label: 'Inactive',     cls: 'badge-inactive' },
      };
      const st = statusMap[data.status] || statusMap.active;
      policies.push({
        name:        data.policy_name || '',
        category:    data.category    || '',
        year:        data.year        || '',
        agency:      data.agency      || '',
        indicators:  data.indicators  || '0',
        statusLabel: st.label,
        statusClass: st.cls,
      });
      save(KEYS.policies, policies);
      renderPolicies();
      e.target.reset();
      closeModal('modal-add-policy');
    });
  }

  // ─── Users page ──────────────────────────────────────────────────────────────
  const usersTbody = document.getElementById('users-tbody');
  if (usersTbody) {
    const users = load(KEYS.users, defaultUsers);

    function renderUsers() {
      usersTbody.innerHTML = users.map((u, i) => {
        const isDisabled = u.status === 'Disabled';
        return `
        <tr>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge ${escapeHtml(u.roleCls)}">${escapeHtml(u.roleLabel)}</span></td>
          <td><span class="badge ${escapeHtml(u.statusCls)}">${escapeHtml(u.status)}</span></td>
          <td>${escapeHtml(u.lastLogin)}</td>
          <td style="display:flex; gap:6px; flex-wrap:wrap;">
            <a href="user-details.html?index=${i}" class="btn btn-secondary btn-sm">View</a>
            <button class="btn btn-sm ${isDisabled ? 'btn-secondary' : 'btn-danger'}"
                    data-action="toggle-status" data-index="${i}">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button class="btn btn-secondary btn-sm"
                    data-action="reset-password" data-index="${i}" data-name="${escapeHtml(u.name)}">
              Reset password
            </button>
          </td>
        </tr>`;
      }).join('');
    }

    renderUsers();

    usersTbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.index, 10);

      if (btn.dataset.action === 'toggle-status') {
        const u = users[idx];
        if (u.status === 'Active') {
          u.status    = 'Disabled';
          u.statusCls = 'badge-inactive';
        } else {
          u.status    = 'Active';
          u.statusCls = 'badge-active';
        }
        save(KEYS.users, users);
        renderUsers();
      }

      if (btn.dataset.action === 'reset-password') {
        document.getElementById('reset-pw-name').textContent = btn.dataset.name;
        document.getElementById('reset-pw-index').value      = idx;
        document.getElementById('form-reset-password').reset();
        document.getElementById('reset-pw-msg').textContent  = '';
        openModal('modal-reset-password');
      }
    });

    document.getElementById('btn-add-user')?.addEventListener('click', () => openModal('modal-add-user'));
    document.getElementById('cancel-user')?.addEventListener('click', () => closeModal('modal-add-user'));

    document.getElementById('form-add-user')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      const roleMap = {
        admin:      { label: 'Admin',      cls: 'badge-admin'      },
        analyst:    { label: 'Analyst',    cls: 'badge-analyst'    },
        researcher: { label: 'Researcher', cls: 'badge-researcher' },
      };
      const r = roleMap[data.role] || roleMap.researcher;
      users.push({
        name:      data.full_name || '',
        email:     data.email     || '',
        roleLabel: r.label,
        roleCls:   r.cls,
        status:    'Active',
        statusCls: 'badge-active',
        lastLogin: '—',
      });
      save(KEYS.users, users);
      renderUsers();
      e.target.reset();
      closeModal('modal-add-user');
    });

    document.getElementById('cancel-reset-pw')?.addEventListener('click', () => closeModal('modal-reset-password'));

    document.getElementById('form-reset-password')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data  = Object.fromEntries(new FormData(e.target));
      const msgEl = document.getElementById('reset-pw-msg');

      if (!data.new_password || data.new_password.length < 8) {
        msgEl.style.color = 'var(--danger)';
        msgEl.textContent = 'Password must be at least 8 characters.';
        return;
      }
      if (data.new_password !== data.confirm_password) {
        msgEl.style.color = 'var(--danger)';
        msgEl.textContent = 'Passwords do not match.';
        return;
      }
      msgEl.style.color = 'var(--success)';
      msgEl.textContent = 'Password updated successfully.';
      setTimeout(() => closeModal('modal-reset-password'), 1200);
    });
  }

  // ─── Evaluation page ─────────────────────────────────────────────────────────
  const evalForm = document.getElementById('form-run-evaluation');
  if (evalForm) {
    const evals = load(KEYS.evals, defaultEvals);

    // Pre-fill policy from URL param (coming from policy-details.html)
    const params    = new URLSearchParams(window.location.search);
    const prePolicy = params.get('policy');
    if (prePolicy) {
      const sel = document.getElementById('policy');
      if (sel) {
        const opt = Array.from(sel.options).find(o => o.value === prePolicy || o.text === prePolicy);
        if (opt) { opt.selected = true; }
        else { sel.appendChild(new Option(prePolicy, prePolicy, true, true)); }
      }
    }

    evalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data  = Object.fromEntries(new FormData(evalForm));
      const errEl = document.getElementById('eval-error');

      if (!data.policy || !data.period || !data.dataset || !data.run_type) {
        if (errEl) { errEl.textContent = 'Please fill in all required fields before running.'; }
        return;
      }
      if (errEl) errEl.textContent = '';

      const score = mockScore(data.policy, data.period, data.dataset);
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const runId = generateRunId(evals);

      evals.unshift({ runId, policy: data.policy, period: data.period, runType: data.run_type, dataset: data.dataset, score, date: today, notes: data.notes || '' });
      save(KEYS.evals, evals);

      window.location.href = 'results.html?highlight=' + encodeURIComponent(runId);
    });
  }

  // ─── Results page ────────────────────────────────────────────────────────────
  const resultsTbody = document.getElementById('results-tbody');
  if (resultsTbody) {
    const evals     = load(KEYS.evals, defaultEvals);
    const params    = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');

    resultsTbody.innerHTML = evals.map((ev) => {
      const b  = bandFor(ev.score);
      const hl = highlight && ev.runId === highlight ? ' style="background:#f0f7ff;"' : '';
      return `<tr${hl}>
        <td>${escapeHtml(ev.runId)}</td>
        <td>${escapeHtml(ev.policy)}</td>
        <td>${escapeHtml(ev.period)}</td>
        <td>${escapeHtml(ev.runType)}</td>
        <td>${escapeHtml(ev.score)}</td>
        <td><span class="badge ${b.cls}">${b.label}</span></td>
        <td>${escapeHtml(ev.date)}</td>
      </tr>`;
    }).join('');

    // Update summary card
    if (evals.length) {
      const latest = evals[0];
      const el = (id) => document.getElementById(id);
      if (el('latest-policy-name'))  el('latest-policy-name').textContent  = latest.policy;
      if (el('latest-policy-meta'))  el('latest-policy-meta').textContent  = `Run on ${latest.date} · Using ${latest.dataset}`;
      if (el('latest-score'))        el('latest-score').textContent        = latest.score;
      if (el('latest-run-type'))     el('latest-run-type').textContent     = latest.runType;
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-csv') ||
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Export CSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const header = ['Run ID','Policy','Period','Run Type','Score','Band','Date'];
        const rows   = evals.map(ev => {
          const b = bandFor(ev.score);
          return [ev.runId, ev.policy, ev.period, ev.runType, ev.score, b.label, ev.date];
        });
        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replaceAll('"','""')}"`).join(',')).join('\n');
        const a   = Object.assign(document.createElement('a'), {
          href:     URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
          download: 'ipipes_results.csv',
        });
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }
  }

  // ─── Suppress other form submits ─────────────────────────────────────────────
  document.querySelectorAll('form:not(#form-add-policy):not(#form-add-user):not(#form-run-evaluation):not(#form-reset-password)').forEach(f => {
    f.addEventListener('submit', e => e.preventDefault());
  });

})();