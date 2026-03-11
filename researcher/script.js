(() => {
  const exportBtn = document.getElementById('export-csv-btn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const rows = [
      ['Run ID', 'Policy', 'Period', 'Run type', 'Owner', 'Score', 'Band'],
      ['EV-2026-012', 'National ICT Policy 2012', '2024 (Annual)', 'Full', 'Admin', '71.4', 'Moderate'],
      ['EV-2026-011', 'Broadband Expansion Strategy', 'Q4 2024', 'Quick', 'Analyst', '67.9', 'Moderate'],
      ['EV-2026-010', 'Digital Inclusion Roadmap', '2023 (Annual)', 'Full', 'Researcher', '74.2', 'High'],
      ['EV-2026-009', 'Cybersecurity Framework', 'Q3 2024', 'Sensitivity', 'Admin', '62.1', 'Moderate'],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipipes_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
})();
