<?php
session_start();
if (!isset($_SESSION['role'])) { header('Location: ../login/index.html'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-PIPES — Users</title>
  <link rel="stylesheet" href="../assets/global.css">
</head>
<body>
<div class="app-layout">
  <aside class="sidebar">
    <div class="sidebar-logo">I-PIPES <span>Policy Evaluation</span></div>
    <nav class="sidebar-nav">
      <a href="dashboard.php"  class="nav-item"><span class="nav-icon">▪</span> Dashboard</a>
      <a href="policies.php"   class="nav-item"><span class="nav-icon">▪</span> Policies</a>
      <a href="evaluation.php" class="nav-item"><span class="nav-icon">▪</span> Evaluation</a>
      <a href="results.php"    class="nav-item"><span class="nav-icon">▪</span> Results</a>
      <a href="history.php"    class="nav-item"><span class="nav-icon">▪</span> History</a>
      <a href="user.php"       class="nav-item active"><span class="nav-icon">▪</span> Users</a>
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
        <div class="page-title">Users</div>
        <div class="page-subtitle">Manage admin, policy analyst, and researcher accounts.</div>
      </div>
      <button id="btn-add-user" class="btn btn-primary">+ Add User</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="users-tbody"></tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Add User Modal -->
<div id="modal-add-user" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Add New User</div>
      <button class="modal-close" id="cancel-user">✕</button>
    </div>
    <form id="form-add-user">
      <div class="form-group">
        <label for="full_name">Full Name</label>
        <input type="text" id="full_name" name="full_name" placeholder="e.g. Jane Mwangi" required>
      </div>
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" placeholder="e.g. jane@example.org" required>
      </div>
      <div class="form-group">
        <label for="role">Role</label>
        <select id="role" name="role" required>
          <option value="">Select role</option>
          <option value="admin">Admin</option>
          <option value="analyst">Policy Analyst</option>
          <option value="researcher">Researcher</option>
        </select>
      </div>
      <div class="modal-footer">
        <button type="button" id="cancel-user" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Add User</button>
      </div>
    </form>
  </div>
</div>

<!-- Reset Password Modal -->
<div id="modal-reset-password" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Reset Password</div>
      <button class="modal-close" id="cancel-reset-pw">✕</button>
    </div>
    <p style="font-size:13px; color:var(--muted); margin-bottom:18px;">
      Setting new password for <strong id="reset-pw-name"></strong>.
    </p>
    <form id="form-reset-password">
      <input type="hidden" id="reset-pw-index" name="user_index">
      <div class="form-group">
        <label for="new_password">New Password</label>
        <input type="password" id="new_password" name="new_password" placeholder="Min. 8 characters" required>
      </div>
      <div class="form-group">
        <label for="confirm_password">Confirm Password</label>
        <input type="password" id="confirm_password" name="confirm_password" placeholder="Repeat new password" required>
      </div>
      <div id="reset-pw-msg" style="font-size:13px; min-height:18px; margin-bottom:10px;"></div>
      <div class="modal-footer">
        <button type="button" id="cancel-reset-pw" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Password</button>
      </div>
    </form>
  </div>
</div>

<script src="script.js"></script>
</body>
</html>