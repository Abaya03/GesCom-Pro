import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryNote, DeliveryStatus, DocumentItem } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Receipt,
  X,
  PlusCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { formatDate, getDeliveryStatusBadge } from '../../utils/formatters';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { exportToCsv } from '../../utils/exportUtils';

interface DeliveryNotesViewProps {
  onNavigateToDocument?: (tab: string, itemData?: unknown) => void;
}

export const DeliveryNotesView: React.FC<DeliveryNotesViewProps> = ({ onNavigateToDocument }) => {
  const {
    deliveryNotes,
    clients,
    products,
    companySettings,
    createDeliveryNote,
    updateDeliveryNote,
    deleteDeliveryNote,
    convertDeliveryNoteToInvoice,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBL, setEditingBL] = useState<DeliveryNote | null>(null);

  const [previewBL, setPreviewBL] = useState<DeliveryNote | null>(null);

  // Form State
  const [clientId, setClientId] = useState<string>(clients[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [orderReference, setOrderReference] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [carrier, setCarrier] = useState('Flotte Entreprise');
  const [driverName, setDriverName] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DocumentItem[]>([
    {
      id: 'item_1',
      code: '',
      designation: '',
      quantity: 1,
      quantityDelivered: 1,
      unit: 'U',
      unitPrice: 0,
      discountPercent: 0,
      vatRate: 16,
      totalHT: 0,
      totalVAT: 0,
      totalTTC: 0,
    },
  ]);

  const filteredBLs = useMemo(() => {
    return deliveryNotes.filter((b) => {
      const matchSearch =
        b.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.clientSnapshot?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.orderReference && b.orderReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.quoteNumber && b.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [deliveryNotes, searchQuery, statusFilter]);

  const handleOpenCreate = () => {
    setEditingBL(null);
    const client = clients[0];
    setClientId(client?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setOrderReference('');
    setDeliveryAddress(client ? `${client.address}, ${client.city}` : '');
    setCarrier('Flotte Entreprise');
    setDriverName('');
    setPreparedBy('');
    setNotes('');

    const firstProd = products[0];
    if (firstProd) {
      setItems([
        {
          id: 'item_' + Date.now(),
          productId: firstProd.id,
          code: firstProd.code,
          designation: firstProd.name,
          description: firstProd.description || '',
          quantity: 1,
          quantityDelivered: 1,
          unit: firstProd.unit,
          unitPrice: firstProd.sellingPrice,
          discountPercent: 0,
          vatRate: firstProd.vatRate,
          totalHT: firstProd.sellingPrice,
          totalVAT: 0,
          totalTTC: firstProd.sellingPrice,
        },
      ]);
    }
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bl: DeliveryNote) => {
    setEditingBL(bl);
    setClientId(bl.clientId);
    setDate(bl.date);
    setOrderReference(bl.orderReference || '');
    setDeliveryAddress(bl.deliveryAddress);
    setCarrier(bl.carrier || '');
    setDriverName(bl.driverName || '');
    setPreparedBy(bl.preparedBy || '');
    setNotes(bl.notes || '');
    setItems(bl.items);
    setIsFormOpen(true);
  };

  const handleSaveBL = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    if (editingBL) {
      updateDeliveryNote(editingBL.id, {
        clientId,
        date,
        orderReference,
        deliveryAddress,
        carrier,
        driverName,
        preparedBy,
        notes,
        items,
      });
    } else {
      createDeliveryNote({
        clientId,
        date,
        orderReference,
        deliveryAddress,
        carrier,
        driverName,
        preparedBy,
        notes,
        items,
        status: 'prepare',
      });
    }
    setIsFormOpen(false);
  };

  const handleConvertToInvoice = (bl: DeliveryNote) => {
    if (window.confirm(`Générer la facture pour le bon de livraison ${bl.number} ?`)) {
      const inv = convertDeliveryNoteToInvoice(bl.id);
      if (onNavigateToDocument) {
        onNavigateToDocument('invoices', inv);
      }
    }
  };

  const handleExportCSV = () => {
    const rows = deliveryNotes.map((b) => ({
      numero: b.number,
      date: b.date,
      client: b.clientSnapshot?.name || '',
      devis_origine: b.quoteNumber || '',
      facture_generee: b.convertedToInvoiceNumber || '',
      transporteur: b.carrier || '',
      statut: b.status,
    }));

    exportToCsv(
      rows,
      [
        { key: 'numero', label: 'Numéro BL' },
        { key: 'date', label: 'Date' },
        { key: 'client', label: 'Client' },
        { key: 'devis_origine', label: 'Devis Origine' },
        { key: 'facture_generee', label: 'Facture Générée' },
        { key: 'transporteur', label: 'Transporteur' },
        { key: 'statut', label: 'Statut' },
      ],
      `bons_livraison_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            <span>Bons de Livraison (BL)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Expéditions, conformité des réceptions clients, déstockage automatique et transformation en facture
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
          {hasPermission('manage_deliveries') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau BL</span>
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
            placeholder="Recherche par n° BL, client, référence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tous les statuts ({deliveryNotes.length})</option>
            <option value="prepare">Préparé</option>
            <option value="livre">Livré & Réceptionné</option>
            <option value="partiellement_livre">Partiellement livré</option>
            <option value="brouillon">Brouillon</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Numéro BL & Date</th>
                <th className="py-3 px-4">Client & Adresse de Livraison</th>
                <th className="py-3 px-4">Devis / Réf Commande</th>
                <th className="py-3 px-4">Lignes & Transport</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Facturation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBLs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Aucun bon de livraison trouvé.
                  </td>
                </tr>
              ) : (
                filteredBLs.map((bl) => {
                  const badge = getDeliveryStatusBadge(bl.status);
                  return (
                    <tr key={bl.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {bl.number}
                        </div>
                        <div className="text-[11px] text-slate-500">{formatDate(bl.date)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {bl.clientSnapshot?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{bl.deliveryAddress}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {bl.quoteNumber ? (
                          <span className="text-sky-600 font-semibold">{bl.quoteNumber}</span>
                        ) : bl.orderReference ? (
                          <span>{bl.orderReference}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{bl.items.length} article(s)</div>
                        {bl.driverName && <div className="text-[10px] text-slate-500">Chauffeur: {bl.driverName}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {bl.convertedToInvoiceNumber ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold">
                            Facturé : {bl.convertedToInvoiceNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">
                            Non facturé
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!bl.convertedToInvoiceNumber && (
                            <button
                              onClick={() => handleConvertToInvoice(bl)}
                              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition"
                              title="Transformer en Facture"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setPreviewBL(bl)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Aperçu & Imprimer BL"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {hasPermission('manage_deliveries') && (
                            <button
                              onClick={() => handleOpenEdit(bl)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('delete_records') && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Supprimer le bon de livraison ${bl.number} ?`)) {
                                  deleteDeliveryNote(bl.id);
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

      {/* CREATE / EDIT BL MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingBL ? `Modifier BL : ${editingBL.number}` : 'Nouveau Bon de Livraison (BL)'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBL} className="p-4 md:p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Client *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      const c = clients.find((x) => x.id === e.target.value);
                      if (c) setDeliveryAddress(`${c.address}, ${c.city}`);
                    }}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date de livraison</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Réf. Commande</label>
                  <input
                    type="text"
                    value={orderReference}
                    onChange={(e) => setOrderReference(e.target.value)}
                    placeholder="BC-2026-001"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Adresse de livraison</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Transporteur</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Chauffeur / Livreur</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Items in BL */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Article / Désignation</th>
                      <th className="p-2.5 w-24 text-center">Qté Commandée</th>
                      <th className="p-2.5 w-24 text-center">Qté Livrée</th>
                      <th className="p-2.5 w-20 text-center">Unité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {it.designation}
                          {it.code && <span className="text-[10px] text-slate-400 font-mono ml-2">({it.code})</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono font-semibold">{it.quantity}</td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={it.quantity}
                            value={it.quantityDelivered ?? it.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, quantityDelivered: val } : item))
                              );
                            }}
                            className="w-20 p-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-indigo-600"
                          />
                        </td>
                        <td className="p-2.5 text-center text-slate-500">{it.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Observations de livraison</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="État du colis, réserves éventuelles, signature..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer le BL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewBL && (
        <DocumentPreviewModal
          isOpen={!!previewBL}
          onClose={() => setPreviewBL(null)}
          type="bl"
          data={previewBL}
          company={companySettings}
        />
      )}
    </div>
  );
};
