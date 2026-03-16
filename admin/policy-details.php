<?php
session_start();
if (!isset($_SESSION['role'])) {
  header('Location: ../login/index.html');
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — Policy Details</title>
  <link rel="stylesheet" href="../assets/global.css">
</head>

<body>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">I-PIPES <span>Policy Evaluation</span></div>
      <nav class="sidebar-nav">
        <a href="dashboard.php" class="nav-item"><span class="nav-icon">▪</span> Dashboard</a>
        <a href="policies.php" class="nav-item active"><span class="nav-icon">▪</span> Policies</a>
        <a href="evaluation.php" class="nav-item"><span class="nav-icon">▪</span> Evaluation</a>
        <a href="results.php" class="nav-item"><span class="nav-icon">▪</span> Results</a>
        <a href="history.php" class="nav-item"><span class="nav-icon">▪</span> History</a>
        <a href="user.php" class="nav-item"><span class="nav-icon">▪</span> Users</a>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user-name">Michael Franklyn</div>
        <div class="sidebar-user-role">Admin</div>
        <a href="../logout.php" class="logout-link">Log out</a>
      </div>
    </aside>

    <main class="main-content">
      <div class="page-header">
        <div>
          <div class="page-title" id="detail-name">Loading…</div>
          <div class="page-subtitle" id="detail-meta">—</div>
        </div>
        <a href="policies.php" class="btn btn-secondary">← Back to Policies</a>
      </div>

      <div id="not-found-msg" style="display:none;" class="card">
        <p style="color:var(--muted);text-align:center;padding:32px;">Policy not found.</p>
      </div>

      <div id="policy-content">
        <div class="two-col" style="margin-bottom:20px;">
          <div class="card">
            <div class="section-header">
              <div class="section-title">Policy Information</div>
              <span id="detail-status-badge"></span>
            </div>
            <div style="font-size:14px;line-height:2;">
              <div><strong>Category:</strong> <span id="di-category">—</span></div>
              <div><strong>Year:</strong> <span id="di-year">—</span></div>
              <div><strong>Agency:</strong> <span id="di-agency">—</span></div>
              <div><strong>Indicators:</strong> <span id="di-indicators">—</span></div>
            </div>
          </div>

          <div class="card">
            <div class="section-header">
              <div class="section-title">Quick Actions</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <a id="run-eval-link" href="evaluation.php" class="btn btn-primary">Run Evaluation</a>
              <a href="results.php" class="btn btn-secondary">View Results</a>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="section-header">
            <div class="section-title">Evaluation History</div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Period</th>
                  <th>Run Type</th>
                  <th>Data Source</th>
                  <th>Score</th>
                  <th>Band</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="detail-evals-tbody">
                <tr>
                  <td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">Loading…</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    // FIX: replaced localStorage approach with real API calls
    (async () => {
      const escapeHtml = (v) =>
        String(v ?? '')
          .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

      const params = new URLSearchParams(window.location.search);
      const policyId = params.get('id');

      if (!policyId) {
        document.getElementById('detail-name').textContent = 'Policy not found';
        document.getElementById('policy-content').style.display = 'none';
        document.getElementById('not-found-msg').style.display = '';
        return;
      }

      // ── Fetch all policies and find the one we need ──────────────────────────────
      let p = null;
      try {
        const res = await fetch('../api/get_policies.php');
        const json = await res.json();
        if (json.success) {
          p = json.data.find((x) => String(x.policyID) === String(policyId));
        }
      } catch (e) { console.error(e); }

      if (!p) {
        document.getElementById('detail-name').textContent = 'Policy not found';
        document.getElementById('detail-meta').textContent = 'This policy could not be loaded.';
        document.getElementById('policy-content').style.display = 'none';
        document.getElementById('not-found-msg').style.display = '';
        return;
      }

      // ── Populate header ──────────────────────────────────────────────────────────
      const statusMap = {
        active:   { cls: 'badge-active',  label: 'Active' },
        review:   { cls: 'badge-review',  label: 'Under review' },
        inactive: { cls: 'badge-inactive',label: 'Inactive' },
      };
      const sb = {
        cls:   p.statusCls   || statusMap[p.status]?.cls   || 'badge-active',
        label: p.statusLabel || statusMap[p.status]?.label || 'Active',
      };

      document.title = `I-PIPES — ${p.name}`;
      document.getElementById('detail-name').textContent = p.name;
      document.getElementById('detail-meta').textContent = `${p.category} · ${p.agency} · Est. ${p.year}`;
      document.getElementById('di-category').textContent = p.category;
      document.getElementById('di-year').textContent = p.year;
      document.getElementById('di-agency').textContent = p.agency;
      document.getElementById('di-indicators').textContent = p.indicators ?? '0';
      document.getElementById('detail-status-badge').innerHTML =
        `<span class="badge ${sb.cls}">${escapeHtml(sb.label)}</span>`;
      document.getElementById('run-eval-link').href =
        `evaluation.php?id=${encodeURIComponent(p.policyID)}`;

      // ── Fetch evaluations for this policy ────────────────────────────────────────
      let policyEvals = [];
      try {
        const res = await fetch('../api/get_evaluations.php');
        const json = await res.json();
        if (json.success) {
          policyEvals = json.data.filter((ev) => String(ev.policyID) === String(policyId));
        }
      } catch (e) { console.error(e); }

      const tbody = document.getElementById('detail-evals-tbody');
      if (!policyEvals.length) {
        tbody.innerHTML =
          `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">
         No evaluations yet for this policy.
       </td></tr>`;
        return;
      }

      const bandMap = {
        high: { label: 'High', cls: 'badge-high' },
        moderate: { label: 'Moderate', cls: 'badge-moderate' },
        low: { label: 'Low', cls: 'badge-low' },
      };

      tbody.innerHTML = policyEvals.map((ev) => {
        const score = parseFloat(ev.score);
        const band = score >= 70 ? 'high' : score >= 50 ? 'moderate' : 'low';
        const b = bandMap[band];
        return `<tr>
      <td>${escapeHtml(ev.runId)}</td>
      <td>${escapeHtml(ev.period)}</td>
      <td>${escapeHtml(ev.runType)}</td>
      <td>${escapeHtml(ev.dataset)}</td>
      <td>${escapeHtml(ev.score)}</td>
      <td><span class="badge ${b.cls}">${b.label}</span></td>
      <td>${escapeHtml(ev.evaluationDate)}</td>
    </tr>`;
      }).join('');
    })();
  </script>
</body>

</html>
