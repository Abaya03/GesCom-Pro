import { BackupData } from '../types';

export function exportToJsonFile(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv(
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; label: string }>,
  filename: string
) {
  if (!rows || rows.length === 0) return;

  const header = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(';');
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          let val = row[col.key];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(';')
    )
    .join('\r\n');

  const csvContent = '\uFEFF' + header + '\r\n' + body;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Fichier de sauvegarde invalide ou corrompu. ' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
    reader.readAsText(file);
  });
}

export function exportCompanyDataAsJson(data: unknown, filename: string) {
  exportToJsonFile(data, `${filename}.json`);
}

export function importCompanyDataFromJson(
  file: File,
  onSuccess: (data: BackupData) => void,
  onError: (err: Error) => void
) {
  readJsonFile(file)
    .then((data) => onSuccess(data))
    .catch((err) => onError(err));
}
