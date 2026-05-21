import type { Category, Expense } from '@/types/models';
import { formatDisplayDateTime, formatExportDateSlug } from '@/utils/dateFormat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import * as XLSX from 'xlsx';

const { StorageAccessFramework } = FileSystem;

const ANDROID_DOWNLOADS_DIR_KEY = 'exptrack.androidDownloadsDirUri';

export type ExportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export type ExportDeliveryResult = {
  fileName: string;
  delivery: 'downloads' | 'share' | 'web-download' | 'web-print';
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtAmount(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function buildAllReportFileName(ext: string) {
  const stamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  return `exptrack_allreport_${stamp}.${ext}`;
}

export function buildCustomReportFileName(start: Date, end: Date, ext: string) {
  return `exptrack_${formatExportDateSlug(start)}_to_${formatExportDateSlug(end)}.${ext}`;
}

function getWritableDirectory(): string {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) {
    throw new Error('File storage is not available on this device.');
  }
  return base;
}

function normalizeLocalFileUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri}`;
}

async function copyToNamedExportPath(sourceUri: string, fileName: string): Promise<string> {
  const dest = `${getWritableDirectory()}${fileName}`;
  await FileSystem.copyAsync({ from: normalizeLocalFileUri(sourceUri), to: dest });
  return dest;
}

async function resolveAndroidDownloadsDirectory(): Promise<string> {
  const stored = await AsyncStorage.getItem(ANDROID_DOWNLOADS_DIR_KEY);
  if (stored) {
    try {
      await StorageAccessFramework.readDirectoryAsync(stored);
      return stored;
    } catch {
      await AsyncStorage.removeItem(ANDROID_DOWNLOADS_DIR_KEY);
    }
  }

  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(
    StorageAccessFramework.getUriForDirectoryInRoot('Download')
  );

  if (!permissions.granted) {
    throw new Error(
      'Downloads access is required. When prompted, choose the Downloads folder (or allow access to it).'
    );
  }

  await AsyncStorage.setItem(ANDROID_DOWNLOADS_DIR_KEY, permissions.directoryUri);
  return permissions.directoryUri;
}

/** Save file into the public Downloads folder on Android (API 21+). */
async function saveToAndroidDownloads(
  fileUri: string,
  fileName: string,
  mimeType: string,
  encoding: FileSystem.EncodingType
): Promise<void> {
  const directoryUri = await resolveAndroidDownloadsDirectory();
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const destUri = await StorageAccessFramework.createFileAsync(directoryUri, baseName, mimeType);
  const contents = await FileSystem.readAsStringAsync(normalizeLocalFileUri(fileUri), { encoding });
  await FileSystem.writeAsStringAsync(destUri, contents, { encoding });
}

function downloadBase64OnWeb(base64: string, mimeType: string, fileName: string) {
  if (typeof document === 'undefined' || typeof atob === 'undefined') {
    throw new Error('Browser download is not available.');
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadTextOnWeb(contents: string, mimeType: string, fileName: string) {
  if (typeof document === 'undefined') {
    throw new Error('Browser download is not available.');
  }
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function openShareSheet(
  fileUri: string,
  options: { mimeType: string; dialogTitle: string }
) {
  const shareUri =
    Platform.OS === 'android' && !fileUri.startsWith('file://') ? `file://${fileUri}` : fileUri;

  if (!(await Sharing.isAvailableAsync())) {
    if (await Linking.canOpenURL(shareUri)) {
      await Linking.openURL(shareUri);
      return;
    }
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(shareUri, {
    mimeType: options.mimeType,
    dialogTitle: options.dialogTitle,
  });
}

