import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote, QuoteStatus, DocumentItem } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Truck,
  Receipt,
  Printer,
  X,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDate, getQuoteStatusBadge } from '../../utils/formatters';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { exportToCsv } from '../../utils/exportUtils';

interface QuotesViewProps {
  onNavigateToDocument?: (tab: string, itemData?: unknown) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({ onNavigateToDocument }) => {
  const {
    quotes,
    clients,
    products,
    companySettings,
    createQuote,
    updateQuote,
    deleteQuote,
    updateQuoteStatus,
    convertQuoteToDeliveryNote,
    convertQuoteToInvoice,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Preview modal state
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  // Form State
  const [clientId, setClientId] = useState<string>(clients[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [object, setObject] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('7 jours ouvrés');
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

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchSearch =
        q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.clientSnapshot?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.object && q.object.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const handleOpenCreate = () => {
    setEditingQuote(null);
    const defaultClient = clients[0] || null;
    setClientId(defaultClient?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setExpiryDate(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setObject('');
    setSalesperson('');
    setDeliveryTime('7 jours ouvrés');
    setNotes('');
    setTerms(companySettings.termsAndConditions);
    setCurrency(companySettings.primaryCurrencyCode);
    setApplyVAT(true);
    setSelectedVatRate(16);

    // Initial first line
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
          code: 'GEN-01',
          designation: 'Article / Prestation',
          description: '',
          quantity: 1,
          unit: 'U',
          unitPrice: 1000,
          discountPercent: 0,
          vatRate: 16,
          totalHT: 1000,
          totalVAT: 160,
          totalTTC: 1160,
        },
      ]);
    }
    setIsFormOpen(true);
  };

  const handleOpenEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setClientId(quote.clientId);
    setDate(quote.date);
    setExpiryDate(quote.expiryDate);
    setObject(quote.object || '');
    setSalesperson(quote.salesperson || '');
    setDeliveryTime(quote.deliveryTime || '7 jours');
    setNotes(quote.notes || '');
    setTerms(quote.terms || companySettings.termsAndConditions);
    setCurrency(quote.currency || companySettings.primaryCurrencyCode);
    const hasVat = quote.applyVAT !== undefined ? quote.applyVAT : (quote.totalVAT > 0);
    setApplyVAT(hasVat);
    setSelectedVatRate(quote.vatRate || 16);
    setItems(quote.items);
    setIsFormOpen(true);
  };

  // Line item helpers
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

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Veuillez sélectionner un client.');
      return;
    }

    if (editingQuote) {
      updateQuote(editingQuote.id, {
        clientId,
        date,
        expiryDate,
        object,
        salesperson,
        deliveryTime,
        notes,
        terms,
        currency,
        applyVAT,
        vatRate: selectedVatRate,
        items,
      });
    } else {
      createQuote({
        clientId,
        date,
        expiryDate,
        object,
        salesperson,
        deliveryTime,
        notes,
        terms,
        currency,
        applyVAT,
        vatRate: selectedVatRate,
        items,
        status: 'en_attente',
      });
    }

