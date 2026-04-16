(() => {
  const escapeHtml = (v) =>
    String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const bandFor = (score, band) => {
    if (band) {
      const b = String(band).toLowerCase();
      if (b.includes('high')) return { label: 'High', cls: 'badge-high' };
      if (b.includes('moderate')) return { label: 'Moderate', cls: 'badge-moderate' };
      if (b.includes('low')) return { label: 'Low', cls: 'badge-low' };
    }
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
      const res = await fetch('../api/get_evaluations.php');
      const json = await res.json();
      if (json.success) evals = sortEvals(json.data || []);
    } catch (e) {
      console.error('fetchEvals:', e);
    }
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

  function renderBreakdownRows(rows) {
    const tbody = document.getElementById('results-tbody-dimensions');
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:32px;">No breakdown available for the latest evaluation.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const b = bandFor(row.score, row.band);
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
      const label = (card.querySelector('.stat-label')?.textContent || '').toLowerCase();
      const valEl = card.querySelector('.stat-value');
      const subEl = card.querySelector('.stat-sub');
      if (!valEl) return;

      if (label.includes('policies')) {
        const active = policies.filter((p) => String(p.status).toLowerCase() === 'active').length;
        valEl.textContent = active;
      } else if (label.includes('evaluations')) {
        valEl.textContent = evals.length;
      } else if (label.includes('avg')) {
        if (evals.length) {
          const sum = evals.reduce((acc, ev) => acc + parseFloat(ev.score || 0), 0);
          valEl.textContent = (sum / evals.length).toFixed(1);
        } else {
          valEl.textContent = '0.0';
        }
      } else if (label.includes('last evaluation')) {
        const latest = evals[0];
        valEl.textContent = latest?.score ?? '—';
        if (subEl) subEl.textContent = latest?.evaluationDate || '—';
      }
    });

    const recentTbody = document.getElementById('recent-tbody');
    if (!recentTbody) return;

    if (!evals.length) {
      recentTbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>';
      return;
    }

    recentTbody.innerHTML = evals.slice(0, 3).map((ev) => {
      const b = bandFor(ev.score, ev.band);
      return `
        <tr>
          <td>${escapeHtml(ev.runId)}</td>
          <td>${escapeHtml(ev.policyName)}</td>
          <td>${escapeHtml(ev.evaluationDate)}</td>
          <td>${escapeHtml(ev.score)}</td>
          <td><span class="badge ${b.cls}">${b.label}</span></td>
        </tr>`;
    }).join('');

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

  if (onPage('dashboard')) {
    Promise.all([fetchPolicies(), fetchEvals()]).then(() => renderDashboard());
  }

  async function renderResults() {
    const runsTbody = document.getElementById('results-tbody-runs');
    if (!runsTbody) return;
    const el = (id) => document.getElementById(id);

    if (!evals.length) {
      runsTbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>';
      renderBreakdownRows([]);
      if (el('latest-policy-name')) el('latest-policy-name').textContent = '—';
      if (el('latest-policy-meta')) el('latest-policy-meta').textContent = '—';
      if (el('latest-score')) el('latest-score').textContent = '—';
      if (el('latest-band')) el('latest-band').textContent = '—';
      if (el('latest-run-type')) el('latest-run-type').textContent = '—';
    } else {
      runsTbody.innerHTML = evals.map((ev) => {
        const b = bandFor(ev.score, ev.band);
        return `
          <tr>
            <td>${escapeHtml(ev.runId)}</td>
            <td>${escapeHtml(ev.policyName)}</td>
            <td>${escapeHtml(ev.period)}</td>
            <td>${escapeHtml(ev.runType)}</td>
            <td>${escapeHtml(ev.evaluatedByName || '')}</td>
            <td>${escapeHtml(ev.score)}</td>
            <td><span class="badge ${b.cls}">${b.label}</span></td>
          </tr>`;
      }).join('');
    }

    const latest = latestEval();
    if (latest) {
      if (el('latest-policy-name')) el('latest-policy-name').textContent = latest.policyName || '—';
      if (el('latest-policy-meta')) el('latest-policy-meta').textContent =
        `Run on ${latest.evaluationDate} • Using ${latest.dataset || '—'}`;
      if (el('latest-score')) el('latest-score').textContent = latest.score ?? '—';
      if (el('latest-band')) el('latest-band').textContent = bandFor(latest.score, latest.band).label;
      if (el('latest-run-type')) el('latest-run-type').textContent = latest.runType ?? '—';
      renderBreakdownRows(await fetchBreakdown(latest.runId));
    }
  }

  if (onPage('results')) {
    fetchEvals().then(() => renderResults());
  }

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      if (!evals.length) await fetchEvals();

      let rows = [];
      if (evals.length) {
        rows = [
          ['Run ID', 'Policy', 'Period', 'Run type', 'Owner', 'Score', 'Band'],
          ...evals.map((ev) => [
            ev.runId,
            ev.policyName,
            ev.period,
            ev.runType,
            ev.evaluatedByName || '',
            ev.score,
            (bandFor(ev.score, ev.band).label || ev.band || ''),
          ]),
        ];
      } else {
        const table = document.querySelector('table');
        const tableRows = Array.from(table?.querySelectorAll('tr') || []).map((tr) =>
          Array.from(tr.children).map((cell) => (cell.textContent || '').trim())
        );
        rows = tableRows.length ? tableRows : [
          ['Run ID', 'Policy', 'Period', 'Run type', 'Owner', 'Score', 'Band'],
        ];
      }

      const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ipipes_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
})();
