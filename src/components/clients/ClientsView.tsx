import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientType } from '../../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Truck,
  Receipt,
  CreditCard,
  Building2,
  CheckCircle2,
  X,
  Clock,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceStatusBadge, getQuoteStatusBadge } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportUtils';

interface ClientsViewProps {
  onNavigateToDocument?: (tab: string, itemData?: unknown) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onNavigateToDocument }) => {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    quotes,
    deliveryNotes,
    invoices,
    payments,
    companySettings,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeClientTab, setActiveClientTab] = useState<'info' | 'quotes' | 'deliveries' | 'invoices' | 'payments' | 'statement'>('info');

  // Client form state
  const [formData, setFormData] = useState<{
    name: string;
    companyName: string;
    type: ClientType;
    address: string;
    city: string;
    country: string;
    phone: string;
    phone2: string;
    email: string;
    nif: string;
    rccm: string;
    contactPerson: string;
    contactRole: string;
    paymentTermsDays: number;
    creditLimit: number;
    defaultDiscount: number;
    currency: string;
    notes: string;
    active: boolean;
  }>({
    name: '',
    companyName: '',
    type: 'company',
    address: '',
    city: 'Nouakchott',
    country: 'Mauritanie',
    phone: '',
    phone2: '',
    email: '',
    nif: '',
    rccm: '',
    contactPerson: '',
    contactRole: '',
    paymentTermsDays: 30,
    creditLimit: 1000000,
    defaultDiscount: 0,
    currency: 'MRU',
    notes: '',
    active: true,
  });

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [clients, searchQuery, typeFilter]);

  // Compute individual client financials
  const getClientFinancials = (clientId: string) => {
    const clientInvoices = invoices.filter((i) => i.clientId === clientId && i.status !== 'annulee');
    const clientPayments = payments.filter((p) => p.clientId === clientId);
    const clientQuotes = quotes.filter((q) => q.clientId === clientId);
    const clientDeliveries = deliveryNotes.filter((d) => d.clientId === clientId);

    const totalInvoiced = clientInvoices.reduce((acc, i) => acc + i.totalTTC, 0);
    const totalPaid = clientInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const totalOutstanding = clientInvoices.reduce((acc, i) => acc + i.remainingAmount, 0);

    return {
      invoices: clientInvoices,
      payments: clientPayments,
      quotes: clientQuotes,
      deliveries: clientDeliveries,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
    };
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      companyName: '',
      type: 'company',
      address: '',
      city: 'Nouakchott',
      country: 'Mauritanie',
      phone: '',
      phone2: '',
      email: '',
      nif: '',
      rccm: '',
      contactPerson: '',
      contactRole: '',
      paymentTermsDays: 30,
      creditLimit: 1000000,
      defaultDiscount: 0,
      currency: companySettings.primaryCurrencyCode,
      notes: '',
      active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      companyName: client.companyName || '',
      type: client.type,
      address: client.address,
      city: client.city,
      country: client.country,
      phone: client.phone,
      phone2: client.phone2 || '',
      email: client.email,
      nif: client.nif || '',
      rccm: client.rccm || '',
      contactPerson: client.contactPerson || '',
      contactRole: client.contactRole || '',
      paymentTermsDays: client.paymentTermsDays || 30,
      creditLimit: client.creditLimit || 0,
      defaultDiscount: client.defaultDiscount || 0,
      currency: client.currency || companySettings.primaryCurrencyCode,
      notes: client.notes || '',
      active: client.active,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, formData);
      if (selectedClient?.id === editingClient.id) {
        setSelectedClient({ ...selectedClient, ...formData });
      }
    } else {
      addClient(formData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (client: Client) => {
    if (window.confirm(`Confirmez-vous la suppression du client ${client.name} (${client.code}) ?`)) {
      deleteClient(client.id);
      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
      }
    }
  };

  const handleExportClients = () => {
    const rows = clients.map((c) => {
      const f = getClientFinancials(c.id);
      return {
        code: c.code,
        nom: c.name,
        societe: c.companyName || '',
        type: c.type,
        telephone: c.phone,
        email: c.email,
        ville: c.city,
        nif: c.nif || '',
        rccm: c.rccm || '',
        total_facture: f.totalInvoiced,
        total_encaisse: f.totalPaid,
        creance_actuelle: f.totalOutstanding,
      };
    });

    exportToCsv(
      rows,
      [
        { key: 'code', label: 'Code Client' },
        { key: 'nom', label: 'Nom Client' },
        { key: 'societe', label: 'Société' },
        { key: 'type', label: 'Type' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'email', label: 'Email' },
        { key: 'ville', label: 'Ville' },
        { key: 'nif', label: 'NIF' },
        { key: 'rccm', label: 'RCCM' },
        { key: 'total_facture', label: 'Total Facturé TTC' },
        { key: 'total_encaisse', label: 'Total Encaissé' },
        { key: 'creance_actuelle', label: 'Solde Dû' },
      ],
      `clients_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Gestion des Clients</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Répertoire commercial, conditions de règlement, historique complet et suivi des créances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportClients}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {hasPermission('manage_clients') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, code, tél, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Tous les types ({clients.length})</option>
            <option value="company">Entreprises / Sociétés</option>
            <option value="administration">Administrations publiques</option>
            <option value="particular">Particuliers</option>
          </select>
        </div>
      </div>

      {/* Clients Grid / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Code & Client</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contact & Coordonnées</th>
                <th className="py-3 px-4 text-right">Total Facturé</th>
                <th className="py-3 px-4 text-right">Solde Dû</th>
                <th className="py-3 px-4 text-center">Conditions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Aucun client trouvé avec ces critères.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const fin = getClientFinancials(client.id);
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-sky-600 font-bold">{client.code}</div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{client.name}</div>
                        {client.companyName && client.companyName !== client.name && (
                          <div className="text-[11px] text-slate-500">{client.companyName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {client.type === 'company' ? 'Entreprise' : client.type === 'administration' ? 'Admin' : 'Particulier'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {client.phone}</div>
                        {client.email && <div className="flex items-center gap-1.5 text-slate-500"><Mail className="w-3 h-3 text-slate-400" /> {client.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(fin.totalInvoiced, client.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {fin.totalOutstanding > 0 ? (
                          <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                            {formatCurrency(fin.totalOutstanding, client.currency, companySettings.currencies)}
                          </span>
                        ) : (
                          <span className="text-emerald-600">0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {client.paymentTermsDays === 0 ? 'Comptant' : `${client.paymentTermsDays} jours`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Historique & Fiche"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('manage_clients') && (
                            <button
                              onClick={() => handleOpenEdit(client)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('delete_records') && (
                            <button
                              onClick={() => handleDelete(client)}
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

      {/* DETAIL CLIENT MODAL WITH MULTI-TAB HISTORY */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 md:p-6 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <span className="text-xs font-mono bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded">
                  {selectedClient.code}
                </span>
                <h2 className="text-lg md:text-xl font-bold text-white mt-1">{selectedClient.name}</h2>
                <p className="text-xs text-slate-400">{selectedClient.address}, {selectedClient.city} - {selectedClient.country}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial summary bar */}
            {(() => {
              const fin = getClientFinancials(selectedClient.id);
              return (
                <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Total Facturé TTC</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm font-mono mt-0.5">
                      {formatCurrency(fin.totalInvoiced, selectedClient.currency, companySettings.currencies)}
                    </div>
                  </div>
                  <div>
                    <span className="text-emerald-600 text-[11px] font-semibold">Total Encaissé</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono mt-0.5">
                      {formatCurrency(fin.totalPaid, selectedClient.currency, companySettings.currencies)}
                    </div>
                  </div>
                  <div>
                    <span className="text-rose-600 text-[11px] font-semibold">Solde / Créance Restante</span>
                    <div className="font-bold text-rose-600 dark:text-rose-400 text-sm font-mono mt-0.5">
                      {formatCurrency(fin.totalOutstanding, selectedClient.currency, companySettings.currencies)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveClientTab('info')}
                className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
                  activeClientTab === 'info' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Informations & NIF
              </button>
              <button
                onClick={() => setActiveClientTab('quotes')}
                className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
                  activeClientTab === 'quotes' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Devis ({getClientFinancials(selectedClient.id).quotes.length})
              </button>
              <button
                onClick={() => setActiveClientTab('deliveries')}
                className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
                  activeClientTab === 'deliveries' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Bons de Livraison ({getClientFinancials(selectedClient.id).deliveries.length})
              </button>
              <button
                onClick={() => setActiveClientTab('invoices')}
                className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
                  activeClientTab === 'invoices' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Factures ({getClientFinancials(selectedClient.id).invoices.length})
              </button>
              <button
                onClick={() => setActiveClientTab('payments')}
                className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
                  activeClientTab === 'payments' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Règlements ({getClientFinancials(selectedClient.id).payments.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1 text-xs">
              {activeClientTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Identifiants Administratifs & Fiscaux</h4>
                    <p><span className="text-slate-500">NIF :</span> <strong>{selectedClient.nif || 'Non renseigné'}</strong></p>
                    <p><span className="text-slate-500">RCCM :</span> <strong>{selectedClient.rccm || 'Non renseigné'}</strong></p>
                    <p><span className="text-slate-500">Contact Référent :</span> <strong>{selectedClient.contactPerson || '-'} {selectedClient.contactRole ? `(${selectedClient.contactRole})` : ''}</strong></p>
                    <p><span className="text-slate-500">Téléphone 2 :</span> <strong>{selectedClient.phone2 || '-'}</strong></p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Paramètres Financiers</h4>
                    <p><span className="text-slate-500">Délai de paiement :</span> <strong>{selectedClient.paymentTermsDays} jours</strong></p>
                    <p><span className="text-slate-500">Limite de crédit autorisée :</span> <strong>{formatCurrency(selectedClient.creditLimit, selectedClient.currency, companySettings.currencies)}</strong></p>
                    <p><span className="text-slate-500">Remise habituelle :</span> <strong>{selectedClient.defaultDiscount}%</strong></p>
                    <p><span className="text-slate-500">Devise de facturation :</span> <strong>{selectedClient.currency}</strong></p>
                  </div>

                  {selectedClient.notes && (
                    <div className="md:col-span-2 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 rounded-xl">
                      <div className="font-bold text-amber-900 dark:text-amber-300 text-[11px] mb-1">Notes Internes</div>
                      <p className="text-slate-700 dark:text-slate-300">{selectedClient.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {activeClientTab === 'quotes' && (
                <div className="space-y-2">
                  {getClientFinancials(selectedClient.id).quotes.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">Aucun devis pour ce client.</p>
                  ) : (
                    getClientFinancials(selectedClient.id).quotes.map((q) => {
                      const badge = getQuoteStatusBadge(q.status);
                      return (
                        <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-sky-600">{q.number}</span>
                            <div className="text-slate-500">{q.object || 'Sans objet'} • {formatDate(q.date)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(q.totalTTC, q.currency, companySettings.currencies)}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeClientTab === 'deliveries' && (
                <div className="space-y-2">
                  {getClientFinancials(selectedClient.id).deliveries.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">Aucun bon de livraison pour ce client.</p>
                  ) : (
                    getClientFinancials(selectedClient.id).deliveries.map((bl) => (
                      <div key={bl.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-indigo-600">{bl.number}</span>
                          <div className="text-slate-500">Date : {formatDate(bl.date)} • {bl.items.length} ligne(s)</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                            {bl.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeClientTab === 'invoices' && (
                <div className="space-y-2">
                  {getClientFinancials(selectedClient.id).invoices.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">Aucune facture pour ce client.</p>
                  ) : (
                    getClientFinancials(selectedClient.id).invoices.map((inv) => {
                      const badge = getInvoiceStatusBadge(inv.status);
                      return (
                        <div key={inv.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-sky-600">{inv.number}</span>
                            <div className="text-slate-500">Émise le {formatDate(inv.date)} • Échéance : {formatDate(inv.dueDate)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(inv.totalTTC, inv.currency, companySettings.currencies)}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeClientTab === 'payments' && (
                <div className="space-y-2">
                  {getClientFinancials(selectedClient.id).payments.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">Aucun encaissement enregistré.</p>
                  ) : (
                    getClientFinancials(selectedClient.id).payments.map((pay) => (
                      <div key={pay.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-emerald-600">{pay.number}</span>
                          <div className="text-slate-500">Sur facture {pay.invoiceNumber} • {formatDate(pay.date)} • {pay.paymentMethod}</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-600 text-sm">
                          + {formatCurrency(pay.amount, pay.currency, companySettings.currencies)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CLIENT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingClient ? `Modifier Client : ${editingClient.code}` : 'Nouveau Client'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-4 md:p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nom ou Raison Sociale *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Mauritanie Import SARL ou M. Ahmedou"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Type de client</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="company">Entreprise / Société</option>
                    <option value="administration">Administration Publique</option>
                    <option value="particular">Particulier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nom Commercial / Sigle</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Téléphone Principal *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+222 45 00 00 00"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@entreprise.mr"
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
                      placeholder="Ville"
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Pays"
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">NIF</label>
                  <input
                    type="text"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    placeholder="ex: 0039281-D"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">RCCM</label>
                  <input
                    type="text"
                    value={formData.rccm}
                    onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                    placeholder="ex: RC-NKC-2023-B-1234"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Délai de paiement (jours)</label>
                  <select
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value={0}>Comptant (0 jour)</option>
                    <option value={7}>7 jours</option>
                    <option value={15}>15 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={45}>45 jours</option>
                    <option value={60}>60 jours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plafond Crédit</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Notes & Observations</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
