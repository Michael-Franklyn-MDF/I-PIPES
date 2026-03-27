(function () {
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

        if (!Array.isArray(data) || data.length === 0) {
          renderMessageRow(tbody, 'No policies found.', colCount);
          return;
        }

        var rows = data.map(function (policy) {
          var name = policy.policyName || '';
          var target = policy.targetArea || '';
          var created = formatDate(policy.dateCreated);
          var statusCell = statusBadge(policy.status);

          var actionsCell = isAdmin
            ? '<td><button class="btn btn-secondary btn-sm">Edit</button> <button class="btn btn-danger btn-sm">Delete</button></td>'
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
      })
      .catch(function () {
        renderMessageRow(tbody, 'Error loading policies.', colCount);
      });
  });
})();
