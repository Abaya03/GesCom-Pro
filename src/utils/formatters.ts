import { CurrencyConfig, QuoteStatus, DeliveryStatus, InvoiceStatus, UserRole } from '../types';

export function formatCurrency(
  amount: number,
  currencyCodeOrConfig?: string | CurrencyConfig,
  currenciesList?: CurrencyConfig[]
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  let symbol = 'MRU';
  let position: 'before' | 'after' = 'after';
  let decimals = 2;

  if (typeof currencyCodeOrConfig === 'object' && currencyCodeOrConfig) {
    symbol = currencyCodeOrConfig.symbol || currencyCodeOrConfig.code;
    position = currencyCodeOrConfig.symbolPosition || 'after';
    decimals = currencyCodeOrConfig.decimals ?? 2;
  } else if (typeof currencyCodeOrConfig === 'string' && currenciesList) {
    const found = currenciesList.find((c) => c.code === currencyCodeOrConfig);
    if (found) {
      symbol = found.symbol || found.code;
      position = found.symbolPosition || 'after';
      decimals = found.decimals ?? 2;
    } else {
      symbol = currencyCodeOrConfig;
    }
  } else if (typeof currencyCodeOrConfig === 'string') {
    symbol = currencyCodeOrConfig;
  }

  const formattedNum = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getQuoteStatusBadge(status: QuoteStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'brouillon':
      return { label: 'Brouillon', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    case 'envoye':
      return { label: 'Envoyé', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'en_attente':
      return { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'accepte':
      return { label: 'Accepté', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'refuse':
      return { label: 'Refusé', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'expire':
      return { label: 'Expiré', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'annule':
      return { label: 'Annulé', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export function getDeliveryStatusBadge(status: DeliveryStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'brouillon':
      return { label: 'Brouillon', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    case 'prepare':
      return { label: 'Préparé', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'livre':
      return { label: 'Livré', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'partiellement_livre':
      return { label: 'Partiellement livré', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'annule':
      return { label: 'Annulé', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export function getInvoiceStatusBadge(status: InvoiceStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'brouillon':
      return { label: 'Brouillon', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    case 'emise':
      return { label: 'Émise / En attente', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
    case 'partiellement_payee':
      return { label: 'Partiellement payée', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'payee':
      return { label: 'Payée', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'en_retard':
      return { label: 'En retard', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'annulee':
      return { label: 'Annulée', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'virement':
      return 'Virement Bancaire';
    case 'cheque':
      return 'Chèque Bancaire';
    case 'espece':
      return 'Espèces';
    case 'mobile_money':
      return 'Mobile Money';
    case 'carte':
      return 'Carte Bancaire';
    default:
      return method;
  }
}

export function getUserRoleLabel(role: UserRole): { label: string; color: string } {
  switch (role) {
    case 'admin':
      return { label: 'Administrateur', color: 'bg-purple-100 text-purple-800' };
    case 'manager':
      return { label: 'Gestionnaire', color: 'bg-blue-100 text-blue-800' };
    case 'commercial':
      return { label: 'Commercial', color: 'bg-emerald-100 text-emerald-800' };
    case 'cashier':
      return { label: 'Caissier', color: 'bg-amber-100 text-amber-800' };
    case 'viewer':
      return { label: 'Consultation', color: 'bg-gray-100 text-gray-800' };
    default:
      return { label: role, color: 'bg-gray-100 text-gray-800' };
  }
}

// Convert numbers to French text for official document totals (e.g., "Arrêté la présente facture à la somme de...")
export function numberToFrenchWords(n: number): string {
  if (isNaN(n)) return '';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function convertGroup(num: number): string {
    let out = '';
    const h = Math.floor(num / 100);
    const remainder = num % 100;

    if (h > 0) {
      if (h === 1) {
        out += 'cent ';
      } else {
        out += `${units[h]} cent${remainder === 0 ? 's' : ''} `;
      }
    }

    if (remainder > 0) {
      if (remainder < 10) {
        out += units[remainder] + ' ';
      } else if (remainder < 20) {
        out += teens[remainder - 10] + ' ';
      } else {
        const t = Math.floor(remainder / 10);
        const u = remainder % 10;

        if (t === 7) {
          out += `soixante-${u === 1 ? 'et-onze' : teens[u]} `;
        } else if (t === 9) {
          out += `quatre-vingt-${teens[u]} `;
        } else {
          if (u === 1 && t < 8) {
            out += `${tens[t]}-et-un `;
          } else if (u === 0) {
            out += `${tens[t]}${t === 8 ? 's' : ''} `;
          } else {
            out += `${tens[t]}-${units[u]} `;
          }
        }
      }
    }

    return out.trim();
  }

  const integerPart = Math.floor(Math.abs(n));
  const decimalPart = Math.round((Math.abs(n) - integerPart) * 100);

  if (integerPart === 0) return 'zéro';

  let result = '';
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const hundreds = integerPart % 1000;

  if (millions > 0) {
    if (millions === 1) {
      result += 'un million ';
    } else {
      result += `${convertGroup(millions)} millions `;
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      result += 'mille ';
    } else {
      result += `${convertGroup(thousands)} mille `;
    }
  }

  if (hundreds > 0) {
    result += `${convertGroup(hundreds)} `;
  }

  let finalWords = result.trim();
  if (decimalPart > 0) {
    finalWords += ` virgule ${convertGroup(decimalPart)}`;
  }

  return finalWords.charAt(0).toUpperCase() + finalWords.slice(1);
}
