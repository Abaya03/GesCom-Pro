import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Wallet,
  X,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportUtils';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    expenses,
    companySettings,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    companyName: string;
    category: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    phone2: string;
    email: string;
    nif: string;
    rccm: string;
    contactPerson: string;
    paymentTermsDays: number;
    currency: string;
    notes: string;
    active: boolean;
  }>({
    name: '',
    companyName: '',
    category: 'Matériel Informatique',
    address: '',
    city: 'Nouakchott',
    country: 'Mauritanie',
    phone: '',
    phone2: '',
    email: '',
    nif: '',
    rccm: '',
    contactPerson: '',
    paymentTermsDays: 30,
    currency: 'MRU',
    notes: '',
    active: true,
  });

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [suppliers, searchQuery]);

  const getSupplierPurchases = (supId: string) => {
    return expenses.filter((e) => e.supplierId === supId);
  };

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      companyName: '',
      category: 'Matériel Informatique',
      address: '',
      city: 'Nouakchott',
      country: 'Mauritanie',
      phone: '',
      phone2: '',
      email: '',
      nif: '',
      rccm: '',
      contactPerson: '',
      paymentTermsDays: 30,
      currency: companySettings.primaryCurrencyCode,
      notes: '',
      active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      companyName: sup.companyName || '',
      category: sup.category || 'Général',
      address: sup.address,
      city: sup.city,
      country: sup.country,
      phone: sup.phone,
      phone2: sup.phone2 || '',
      email: sup.email,
      nif: sup.nif || '',
      rccm: sup.rccm || '',
      contactPerson: sup.contactPerson || '',
      paymentTermsDays: sup.paymentTermsDays || 30,
      currency: sup.currency || companySettings.primaryCurrencyCode,
      notes: sup.notes || '',
      active: sup.active,
    });
    setIsFormOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      if (selectedSupplier?.id === editingSupplier.id) {
        setSelectedSupplier({ ...selectedSupplier, ...formData });
      }
    } else {
      addSupplier(formData);
    }
    setIsFormOpen(false);
  };

  const handleExportCSV = () => {
    const rows = suppliers.map((s) => {
      const p = getSupplierPurchases(s.id);
      const totalPurchases = p.reduce((acc, x) => acc + x.amountTTC, 0);
      return {
        code: s.code,
        nom: s.name,
        societe: s.companyName || '',
        telephone: s.phone,
        email: s.email,
        ville: s.city,
        total_achats_ttc: totalPurchases,
      };
    });

    exportToCsv(
      rows,
      [
        { key: 'code', label: 'Code Fournisseur' },
        { key: 'nom', label: 'Nom Fournisseur' },
        { key: 'societe', label: 'Société' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'email', label: 'Email' },
        { key: 'ville', label: 'Ville' },
        { key: 'total_achats_ttc', label: 'Total Achats TTC' },
      ],
      `fournisseurs_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <span>Gestion des Fournisseurs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Partenaires commerciaux, historique des achats et conditions fournisseurs
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
          {hasPermission('manage_suppliers') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Fournisseur</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, code, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Code & Fournisseur</th>
                <th className="py-3 px-4">Contact & Coordonnées</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-right">Total Achats TTC</th>
                <th className="py-3 px-4 text-center">Délai</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Aucun fournisseur trouvé.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => {
                  const purchases = getSupplierPurchases(sup.id);
                  const total = purchases.reduce((acc, p) => acc + p.amountTTC, 0);

                  return (
                    <tr key={sup.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-slate-500 font-bold">{sup.code}</div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{sup.name}</div>
                        {sup.companyName && <div className="text-[11px] text-slate-500">{sup.companyName}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {sup.phone}</div>
                        {sup.email && <div className="flex items-center gap-1.5 text-slate-500"><Mail className="w-3 h-3 text-slate-400" /> {sup.email}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {sup.category || 'Général'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(total, sup.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {sup.paymentTermsDays} jours
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSupplier(sup)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Historique des achats"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('manage_suppliers') && (
                            <button
                              onClick={() => handleOpenEdit(sup)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('delete_records') && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Supprimer le fournisseur ${sup.name} ?`)) {
                                  deleteSupplier(sup.id);
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

      {/* DETAIL MODAL */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="font-mono text-xs text-sky-400">{selectedSupplier.code}</span>
                <h3 className="font-bold text-base">{selectedSupplier.name}</h3>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                <div>NIF : <strong>{selectedSupplier.nif || 'Non renseigné'}</strong></div>
                <div>Adresse : <strong>{selectedSupplier.address}, {selectedSupplier.city} - {selectedSupplier.country}</strong></div>
                <div>Contact : <strong>{selectedSupplier.contactPerson || '-'} ({selectedSupplier.phone})</strong></div>
              </div>

              <div className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">
                Historique des Dépenses & Achats auprès de ce fournisseur
              </div>

              <div className="space-y-2">
                {getSupplierPurchases(selectedSupplier.id).length === 0 ? (
                  <p className="text-slate-400 text-center py-6">Aucun achat enregistré pour ce fournisseur.</p>
                ) : (
                  getSupplierPurchases(selectedSupplier.id).map((e) => (
                    <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-rose-600">{e.number}</span>
                        <div className="text-slate-700 dark:text-slate-300 font-medium">{e.description}</div>
                        <div className="text-[10px] text-slate-400">{formatDate(e.date)} • Facture: {e.supplierInvoiceNumber || 'Sans réf'}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-rose-600 text-sm">
                        {formatCurrency(e.amountTTC, e.currency, companySettings.currencies)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingSupplier ? `Modifier Fournisseur : ${editingSupplier.code}` : 'Nouveau Fournisseur'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-4 md:p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Raison Sociale / Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Cisco Systems Global SARL"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">NIF</label>
                  <input
                    type="text"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="ex: Matériel Informatique"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ville & Pays</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
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
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer le Fournisseur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
