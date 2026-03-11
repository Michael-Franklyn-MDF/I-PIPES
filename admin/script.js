(() => {
  const forms = Array.from(document.querySelectorAll('form'));
  for (const form of forms) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }

  const escapeHtml = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const policiesTbody = document.getElementById('policies-tbody');
  if (policiesTbody) {
    const policies = [
      {
        name: 'National ICT Policy 2012',
        category: 'National',
        year: '2012',
        agency: 'ICT Ministry',
        indicators: '6',
        statusLabel: 'Active',
        statusClass: 'badge-active',
      },
      {
        name: 'Broadband Expansion Strategy',
        category: 'Infrastructure',
        year: '2018',
        agency: 'ICT Ministry',
        indicators: '5',
        statusLabel: 'Active',
        statusClass: 'badge-active',
      },
      {
        name: 'Digital Inclusion Roadmap',
        category: 'Inclusion',
        year: '2020',
        agency: 'Social Dev. Ministry',
        indicators: '4',
        statusLabel: 'Under review',
        statusClass: 'badge-review',
      },
      {
        name: 'Cybersecurity Framework',
        category: 'Security',
        year: '2019',
        agency: 'ICT Ministry',
        indicators: '5',
        statusLabel: 'Active',
        statusClass: 'badge-active',
      },
    ];

    policiesTbody.innerHTML = policies
      .map(
        (p) => `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.category)}</td>
            <td>${escapeHtml(p.year)}</td>
            <td>${escapeHtml(p.agency)}</td>
            <td>${escapeHtml(p.indicators)}</td>
            <td><span class="badge ${escapeHtml(p.statusClass)}">${escapeHtml(p.statusLabel)}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm">View</button>
            </td>
          </tr>
        `
      )
      .join('');
  }

  const exportBtn = Array.from(document.querySelectorAll('button.btn.btn-secondary')).find(
    (b) => b.textContent && b.textContent.trim() === 'Export CSV'
  );
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const allRunsTable = Array.from(document.querySelectorAll('table')).find((t) =>
        t.querySelector('thead')?.textContent?.includes('Run ID')
      );
      if (!allRunsTable) return;

      const rows = Array.from(allRunsTable.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.children).map((cell) => (cell.textContent || '').trim())
      );
      if (!rows.length) return;

      const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ipipes_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
})();
