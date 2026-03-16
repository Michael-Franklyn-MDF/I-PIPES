(() => {
  const escapeHtml = (v) =>
    String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  let policies = [];
  let users = [];
  let evals = [];

  // ─── Modal helpers ────────────────────────────────────────────────────────────
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

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function bandFor(score) {
    const s = parseFloat(score);
    if (s >= 70) return { label: 'High', cls: 'badge-high' };
    if (s >= 50) return { label: 'Moderate', cls: 'badge-moderate' };
    return { label: 'Low', cls: 'badge-low' };
  }

  // ─── Page detection ───────────────────────────────────────────────────────────
  const path = window.location.pathname;
  const onPage = (name) => path.includes(name);

  // ─── Policies page ────────────────────────────────────────────────────────────
  const policiesTbody = document.getElementById('policies-tbody');

  async function fetchPolicies() {
    try {
      const res = await fetch('../api/get_policies.php');
      const json = await res.json();
      if (json.success) policies = json.data;
    } catch (e) { console.error('fetchPolicies:', e); }
  }

  function renderPolicies() {
    if (!policiesTbody) return;
    if (!policies.length) {
      policiesTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">No policies found.</td></tr>`;
      return;
    }
    const statusMap = {
      'Active': 'badge-active',
      'Under review': 'badge-review',
      'Inactive': 'badge-inactive',
    };
    policiesTbody.innerHTML = policies.map((p) => {
      const sCls = statusMap[p.status] || 'badge-active';
      return `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${escapeHtml(p.year)}</td>
          <td>${escapeHtml(p.agency)}</td>
          <td>${escapeHtml(p.indicators || '0')}</td>
          <td><span class="badge ${sCls}">${escapeHtml(p.status || 'Active')}</span></td>
          <td>
            <a href="policy-details.php?id=${encodeURIComponent(p.policyID)}&name=${encodeURIComponent(p.name)}"
               class="btn btn-secondary btn-sm">View</a>
          </td>
        </tr>`;
    }).join('');
  }

  if (policiesTbody) {
    fetchPolicies().then(() => renderPolicies());
  }

  document.getElementById('btn-add-policy')?.addEventListener('click', () => openModal('modal-add-policy'));

  // Two cancel buttons share the same id in the template – handle both
  document.querySelectorAll('#cancel-policy').forEach((btn) =>
    btn.addEventListener('click', () => closeModal('modal-add-policy'))
  );

  document.getElementById('form-add-policy')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch('../api/add_policy.php', { method: 'POST', body: new FormData(e.target) });
      const data = await res.json();
      if (data.success) {
        await fetchPolicies();
        renderPolicies();
        e.target.reset();
        closeModal('modal-add-policy');
      } else {
        alert(data.error || 'Failed to add policy');
      }
    } catch (err) { alert('Network error'); }
    finally { btn.disabled = false; }
  });

  // ─── Users page ───────────────────────────────────────────────────────────────
  const usersTbody = document.getElementById('users-tbody');

  async function fetchUsers() {
    try {
      const res = await fetch('../api/get_users.php');
      const json = await res.json();
      if (json.success) users = json.data;
    } catch (e) { console.error('fetchUsers:', e); }
  }

  function renderUsers() {
    if (!usersTbody) return;
    if (!users.length) {
      usersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px;">No users found.</td></tr>`;
      return;
    }
    usersTbody.innerHTML = users.map((u) => {
      const isDisabled = u.status !== 'active';
      return `
      <tr>
        <td>${escapeHtml(u.full_name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge ${escapeHtml(u.roleCls || 'badge-researcher')}">${escapeHtml(u.roleLabel || u.role)}</span></td>
        <td><span class="badge ${escapeHtml(u.statusCls || (isDisabled ? 'badge-inactive' : 'badge-active'))}">${escapeHtml(u.statusLabel || u.status)}</span></td>
        <td>${escapeHtml(u.lastLogin || '—')}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm ${isDisabled ? 'btn-secondary' : 'btn-danger'}"
                  data-action="toggle-status"
                  data-id="${escapeHtml(String(u.userID))}"
                  data-status="${isDisabled ? 'active' : 'inactive'}">
            ${isDisabled ? 'Enable' : 'Disable'}
          </button>
          <button class="btn btn-secondary btn-sm"
                  data-action="reset-password"
                  data-id="${escapeHtml(String(u.userID))}"
                  data-name="${escapeHtml(u.full_name)}">
            Reset password
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  if (usersTbody) {
    fetchUsers().then(() => renderUsers());
  }

  usersTbody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    if (btn.dataset.action === 'toggle-status') {
      btn.disabled = true;
      try {
        const f = new FormData();
        f.append('action', 'toggle_status');
        f.append('userID', btn.dataset.id);
        f.append('status', btn.dataset.status);
        const res = await fetch('../api/update_user.php', { method: 'POST', body: f });
        const json = await res.json();
        if (json.success) { await fetchUsers(); renderUsers(); }
        else alert(json.error || 'Update failed');
      } catch (err) { console.error(err); }
      finally { btn.disabled = false; }
    }

    if (btn.dataset.action === 'reset-password') {
      document.getElementById('reset-pw-name').textContent = btn.dataset.name;
      document.getElementById('reset-pw-index').value = btn.dataset.id;
      document.getElementById('form-reset-password').reset();
      document.getElementById('reset-pw-msg').textContent = '';
      openModal('modal-reset-password');
    }
  });

  document.getElementById('btn-add-user')?.addEventListener('click', () => openModal('modal-add-user'));

  document.querySelectorAll('#cancel-user').forEach((btn) =>
    btn.addEventListener('click', () => closeModal('modal-add-user'))
  );

  document.getElementById('form-add-user')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch('../api/add_user.php', { method: 'POST', body: new FormData(e.target) });
      const data = await res.json();
      if (data.success) {
        alert(`User added!\nUsername: ${data.username}\nTemporary password: ${data.temporary_password}`);
        await fetchUsers();
        renderUsers();
        e.target.reset();
        closeModal('modal-add-user');
      } else {
        alert(data.error || 'Failed to add user');
      }
    } catch (err) { alert('Network error'); }
    finally { btn.disabled = false; }
  });

  document.querySelectorAll('#cancel-reset-pw').forEach((btn) =>
    btn.addEventListener('click', () => closeModal('modal-reset-password'))
  );

  document.getElementById('form-reset-password')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msgEl = document.getElementById('reset-pw-msg');

    if (f.get('new_password').length < 8) {
      msgEl.style.color = 'var(--danger)';
      msgEl.textContent = 'Password must be at least 8 characters.';
      return;
    }
    if (f.get('new_password') !== f.get('confirm_password')) {
      msgEl.style.color = 'var(--danger)';
      msgEl.textContent = 'Passwords do not match.';
      return;
    }

    f.append('action', 'reset_password');
    f.append('userID', document.getElementById('reset-pw-index').value);

    try {
      const res = await fetch('../api/update_user.php', { method: 'POST', body: f });
      const data = await res.json();
      if (data.success) {
        msgEl.style.color = 'var(--success)';
        msgEl.textContent = 'Password updated successfully.';
        setTimeout(() => closeModal('modal-reset-password'), 1200);
      } else {
        msgEl.style.color = 'var(--danger)';
        msgEl.textContent = data.error || 'Failed to reset password.';
      }
    } catch (err) { console.error(err); }
  });

  // ─── Evaluation page ──────────────────────────────────────────────────────────
  const evalForm = document.getElementById('form-run-evaluation');
  if (evalForm) {
    fetchPolicies().then(() => {
      const sel = document.getElementById('policy');
      if (!sel) return;
      const urlParams = new URLSearchParams(window.location.search);
      const policyTarget = urlParams.get('id');

      sel.innerHTML = '<option value="" disabled selected>Select a policy</option>';
      policies.forEach((p) => {
        const opt = new Option(p.name, p.policyID);
        if (String(p.policyID) === String(policyTarget)) opt.selected = true;
        sel.appendChild(opt);
      });
    });

    evalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('eval-error');
      const formData = new FormData(evalForm);

      // Normalise the policy field name to policy_id
      const policyVal = formData.get('policy') || formData.get('policy_id') || '';
      formData.set('policy_id', policyVal);

      const missing = !policyVal || !formData.get('period') || !formData.get('dataset') || !formData.get('run_type');
      if (missing) {
        if (errEl) errEl.textContent = 'Please fill in all required fields before running.';
        return;
      }
      if (errEl) errEl.textContent = '';

      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      // Deterministic mock score derived from inputs
      const str = `${policyVal}${formData.get('period')}${formData.get('dataset')}`;
      let hash = 0;
      for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
      const base = 45 + (Math.abs(hash) % 45);
      const score = (base + (Math.abs(hash >> 8) % 10) / 10).toFixed(1);

      // Build next run ID from existing evals
      await fetchEvals();
      let next = 1;
      if (evals.length) {
        const nums = evals
          .map((ev) => parseInt((ev.runId || '').split('-')[2] || '0', 10))
          .filter((n) => !isNaN(n));
        if (nums.length) next = Math.max(...nums) + 1;
      }
      const year = new Date().getFullYear();
      const runId = `EV-${year}-${String(next).padStart(3, '0')}`;

      formData.append('score', score);
      formData.append('run_id', runId);

      try {
        const res = await fetch('../api/add_evaluation.php', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.success) {
          window.location.href = `results.php?highlight=${encodeURIComponent(runId)}`;
        } else {
          if (errEl) errEl.textContent = json.error || 'Submission failed.';
        }
      } catch (err) {
        if (errEl) errEl.textContent = 'Network error.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ─── Results page ─────────────────────────────────────────────────────────────
  // FIX: results.php has two tbodies – use distinct IDs:
  //   #results-tbody-dimensions  (dimension breakdown card)
  //   #results-tbody-runs        (all evaluation runs card)
  const allRunsTbody = document.getElementById('results-tbody-runs');

  async function fetchEvals() {
    try {
      const res = await fetch('../api/get_evaluations.php');
      const json = await res.json();
      if (json.success) evals = json.data;
    } catch (e) { console.error('fetchEvals:', e); }
  }

  function renderEvals() {
    if (!allRunsTbody) return;
    const highlight = new URLSearchParams(window.location.search).get('highlight');

    if (!evals.length) {
      allRunsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>`;
      return;
    }

    allRunsTbody.innerHTML = evals.map((ev) => {
      const b = bandFor(ev.score);
      const hl = (highlight && ev.runId === highlight) ? ' style="background:#f0f7ff;"' : '';
      return `<tr${hl}>
        <td>${escapeHtml(ev.runId)}</td>
        <td>${escapeHtml(ev.policyName)}</td>
        <td>${escapeHtml(ev.period)}</td>
        <td>${escapeHtml(ev.runType)}</td>
        <td>${escapeHtml(ev.score)}</td>
        <td><span class="badge ${b.cls}">${b.label}</span></td>
        <td>${escapeHtml(ev.evaluationDate)}</td>
      </tr>`;
    }).join('');

    // Populate "Latest evaluation summary" card
    const latest = evals[0];
    const el = (id) => document.getElementById(id);
    if (el('latest-policy-name')) el('latest-policy-name').textContent = latest.policyName || '—';
    if (el('latest-policy-meta')) el('latest-policy-meta').textContent = `Run on ${latest.evaluationDate} · Using ${latest.dataset}`;
    if (el('latest-score')) el('latest-score').textContent = latest.score || '—';
    if (el('latest-run-type')) el('latest-run-type').textContent = latest.runType || '—';
  }

  if (allRunsTbody) {
    fetchEvals().then(() => renderEvals());
  }

  // Export CSV
  const exportBtn =
    document.getElementById('btn-export-csv') ||
    Array.from(document.querySelectorAll('button')).find((b) => b?.textContent?.trim() === 'Export CSV');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      if (!evals.length) await fetchEvals();
      if (!evals.length) { alert('No data to export'); return; }

      const header = ['Run ID', 'Policy', 'Period', 'Run Type', 'Score', 'Band', 'Date'];
      const rows = evals.map((ev) => {
        const b = bandFor(ev.score);
        return [ev.runId, ev.policyName, ev.period, ev.runType, ev.score, b.label, ev.evaluationDate];
      });
      const csv = [header, ...rows]
        .map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(','))
        .join('\n');

      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
        download: 'ipipes_results.csv',
      });
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // ─── Dashboard stats ──────────────────────────────────────────────────────────
  // FIX: was checking for 'dashboard.html' — now checks for 'dashboard'
  if (onPage('dashboard')) {
    Promise.all([fetchPolicies(), fetchEvals(), fetchUsers()]).then(() => {
      const statCards = document.querySelectorAll('.stat-card');

      // Map by label text so order changes don't break anything
      statCards.forEach((card) => {
        const label = (card.querySelector('.stat-label')?.textContent || '').toLowerCase();
        const valEl = card.querySelector('.stat-value');
        if (!valEl) return;

        if (label.includes('policies')) {
          valEl.textContent = policies.filter((p) => p.status === 'Active').length;
        } else if (label.includes('evaluations')) {
          valEl.textContent = evals.length;
        } else if (label.includes('average') || label.includes('avg')) {
          if (evals.length) {
            const sum = evals.reduce((acc, ev) => acc + parseFloat(ev.score || 0), 0);
            valEl.textContent = (sum / evals.length).toFixed(1);
          } else {
            valEl.textContent = '0.0';
          }
        } else if (label.includes('users')) {
          valEl.textContent = users.length;
        }
      });

      // Recent evaluations table on dashboard
      const recentTbody = document.getElementById('recent-tbody');
      if (recentTbody && evals.length) {
        recentTbody.innerHTML = evals.slice(0, 3).map((ev) => `
          <tr>
            <td>${escapeHtml(ev.runId)}</td>
            <td>${escapeHtml(ev.policyName)}</td>
            <td>${escapeHtml(ev.evaluationDate)}</td>
            <td>${escapeHtml(ev.score)}</td>
          </tr>`).join('');
      }
    });
  }

  // ─── Suppress unhandled form submits ─────────────────────────────────────────
  document.querySelectorAll(
    'form:not(#form-add-policy):not(#form-add-user):not(#form-run-evaluation):not(#form-reset-password)'
  ).forEach((f) => f.addEventListener('submit', (e) => e.preventDefault()));

})();