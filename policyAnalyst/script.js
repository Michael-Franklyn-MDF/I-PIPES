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
      const res = await fetch('../api/get_evaluations.php');
      const json = await res.json();
      if (json.success) evals = json.data;
    } catch (e) {
      console.error('fetchEvals:', e);
    }
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

  function renderResultsRuns() {
    const resultsTbody = document.getElementById('results-tbody-runs');
    if (!resultsTbody) return;

    if (!evals.length) {
      resultsTbody.innerHTML = '<tr><td colspan="6">No evaluations yet.</td></tr>';
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
  }

  if (onPage('dashboard')) {
    Promise.all([fetchPolicies(), fetchEvals()]).then(() => renderDashboard());
  }

  if (onPage('evaluation')) {
    const policySelect = document.getElementById('policy');
    const indicatorWrap = document.getElementById('indicator-inputs-wrap');

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
  }

  if (onPage('history')) {
    fetchEvals().then(() => renderHistory());
  }

  if (onPage('results')) {
    fetchEvals().then(() => renderResultsRuns());
  }

  const forms = Array.from(document.querySelectorAll('form'));
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