/** Save to Downloads on Android; direct download on web; share sheet on iOS (Save to Files). */
async function deliverExportFile(
  fileUri: string,
  options: {
    mimeType: string;
    dialogTitle: string;
    fileName: string;
    encoding: FileSystem.EncodingType;
  }
): Promise<ExportDeliveryResult> {
  const { fileName, mimeType, dialogTitle, encoding } = options;

  if (Platform.OS === 'web') {
    if (encoding === FileSystem.EncodingType.Base64) {
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding });
      downloadBase64OnWeb(base64, mimeType, fileName);
    } else {
      const text = await FileSystem.readAsStringAsync(fileUri, { encoding });
      downloadTextOnWeb(text, mimeType, fileName);
    }
    return { fileName, delivery: 'web-download' };
  }

  if (Platform.OS === 'android') {
    await saveToAndroidDownloads(fileUri, fileName, mimeType, encoding);
    return { fileName, delivery: 'downloads' };
  }

  await openShareSheet(fileUri, { mimeType, dialogTitle });
  return { fileName, delivery: 'share' };
}

function categoryMap(categories: Category[]) {
  return new Map(categories.map((c) => [c.id, c.name]));
}

function sortExpensesLatestFirst(expenses: Expense[]) {
  return [...expenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function buildBreakdown(expenses: Expense[], categories: Category[]) {
  const catMap = categoryMap(categories);
  const map = new Map<string, number>();
  expenses.forEach((e) => {
    const name = catMap.get(e.categoryId) ?? 'Other';
    map.set(name, (map.get(name) ?? 0) + e.amount);
  });
  const breakdown = [...map.entries()].map(([name, total]) => ({ name, total }));
  breakdown.sort((a, b) => b.total - a.total);
  return breakdown;
}

function buildRowsHtml(
  expenses: Expense[],
  categories: Category[],
  primaryCurrency: string
) {
  const catMap = categoryMap(categories);
  const sorted = sortExpensesLatestFirst(expenses);
  const rows = sorted
    .map((e, i) => {
      const cat = catMap.get(e.categoryId) ?? '—';
      const when = formatDisplayDateTime(e.createdAt);
      const stripe = i % 2 === 1 ? ' class="stripe"' : '';
      return `<tr${stripe}><td class="nowrap">${escapeHtml(when)}</td><td>${escapeHtml(cat)}</td><td>${escapeHtml(e.subCategory || '—')}</td><td class="note">${escapeHtml(e.note || '—')}</td><td class="num">${fmtAmount(e.amount, primaryCurrency)}</td></tr>`;
    })
    .join('');
  return rows;
}

function reportHtml(params: {
  title: string;
  expenses: Expense[];
  categories: Category[];
  primaryCurrency: string;
  total: number;
  breakdown: { name: string; total: number }[];
}) {
  const { title, expenses, categories, primaryCurrency, total, breakdown } = params;
  const recordLabel = expenses.length === 1 ? '1 record' : `${expenses.length} records`;
  const breakdownRows = breakdown
    .map(
      (b) =>
        `<tr><td>${escapeHtml(b.name)}</td><td class="num">${fmtAmount(b.total, primaryCurrency)}</td></tr>`
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
    title
  )}</title><style>
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;padding:28px 32px;color:#0f172a;max-width:960px;margin:0 auto}
    h1{font-size:24px;margin:0 0 6px;font-weight:700}
    h2{font-size:16px;margin:28px 0 12px;font-weight:600;color:#334155}
    .muted{color:#64748b;font-size:13px;margin:0 0 20px}
    .meta{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}
    .pill{background:#f1f5f9;border-radius:8px;padding:8px 14px;font-size:13px;color:#475569}
    .pill strong{color:#0f172a;margin-right:6px}
    table{width:100%;border-collapse:collapse;margin-top:8px;table-layout:fixed}
    th,td{border-bottom:1px solid #e2e8f0;padding:9px 10px;text-align:left;font-size:13px;vertical-align:top}
    th{background:#f1f5f9;font-weight:600;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
    td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
    td.nowrap{white-space:nowrap}
    td.note{word-wrap:break-word;overflow-wrap:break-word}
    tr.stripe td{background:#fafafa}
    tfoot td{font-weight:700;border-top:2px solid #cbd5e1;background:#f8fafc}
    .summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:8px}
    @media(max-width:640px){.summary-grid{grid-template-columns:1fr}}
    .card{border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px}
    .total-value{font-size:26px;font-weight:700;margin-top:6px;color:#0369a1}
    @media print{body{padding:16px}.card,h2{break-inside:avoid}tr{break-inside:avoid}}
  </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <p class="muted">ExpTrack · Generated ${format(new Date(), 'PPpp')}</p>
    <div class="meta">
      <span class="pill"><strong>Records</strong>${recordLabel}</span>
      <span class="pill"><strong>Currency</strong>${escapeHtml(primaryCurrency)}</span>
    </div>
    <div class="summary-grid">
      <div class="card"><strong>Total spending</strong><div class="total-value">${fmtAmount(
        total,
        primaryCurrency
      )}</div></div>
      <div class="card"><strong>Category breakdown</strong>
        <table><thead><tr><th>Category</th><th class="num">Amount</th></tr></thead>
        <tbody>${breakdownRows || '<tr><td>—</td><td class="num">—</td></tr>'}</tbody></table>
      </div>
    </div>
    <h2>Expense list</h2>
    <table>
      <colgroup>
        <col style="width:22%"/><col style="width:14%"/><col style="width:14%"/><col style="width:34%"/><col style="width:16%"/>
      </colgroup>
      <thead><tr>
        <th>Date</th><th>Category</th><th>Sub category</th><th>Note</th>
        <th class="num">Amount (${escapeHtml(primaryCurrency)})</th>
      </tr></thead>
      <tbody>${buildRowsHtml(expenses, categories, primaryCurrency)}</tbody>
      <tfoot><tr>
        <td colspan="4">Total (${recordLabel})</td>
        <td class="num">${fmtAmount(total, primaryCurrency)}</td>
      </tr></tfoot>
    </table>
  </body></html>`;
}

type SheetLayout = {
  colWidths: number[];
  freezeHeaderRow?: number;
  autofilterEndRow?: number;
};

function applySheetLayout(ws: XLSX.WorkSheet, layout: SheetLayout) {
  ws['!cols'] = layout.colWidths.map((wch) => ({ wch }));
  if (layout.freezeHeaderRow) {
    const y = layout.freezeHeaderRow;
    ws['!freeze'] = {
      xSplit: 0,
      ySplit: y,
      topLeftCell: `A${y + 1}`,
      activePane: 'bottomLeft',
      state: 'frozen',
    };
  }
  if (layout.autofilterEndRow && ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const endCol = XLSX.utils.encode_col(range.e.c);
    ws['!autofilter'] = { ref: `A1:${endCol}${layout.autofilterEndRow}` };
  }
}

function buildExcelReportSheet(params: {
  title: string;
  expenses: Expense[];
  breakdown: { name: string; total: number }[];
  total: number;
  primaryCurrency: string;
}) {
  const { title, expenses, breakdown, total, primaryCurrency } = params;
  const generated = format(new Date(), 'd MMMM yyyy, h:mm a');
  const rows: (string | number)[][] = [
    ['ExpTrack Expense Report'],
    [title],
    ['Generated', generated],
    ['Currency', primaryCurrency],
    ['Records', expenses.length],
    ['Total spending', total],
    [],
    ['Category breakdown'],
    ['Category', `Amount (${primaryCurrency})`],
    ...breakdown.map((b) => [b.name, b.total]),
  ];
  if (breakdown.length === 0) {
    rows.push(['—', 0]);
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  applySheetLayout(ws, { colWidths: [28, 18] });
  return ws;
}

function buildExcelExpensesSheet(params: {
  expenses: Expense[];
  categories: Category[];
  primaryCurrency: string;
  total: number;
}) {
  const { expenses, categories, primaryCurrency, total } = params;
  const catMap = categoryMap(categories);
  const currencyCol = `Amount (${primaryCurrency})`;

  const header = [
    'Date',
    'Time',
    'Category',
    'Sub category',
    'Note',
    currencyCol,
    'Txn currency',
    'Original amount',
  ];

  const sorted = sortExpensesLatestFirst(expenses);
  const dataRows = sorted.map((e) => {
    const d = new Date(e.createdAt);
    const showOriginal =
      e.currency !== primaryCurrency || Math.abs(e.originalAmount - e.amount) > 0.009;
    return [
      format(d, 'yyyy-MM-dd'),
      format(d, 'h:mm a'),
      catMap.get(e.categoryId) ?? '',
      e.subCategory?.trim() || '',
      e.note?.trim() || '',
      Math.round(e.amount * 100) / 100,
      e.currency,
      showOriginal ? Math.round(e.originalAmount * 100) / 100 : '',
    ];
  });

  const aoa: (string | number)[][] = [header, ...dataRows];
  if (dataRows.length === 0) {
    aoa.push(['No expenses in this report', '', '', '', '', 0, '', '']);
  } else {
    aoa.push([]);
    aoa.push(['', '', '', 'TOTAL', '', Math.round(total * 100) / 100, '', '']);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const headerRow = 1;
  const dataEndRow = headerRow + Math.max(dataRows.length, 1);
  applySheetLayout(ws, {
    colWidths: [12, 10, 14, 16, 32, 14, 12, 14],
    freezeHeaderRow: 1,
    autofilterEndRow: dataRows.length > 0 ? dataEndRow : undefined,
  });
  return ws;
}

function buildExcelWorkbook(params: {
  title: string;
  expenses: Expense[];
  categories: Category[];
  primaryCurrency: string;
}) {
  const breakdown = buildBreakdown(params.expenses, params.categories);
  const total = params.expenses.reduce((a, e) => a + e.amount, 0);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    buildExcelReportSheet({ ...params, breakdown, total }),
    'Report'
  );
  XLSX.utils.book_append_sheet(
    wb,
    buildExcelExpensesSheet({ ...params, total }),
    'Expenses'
  );
  return wb;
}

export async function exportPdfReport(params: {
  title: string;
  fileName: string;
  expenses: Expense[];
  categories: Category[];
  primaryCurrency: string;
}): Promise<ExportDeliveryResult> {
  const total = params.expenses.reduce((a, e) => a + e.amount, 0);
  const breakdown = buildBreakdown(params.expenses, params.categories);
  const html = reportHtml({ ...params, total, breakdown });
  const { fileName } = params;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { fileName, delivery: 'web-print' };
  }

  const { uri } = await Print.printToFileAsync({ html });
  const namedPath = await copyToNamedExportPath(uri, fileName);
  return deliverExportFile(namedPath, {
    mimeType: 'application/pdf',
    dialogTitle: params.title,
    fileName,
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function exportDocReport(params: {
  title: string;
  fileName: string;
  expenses: Expense[];
  categories: Category[];
  primaryCurrency: string;
}): Promise<ExportDeliveryResult> {
  const total = params.expenses.reduce((a, e) => a + e.amount, 0);
  const breakdown = buildBreakdown(params.expenses, params.categories);
  const html = reportHtml({ ...params, total, breakdown });
  const { fileName } = params;

  if (Platform.OS === 'web') {
    downloadTextOnWeb(html, 'application/msword', fileName);
    return { fileName, delivery: 'web-download' };
  }

  const path = `${getWritableDirectory()}${fileName}`;
  await FileSystem.writeAsStringAsync(path, html, { encoding: FileSystem.EncodingType.UTF8 });
  return deliverExportFile(path, {
    mimeType: 'application/msword',
    dialogTitle: params.title,
    fileName,
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function exportExcelReport(params: {
  title: string;
  fileName: string;
  expenses: Expense[];
  categories: Category[];
  primaryCurrency: string;
}): Promise<ExportDeliveryResult> {
  const wb = buildExcelWorkbook(params);
  const { fileName } = params;

  if (Platform.OS === 'web') {
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    downloadBase64OnWeb(
      wbout,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName
    );
    return { fileName, delivery: 'web-download' };
  }

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const path = `${getWritableDirectory()}${fileName}`;
  await FileSystem.writeAsStringAsync(path, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return deliverExportFile(path, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: params.title,
    fileName,
    encoding: FileSystem.EncodingType.Base64,
  });
}
