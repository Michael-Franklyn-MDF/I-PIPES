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
      <div class="sidebar-user-name">Researcher One</div>
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
              <th>Category</th>
              <th>Year</th>
              <th>Agency</th>
              <th>Status</th>
              <th>Last evaluated</th>
              <th>Indicators (count)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="policies-tbody">
            <tr>
              <td>National ICT Policy 2012</td>
              <td>National</td>
              <td>2012</td>
              <td>ICT Ministry</td>
              <td><span class="badge badge-active">Active</span></td>
              <td>2024 (Annual)</td>
              <td>6</td>
              <td><button class="btn btn-secondary btn-sm">View details</button></td>
            </tr>
            <tr>
              <td>Broadband Expansion Strategy</td>
              <td>Infrastructure</td>
              <td>2018</td>
              <td>ICT Ministry</td>
              <td><span class="badge badge-active">Active</span></td>
              <td>Q4 2024</td>
              <td>5</td>
              <td><button class="btn btn-secondary btn-sm">View details</button></td>
            </tr>
            <tr>
              <td>Digital Inclusion Roadmap</td>
              <td>Inclusion</td>
              <td>2020</td>
              <td>Social Dev. Ministry</td>
              <td><span class="badge badge-review">Review</span></td>
              <td>2023 (Annual)</td>
              <td>4</td>
              <td><button class="btn btn-secondary btn-sm">View details</button></td>
            </tr>
            <tr>
              <td>Cybersecurity Framework</td>
              <td>Security</td>
              <td>2019</td>
              <td>ICT Ministry</td>
              <td><span class="badge badge-active">Active</span></td>
              <td>Q3 2024</td>
              <td>5</td>
              <td><button class="btn btn-secondary btn-sm">View details</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>
<script src="script.js"></script>
</body>
</html>
