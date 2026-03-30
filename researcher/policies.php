<?php
session_start();
if (!isset($_SESSION['role'])) { header('Location: ../login/index.html'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — Policies</title>
  <link rel="stylesheet" href="../assets/global.css">
</head>
<body>
<div class="app-layout">
  <aside class="sidebar">
    <div class="sidebar-logo">I-PIPES <span>Policy Evaluation</span></div>
    <nav class="sidebar-nav">
      <a href="dashboard.php" class="nav-item"><span class="nav-icon">▪</span> Dashboard</a>
      <a href="policies.php"  class="nav-item active"><span class="nav-icon">▪</span> Policies</a>
      <a href="results.php"   class="nav-item"><span class="nav-icon">▪</span> Results</a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user-name"><?php echo htmlspecialchars($_SESSION['full_name'] ?? $_SESSION['username'] ?? 'User'); ?></div>
      <div class="sidebar-user-role">Researcher</div>
      <a href="../logout.php" class="logout-link">Log out</a>
    </div>
  </aside>

  <main class="main-content">
    <div class="page-header">
      <div>
        <div class="page-title">Policies</div>
        <div class="page-subtitle">Browse ICT policies and their evaluation history.</div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Target Area</th>
              <th>Date Created</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="policies-tbody"></tbody>
        </table>
      </div>
    </div>
  </main>
</div>
<script>window.POLICIES_API_PATH = '../api/get_policies.php'; window.IS_ADMIN = false;</script>
<script src="../assets/policies.js"></script>
</body>
</html>
