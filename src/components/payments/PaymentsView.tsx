import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import {
  CreditCard,
  Search,
  Filter,
  Printer,
  Trash2,
  Receipt,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '../../utils/formatters';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { exportToCsv } from '../../utils/exportUtils';

export const PaymentsView: React.FC = () => {
  const { payments, deletePayment, companySettings, hasPermission } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientSnapshot?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  const handleExportCSV = () => {
    const rows = payments.map((p) => ({
      recu_numero: p.number,
      date: p.date,
      client: p.clientSnapshot?.name || '',
      facture_numero: p.invoiceNumber,
      montant: p.amount,
      devise: p.currency,
      mode_reglement: p.paymentMethod,
      reference: p.reference || '',
      compte_bancaire: p.bankAccount || '',
    }));

    exportToCsv(
      rows,
      [
        { key: 'recu_numero', label: 'N° Reçu' },
        { key: 'date', label: 'Date Règlement' },
        { key: 'client', label: 'Client' },
        { key: 'facture_numero', label: 'Facture Liée' },
        { key: 'montant', label: 'Montant Encaissé' },
        { key: 'devise', label: 'Devise' },
        { key: 'mode_reglement', label: 'Mode' },
        { key: 'reference', label: 'Réf Transaction' },
        { key: 'compte_bancaire', label: 'Compte' },
      ],
      `reglements_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Journal des Règlements & Paiements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Traçabilité intégrale des encaissements clients, reçus de paiement et rapprochement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-right">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">Total Encaissé</span>
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {formatCurrency(totalCollected, companySettings.primaryCurrencyCode, companySettings.currencies)}
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche par reçu, client, n° facture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tous les modes ({payments.length})</option>
            <option value="virement">Virement Bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="espece">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="carte">Carte Bancaire</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">N° Reçu & Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Facture Rattachée</th>
                <th className="py-3 px-4">Mode & Réf</th>
                <th className="py-3 px-4 text-right">Montant Encaissé</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Aucun paiement enregistré.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.number}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(p.date)}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {p.clientSnapshot?.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{getPaymentMethodLabel(p.paymentMethod)}</div>
                      {p.reference && <div className="text-[10px] text-slate-500 font-mono">Réf: {p.reference}</div>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                      + {formatCurrency(p.amount, p.currency, companySettings.currencies)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewPayment(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Imprimer Reçu de Caisse / Paiement"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {hasPermission('delete_records') && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Supprimer le paiement ${p.number} ?`)) {
                                deletePayment(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Annuler Paiement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW RECEIPT MODAL */}
      {previewPayment && (
        <DocumentPreviewModal
          isOpen={!!previewPayment}
          onClose={() => setPreviewPayment(null)}
          type="recu"
          data={previewPayment}
          company={companySettings}
        />
      )}
    </div>
  );
};
