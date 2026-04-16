<?php
session_start();
if (!isset($_SESSION['role'])) { header('Location: ../login/index.html'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — User Details</title>
  <link rel="stylesheet" href="../assets/global.css">
</head>
<body>
<div class="app-layout">
  <aside class="sidebar">
    <div class="sidebar-logo">I-PIPES <span>Policy Evaluation</span></div>
    <nav class="sidebar-nav">
      <a href="dashboard.php" class="nav-item"><span class="nav-icon">▪</span> Dashboard</a>
      <a href="policies.php" class="nav-item"><span class="nav-icon">▪</span> Policies</a>
      <a href="evaluation.php" class="nav-item"><span class="nav-icon">▪</span> Evaluation</a>
      <a href="results.php" class="nav-item"><span class="nav-icon">▪</span> Results</a>
      <a href="history.php" class="nav-item"><span class="nav-icon">▪</span> History</a>
      <a href="user.php" class="nav-item active"><span class="nav-icon">▪</span> Users</a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user-name"><?php echo htmlspecialchars($_SESSION['full_name'] ?? $_SESSION['username'] ?? 'User'); ?></div>
      <div class="sidebar-user-role">Admin</div>
      <a href="../logout.php" class="logout-link">Log out</a>
    </div>
  </aside>
  <main class="main-content">
    <div class="page-header">
      <div>
        <div class="page-title" id="ud-page-title">User details</div>
        <div class="page-subtitle" id="ud-page-subtitle">View and manage an individual user account.</div>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="user.php" class="btn btn-secondary">Back to users</a>
      </div>
    </div>
    <div id="ud-not-found" class="card" style="display:none;">
      <p style="color:var(--muted);text-align:center;padding:32px;">User not found.</p>
    </div>
    <div id="ud-content">
    <div class="two-col">
      <div class="card">
        <div class="section-header">
          <div class="section-title">Profile</div>
        </div>
        <div style="font-size:14px; line-height:1.7;">
          <div><strong>Name:</strong> <span id="ud-name">—</span></div>
          <div><strong>Username:</strong> <span id="ud-username">—</span></div>
          <div><strong>Email:</strong> <span id="ud-email">—</span></div>
          <div><strong>Role:</strong> <span id="ud-role">—</span></div>
          <div><strong>Status:</strong> <span id="ud-status">—</span></div>
          <div><strong>Last login:</strong> <span id="ud-last-login">—</span></div>
          <div><strong>Created:</strong> <span id="ud-created">—</span></div>
        </div>
      </div>
      <div class="card">
        <div class="section-header">
          <div class="section-title">Summary</div>
        </div>
        <div class="three-col">
          <div>
            <div class="stat-label">Evaluations run</div>
            <div id="ud-evals-run" class="stat-value">—</div>
            <div class="stat-sub">All time</div>
          </div>
          <div>
            <div class="stat-label">Avg. score</div>
            <div id="ud-avg-score" class="stat-value">—</div>
            <div class="stat-sub">Across runs</div>
          </div>
          <div>
            <div class="stat-label">Policies evaluated</div>
            <div id="ud-policies-evaluated" class="stat-value">—</div>
            <div class="stat-sub">Distinct policies</div>
          </div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:20px;">
      <div class="section-header">
        <div class="section-title">Recent evaluations</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
          <tr>
            <th>Run ID</th>
            <th>Policy</th>
            <th>Period</th>
            <th>Run type</th>
            <th>Score</th>
            <th>Band</th>
          </tr>
          </thead>
          <tbody id="ud-recent-evals-tbody"></tbody>
        </table>
      </div>
    </div>
    </div>
  </main>
</div>
<script src="script.js?v=20260416-admin"></script>
<script>
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    const el = (id) => document.getElementById(id);
    const escapeHtml = (v) => String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

    const formatDate = (value) => {
      if (!value) return '—';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const bandFor = (score) => {
      const s = parseFloat(score);
      if (s >= 70) return { label: 'High', cls: 'badge-high' };
      if (s >= 50) return { label: 'Moderate', cls: 'badge-moderate' };
      return { label: 'Low', cls: 'badge-low' };
    };

    if (!userId) {
      el('ud-content').style.display = 'none';
      el('ud-not-found').style.display = '';
      return;
    }

    let user = null;
    let evals = [];

    try {
      const [usersRes, evalsRes] = await Promise.all([
        fetch('../api/get_users.php'),
        fetch('../api/get_evaluations.php'),
      ]);

      const usersJson = await usersRes.json();
      const evalsJson = await evalsRes.json();

      const users = usersJson.success && Array.isArray(usersJson.data) ? usersJson.data : [];
      user = users.find((u) => String(u.userID) === String(userId)) || null;
      evals = evalsJson.success && Array.isArray(evalsJson.data)
        ? evalsJson.data.filter((ev) => String(ev.evaluatedBy) === String(userId))
        : [];
    } catch (err) {
      console.error(err);
    }

    if (!user) {
      el('ud-content').style.display = 'none';
      el('ud-not-found').style.display = '';
      return;
    }

    const roleBadge = `<span class="badge ${escapeHtml(user.roleCls || 'badge-researcher')}">${escapeHtml(user.roleLabel || user.role || '—')}</span>`;
    const statusBadge = `<span class="badge ${escapeHtml(user.statusCls || 'badge-inactive')}">${escapeHtml(user.statusLabel || user.status || '—')}</span>`;

    el('ud-page-title').textContent = user.full_name || 'User details';
    el('ud-page-subtitle').textContent = `Profile and recent activity for @${user.username || 'user'}.`;
    el('ud-name').textContent = user.full_name || '—';
    el('ud-username').textContent = user.username || '—';
    el('ud-email').textContent = user.email || '—';
    el('ud-role').innerHTML = roleBadge;
    el('ud-status').innerHTML = statusBadge;
    el('ud-last-login').textContent = user.lastLogin || '—';
    el('ud-created').textContent = formatDate(user.registeredAt);

    const evalCount = evals.length;
    const avgScore = evalCount
      ? (evals.reduce((sum, ev) => sum + parseFloat(ev.score || 0), 0) / evalCount).toFixed(1)
      : '—';
    const policyCount = new Set(evals.map((ev) => String(ev.policyID || ''))).size;

    el('ud-evals-run').textContent = String(evalCount);
    el('ud-avg-score').textContent = avgScore;
    el('ud-policies-evaluated').textContent = String(policyCount);

    const tbody = el('ud-recent-evals-tbody');
    if (!evalCount) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px;">No evaluations yet for this user.</td></tr>';
      return;
    }

    evals.sort((a, b) => {
      const aTime = Date.parse(a.createdAt || '') || 0;
      const bTime = Date.parse(b.createdAt || '') || 0;
      if (bTime !== aTime) return bTime - aTime;
      return String(b.runId || '').localeCompare(String(a.runId || ''), undefined, { numeric: true });
    });

    tbody.innerHTML = evals.slice(0, 8).map((ev) => {
      const b = bandFor(ev.score);
      return `
        <tr>
          <td>${escapeHtml(ev.runId)}</td>
          <td>${escapeHtml(ev.policyName)}</td>
          <td>${escapeHtml(ev.period)}</td>
          <td>${escapeHtml(ev.runType)}</td>
          <td>${escapeHtml(ev.score)}</td>
          <td><span class="badge ${b.cls}">${b.label}</span></td>
        </tr>`;
    }).join('');
  })();
</script>
</body>
</html>
