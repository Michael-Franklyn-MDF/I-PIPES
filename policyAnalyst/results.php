<?php
session_start();
if (!isset($_SESSION['role'])) { header('Location: ../login/index.html'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — Analyst Results</title>
  <link rel="stylesheet" href="../assets/global.css">
</head>
<body>
<div class="app-layout">
  <aside class="sidebar">
    <div class="sidebar-logo">I-PIPES <span>Policy Evaluation</span></div>
    <nav class="sidebar-nav">
      <a href="dashboard.php"   class="nav-item"><span class="nav-icon">▪</span> Dashboard</a>
      <a href="policies.php"    class="nav-item"><span class="nav-icon">▪</span> Policies</a>
      <a href="evaluation.php"  class="nav-item"><span class="nav-icon">▪</span> Evaluation</a>
      <a href="results.php"     class="nav-item active"><span class="nav-icon">▪</span> Results</a>
      <a href="history.php"     class="nav-item"><span class="nav-icon">▪</span> History</a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user-name"><?php echo htmlspecialchars($_SESSION['full_name'] ?? $_SESSION['username'] ?? 'User'); ?></div>
      <div class="sidebar-user-role">Analyst</div>
      <a href="../logout.php" class="logout-link">Log out</a>
    </div>
  </aside>

  <main class="main-content">
    <div class="page-header">
      <div>
        <div class="page-title">Evaluation Results</div>
        <div class="page-subtitle">Explore outcomes and compare your recent evaluation runs.</div>
      </div>
      <button id="export-csv-btn" class="btn btn-secondary">Export summary</button>
    </div>

    <div class="two-col" style="margin-bottom: 20px;">
      <div class="card">
        <div class="section-header">
          <div class="section-title">Latest evaluation (yours)</div>
        </div>
        <div style="margin-bottom: 16px;">
          <div style="font-size:14px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">Policy</div>
          <div id="latest-policy-name" style="font-size:17px; font-weight:600; margin-top:4px;">—</div>
          <div id="latest-policy-meta" style="font-size:13px; color: var(--muted); margin-top:2px;">—</div>
        </div>

        <div class="three-col">
          <div>
            <div class="stat-label">Overall score</div>
            <div id="latest-score" class="stat-value">—</div>
            <div class="stat-sub">out of 100</div>
          </div>
          <div>
            <div class="stat-label">Confidence level</div>
            <div id="latest-band" class="stat-value">—</div>
            <div class="stat-sub">Model certainty</div>
          </div>
          <div>
            <div class="stat-label">Run type</div>
            <div id="latest-run-type" class="stat-value">—</div>
            <div id="latest-dimension-count" class="stat-sub">—</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div class="section-title">Dimension breakdown</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
            <tr>
              <th>Dimension</th>
              <th>Score</th>
              <th>Band</th>
              <th>Score bar</th>
            </tr>
            </thead>
            <tbody id="results-tbody-dimensions"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-header">
        <div class="section-title">Your evaluation runs</div>
        <button class="btn btn-secondary btn-sm">Filter</button>
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
          <tbody id="results-tbody-runs"></tbody>
        </table>
      </div>
    </div>
  </main>
</div>
<script src="script.js?v=20260416"></script>
</body>
</html>
