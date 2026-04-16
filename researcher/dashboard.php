<?php
session_start();
if (!isset($_SESSION['role'])) { header('Location: ../login/index.html'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — Researcher Dashboard</title>
  <link rel="stylesheet" href="../assets/global.css">
</head>
<body>
<div class="app-layout">
  <aside class="sidebar">
    <div class="sidebar-logo">I-PIPES <span>Policy Evaluation</span></div>
    <nav class="sidebar-nav">
      <a href="dashboard.php" class="nav-item active"><span class="nav-icon">▪</span> Dashboard</a>
      <a href="policies.php" class="nav-item"><span class="nav-icon">▪</span> Policies</a>
      <a href="results.php" class="nav-item"><span class="nav-icon">▪</span> Results</a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user-name"><?php echo htmlspecialchars($_SESSION['full_name'] ?? $_SESSION['username'] ?? 'User'); ?></div>
      <div class="sidebar-user-role">Researcher</div>
      <a href="../logout.php" class="logout-link">Log out</a>
    </div>
  </aside>
  <main class="main-content">
    <div class="welcome-banner">
      <div>
        <h2>Welcome back, Researcher</h2>
        <p>Browse ICT policies and explore evaluation results.</p>
      </div>
      <div>
        <span class="badge badge-researcher">Read-only</span>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Policies available</div>
        <div class="stat-value">—</div>
        <div class="stat-sub">Active in system</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Evaluations viewable</div>
        <div class="stat-value">—</div>
        <div class="stat-sub">All time</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">System avg. score</div>
        <div class="stat-value">—</div>
        <div class="stat-sub">Out of 100</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Last evaluation</div>
        <div class="stat-value">—</div>
        <div class="stat-sub">—</div>
      </div>
    </div>
    <div class="card chart-card">
      <div class="section-header">
        <div class="section-title">Score trend</div>
        <div class="section-meta" id="trend-meta">Last 6 runs</div>
      </div>
      <div class="chart-wrap">
        <div class="chart-canvas">
          <canvas id="score-trend" aria-label="Score trend"></canvas>
          <div class="chart-empty" id="trend-empty">No evaluations yet.</div>
        </div>
        <div class="chart-legend">
          <div><span class="legend-dot"></span>Avg: <span id="trend-avg">—</span></div>
          <div>Latest: <span id="trend-latest">—</span></div>
        </div>
      </div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="section-header">
          <div class="section-title">Recent evaluations</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Policy</th>
                <th>Date</th>
                <th>Score</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody id="recent-tbody"></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="section-header">
          <div class="section-title">Quick access</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
          <a href="policies.php" class="btn btn-primary">Browse all policies</a>
          <a href="results.php" class="btn btn-secondary">View all results</a>
          <a href="results.php" class="btn btn-secondary">Export results as CSV</a>
        </div>
        <div class="section-header" style="margin-top:8px;">
          <div class="section-title">System notes</div>
        </div>
        <ul style="margin-left:16px; font-size:13px; color:var(--muted); line-height:1.6;">
          <li>Researcher access is read-only across all pages.</li>
          <li>Latest run shows strong Access &amp; Infrastructure performance.</li>
          <li>Use Export CSV in Results to download the full runs table.</li>
        </ul>
      </div>
    </div>
  </main>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="script.js?v=20260416-researcher"></script>
</body>
</html>
