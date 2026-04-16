<?php
session_start();
if (!isset($_SESSION['role'])) { header('Location: ../login/index.html'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — History</title>
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
      <a href="results.php"     class="nav-item"><span class="nav-icon">▪</span> Results</a>
      <a href="history.php"     class="nav-item active"><span class="nav-icon">▪</span> History</a>
      <a href="user.php"        class="nav-item"><span class="nav-icon">▪</span> Users</a>
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
        <div class="page-title">History</div>
        <div class="page-subtitle">Audit trail of evaluations and key policy changes.</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="section-header">
          <div class="section-title">Evaluation history</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Policy</th>
                <th>Triggered by</th>
                <th>Date</th>
                <th>Run type</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody id="history-evals-tbody"></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div class="section-title">Policy change log</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Policy</th>
                <th>User</th>
                <th>Date</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="history-changes-tbody">
              <tr>
                <td>Indicators updated</td>
                <td>National ICT Policy 2012</td>
                <td>Admin</td>
                <td>10 Feb 2026</td>
                <td>Added new broadband penetration proxy indicators.</td>
              </tr>
              <tr>
                <td>Policy created</td>
                <td>Cybersecurity Framework</td>
                <td>Admin</td>
                <td>02 Feb 2026</td>
                <td>Initial version created from template.</td>
              </tr>
              <tr>
                <td>Metadata edited</td>
                <td>Digital Inclusion Roadmap</td>
                <td>Analyst</td>
                <td>25 Jan 2026</td>
                <td>Updated target population coverage.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</div>
<script src="script.js?v=20260416-admin"></script>
</body>
</html>
