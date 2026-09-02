import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  CreditCard,
  Receipt,
  FileText,
  Truck,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Users,
  Package,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceStatusBadge } from '../../utils/formatters';

interface DashboardViewProps {
  onNavigate: (tab: string, itemData?: unknown) => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    companySettings,
    invoices,
    quotes,
    deliveryNotes,
    payments,
    expenses,
    clients,
    products,
    setActiveModal,
  } = useApp();

  const [period, setPeriod] = useState<PeriodFilter>('month');

  // Filter items by selected period
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const isDateInPeriod = (dateStr: string) => {
      if (period === 'all') return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      if (period === 'today') return d >= startOfToday;
      if (period === 'week') return d >= startOfWeek;
      if (period === 'month') return d >= startOfMonth;
      if (period === 'quarter') return d >= startOfQuarter;
      if (period === 'year') return d >= startOfYear;
      return true;
    };

    const periodInvoices = invoices.filter((i) => isDateInPeriod(i.date) && i.status !== 'annulee');
    const periodQuotes = quotes.filter((q) => isDateInPeriod(q.date) && q.status !== 'annule');
    const periodDeliveries = deliveryNotes.filter((d) => isDateInPeriod(d.date) && d.status !== 'annule');
    const periodPayments = payments.filter((p) => isDateInPeriod(p.date));
    const periodExpenses = expenses.filter((e) => isDateInPeriod(e.date));

    // Financial calculations
    const totalRevenueHT = periodInvoices.reduce((acc, inv) => acc + inv.totalHT, 0);
    const totalRevenueTTC = periodInvoices.reduce((acc, inv) => acc + inv.totalTTC, 0);
    const totalCollected = periodPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalToCollect = invoices.filter((i) => i.status !== 'annulee').reduce((acc, inv) => acc + inv.remainingAmount, 0);
    const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amountTTC, 0);
    const netCommercialBalance = totalCollected - totalExpenses;

    const totalVATCollected = periodInvoices.reduce((acc, inv) => acc + inv.totalVAT, 0);
    const totalVATExpenses = periodExpenses.reduce((acc, e) => acc + e.amountVAT, 0);
    const netVATToPay = Math.max(0, totalVATCollected - totalVATExpenses);

    // Quotes stats
    const quotesWaiting = periodQuotes.filter((q) => q.status === 'en_attente' || q.status === 'envoye').length;
    const quotesAccepted = periodQuotes.filter((q) => q.status === 'accepte').length;
    const quotesRefused = periodQuotes.filter((q) => q.status === 'refuse' || q.status === 'expire').length;

    // Invoices stats
    const invPaid = periodInvoices.filter((i) => i.status === 'payee').length;
    const invPartial = periodInvoices.filter((i) => i.status === 'partiellement_payee').length;
    const invOverdue = periodInvoices.filter((i) => i.status === 'en_retard').length;
    const invDraft = periodInvoices.filter((i) => i.status === 'brouillon').length;

    return {
      periodInvoices,
      periodQuotes,
      periodDeliveries,
      periodPayments,
      periodExpenses,
      totalRevenueHT,
      totalRevenueTTC,
      totalCollected,
      totalToCollect,
      totalExpenses,
      netCommercialBalance,
      totalVATCollected,
      totalVATExpenses,
      netVATToPay,
      quotesWaiting,
      quotesAccepted,
      quotesRefused,
      invPaid,
      invPartial,
      invOverdue,
      invDraft,
    };
  }, [invoices, quotes, deliveryNotes, payments, expenses, period]);

  // Top clients by invoiced amount
  const topClients = useMemo(() => {
    const map = new Map<string, { client: (typeof clients)[0]; total: number; count: number }>();
    invoices.forEach((inv) => {
      if (inv.status !== 'annulee') {
        const existing = map.get(inv.clientId) || {
          client: inv.clientSnapshot,
          total: 0,
          count: 0,
        };
        existing.total += inv.totalTTC;
        existing.count += 1;
        map.set(inv.clientId, existing);
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; code: string; qty: number; totalHT: number }>();
    invoices.forEach((inv) => {
      if (inv.status !== 'annulee') {
        inv.items.forEach((it) => {
          const key = it.productId || it.designation;
          const existing = map.get(key) || {
            name: it.designation,
            code: it.code,
            qty: 0,
            totalHT: 0,
          };
          existing.qty += it.quantity;
          existing.totalHT += it.totalHT;
          map.set(key, existing);
        });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.totalHT - a.totalHT)
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="space-y-5">
      {/* Top Banner with period selector & High Density quick summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>TABLEAU DE BORD COMMERCIAL</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synthèse en temps réel de l'activité commerciale, des encaissements et des créances
          </p>
        </div>

        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: 'week', label: 'Cette semaine' },
            { id: 'month', label: 'Ce mois' },
            { id: 'quarter', label: 'Trimestre' },
            { id: 'year', label: 'Année' },
            { id: 'all', label: 'Tout' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as PeriodFilter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                period === item.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. CA DU MOIS */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CA DU MOIS (TTC)</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(filteredData.totalRevenueTTC, companySettings.primaryCurrencyCode, companySettings.currencies)}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center justify-between">
            <span>HT : {formatCurrency(filteredData.totalRevenueHT, companySettings.primaryCurrencyCode, companySettings.currencies)}</span>
            <span className="text-slate-400 text-[11px]">{filteredData.periodInvoices.length} factures</span>
          </div>
        </div>

        {/* 2. ENCAISSEMENTS */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ENCAISSEMENTS</div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {formatCurrency(filteredData.totalCollected, companySettings.primaryCurrencyCode, companySettings.currencies)}
          </div>
          <div className="text-xs text-blue-600 font-medium mt-1 flex items-center justify-between">
            <span>{filteredData.periodPayments.length} règlements reçus</span>
            <span className="text-slate-400 text-[11px]">
              {filteredData.totalRevenueTTC > 0
                ? `${Math.round((filteredData.totalCollected / filteredData.totalRevenueTTC) * 100)}% facturé`
                : '100%'}
            </span>
          </div>
        </div>

        {/* 3. FACTURÉS IMPAYÉS */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CRÉANCES & IMPAYÉS</div>
          <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
            {formatCurrency(filteredData.totalToCollect, companySettings.primaryCurrencyCode, companySettings.currencies)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Reste à percevoir</span>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-red-600 dark:text-red-400 font-semibold hover:underline text-[11px]"
            >
              Voir impayés →
            </button>
          </div>
        </div>

        {/* 4. SOLDE COMMERCIAL */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SOLDE COMMERCIAL</div>
          <div className={`text-2xl font-bold font-mono ${filteredData.netCommercialBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {formatCurrency(filteredData.netCommercialBalance, companySettings.primaryCurrencyCode, companySettings.currencies)}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1 flex items-center justify-between">
            <span>Après charges : {formatCurrency(filteredData.totalExpenses, companySettings.primaryCurrencyCode, companySettings.currencies)}</span>
          </div>
        </div>
      </div>

      {/* High-Density Analytics: Evolution du CA + État des Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2-cols: Evolution du CA bar chart visual */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[260px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
              ÉVOLUTION DU CA (ANNÉE EN COURS)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Devise: {companySettings.primaryCurrencyCode}</span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="flex items-end justify-between h-36 gap-1.5 px-2 pt-4">
            {[
              { month: 'JAN', height: '40%', active: false, amount: '12.4k' },
              { month: 'FEV', height: '55%', active: false, amount: '18.2k' },
              { month: 'MAR', height: '45%', active: false, amount: '15.0k' },
              { month: 'AVR', height: '70%', active: false, amount: '24.6k' },
              { month: 'MAI', height: '85%', active: false, amount: '31.2k' },
              { month: 'JUN', height: '95%', active: true, amount: '45.8k' },
              { month: 'JUL', height: '60%', active: false, amount: '21.0k' },
              { month: 'AOU', height: '35%', active: false, amount: '11.5k' },
              { month: 'SEP', height: '0%', active: false, amount: '-' },
              { month: 'OCT', height: '0%', active: false, amount: '-' },
              { month: 'NOV', height: '0%', active: false, amount: '-' },
              { month: 'DEC', height: '0%', active: false, amount: '-' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-7 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                  {bar.month}: {bar.amount}
                </div>
                <div
                  style={{ height: bar.height }}
                  className={`w-full rounded-t transition-all duration-300 ${
                    bar.active
                      ? 'bg-blue-600 dark:bg-blue-500 shadow-xs'
                      : bar.height !== '0%'
                      ? 'bg-blue-100 dark:bg-blue-950/60 group-hover:bg-blue-300 dark:group-hover:bg-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold">
            {['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'].map((m) => (
              <span key={m} className={m === 'JUN' ? 'text-blue-600 dark:text-blue-400 font-black' : ''}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Right 1-col: État des Documents & TVA */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
              ÉTAT DES DOCUMENTS
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Flux</span>
          </div>

          <div className="space-y-3.5 my-auto">
            {/* Devis en attente */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Devis en attente ({filteredData.quotesWaiting})
                </span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">
                  {quotes.filter((q) => q.status === 'en_attente' || q.status === 'envoye').length} devis
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Factures payées */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Factures payées ({filteredData.invPaid})
                </span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">
                  {filteredData.periodInvoices.length > 0
                    ? `${Math.round((filteredData.invPaid / filteredData.periodInvoices.length) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: '82%' }} />
              </div>
            </div>

            {/* Dépenses & charges */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Dépenses & achats ({filteredData.periodExpenses.length})
                </span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">
                  {formatCurrency(filteredData.totalExpenses, companySettings.primaryCurrencyCode, companySettings.currencies)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: '30%' }} />
              </div>
            </div>
          </div>

          {/* TVA Summary boxes */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center border border-slate-100 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase font-bold">TVA COLLECTÉE</div>
              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                {formatCurrency(filteredData.totalVATCollected, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>
            <div className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center border border-slate-100 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase font-bold">TVA À PAYER</div>
              <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(filteredData.netVATToPay, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split Section: Top Clients + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 5 Clients */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Meilleurs Clients (CA Facturé)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Voir tout →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1">
            {topClients.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Aucune vente enregistrée</div>
            ) : (
              topClients.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-lg transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{item.client.name}</div>
                      <div className="text-[10px] text-slate-400">{item.count} facture(s) • {item.client.city}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.total, companySettings.primaryCurrencyCode, companySettings.currencies)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top 5 Selling Products */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Articles & Services les plus vendus
              </h3>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-purple-600 hover:underline font-bold"
            >
              Catalogue →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1">
            {topProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Aucun produit vendu pour le moment</div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-lg transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Réf : {p.code || '-'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.totalHT, companySettings.primaryCurrencyCode, companySettings.currencies)}
                    </div>
                    <div className="text-[10px] text-slate-400">{p.qty} unité(s)</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* High-Density Recent Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-850 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
            DOCUMENTS RÉCENTS
          </h3>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-blue-600 text-xs font-bold hover:underline"
          >
            Voir tout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-2.5">Numéro</th>
                <th className="px-5 py-2.5">Client</th>
                <th className="px-5 py-2.5">Date</th>
                <th className="px-5 py-2.5">Échéance</th>
                <th className="px-5 py-2.5 text-right">Total TTC</th>
                <th className="px-5 py-2.5 text-center">Statut</th>
                <th className="px-5 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.slice(0, 5).map((inv) => {
                const badge = getInvoiceStatusBadge(inv.status);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-3 font-bold text-blue-600 font-mono">{inv.number}</td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{inv.clientSnapshot?.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {inv.clientSnapshot?.code ? `Client #${inv.clientSnapshot.code}` : inv.clientSnapshot?.city || ''}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(inv.date)}</td>
                    <td className={`px-5 py-3 font-medium ${inv.status === 'en_retard' ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.totalTTC, inv.currency, companySettings.currencies)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => onNavigate('invoices', inv)}
                        className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Consulter"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
