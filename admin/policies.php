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
      <a href="dashboard.php"  class="nav-item"><span class="nav-icon">▪</span> Dashboard</a>
      <a href="policies.php"   class="nav-item active"><span class="nav-icon">▪</span> Policies</a>
      <a href="evaluation.php" class="nav-item"><span class="nav-icon">▪</span> Evaluation</a>
      <a href="results.php"    class="nav-item"><span class="nav-icon">▪</span> Results</a>
      <a href="history.php"    class="nav-item"><span class="nav-icon">▪</span> History</a>
      <a href="user.php"       class="nav-item"><span class="nav-icon">▪</span> Users</a>
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
        <div class="page-title">Policies</div>
        <div class="page-subtitle">Manage ICT policies and their proxy indicators.</div>
      </div>
      <button id="btn-add-policy" class="btn btn-primary">+ Add Policy</button>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="policies-tbody"></tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Add Policy Modal -->
<div id="modal-add-policy" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Add New Policy</div>
      <button class="modal-close cancel-policy" type="button">✕</button>
    </div>
    <form id="form-add-policy">
      <div class="form-grid">
        <div class="form-group full">
          <label for="policy_name">Policy Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="policy_name" name="policy_name" placeholder="e.g. National Broadband Policy 2024" required>
        </div>
        <div class="form-group full">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="2" placeholder="Brief description of the policy"></textarea>
        </div>
        <div class="form-group">
          <label for="category">Category <span style="color:var(--danger)">*</span></label>
          <select id="category" name="category" required>
            <option value="">Select category</option>
            <option value="National">National</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Inclusion">Inclusion</option>
            <option value="Security">Security</option>
            <option value="Education">Education</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="year">Year <span style="color:var(--danger)">*</span></label>
          <input type="number" id="year" name="year" placeholder="e.g. 2024" min="1990" max="2099" required>
        </div>
        <div class="form-group">
          <label for="agency">Agency <span style="color:var(--danger)">*</span></label>
          <input type="text" id="agency" name="agency" placeholder="e.g. ICT Ministry" required>
        </div>
        <div class="form-group">
          <label for="targetArea">Target Area</label>
          <input type="text" id="targetArea" name="targetArea" placeholder="e.g. Rural broadband">
        </div>
        <div class="form-group full">
          <label for="status">Status</label>
          <select id="status" name="status">
            <option value="active">Active</option>
            <option value="review">Under review</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="form-group full" style="margin-top:8px;">
          <label>Indicators <span style="color:var(--danger)">*</span>
            <span style="font-size:11px; color:var(--muted); text-transform:none; letter-spacing:0;">
              — min. 3, weights must sum to 100%
            </span>
          </label>

          <div id="indicator-rows" style="display:flex; flex-direction:column; gap:8px; margin-top:6px;"></div>

          <button type="button" id="btn-add-indicator"
                  class="btn btn-secondary btn-sm" style="margin-top:8px; align-self:flex-start;">
            + Add indicator
          </button>
          <div id="weight-total-msg" style="font-size:12px; color:var(--muted); margin-top:6px;">
            Total weight: <strong id="weight-total">0</strong>%
          </div>
        </div>

      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary cancel-policy">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Policy</button>
      </div>
    </form>
  </div>
</div>

<script>window.POLICIES_API_PATH = '../api/get_policies.php'; window.IS_ADMIN = true;</script>
<script src="../assets/policies.js"></script>
</body>
</html>
