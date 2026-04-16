(() => {
  const escapeHtml = (v) =>
    String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const bandFor = (score) => {
    const s = parseFloat(score);
    if (s >= 70) return { label: 'High', cls: 'badge-high' };
    if (s >= 50) return { label: 'Moderate', cls: 'badge-moderate' };
    return { label: 'Low', cls: 'badge-low' };
  };

  const parseEvaluationTime = (ev) => {
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
  };

  const sortEvals = (list) => [...list].sort((a, b) => {
    const timeDiff = parseEvaluationTime(b) - parseEvaluationTime(a);
    if (timeDiff !== 0) return timeDiff;
    return String(b?.runId || '').localeCompare(String(a?.runId || ''), undefined, { numeric: true });
  });

  const latestEval = () => evals[0] || null;

  const path = window.location.pathname;
  const onPage = (name) => path.includes(name);

  let policies = [];
  let evals = [];

  async function fetchPolicies() {
    try {
      const res = await fetch('../api/get_policies.php');
      const json = await res.json();
      const raw = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      policies = raw.map((p) => ({
        policyID: p.policyID ?? p.id ?? p.policy_id ?? '',
        name: p.policyName ?? p.name ?? '',
        status: p.status ?? '',
      }));
    } catch (e) {
      console.error('fetchPolicies:', e);
    }
  }

  async function fetchEvals() {
    try {
      const res = await fetch('../api/get_evaluations.php?scope=mine');
      const json = await res.json();
      if (json.success) evals = sortEvals(json.data || []);
    } catch (e) {
      console.error('fetchEvals:', e);
    }
  }

  async function fetchBreakdown(runId) {
    if (!runId) return [];
    try {
      const res = await fetch(`../api/get_evaluation_breakdown.php?scope=mine&run_id=${encodeURIComponent(runId)}`);
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    } catch (e) {
      console.error('fetchBreakdown:', e);
      return [];
    }
  }

  function renderBreakdownRows(rows) {
    const tbody = document.getElementById('results-tbody-dimensions');
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px;">No breakdown available for your latest evaluation.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const b = bandFor(row.score);
      const width = Math.max(0, Math.min(100, parseFloat(row.score || 0)));
      const fillCls = b.cls.replace('badge-', 'score-');
      return `
        <tr>
          <td>${escapeHtml(row.dimension || '—')}</td>
          <td>${escapeHtml(width.toFixed(1))}</td>
          <td><span class="badge ${b.cls}">${b.label}</span></td>
          <td>
            <span class="score-bar-wrap">
              <span class="score-bar-fill ${fillCls}" style="width:${width}%"></span>
            </span>
          </td>
        </tr>`;
    }).join('');
  }

  let trendChart = null;

  function renderDashboard() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card) => {
      const label = (card.querySelector('.stat-label')?.textContent || '').trim().toLowerCase();
      const valEl = card.querySelector('.stat-value');
      const subEl = card.querySelector('.stat-sub');
      if (!valEl) return;

      if (label.includes('your evaluations')) {
        valEl.textContent = evals.length;
      } else if (label.includes('active policies')) {
        const active = policies.filter((p) => String(p.status).toLowerCase() === 'active').length;
        valEl.textContent = active;
      } else if (label.includes('avg')) {
        if (evals.length) {
          const sum = evals.reduce((acc, ev) => acc + parseFloat(ev.score || 0), 0);
          valEl.textContent = (sum / evals.length).toFixed(1);
        } else {
          valEl.textContent = '0.0';
        }
      } else if (label.includes('last run')) {
        const latest = evals[0];
        valEl.textContent = latest?.score ?? '—';
        if (subEl) subEl.textContent = latest?.evaluationDate || '—';
      }
    });

    const recentTbody = document.getElementById('recent-tbody');
    if (!recentTbody) return;

    if (!evals.length) {
      recentTbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>';
      return;
    }

    recentTbody.innerHTML = evals.slice(0, 3).map((ev) => `
      <tr>
        <td>${escapeHtml(ev.runId)}</td>
        <td>${escapeHtml(ev.policyName)}</td>
        <td>${escapeHtml(ev.evaluationDate)}</td>
        <td>${escapeHtml(ev.score)}</td>
      </tr>`).join('');

    renderTrend();
  }

  function renderTrend() {
    const canvas = document.getElementById('score-trend');
    const emptyEl = document.getElementById('trend-empty');
    if (!canvas) return;

    const scores = evals.slice(0, 6)
      .map((ev) => parseFloat(ev.score))
      .filter((n) => Number.isFinite(n));

    const avgEl = document.getElementById('trend-avg');
    const latestEl = document.getElementById('trend-latest');
    const metaEl = document.getElementById('trend-meta');

    if (!scores.length) {
      if (trendChart) {
        trendChart.destroy();
        trendChart = null;
      }
      if (emptyEl) emptyEl.style.display = 'flex';
      if (avgEl) avgEl.textContent = '—';
      if (latestEl) latestEl.textContent = '—';
      if (metaEl) metaEl.textContent = 'No runs yet';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (metaEl) metaEl.textContent = `Last ${scores.length} runs`;

    const latest = scores[0];
    const avg = scores.reduce((acc, n) => acc + n, 0) / scores.length;
    if (avgEl) avgEl.textContent = avg.toFixed(1);
    if (latestEl) latestEl.textContent = latest.toFixed(1);

    if (!window.Chart) {
      if (emptyEl) {
        emptyEl.style.display = 'flex';
        emptyEl.textContent = 'Chart library not loaded.';
      }
      return;
    }

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4c6ef5';
    const chartScores = [...scores].reverse();
    const labels = evals.slice(0, chartScores.length)
      .map((ev) => ev.evaluationDate || ev.runId || '')
      .reverse();

    if (trendChart) trendChart.destroy();

    trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: chartScores,
          borderColor: accent,
          backgroundColor: `${accent}33`,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 100 },
        },
      },
    });
  }

  function renderHistory() {
    const historyTbody = document.getElementById('history-evals-tbody');
    if (!historyTbody) return;

    if (!evals.length) {
      historyTbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>';
      return;
    }

    historyTbody.innerHTML = evals.map((ev) => {
      const b = bandFor(ev.score);
      return `
        <tr>
          <td>${escapeHtml(ev.runId)}</td>
          <td>${escapeHtml(ev.policyName)}</td>
          <td>${escapeHtml(ev.evaluationDate)}</td>
          <td>${escapeHtml(ev.runType)}</td>
          <td><span class="badge ${b.cls}">${b.label}</span></td>
        </tr>`;
    }).join('');
  }

  async function renderResultsRuns() {
    const resultsTbody = document.getElementById('results-tbody-runs');
    if (!resultsTbody) return;
    const el = (id) => document.getElementById(id);

    if (!evals.length) {
      resultsTbody.innerHTML = '<tr><td colspan="6">No evaluations yet.</td></tr>';
      renderBreakdownRows([]);
      if (el('latest-policy-name')) el('latest-policy-name').textContent = '—';
      if (el('latest-policy-meta')) el('latest-policy-meta').textContent = '—';
      if (el('latest-score')) el('latest-score').textContent = '—';
      if (el('latest-band')) el('latest-band').textContent = '—';
      if (el('latest-run-type')) el('latest-run-type').textContent = '—';
      return;
    }

    resultsTbody.innerHTML = evals.map((ev) => {
      const b = bandFor(ev.score);
      return `
        <tr>
          <td>${escapeHtml(ev.runId)}</td>
          <td>${escapeHtml(ev.policyName)}</td>
          <td>${escapeHtml(ev.period || 'N/A')}</td>
          <td>${escapeHtml(ev.runType || 'N/A')}</td>
          <td>${escapeHtml(ev.score)}</td>
          <td><span class="badge ${b.cls}">${b.label}</span></td>
        </tr>`;
      }).join('');

    const latest = latestEval();
    if (latest) {
      if (el('latest-policy-name')) el('latest-policy-name').textContent = latest.policyName || '—';
      if (el('latest-policy-meta')) el('latest-policy-meta').textContent =
        `Run on ${latest.evaluationDate} • By you • Using ${latest.dataset || '—'}`;
      if (el('latest-score')) el('latest-score').textContent = latest.score ?? '—';
      if (el('latest-band')) el('latest-band').textContent = bandFor(latest.score).label;
      if (el('latest-run-type')) el('latest-run-type').textContent = latest.runType ?? '—';
      renderBreakdownRows(await fetchBreakdown(latest.runId));
    }
  }

  if (onPage('dashboard')) {
    Promise.all([fetchPolicies(), fetchEvals()]).then(() => renderDashboard());
  }

  if (onPage('evaluation')) {
    const policySelect = document.getElementById('policy');
    const indicatorWrap = document.getElementById('indicator-inputs-wrap');
    const evalForm = document.getElementById('form-run-evaluation');

    const showIndicatorError = (msg) => {
      if (!indicatorWrap) return;
      let msgEl = indicatorWrap.querySelector('.error-msg');
      if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.className = 'error-msg';
        indicatorWrap.prepend(msgEl);
      }
      msgEl.textContent = msg;
    };

    const clearIndicatorError = () => {
      if (!indicatorWrap) return;
      const msgEl = indicatorWrap.querySelector('.error-msg');
      if (msgEl) msgEl.remove();
    };

    fetchPolicies().then(() => {
      if (!policySelect) return;
      policySelect.innerHTML = '<option value="">Select a policy</option>';
      policies.forEach((p) => {
        const opt = new Option(p.name, p.policyID);
        policySelect.appendChild(opt);
      });
    });

    async function loadIndicators(policyID) {
      if (!indicatorWrap) return;

      if (!policyID) {
        indicatorWrap.innerHTML = '';
        return;
      }

      indicatorWrap.innerHTML = `
        <div class="form-group full">
          <label>Indicator scores</label>
          <div>Loading indicators...</div>
        </div>
      `;

      try {
        const res = await fetch(`../api/get_indicators.php?policy_id=${encodeURIComponent(policyID)}`);
        const json = await res.json();
        const indicators = json.success && Array.isArray(json.data) ? json.data : [];

        if (!indicators.length) {
          indicatorWrap.innerHTML = `
            <div class="form-group full">
              <label>Indicator scores</label>
              <div>No indicators found for this policy.</div>
            </div>
          `;
          return;
        }

        indicatorWrap.innerHTML = `
          <div class="form-group full">
            <label>Indicator scores</label>
            <div>Enter a score (0-100) for each indicator.</div>
          </div>
          ${indicators.map((ind) => {
            const id = ind.indicatorID ?? ind.id ?? ind.indicator_id ?? '';
            const name = ind.name ?? ind.indicatorName ?? 'Indicator';
            const weight = ind.weight ?? ind.indicatorWeight ?? 'N/A';
            return `
              <div class="form-group full">
                <label>${escapeHtml(name)} (weight: ${escapeHtml(String(weight))}%)</label>
                <input type="number" min="0" max="100" step="0.1" placeholder="0-100"
                       data-indicator-id="${escapeHtml(String(id))}">
              </div>
            `;
          }).join('')}
        `;
      } catch (err) {
        indicatorWrap.innerHTML = `
          <div class="form-group full">
            <label>Indicator scores</label>
            <div>Failed to load indicators.</div>
          </div>
        `;
      }
    }

    policySelect?.addEventListener('change', (e) => {
      loadIndicators(e.target.value);
    });

    evalForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const policyVal = document.getElementById('policy')?.value || '';
      const periodVal = document.getElementById('period')?.value || '';
      const datasetVal = document.getElementById('dataset')?.value || '';
      const runTypeVal = document.getElementById('run-type')?.value || '';

      if (!policyVal || !periodVal || !datasetVal || !runTypeVal) {
        showIndicatorError('Please fill in all required fields before running.');
        return;
      }

      const scoreInputs = document.querySelectorAll('[data-indicator-id]');
      if (!scoreInputs.length) {
        showIndicatorError('Please select a policy with indicators before running.');
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
        showIndicatorError('Please enter a score for every indicator.');
        return;
      }

      clearIndicatorError();

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

      const formData = new FormData();
      formData.append('policy_id', policyVal);
      formData.append('period', periodVal);
      formData.append('dataset', datasetVal);
      formData.append('run_type', runTypeVal);
      formData.append('notes', document.getElementById('notes')?.value || '');
      formData.append('run_id', runId);
      formData.append('indicator_scores', JSON.stringify(indicatorScores));

      const submitBtn = evalForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch('../api/add_evaluation.php', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.success) {
          window.location.href = `results.php?highlight=${encodeURIComponent(runId)}`;
        } else {
          showIndicatorError(json.error || 'Submission failed.');
          if (submitBtn) submitBtn.disabled = false;
        }
      } catch (err) {
        showIndicatorError('Network error. Please try again.');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  if (onPage('history')) {
    fetchEvals().then(() => renderHistory());
  }

  if (onPage('results')) {
    fetchEvals().then(() => renderResultsRuns());
  }

  const forms = Array.from(document.querySelectorAll('form:not(#form-run-evaluation)'));
  for (const form of forms) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }

  const exportBtn = Array.from(document.querySelectorAll('button.btn.btn-secondary')).find(
    (b) => b.textContent && b.textContent.trim().toLowerCase() === 'export summary'
  );
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const runsTable = Array.from(document.querySelectorAll('table')).find((t) =>
        t.querySelector('thead')?.textContent?.includes('Run ID')
      );
      if (!runsTable) return;

      const rows = Array.from(runsTable.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.children).map((cell) => (cell.textContent || '').trim())
      );
      if (!rows.length) return;

      const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ipipes_analyst_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
})();
