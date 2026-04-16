(() => {
  const escapeHtml = (v) =>
    String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  let policies = [];
  let users    = [];
  let evals    = [];

  // Modal helpers
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

  // Helpers
  function bandFor(score) {
    const s = parseFloat(score);
    if (s >= 70) return { label: 'High',     cls: 'badge-high'     };
    if (s >= 50) return { label: 'Moderate', cls: 'badge-moderate' };
    return { label: 'Low',      cls: 'badge-low'      };
  }

  function parseEvaluationTime(ev) {
    const createdAt = Date.parse(ev?.createdAt || '');
    if (Number.isFinite(createdAt)) return createdAt;

    const rawDate = String(ev?.evaluationDate || '').trim();
    const parsedDate = Date.parse(rawDate);
    if (Number.isFinite(parsedDate)) return parsedDate;

    const match = rawDate.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      const manualDate = Date.parse(`${day} ${month} ${year}`);
      if (Number.isFinite(manualDate)) return manualDate;
    }

    return 0;
  }

  function sortEvals(list) {
    return [...list].sort((a, b) => {
      const timeDiff = parseEvaluationTime(b) - parseEvaluationTime(a);
      if (timeDiff !== 0) return timeDiff;
      return String(b?.runId || '').localeCompare(String(a?.runId || ''), undefined, { numeric: true });
    });
  }

  function latestEval() {
    return evals[0] || null;
  }

  async function fetchBreakdown(runId) {
    if (!runId) return [];
    try {
      const res = await fetch(`../api/get_evaluation_breakdown.php?run_id=${encodeURIComponent(runId)}`);
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    } catch (e) {
      console.error('fetchBreakdown:', e);
      return [];
    }
  }

  function renderBreakdownRows(rows, tbody) {
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px;">No breakdown available for the latest evaluation.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const b = bandFor(row.score);
      const width = Math.max(0, Math.min(100, parseFloat(row.score || 0)));
      const fillCls = b.cls.replace('badge-', 'score-');
      return `
        <tr>
          <td>${escapeHtml(row.dimension || '—')}</td>
          <td>${escapeHtml(Number(width).toFixed(1))}</td>
          <td><span class="badge ${b.cls}">${b.label}</span></td>
          <td><span class="score-bar-wrap"><span class="score-bar-fill ${fillCls}" style="width:${width}%"></span></span></td>
        </tr>`;
    }).join('');
  }

  // Page detection
  const path = window.location.pathname;
  const onPage = (name) => path.includes(name);

  // Policies page
  const policiesTbody = document.getElementById('policies-tbody');

  async function fetchPolicies() {
    try {
      const res  = await fetch('../api/get_policies.php');
      const json = await res.json();
      const raw = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      policies = raw.map((p) => ({
        policyID:   p.policyID ?? p.id ?? p.policy_id ?? '',
        name:       p.policyName ?? p.name ?? '',
        category:   p.category ?? '',
        year:       p.year ?? '',
        agency:     p.agency ?? '',
        targetArea: p.targetArea ?? p.target_area ?? '',
        dateCreated: p.dateCreated ?? p.created_at ?? '',
        status:     p.status ?? '',
      }));
    } catch (e) { console.error('fetchPolicies:', e); }
  }

  function renderPolicies() {
    if (!policiesTbody) return;
    if (!policies.length) {
      policiesTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px;">No policies found.</td></tr>`;
      return;
    }
    policiesTbody.innerHTML = policies.map((p) => {
      const sCls   = p.statusCls || 'badge-active';
      const sLabel = p.statusLabel || p.status || 'Active';
      const date   = p.dateCreated ? new Date(p.dateCreated) : null;
      const dateStr = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
        : (p.dateCreated || '—');
      return `
        <tr>
          <td>${escapeHtml(p.name || '—')}</td>
          <td>${escapeHtml(p.targetArea || '—')}</td>
          <td>${escapeHtml(dateStr)}</td>
          <td><span class="badge ${sCls}">${escapeHtml(sLabel)}</span></td>
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

  // Close buttons in the Add Policy modal
  document.querySelectorAll('.cancel-policy').forEach((btn) =>
    btn.addEventListener('click', () => closeModal('modal-add-policy'))
  );
  // Indicator row builder 
  function makeIndicatorRow(index) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;';
    row.innerHTML = `
      <input type="text" placeholder="Indicator name (e.g. Internet penetration)"
             data-ind-name="${index}"
             style="flex:1;padding:8px 10px;border:1px solid var(--border);
                    border-radius:var(--radius);font-size:13px;
                    font-family:'DM Sans',sans-serif;">
      <input type="number" min="1" max="100" step="0.5" placeholder="Weight %"
             data-ind-weight="${index}"
             style="width:90px;padding:8px 10px;border:1px solid var(--border);
                    border-radius:var(--radius);font-size:13px;
                    font-family:'DM Sans',sans-serif;">
      <button type="button" class="btn btn-danger btn-sm remove-indicator-row"
              style="padding:6px 10px;">✕</button>
    `;
    row.querySelector('.remove-indicator-row').addEventListener('click', () => {
      row.remove();
      updateWeightTotal();
    });
    row.querySelectorAll('input').forEach((inp) =>
      inp.addEventListener('input', updateWeightTotal)
    );
    return row;
  }

  function updateWeightTotal() {
    const weights = Array.from(document.querySelectorAll('[data-ind-weight]'))
      .map((el) => parseFloat(el.value) || 0);
    const total = weights.reduce((a, b) => a + b, 0);
    const totalEl = document.getElementById('weight-total');
    const msgEl   = document.getElementById('weight-total-msg');
    if (totalEl) totalEl.textContent = total.toFixed(1);
    if (msgEl) {
      msgEl.style.color = Math.abs(total - 100) < 0.1 ? 'var(--success)' : 'var(--muted)';
    }
  }

  let indicatorIndex = 0;

  document.getElementById('btn-add-indicator')?.addEventListener('click', () => {
    const container = document.getElementById('indicator-rows');
    if (!container) return;
    container.appendChild(makeIndicatorRow(indicatorIndex++));
  });

  // Pre-populate 3 rows when modal opens
  document.getElementById('btn-add-policy')?.addEventListener('click', () => {
    const container = document.getElementById('indicator-rows');
    if (container && container.children.length === 0) {
      for (let i = 0; i < 3; i++) container.appendChild(makeIndicatorRow(indicatorIndex++));
    }
    openModal('modal-add-policy');
  });

  document.getElementById('form-add-policy')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate indicators
    const nameInputs   = Array.from(document.querySelectorAll('[data-ind-name]'));
    const weightInputs = Array.from(document.querySelectorAll('[data-ind-weight]'));

    if (nameInputs.length < 3) {
      alert('Please add at least 3 indicators.');
      return;
    }

    const indicators = nameInputs.map((el, i) => ({
      name:   el.value.trim(),
      weight: parseFloat(weightInputs[i]?.value) || 0,
    }));

    const hasEmpty  = indicators.some((ind) => !ind.name || ind.weight <= 0);
    const totalW    = indicators.reduce((a, b) => a + b.weight, 0);

    if (hasEmpty) { alert('All indicators must have a name and weight.'); return; }
    if (Math.abs(totalW - 100) > 0.5) {
      alert(`Weights must sum to 100%. Current total: ${totalW.toFixed(1)}%`);
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const fd = new FormData(e.target);
    fd.append('indicators', JSON.stringify(indicators));

    try {
      const res  = await fetch('../api/add_policy.php', { method: 'POST', body: fd });
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

  // Users page
  const usersTbody = document.getElementById('users-tbody');

  async function fetchUsers() {
    try {
      const res  = await fetch('../api/get_users.php');
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
          <a class="btn btn-secondary btn-sm"
             href="user-details.php?id=${encodeURIComponent(String(u.userID))}">
            View
          </a>
          <button class="btn btn-sm ${isDisabled ? 'btn-secondary' : 'btn-danger'}"
                  data-action="toggle-status"
                  data-id="${escapeHtml(String(u.userID))}"
                  data-status="${isDisabled ? 'active' : 'disabled'}">
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
        const res  = await fetch('../api/update_user.php', { method: 'POST', body: f });
        const json = await res.json();
        if (json.success) { await fetchUsers(); renderUsers(); }
        else alert(json.error || 'Update failed');
      } catch (err) { console.error(err); }
      finally { btn.disabled = false; }
    }

    if (btn.dataset.action === 'reset-password') {
      document.getElementById('reset-pw-name').textContent  = btn.dataset.name;
      document.getElementById('reset-pw-index').value       = btn.dataset.id;
      document.getElementById('form-reset-password').reset();
      document.getElementById('reset-pw-msg').textContent   = '';
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
      const res  = await fetch('../api/add_user.php', { method: 'POST', body: new FormData(e.target) });
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
    const f     = new FormData(e.target);
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
      const res  = await fetch('../api/update_user.php', { method: 'POST', body: f });
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

  // Evaluation page.
  const evalForm = document.getElementById('form-run-evaluation');
  if (evalForm) {
    // Load policies into the policy selector.
    fetchPolicies().then(() => {
      const sel = document.getElementById('policy');
      if (!sel) return;
      const urlParams    = new URLSearchParams(window.location.search);
      const policyTarget = urlParams.get('id');

      sel.innerHTML = '<option value="" disabled selected>Select a policy</option>';
      policies.forEach((p) => {
        const opt = new Option(p.name, p.policyID);
        if (String(p.policyID) === String(policyTarget)) opt.selected = true;
        sel.appendChild(opt);
      });

      // If a policy was pre-selected via URL, load its indicators immediately
      if (policyTarget) loadIndicatorInputs(policyTarget);
    });

    // When the policy dropdown changes, load that policy's indicators.
    document.getElementById('policy')?.addEventListener('change', (e) => {
      loadIndicatorInputs(e.target.value);
    });

    async function loadIndicatorInputs(policyID) {
      const container = document.getElementById('indicator-inputs-wrap');
      if (!container) return;

      if (!policyID) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = '<p style="color:var(--muted);font-size:13px;">Loading indicators…</p>';

      try {
        const res  = await fetch(`../api/get_indicators.php?policy_id=${encodeURIComponent(policyID)}`);
        const json = await res.json();

        if (!json.success || !json.data.length) {
          container.innerHTML =
            '<p style="color:var(--muted);font-size:13px;">This policy has no indicators defined yet.</p>';
          return;
        }

        container.innerHTML = `
          <label style="font-size:12px;font-weight:500;color:var(--muted);
                        text-transform:uppercase;letter-spacing:0.05em;">
            Indicator Scores
          </label>
          <p style="font-size:12px;color:var(--muted);margin-bottom:10px;">
            Enter a score (0–100) for each indicator.
          </p>
          ${json.data.map((ind) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
              <span style="flex:1;font-size:14px;">
                ${escapeHtml(ind.name)}
                <span style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;">
                  (weight: ${ind.weight}%)
                </span>
              </span>
              <input type="number" min="0" max="100" step="0.1"
                     placeholder="0–100"
                     data-indicator-id="${escapeHtml(String(ind.indicatorID))}"
                     style="width:90px;padding:7px 10px;border:1px solid var(--border);
                            border-radius:var(--radius);font-size:14px;
                            font-family:'DM Sans',sans-serif;">
            </div>
          `).join('')}
        `;
      } catch (err) {
        container.innerHTML = '<p style="color:var(--danger);font-size:13px;">Failed to load indicators.</p>';
      }
    }

    evalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl    = document.getElementById('eval-error');
      const formData = new FormData(evalForm);

      const policyVal = formData.get('policy') || '';
      const missing   = !policyVal || !formData.get('period') || !formData.get('dataset') || !formData.get('run_type');
      if (missing) {
        if (errEl) errEl.textContent = 'Please fill in all required fields before running.';
        return;
      }
      formData.set('policy_id', policyVal);

      // Collect indicator scores
      const scoreInputs = document.querySelectorAll('[data-indicator-id]');
      if (!scoreInputs.length) {
        if (errEl) errEl.textContent = 'Please select a policy with indicators before running.';
        return;
      }

      const indicatorScores = [];
      let hasBlank = false;
      scoreInputs.forEach((input) => {
        const val = input.value.trim();
        if (val === '') { hasBlank = true; return; }
        indicatorScores.push({
          indicatorID: parseInt(input.dataset.indicatorId, 10),
          score: parseFloat(val),
        });
      });

      if (hasBlank) {
        if (errEl) errEl.textContent = 'Please enter a score for every indicator.';
        return;
      }
      if (errEl) errEl.textContent = '';

      formData.append('indicator_scores', JSON.stringify(indicatorScores));

      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const res  = await fetch('../api/add_evaluation.php', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.success) {
          const savedRunId = json.runId || '';
          window.location.href = `results.php${savedRunId ? `?highlight=${encodeURIComponent(savedRunId)}` : ''}`;
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

  // Results page.
  const allRunsTbody = document.getElementById('results-tbody-runs');

  async function fetchEvals() {
    try {
      const res  = await fetch('../api/get_evaluations.php');
      const json = await res.json();
      if (json.success) evals = sortEvals(json.data || []);
    } catch (e) { console.error('fetchEvals:', e); }
  }

  // History page.
  const historyTbody = document.getElementById('history-evals-tbody');

  function renderHistory() {
    if (!historyTbody) return;

    if (!evals.length) {
      historyTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>`;
      return;
    }

    historyTbody.innerHTML = evals.map((ev) => {
      const b = bandFor(ev.score);
      return `
        <tr>
          <td>${escapeHtml(ev.runId)}</td>
          <td>${escapeHtml(ev.policyName)}</td>
          <td>${escapeHtml(ev.evaluatedByName || '—')}</td>
          <td>${escapeHtml(ev.evaluationDate)}</td>
          <td>${escapeHtml(ev.runType)}</td>
          <td><span class="badge ${b.cls}">${b.label}</span></td>
        </tr>`;
    }).join('');
  }

  if (historyTbody) {
    fetchEvals().then(() => renderHistory());
  }

  async function renderEvals() {
    if (!allRunsTbody) return;
    const highlight = new URLSearchParams(window.location.search).get('highlight');
    const breakdownTbody = document.getElementById('results-tbody-dimensions');
    const el = (id) => document.getElementById(id);

    if (!evals.length) {
      allRunsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>`;
      renderBreakdownRows([], breakdownTbody);
      if (el('latest-policy-name'))  el('latest-policy-name').textContent = '—';
      if (el('latest-policy-meta'))  el('latest-policy-meta').textContent = '—';
      if (el('latest-score'))        el('latest-score').textContent = '—';
      if (el('latest-run-type'))     el('latest-run-type').textContent = '—';
      if (el('latest-dimension-count')) el('latest-dimension-count').textContent = '—';
      return;
    }

    allRunsTbody.innerHTML = evals.map((ev) => {
      const b  = bandFor(ev.score);
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
    const latest = latestEval();
    if (el('latest-policy-name'))  el('latest-policy-name').textContent  = latest.policyName    || '—';
    if (el('latest-policy-meta'))  el('latest-policy-meta').textContent  = `Run on ${latest.evaluationDate} · Using ${latest.dataset}`;
    if (el('latest-score'))        el('latest-score').textContent        = latest.score         || '—';
    if (el('latest-run-type'))     el('latest-run-type').textContent     = latest.runType       || '—';

    const breakdownRows = await fetchBreakdown(latest.runId);
    renderBreakdownRows(breakdownRows, breakdownTbody);
    if (el('latest-dimension-count')) {
      el('latest-dimension-count').textContent = breakdownRows.length === 1 ? '1 dimension' : `${breakdownRows.length} dimensions`;
    }
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
      const rows   = evals.map((ev) => {
        const b = bandFor(ev.score);
        return [ev.runId, ev.policyName, ev.period, ev.runType, ev.score, b.label, ev.evaluationDate];
      });
      const csv = [header, ...rows]
        .map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(','))
        .join('\n');

      const a = Object.assign(document.createElement('a'), {
        href:     URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
        download: 'ipipes_results.csv',
      });
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // Dashboard stats.
  if (onPage('dashboard')) {
    Promise.all([fetchPolicies(), fetchEvals(), fetchUsers()]).then(() => {
      const statCards = document.querySelectorAll('.stat-card');

      // Map by label text so order changes don't break anything
      statCards.forEach((card) => {
        const label = (card.querySelector('.stat-label')?.textContent || '').toLowerCase();
        const valEl = card.querySelector('.stat-value');
        if (!valEl) return;

        if (label.includes('policies')) {
          valEl.textContent = policies.filter((p) => String(p.status).toLowerCase() === 'active').length;
        } else if (label.includes('evaluations')) {
          valEl.textContent = evals.length;
        } else if (label.includes('latest score') || label.includes('average') || label.includes('avg')) {
          valEl.textContent = latestEval()?.score ?? '—';
        } else if (label.includes('users')) {
          valEl.textContent = users.length;
        }
      });

      // Recent evaluations table on dashboard
      const recentTbody = document.getElementById('recent-tbody');
      if (recentTbody && !evals.length) {
        recentTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>`;
      } else if (recentTbody && evals.length) {
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

  // Suppress unhandled form submits.
  document.querySelectorAll(
    'form:not(#form-add-policy):not(#form-add-user):not(#form-run-evaluation):not(#form-reset-password)'
  ).forEach((f) => f.addEventListener('submit', (e) => e.preventDefault()));

})();
