(function () {
  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    var day = String(date.getDate()).padStart(2, '0');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var month = months[date.getMonth()];
    var year = date.getFullYear();
    return day + ' ' + month + ' ' + year;
  }

  function statusBadge(status) {
    var normalized = String(status || '').toLowerCase();
    var cls = 'badge-active';
    var label = 'Active';

    if (normalized === 'review') {
      cls = 'badge-review';
      label = 'Review';
    } else if (normalized === 'inactive') {
      cls = 'badge-inactive';
      label = 'Inactive';
    }

    return '<span class="badge ' + cls + '">' + label + '</span>';
  }

  function renderMessageRow(tbody, message, colCount) {
    tbody.innerHTML = '<tr><td colspan="' + colCount + '">' + message + '</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var tbody = document.getElementById('policies-tbody');
    if (!tbody) return;

    var apiPath = window.POLICIES_API_PATH || '../api/get_policies.php';
    var isAdmin = window.IS_ADMIN === true;
    var colCount = isAdmin ? 5 : 4;
    var deletePath = apiPath.replace('get_policies.php', 'delete_policy.php');
    var indicatorIndex = 0;

    function renderRows(data) {
      if (!Array.isArray(data) || data.length === 0) {
        renderMessageRow(tbody, 'No policies found.', colCount);
        return;
      }

      var rows = data.map(function (policy) {
        var name = escapeHtml(policy.policyName || '');
        var target = escapeHtml(policy.targetArea || '');
        var created = escapeHtml(formatDate(policy.dateCreated));
        var statusCell = statusBadge(policy.status);
        var id = escapeHtml(policy.policyID);

        var actionsCell = isAdmin
          ? '<td>' +
              '<button class="btn btn-secondary btn-sm" data-action="edit" data-policy-id="' + id + '">Edit</button> ' +
              '<button class="btn btn-danger btn-sm" data-action="delete" data-policy-id="' + id + '">Delete</button>' +
            '</td>'
          : '';

        return (
          '<tr>' +
            '<td>' + name + '</td>' +
            '<td>' + target + '</td>' +
            '<td>' + created + '</td>' +
            '<td>' + statusCell + '</td>' +
            actionsCell +
          '</tr>'
        );
      }).join('');

      tbody.innerHTML = rows;
    }

    function loadPolicies() {
      fetch(apiPath)
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed');
          return response.json();
        })
        .then(function (data) {
          if (data && data.error) {
            renderMessageRow(tbody, 'Error loading policies.', colCount);
            return;
          }
          renderRows(data);
        })
        .catch(function () {
          renderMessageRow(tbody, 'Error loading policies.', colCount);
        });
    }

    function openModal(id) {
      var m = document.getElementById(id);
      if (!m) return;
      m.style.display = 'flex';
      requestAnimationFrame(function () { m.classList.add('modal-visible'); });
    }

    function closeModal(id) {
      var m = document.getElementById(id);
      if (!m) return;
      m.classList.remove('modal-visible');
      m.addEventListener(
        'transitionend',
        function () { m.style.display = 'none'; },
        { once: true }
      );
    }

    function updateWeightTotal() {
      var weights = Array.from(document.querySelectorAll('[data-ind-weight]'))
        .map(function (el) { return parseFloat(el.value) || 0; });
      var total = weights.reduce(function (a, b) { return a + b; }, 0);
      var totalEl = document.getElementById('weight-total');
      var msgEl = document.getElementById('weight-total-msg');
      if (totalEl) totalEl.textContent = total.toFixed(1);
      if (msgEl) {
        msgEl.style.color = Math.abs(total - 100) < 0.1 ? 'var(--success)' : 'var(--muted)';
      }
    }

    function makeIndicatorRow(index) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;';
      row.innerHTML =
        '<input type="text" placeholder="Indicator name (e.g. Internet penetration)" ' +
        'data-ind-name="' + index + '" ' +
        'style="flex:1;padding:8px 10px;border:1px solid var(--border);' +
        'border-radius:var(--radius);font-size:13px;' +
        "font-family:'DM Sans',sans-serif;\">" +
        '<input type="number" min="1" max="100" step="0.5" placeholder="Weight %" ' +
        'data-ind-weight="' + index + '" ' +
        'style="width:90px;padding:8px 10px;border:1px solid var(--border);' +
        'border-radius:var(--radius);font-size:13px;' +
        "font-family:'DM Sans',sans-serif;\">" +
        '<button type="button" class="btn btn-danger btn-sm remove-indicator-row" ' +
        'style="padding:6px 10px;">✕</button>';

      row.querySelector('.remove-indicator-row').addEventListener('click', function () {
        row.remove();
        updateWeightTotal();
      });
      row.querySelectorAll('input').forEach(function (inp) {
        inp.addEventListener('input', updateWeightTotal);
      });
      return row;
    }

    function resetIndicatorRows() {
      var container = document.getElementById('indicator-rows');
      if (!container) return;
      container.innerHTML = '';
      indicatorIndex = 0;
      for (var i = 0; i < 3; i++) container.appendChild(makeIndicatorRow(indicatorIndex++));
      updateWeightTotal();
    }

    if (isAdmin) {
      document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal-backdrop')) closeModal(event.target.id);
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          document.querySelectorAll('.modal-backdrop.modal-visible')
            .forEach(function (m) { closeModal(m.id); });
        }
      });

      var addPolicyBtn = document.getElementById('btn-add-policy');
      var addIndicatorBtn = document.getElementById('btn-add-indicator');
      var addPolicyForm = document.getElementById('form-add-policy');

      addIndicatorBtn && addIndicatorBtn.addEventListener('click', function () {
        var container = document.getElementById('indicator-rows');
        if (!container) return;
        container.appendChild(makeIndicatorRow(indicatorIndex++));
      });

      addPolicyBtn && addPolicyBtn.addEventListener('click', function () {
        var container = document.getElementById('indicator-rows');
        if (container && container.children.length === 0) {
          for (var i = 0; i < 3; i++) container.appendChild(makeIndicatorRow(indicatorIndex++));
        }
        updateWeightTotal();
        openModal('modal-add-policy');
      });

      document.querySelectorAll('.cancel-policy').forEach(function (btn) {
        btn.addEventListener('click', function () { closeModal('modal-add-policy'); });
      });

      addPolicyForm && addPolicyForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var nameInputs = Array.from(document.querySelectorAll('[data-ind-name]'));
        var weightInputs = Array.from(document.querySelectorAll('[data-ind-weight]'));

        if (nameInputs.length < 3) {
          alert('Please add at least 3 indicators.');
          return;
        }

        var indicators = nameInputs.map(function (el, i) {
          return {
            name: el.value.trim(),
            weight: parseFloat(weightInputs[i] && weightInputs[i].value) || 0,
          };
        });

        var hasEmpty = indicators.some(function (ind) { return !ind.name || ind.weight <= 0; });
        var totalW = indicators.reduce(function (a, b) { return a + b.weight; }, 0);

        if (hasEmpty) { alert('All indicators must have a name and weight.'); return; }
        if (Math.abs(totalW - 100) > 0.5) {
          alert('Weights must sum to 100%. Current total: ' + totalW.toFixed(1) + '%');
          return;
        }

        var btn = e.target.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        var fd = new FormData(e.target);
        fd.append('indicators', JSON.stringify(indicators));

        fetch('../api/add_policy.php', { method: 'POST', body: fd })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data && data.success) {
              loadPolicies();
              e.target.reset();
              closeModal('modal-add-policy');
              resetIndicatorRows();
            } else {
              alert((data && data.error) || 'Failed to add policy');
            }
          })
          .catch(function () { alert('Network error'); })
          .finally(function () { if (btn) btn.disabled = false; });
      });
    }

    if (isAdmin) {
      tbody.addEventListener('click', function (event) {
        var target = event.target.closest('[data-action]');
        if (!target) return;

        var action = target.getAttribute('data-action');
        var policyId = target.getAttribute('data-policy-id');
        if (!policyId) return;

        if (action === 'edit') {
          window.location.href = 'policy-details.php?id=' + encodeURIComponent(policyId);
          return;
        }

        if (action === 'delete') {
          if (!confirm('Delete this policy? This cannot be undone.')) return;
          fetch(deletePath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ policy_id: policyId }),
          })
            .then(function (response) { return response.json(); })
            .then(function (data) {
              if (data && data.error) {
                renderMessageRow(tbody, 'Error deleting policy.', colCount);
                return;
              }
              loadPolicies();
            })
            .catch(function () {
              renderMessageRow(tbody, 'Error deleting policy.', colCount);
            });
        }
      });
    }

    loadPolicies();
  });
})();
