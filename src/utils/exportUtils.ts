/**
 * Export utilities for analytics data — CSV and PDF export support.
 */

type Row = Record<string, string | number | boolean | null | undefined>;

/**
 * Export data as a CSV file download.
 */
export function exportToCSV(
  data: Row[],
  filename: string,
  columns?: { key: string; label: string }[]
): void {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const headers = cols.map(c => `"${c.label}"`).join(',');

  const rows = data.map(row =>
    cols.map(col => {
      const val = row[col.key];
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data as a printable HTML table that opens in a new window for PDF printing.
 */
export function exportToPDF(
  data: Row[],
  title: string,
  columns?: { key: string; label: string }[]
): void {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));

  const headerRow = cols.map(c => `<th style="border:1px solid #ddd;padding:8px 12px;background:#1e3a8a;color:#fff;font-size:12px;text-align:left">${c.label}</th>`).join('');

  const bodyRows = data.map(row =>
    `<tr>${cols.map(col => {
      const val = row[col.key] ?? '';
      return `<td style="border:1px solid #ddd;padding:6px 12px;font-size:12px">${val}</td>`;
    }).join('')}</tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title} — CityScope Export</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #1e3a8a; margin-bottom: 4px; font-size: 22px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; }
    tr:nth-child(even) { background: #f8fafc; }
    @media print {
      body { margin: 20px; }
      h1 { font-size: 18px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} • CityScope Analytics</p>
  <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;background:#1e3a8a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">Print / Save as PDF</button>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <p class="meta" style="margin-top:20px">Total: ${data.length} records</p>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    // Auto-trigger print dialog after content loads
    w.onload = () => { w.print(); };
  }
}

/**
 * Export analytics summary as a formatted report.
 */
export function exportAnalyticsReport(analytics: {
  totalIssues: number;
  issuesByStatus: Record<string, number>;
  issuesByCategory: Record<string, number>;
  averageResolutionTime: number;
  resolutionRate: number;
  topReporters: Array<{ name: string; count: number }>;
  recentTrends: Array<{ date: string; count: number }>;
}): void {
  const rows: Row[] = [];

  // Summary section
  rows.push({ Section: 'Overview', Metric: 'Total Issues', Value: analytics.totalIssues });
  rows.push({ Section: 'Overview', Metric: 'Resolution Rate', Value: `${analytics.resolutionRate}%` });
  rows.push({ Section: 'Overview', Metric: 'Avg Resolution Time', Value: `${analytics.averageResolutionTime} days` });

  // Status breakdown
  Object.entries(analytics.issuesByStatus).forEach(([status, count]) => {
    rows.push({ Section: 'By Status', Metric: status, Value: count });
  });

  // Category breakdown
  Object.entries(analytics.issuesByCategory).forEach(([cat, count]) => {
    rows.push({ Section: 'By Category', Metric: cat, Value: count });
  });

  // Top reporters
  analytics.topReporters.forEach((r, i) => {
    rows.push({ Section: 'Top Reporters', Metric: `#${i + 1} ${r.name}`, Value: r.count });
  });

  // Trends
  analytics.recentTrends.forEach(t => {
    rows.push({ Section: 'Daily Trend', Metric: t.date, Value: t.count });
  });

  exportToCSV(rows, `cityscope-analytics-${new Date().toISOString().split('T')[0]}`, [
    { key: 'Section', label: 'Section' },
    { key: 'Metric', label: 'Metric' },
    { key: 'Value', label: 'Value' },
  ]);
}

// Internal helper
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
