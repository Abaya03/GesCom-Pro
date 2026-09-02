import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus, DocumentItem } from '../../types';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  CreditCard,
  X,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceStatusBadge } from '../../utils/formatters';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { exportToCsv } from '../../utils/exportUtils';

interface InvoicesViewProps {
  onNavigateToDocument?: (tab: string, itemData?: unknown) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onNavigateToDocument }) => {
  const {
    invoices,
    clients,
    products,
    companySettings,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Preview modal
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Payment quick modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'espece' | 'cheque' | 'virement' | 'carte' | 'mobile_money'>('virement');
  const [paymentRef, setPaymentRef] = useState('');

  // Form State
  const [clientId, setClientId] = useState<string>(clients[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [orderReference, setOrderReference] = useState('');
  const [paymentConditions, setPaymentConditions] = useState('30 jours fin de mois');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(companySettings.termsAndConditions);
  const [currency, setCurrency] = useState(companySettings.primaryCurrencyCode);
  const [applyVAT, setApplyVAT] = useState<boolean>(true);
  const [selectedVatRate, setSelectedVatRate] = useState<number>(16);
  const [items, setItems] = useState<DocumentItem[]>([
    {
      id: 'item_1',
      code: '',
      designation: '',
      description: '',
      quantity: 1,
      unit: 'U',
      unitPrice: 0,
      discountPercent: 0,
      vatRate: 16,
      totalHT: 0,
      totalVAT: 0,
      totalTTC: 0,
    },
  ]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientSnapshot?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleOpenCreate = () => {
    setEditingInvoice(null);
    const client = clients[0];
    setClientId(client?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    const due = new Date(Date.now() + (client?.paymentTermsDays || 30) * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];
    setDueDate(due);
    setOrderReference('');
    setPaymentConditions(`${client?.paymentTermsDays || 30} jours`);
    setNotes('');
    setTerms(companySettings.termsAndConditions);
    setCurrency(client?.currency || companySettings.primaryCurrencyCode);
    setApplyVAT(true);
    setSelectedVatRate(16);

    const firstProd = products[0];
    if (firstProd) {
      const ht = firstProd.sellingPrice;
      const vat = ht * 0.16;
      setItems([
        {
          id: 'item_' + Date.now(),
          productId: firstProd.id,
          code: firstProd.code,
          designation: firstProd.name,
          description: firstProd.description || '',
          quantity: 1,
          unit: firstProd.unit,
          unitPrice: firstProd.sellingPrice,
          discountPercent: 0,
          vatRate: 16,
          totalHT: ht,
          totalVAT: vat,
          totalTTC: ht + vat,
        },
      ]);
    } else {
      setItems([
        {
          id: 'item_' + Date.now(),
          code: 'SERV-01',
          designation: 'Prestation Informatique',
          description: '',
          quantity: 1,
          unit: 'U',
          unitPrice: 5000,
          discountPercent: 0,
          vatRate: 16,
          totalHT: 5000,
          totalVAT: 800,
          totalTTC: 5800,
        },
      ]);
    }
    setIsFormOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setClientId(inv.clientId);
    setDate(inv.date);
    setDueDate(inv.dueDate);
    setOrderReference(inv.orderReference || '');
    setPaymentConditions(inv.paymentConditions || '');
    setNotes(inv.notes || '');
    setTerms(inv.terms || companySettings.termsAndConditions);
    setCurrency(inv.currency || companySettings.primaryCurrencyCode);
    const hasVat = inv.applyVAT !== undefined ? inv.applyVAT : (inv.totalVAT > 0);
    setApplyVAT(hasVat);
    setSelectedVatRate(inv.vatRate || 16);
    setItems(inv.items);
    setIsFormOpen(true);
  };

  const handleItemProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const qty = item.quantity || 1;
          const ht = qty * prod.sellingPrice;
          const vat = applyVAT ? ht * (selectedVatRate / 100) : 0;

          return {
            ...item,
            productId: prod.id,
            code: prod.code,
            designation: prod.name,
            description: prod.description || '',
            unit: prod.unit,
            unitPrice: prod.sellingPrice,
            discountPercent: 0,
            vatRate: applyVAT ? selectedVatRate : 0,
            totalHT: ht,
            totalVAT: vat,
            totalTTC: ht + vat,
          };
        }
        return item;
      })
    );
  };

  const handleItemChange = (index: number, field: keyof DocumentItem, value: unknown) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const updated = { ...item, [field]: value };
          const qty = Number(updated.quantity) || 0;
          const price = Number(updated.unitPrice) || 0;
          const ht = qty * price;
          const vat = applyVAT ? ht * (selectedVatRate / 100) : 0;

          updated.discountPercent = 0;
          updated.vatRate = applyVAT ? selectedVatRate : 0;
          updated.totalHT = ht;
          updated.totalVAT = vat;
          updated.totalTTC = ht + vat;
          return updated;
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'item_' + Date.now(),
        code: '',
        designation: '',
        description: '',
        quantity: 1,
        unit: 'U',
        unitPrice: 0,
        discountPercent: 0,
        vatRate: applyVAT ? selectedVatRate : 0,
        totalHT: 0,
        totalVAT: 0,
        totalTTC: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        clientId,
        date,
        dueDate,
        orderReference,
        paymentConditions,
        notes,
        terms,
        currency,
        applyVAT,
        vatRate: selectedVatRate,
        items,
      });
    } else {
      createInvoice({
        clientId,
        date,
        dueDate,
        orderReference,
        paymentConditions,
        notes,
        terms,
        currency,
        applyVAT,
        vatRate: selectedVatRate,
        items,
        status: 'emise',
      });
    }
    setIsFormOpen(false);
  };

  // Encaisser règlement
  const handleOpenPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPaymentAmount(inv.remainingAmount > 0 ? inv.remainingAmount : inv.totalTTC);
    setPaymentMethod('virement');
    setPaymentRef('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || paymentAmount <= 0) return;

    addPayment({
      invoiceId: paymentInvoice.id,
      clientId: paymentInvoice.clientId,
      amount: paymentAmount,
      currency: paymentInvoice.currency,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      reference: paymentRef,
      bankAccount: 'Compte Principal Société',
      notes: `Règlement pour facture ${paymentInvoice.number}`,
    });

    setPaymentInvoice(null);
  };

  const handleExportCSV = () => {
    const rows = invoices.map((inv) => ({
      numero: inv.number,
      date: inv.date,
      echeance: inv.dueDate,
      client: inv.clientSnapshot?.name || '',
      total_ht: inv.totalHT,
      total_tva: inv.totalVAT,
      total_ttc: inv.totalTTC,
      paye: inv.paidAmount,
      reste_du: inv.remainingAmount,
      devise: inv.currency,
      statut: inv.status,
    }));

    exportToCsv(
      rows,
      [
        { key: 'numero', label: 'N° Facture' },
        { key: 'date', label: 'Date Émission' },
        { key: 'echeance', label: 'Échéance' },
        { key: 'client', label: 'Client' },
        { key: 'total_ht', label: 'Total HT' },
        { key: 'total_tva', label: 'Total TVA' },
        { key: 'total_ttc', label: 'Total TTC' },
        { key: 'paye', label: 'Montant Payé' },
        { key: 'reste_du', label: 'Reste Dû' },
        { key: 'devise', label: 'Devise' },
        { key: 'statut', label: 'Statut' },
      ],
      `factures_${new Date().toISOString().split('T')[0]}`
    );
  };

  // Form Live Totals
  const formSubtotalHT = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const formTotalHT = formSubtotalHT;
  const formTotalVAT = applyVAT ? Math.round(formTotalHT * (selectedVatRate / 100) * 100) / 100 : 0;
  const formTotalTTC = formTotalHT + formTotalVAT;

  const handleToggleApplyVat = (apply: boolean) => {
    setApplyVAT(apply);
    setItems((prev) =>
      prev.map((it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice) || 0;
        const ht = qty * price;
        const vat = apply ? Math.round(ht * (selectedVatRate / 100) * 100) / 100 : 0;
        return {
          ...it,
          discountPercent: 0,
          vatRate: apply ? selectedVatRate : 0,
          totalHT: ht,
          totalVAT: vat,
          totalTTC: ht + vat,
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-600" />
            <span>Gestion de la Facturation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Émission des factures légales, suivi des échéances, relances et encaissement direct des paiements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {hasPermission('manage_invoices') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Facture</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° Facture, client, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tous les statuts ({invoices.length})</option>
            <option value="emise">Émise (Non payée)</option>
            <option value="partiellement_payee">Partiellement payée</option>
            <option value="payee">Payée / Soldée</option>
            <option value="en_retard">En retard (Impayée)</option>
            <option value="brouillon">Brouillon</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Numéro & Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4 text-right">Montant TTC</th>
                <th className="py-3 px-4 text-right">Payé</th>
                <th className="py-3 px-4 text-right">Reste Dû</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Aucune facture trouvée.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const badge = getInvoiceStatusBadge(inv.status);
                  const isOverdue = inv.status === 'en_retard';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                          {inv.number}
                        </div>
                        <div className="text-[11px] text-slate-500">{formatDate(inv.date)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {inv.clientSnapshot?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{inv.clientSnapshot?.city}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                          {formatDate(inv.dueDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.totalTTC, inv.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {formatCurrency(inv.paidAmount, inv.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {inv.remainingAmount > 0 ? (
                          <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                            {formatCurrency(inv.remainingAmount, inv.currency, companySettings.currencies)}
                          </span>
                        ) : (
                          <span className="text-emerald-600">0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Payment Button */}
                          {inv.remainingAmount > 0 && inv.status !== 'annulee' && hasPermission('manage_payments') && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                              title="Encaisser un paiement"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Aperçu & Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {hasPermission('manage_invoices') && (
                            <button
                              onClick={() => handleOpenEdit(inv)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('delete_records') && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Supprimer la facture ${inv.number} ?`)) {
                                  deleteInvoice(inv.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT INVOICE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">
                  {editingInvoice ? `Édition Facture : ${editingInvoice.number}` : 'Création d\'une Nouvelle Facture'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-4 md:p-6 space-y-5 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Client *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      const cl = clients.find((c) => c.id === e.target.value);
                      if (cl) {
                        const days = cl.paymentTermsDays || 30;
                        setPaymentConditions(`${days} jours`);
                        const d = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().split('T')[0];
                        setDueDate(d);
                      }
                    }}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - {c.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date Facture</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date d'Échéance</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sky-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Réf. Bon de Commande / Contrat</label>
                  <input
                    type="text"
                    value={orderReference}
                    onChange={(e) => setOrderReference(e.target.value)}
                    placeholder="BC-2026-CLIENT-09"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Conditions de règlement</label>
                  <input
                    type="text"
                    value={paymentConditions}
                    onChange={(e) => setPaymentConditions(e.target.value)}
                    placeholder="ex: 30 jours fin de mois par virement bancaire"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                    Lignes de Facturation
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-bold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 w-48">Catalogue</th>
                        <th className="p-2.5">Désignation</th>
                        <th className="p-2.5 w-20 text-center">Qté</th>
                        <th className="p-2.5 w-20 text-center">Unité</th>
                        <th className="p-2.5 w-32 text-right">Prix Unit HT ({currency})</th>
                        <th className="p-2.5 w-32 text-right">Montant HT ({currency})</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="p-2">
                            <select
                              value={it.productId || ''}
                              onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            >
                              <option value="">-- Choisir --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={it.designation}
                              onChange={(e) => handleItemChange(idx, 'designation', e.target.value)}
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-full p-1.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={it.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full p-1.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={it.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(it.totalHT, currency, companySettings.currencies)}
                          </td>
                          <td className="p-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Manual VAT Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
                <div className="space-y-3">
                  {/* Manual VAT Toggle Box */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">
                          Calcul de la TVA (Manuel)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Activer ou désactiver le calcul de la TVA sur cette facture
                        </span>
                      </div>
                      <div className="inline-flex rounded-xl p-1 bg-slate-200 dark:bg-slate-700">
                        <button
                          type="button"
                          onClick={() => handleToggleApplyVat(true)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                            applyVAT
                              ? 'bg-sky-600 text-white shadow'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          OUI (16%)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleApplyVat(false)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                            !applyVAT
                              ? 'bg-slate-600 text-white shadow'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          NON (0%)
                        </button>
                      </div>
                    </div>

                    {applyVAT && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Taux de TVA appliqué :</span>
                        <select
                          value={selectedVatRate}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 16;
                            setSelectedVatRate(rate);
                            setItems((prev) =>
                              prev.map((it) => ({
                                ...it,
                                vatRate: rate,
                                totalVAT: Math.round(it.totalHT * (rate / 100) * 100) / 100,
                                totalTTC: it.totalHT + Math.round(it.totalHT * (rate / 100) * 100) / 100,
                              }))
                            );
                          }}
                          className="p-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        >
                          <option value="16">16% (Standard Mauritanie)</option>
                          <option value="10">10% (Intermédiaire)</option>
                          <option value="5">5% (Réduite)</option>
                          <option value="0">0% (Exonéré)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Notes Internes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Conditions de règlement légales</label>
                    <textarea
                      rows={2}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                    <span>Total Brut HT :</span>
                    <span className="font-mono">{formatCurrency(formTotalHT, currency, companySettings.currencies)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{applyVAT ? `TVA Mauritanie (${selectedVatRate}%) :` : 'TVA (Exonérée / Non soumise) :'}</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {applyVAT
                        ? formatCurrency(formTotalVAT, currency, companySettings.currencies)
                        : `0,00 ${currency}`}
                    </span>
                  </div>
                  <div className="flex justify-between bg-sky-600 text-white p-3 rounded-xl font-bold text-sm shadow">
                    <span>{applyVAT ? 'TOTAL FACTURE TTC :' : 'TOTAL FACTURE HT :'}</span>
                    <span className="font-mono text-base">{formatCurrency(formTotalTTC, currency, companySettings.currencies)}</span>
                  </div>
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow"
                >
                  {editingInvoice ? 'Mettre à jour la Facture' : 'Émettre la Facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PAYMENT RECORD MODAL */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Enregistrer un Règlement</h3>
                <span className="text-xs text-sky-400 font-mono">Facture {paymentInvoice.number}</span>
              </div>
              <button onClick={() => setPaymentInvoice(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-4 space-y-4 text-xs">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl space-y-1">
                <div className="text-slate-600 dark:text-slate-400">Client : <strong className="text-slate-900 dark:text-white">{paymentInvoice.clientSnapshot?.name}</strong></div>
                <div className="text-slate-600 dark:text-slate-400">Reste à payer : <strong className="text-rose-600 font-mono">{formatCurrency(paymentInvoice.remainingAmount, paymentInvoice.currency, companySettings.currencies)}</strong></div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Montant Encaissé *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentInvoice.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-base text-emerald-600"
                />
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
                  <option value="espece">Espèces / Caisse</option>
                  <option value="mobile_money">Mobile Money (Bankily / Masrvi / Sedad)</option>
                  <option value="carte">Carte Bancaire (GIM-TEL / TPE)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Référence Transaction / N° Chèque</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="ex: VIR-BNM-98124 ou CHQ-0012938"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                >
                  Valider l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewInvoice && (
        <DocumentPreviewModal
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          type="facture"
          data={previewInvoice}
          company={companySettings}
        />
      )}
    </div>
  );
};
