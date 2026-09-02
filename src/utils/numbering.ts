import { NumberingConfig } from '../types';

/**
 * Generates formatted document number based on pattern, next sequence, and current year/month.
 * Pattern example: "FAC-{YEAR}-{NUMBER}" or "DEV/{YEAR}/{NUMBER}"
 */
export function generateDocumentNumber(config: NumberingConfig, date: Date = new Date()): {
  formattedNumber: string;
  nextConfig: NumberingConfig;
} {
  const year = date.getFullYear().toString();
  const shortYear = year.slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const numStr = config.nextNumber.toString().padStart(config.digits || 5, '0');
  
  let formatted = config.format || `${config.prefix}-{YEAR}-{NUMBER}`;
  formatted = formatted.replace(/{PREFIX}/g, config.prefix);
  formatted = formatted.replace(/{YEAR}/g, year);
  formatted = formatted.replace(/{YY}/g, shortYear);
  formatted = formatted.replace(/{MONTH}/g, month);
  formatted = formatted.replace(/{DAY}/g, day);
  formatted = formatted.replace(/{NUMBER}/g, numStr);

  if (config.suffix) {
    formatted = `${formatted}${config.suffix}`;
  }

  const nextConfig: NumberingConfig = {
    ...config,
    nextNumber: config.nextNumber + 1,
  };

  return { formattedNumber: formatted, nextConfig };
}

export function previewNumberFormat(config: NumberingConfig): string {
  const date = new Date();
  const year = date.getFullYear().toString();
  const shortYear = year.slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const numStr = (config.nextNumber || 1).toString().padStart(config.digits || 5, '0');
  
  let formatted = config.format || `${config.prefix}-{YEAR}-{NUMBER}`;
  formatted = formatted.replace(/{PREFIX}/g, config.prefix || 'DOC');
  formatted = formatted.replace(/{YEAR}/g, year);
  formatted = formatted.replace(/{YY}/g, shortYear);
  formatted = formatted.replace(/{MONTH}/g, month);
  formatted = formatted.replace(/{DAY}/g, day);
  formatted = formatted.replace(/{NUMBER}/g, numStr);
  
  if (config.suffix) {
    formatted = `${formatted}${config.suffix}`;
  }
  return formatted;
}
