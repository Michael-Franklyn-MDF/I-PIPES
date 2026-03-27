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
  }

  if (onPage('dashboard')) {
    Promise.all([fetchPolicies(), fetchEvals()]).then(() => renderDashboard());
  }

  function renderResults() {
    const runsTbody = document.getElementById('results-tbody-runs');
    if (!runsTbody) return;

    if (!evals.length) {
      runsTbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet.</td></tr>';
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

    const latest = evals[0];
    const el = (id) => document.getElementById(id);
    if (latest) {
      if (el('latest-policy-name')) el('latest-policy-name').textContent = latest.policyName || '—';
      if (el('latest-policy-meta')) el('latest-policy-meta').textContent =
        `Run on ${latest.evaluationDate} • Using ${latest.dataset || '—'}`;
      if (el('latest-score')) el('latest-score').textContent = latest.score ?? '—';
      if (el('latest-run-type')) el('latest-run-type').textContent = latest.runType ?? '—';
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
