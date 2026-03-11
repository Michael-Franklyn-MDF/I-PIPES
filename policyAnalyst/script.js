(() => {
  const forms = Array.from(document.querySelectorAll('form'));
  for (const form of forms) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }

  const exportBtn = Array.from(document.querySelectorAll('button.btn.btn-secondary')).find(
    (b) => b.textContent && b.textContent.trim().toLowerCase() === 'export summary'
  );
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const runsTable = Array.from(document.querySelectorAll('table')).find((t) =>
        t.querySelector('thead')?.textContent?.includes('Run ID')
      );
      if (!runsTable) return;

      const rows = Array.from(runsTable.querySelectorAll('tr')).map((tr) =>
        Array.from(tr.children).map((cell) => (cell.textContent || '').trim())
      );
      if (!rows.length) return;

      const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ipipes_analyst_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
})();
