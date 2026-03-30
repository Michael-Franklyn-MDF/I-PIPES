<?php
session_start();
if (!isset($_SESSION['role'])) { header('Location: ../login/index.html'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — Analyst Dashboard</title>
  <link rel="stylesheet" href="../assets/global.css">
</head>
<body>
<div class="app-layout">
  <aside class="sidebar">
    <div class="sidebar-logo">I-PIPES <span>Policy Evaluation</span></div>
    <nav class="sidebar-nav">
      <a href="dashboard.php"   class="nav-item active"><span class="nav-icon">▪</span> Dashboard</a>
      <a href="policies.php"    class="nav-item"><span class="nav-icon">▪</span> Policies</a>
      <a href="evaluation.php"  class="nav-item"><span class="nav-icon">▪</span> Evaluation</a>
      <a href="results.php"     class="nav-item"><span class="nav-icon">▪</span> Results</a>
      <a href="history.php"     class="nav-item"><span class="nav-icon">▪</span> History</a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user-name"><?php echo htmlspecialchars($_SESSION['full_name'] ?? $_SESSION['username'] ?? 'User'); ?></div>
      <div class="sidebar-user-role">Analyst</div>
      <a href="../logout.php" class="logout-link">Log out</a>
    </div>
  </aside>

  <main class="main-content">
    <div class="welcome-banner">
      <div>
        <h2>Welcome back</h2>
        <p>Here’s an overview of your recent evaluation work.</p>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Your evaluations</div>
        <div class="stat-value">8</div>
        <div class="stat-sub">Runs initiated by you</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active policies</div>
        <div class="stat-value">4</div>
        <div class="stat-sub">Assigned to you</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. score</div>
        <div class="stat-value">69.8</div>
        <div class="stat-sub">Across your runs</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Last run</div>
        <div class="stat-value">71.4</div>
        <div class="stat-sub">3 days ago</div>
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
            </tr>
            </thead>
            <tbody id="recent-tbody">
            <tr>
              <td>EV-2026-012</td>
              <td>National ICT Policy 2012</td>
              <td>12 Feb 2026</td>
              <td>71.4</td>
            </tr>
            <tr>
              <td>EV-2026-011</td>
              <td>Broadband Expansion Strategy</td>
              <td>05 Feb 2026</td>
              <td>67.9</td>
            </tr>
            <tr>
              <td>EV-2026-009</td>
              <td>Digital Inclusion Roadmap</td>
              <td>28 Jan 2026</td>
              <td>74.2</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div class="section-title">Quick actions</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <a href="evaluation.php" class="btn btn-primary">Run new evaluation</a>
          <a href="results.php" class="btn btn-secondary">View latest results</a>
          <a href="policies.php" class="btn btn-secondary">Browse policies</a>
        </div>
      </div>
    </div>
  </main>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="script.js"></script>
</body>
</html>