    setIsFormOpen(false);
  };

  // Transformation actions
  const handleConvertToBL = (quote: Quote) => {
    if (window.confirm(`Voulez-vous générer un Bon de Livraison à partir du devis ${quote.number} ?`)) {
      const bl = convertQuoteToDeliveryNote(quote.id);
      if (onNavigateToDocument) {
        onNavigateToDocument('delivery', bl);
      }
    }
  };

  const handleConvertToInvoice = (quote: Quote) => {
    if (window.confirm(`Voulez-vous générer une Facture à partir du devis ${quote.number} ?`)) {
      const inv = convertQuoteToInvoice(quote.id);
      if (onNavigateToDocument) {
        onNavigateToDocument('invoices', inv);
      }
    }
  };

  const handleExportCSV = () => {
    const rows = quotes.map((q) => ({
      numero: q.number,
      date: q.date,
      client: q.clientSnapshot?.name || '',
      objet: q.object || '',
      total_ht: q.totalHT,
      total_tva: q.totalVAT,
      total_ttc: q.totalTTC,
      devise: q.currency,
      statut: q.status,
    }));

    exportToCsv(
      rows,
      [
        { key: 'numero', label: 'Numéro Devis' },
        { key: 'date', label: 'Date' },
        { key: 'client', label: 'Client' },
        { key: 'objet', label: 'Objet' },
        { key: 'total_ht', label: 'Total HT' },
        { key: 'total_tva', label: 'Total TVA' },
        { key: 'total_ttc', label: 'Total TTC' },
        { key: 'devise', label: 'Devise' },
        { key: 'statut', label: 'Statut' },
      ],
      `devis_${new Date().toISOString().split('T')[0]}`
    );
  };

  // Live totals calculation for form
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>Gestion des Devis Commerciaux</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Création, chiffrage, suivi des propositions et transformation en Bon de Livraison ou Facture
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
          {hasPermission('manage_quotes') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Devis</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche par numéro, client, objet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tous les statuts ({quotes.length})</option>
            <option value="en_attente">En attente</option>
            <option value="accepte">Accepté (Gagné)</option>
            <option value="refuse">Refusé / Perdu</option>
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé</option>
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Numéro & Date</th>
                <th className="py-3 px-4">Client & Destinataire</th>
                <th className="py-3 px-4">Objet de l'Offre</th>
                <th className="py-3 px-4 text-right">Total HT</th>
                <th className="py-3 px-4 text-right">Total TTC</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Liaison</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Aucun devis trouvé.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => {
                  const badge = getQuoteStatusBadge(quote.status);
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {quote.number}
                        </div>
                        <div className="text-[11px] text-slate-500">{formatDate(quote.date)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {quote.clientSnapshot?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{quote.clientSnapshot?.city}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs">
                        <div className="truncate font-medium">{quote.object || 'Fourniture & Prestations'}</div>
                        <div className="text-[10px] text-slate-400">{quote.items.length} article(s)</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(quote.totalHT, quote.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(quote.totalTTC, quote.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {quote.convertedToInvoiceNumber ? (
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-mono font-semibold">
                            FAC: {quote.convertedToInvoiceNumber}
                          </span>
                        ) : quote.convertedToBLNumber ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-mono font-semibold">
                            BL: {quote.convertedToBLNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Transform quick buttons */}
                          {quote.status !== 'annule' && (
                            <>
                              {!quote.convertedToBLNumber && (
                                <button
                                  onClick={() => handleConvertToBL(quote)}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                                  title="Générer Bon de Livraison (BL)"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!quote.convertedToInvoiceNumber && (
                                <button
                                  onClick={() => handleConvertToInvoice(quote)}
                                  className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition"
                                  title="Générer Facture"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => setPreviewQuote(quote)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Aperçu & Impression PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {hasPermission('manage_quotes') && (
                            <button
                              onClick={() => handleOpenEdit(quote)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('delete_records') && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Supprimer le devis ${quote.number} ?`)) {
                                  deleteQuote(quote.id);
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

      {/* CREATE / EDIT DEVIS FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingQuote ? `Édition Devis : ${editingQuote.number}` : 'Création d\'un Nouveau Devis'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="p-4 md:p-6 space-y-5 overflow-y-auto text-xs">
              {/* Client & Date parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Client *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
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
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date d'émission</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date d'expiration</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Objet du devis</label>
                  <input
                    type="text"
                    value={object}
                    onChange={(e) => setObject(e.target.value)}
                    placeholder="ex: Fourniture d'équipements informatiques et déploiement"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Commercial / Référent</label>
                  <input
                    type="text"
                    value={salesperson}
                    onChange={(e) => setSalesperson(e.target.value)}
                    placeholder="Nom du commercial"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Délai de livraison</label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="ex: 7 jours ouvrés"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Items Table Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                    Lignes d'articles et prestations
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 w-48">Article Catalogue</th>
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
                              placeholder="Désignation"
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

              {/* Totals Summary & Manual VAT Toggle */}
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
                          Activer ou désactiver le calcul de la TVA sur ce devis
                        </span>
                      </div>
                      <div className="inline-flex rounded-xl p-1 bg-slate-200 dark:bg-slate-700">
                        <button
                          type="button"
                          onClick={() => handleToggleApplyVat(true)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                            applyVAT
                              ? 'bg-amber-500 text-white shadow'
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
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Notes Internes / Mentions</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes particulières pour le client..."
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Conditions de validité & Règlement</label>
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
                  <div className="flex justify-between bg-amber-500 text-white p-3 rounded-xl font-bold text-sm shadow">
                    <span>{applyVAT ? 'TOTAL DEVIS TTC :' : 'TOTAL DEVIS HT :'}</span>
                    <span className="font-mono text-base">{formatCurrency(formTotalTTC, currency, companySettings.currencies)}</span>
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow"
                >
                  {editingQuote ? 'Mettre à jour le Devis' : 'Enregistrer le Devis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewQuote && (
        <DocumentPreviewModal
          isOpen={!!previewQuote}
          onClose={() => setPreviewQuote(null)}
          type="devis"
          data={previewQuote}
          company={companySettings}
        />
      )}
    </div>
  );
};
