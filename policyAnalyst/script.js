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

  function renderDashboard() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card) => {
      const label = (card.querySelector('.stat-label')?.textContent || '').toLowerCase();
      const valEl = card.querySelector('.stat-value');
      const subEl = card.querySelector('.stat-sub');
      if (!valEl) return;

      if (label.includes('evaluations')) {
        valEl.textContent = evals.length;
      } else if (label.includes('policies')) {
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

  if (onPage('dashboard')) {
    Promise.all([fetchPolicies(), fetchEvals()]).then(() => renderDashboard());
  }

  if (onPage('history')) {
    fetchEvals().then(() => renderHistory());
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
