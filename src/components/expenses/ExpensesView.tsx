import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Receipt,
  X,
  FileCheck,
  Building2,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportUtils';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    suppliers,
    addExpense,
    deleteExpense,
    companySettings,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Loyer & Locaux');
  const [description, setDescription] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [amountHT, setAmountHT] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(16);
  const [paymentMethod, setPaymentMethod] = useState<'espece' | 'cheque' | 'virement' | 'carte' | 'mobile_money'>('virement');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.supplierName && e.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.supplierInvoiceNumber && e.supplierInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const totalExpensesTTC = expenses.reduce((acc, e) => acc + e.amountTTC, 0);
  const totalVATDeductible = expenses.reduce((acc, e) => acc + e.amountVAT, 0);

  const handleOpenCreate = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Loyer & Locaux');
    setDescription('');
    setSupplierId('');
    setSupplierInvoiceNumber('');
    setAmountHT(0);
    setVatRate(companySettings.taxes.find((t) => t.isDefault)?.rate || 16);
    setPaymentMethod('virement');
    setPaymentReference('');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amountHT <= 0) return;

    const sup = suppliers.find((s) => s.id === supplierId);

    addExpense({
      date,
      category,
      description,
      supplierId: supplierId || undefined,
      supplierName: sup?.name,
      supplierInvoiceNumber: supplierInvoiceNumber || undefined,
      amountHT,
      amountVAT: amountHT * (vatRate / 100),
      amountTTC: amountHT * (1 + vatRate / 100),
      vatRate,
      currency: companySettings.primaryCurrencyCode,
      paymentMethod,
      paymentReference,
      notes,
    });

    setIsFormOpen(false);
  };

  const handleExportCSV = () => {
    const rows = expenses.map((e) => ({
      numero: e.number,
      date: e.date,
      categorie: e.category,
      description: e.description,
      fournisseur: e.supplierName || '',
      montant_ht: e.amountHT,
      montant_tva: e.amountVAT,
      montant_ttc: e.amountTTC,
      devise: e.currency,
      mode_reglement: e.paymentMethod,
    }));

    exportToCsv(
      rows,
      [
        { key: 'numero', label: 'N° Dépense' },
        { key: 'date', label: 'Date' },
        { key: 'categorie', label: 'Catégorie' },
        { key: 'description', label: 'Description' },
        { key: 'fournisseur', label: 'Fournisseur' },
        { key: 'montant_ht', label: 'Montant HT' },
        { key: 'montant_tva', label: 'TVA' },
        { key: 'montant_ttc', label: 'Montant TTC' },
        { key: 'devise', label: 'Devise' },
        { key: 'mode_reglement', label: 'Mode' },
      ],
      `depenses_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-600" />
            <span>Gestion des Dépenses & Achats</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrement des charges, achats fournisseurs, TVA déductible et pièces justificatives
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {hasPermission('manage_expenses') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer une Dépense</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Dépenses TTC</span>
          <div className="text-xl font-black text-rose-600 font-mono mt-1">
            {formatCurrency(totalExpensesTTC, companySettings.primaryCurrencyCode, companySettings.currencies)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{expenses.length} dépenses enregistrées</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-semibold uppercase">TVA Déductible</span>
          <div className="text-xl font-black text-sky-600 font-mono mt-1">
            {formatCurrency(totalVATDeductible, companySettings.primaryCurrencyCode, companySettings.currencies)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Récupérable sur déclaration</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-semibold uppercase">Dépense Moyenne</span>
          <div className="text-xl font-black text-slate-800 dark:text-white font-mono mt-1">
            {formatCurrency(
              expenses.length > 0 ? totalExpensesTTC / expenses.length : 0,
              companySettings.primaryCurrencyCode,
              companySettings.currencies
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Par pièce comptable</div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche par n°, description, fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Toutes les catégories ({expenses.length})</option>
            <option value="Loyer & Locaux">Loyer & Locaux</option>
            <option value="Matériel & Équipements">Matériel & Équipements</option>
            <option value="Télécoms & Internet">Télécoms & Internet</option>
            <option value="Transport & Carburant">Transport & Carburant</option>
            <option value="Salaires & Honoraires">Salaires & Honoraires</option>
            <option value="Publicité & Marketing">Publicité & Marketing</option>
            <option value="Fournitures de bureau">Fournitures de bureau</option>
            <option value="Impôts & Taxes">Impôts & Taxes</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">N° Dépense & Date</th>
                <th className="py-3 px-4">Catégorie & Description</th>
                <th className="py-3 px-4">Fournisseur & Facture</th>
                <th className="py-3 px-4 text-right">Montant HT</th>
                <th className="py-3 px-4 text-right">TVA</th>
                <th className="py-3 px-4 text-right">Montant TTC</th>
                <th className="py-3 px-4 text-center">Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Aucune dépense trouvée.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-rose-600 dark:text-rose-400">{e.number}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(e.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                        {e.category}
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{e.description}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {e.supplierName ? (
                        <div>
                          <div className="font-bold">{e.supplierName}</div>
                          {e.supplierInvoiceNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">Facture: {e.supplierInvoiceNumber}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Dépense directe</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(e.amountHT, e.currency, companySettings.currencies)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(e.amountVAT, e.currency, companySettings.currencies)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatCurrency(e.amountTTC, e.currency, companySettings.currencies)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {getPaymentMethodLabel(e.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasPermission('delete_records') && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Supprimer la dépense ${e.number} ?`)) {
                              deleteExpense(e.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Enregistrer une Nouvelle Dépense</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-4 md:p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Catégorie de Charge</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Loyer & Locaux">Loyer & Locaux</option>
                    <option value="Matériel & Équipements">Matériel & Équipements</option>
                    <option value="Télécoms & Internet">Télécoms & Internet</option>
                    <option value="Transport & Carburant">Transport & Carburant</option>
                    <option value="Salaires & Honoraires">Salaires & Honoraires</option>
                    <option value="Publicité & Marketing">Publicité & Marketing</option>
                    <option value="Fournitures de bureau">Fournitures de bureau</option>
                    <option value="Impôts & Taxes">Impôts & Taxes</option>
                    <option value="Autre">Autre charge</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description / Libellé *</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ex: Facture Fibre Optique Mauritel Avril"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Fournisseur</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">-- Aucun / Dépense diverse --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">N° Facture Fournisseur</label>
                  <input
                    type="text"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="ex: FAC-SUP-2026-981"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Montant HT *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amountHT}
                      onChange={(e) => setAmountHT(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Taux TVA (%)</label>
                    <select
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value={0}>0% (Exonéré)</option>
                      <option value={16}>16% (Taux Normal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Total TTC calculé</label>
                    <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-rose-600">
                      {formatCurrency(amountHT * (1 + vatRate / 100), companySettings.primaryCurrencyCode, companySettings.currencies)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mode de règlement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="espece">Espèces / Petite caisse</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="carte">Carte Bancaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Référence Transaction</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="ex: VIR-67123"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer la Dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
