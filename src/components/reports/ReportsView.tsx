import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Users,
  CreditCard,
  Receipt,
  Scale,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportUtils';

export const ReportsView: React.FC = () => {
  const {
    invoices,
    expenses,
    payments,
    clients,
    products,
    categories,
    companySettings,
  } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'vat' | 'receivables' | 'profit_loss'>('sales');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 1. Sales by month for selected year
  const monthlySales = useMemo(() => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const result = months.map((monthName, idx) => {
      const monthInvoices = invoices.filter((inv) => {
        if (inv.status === 'annulee') return false;
        const d = new Date(inv.date);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      const monthExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      const totalHT = monthInvoices.reduce((acc, i) => acc + i.totalHT, 0);
      const totalTTC = monthInvoices.reduce((acc, i) => acc + i.totalTTC, 0);
      const totalVAT = monthInvoices.reduce((acc, i) => acc + i.totalVAT, 0);
      const totalExp = monthExpenses.reduce((acc, e) => acc + e.amountTTC, 0);

      return {
        month: monthName,
        monthIndex: idx,
        invoicesCount: monthInvoices.length,
        totalHT,
        totalTTC,
        totalVAT,
        totalExp,
        netResult: totalHT - totalExp,
      };
    });

    return result;
  }, [invoices, expenses, selectedYear]);

  // 2. VAT Declaration report
  const vatSummary = useMemo(() => {
    const validInvoices = invoices.filter((i) => i.status !== 'annulee');
    const totalVATCollected = validInvoices.reduce((acc, i) => acc + i.totalVAT, 0);
    const totalVATDeductible = expenses.reduce((acc, e) => acc + e.amountVAT, 0);
    const netVATToPay = totalVATCollected - totalVATDeductible;

    return {
      totalVATCollected,
      totalVATDeductible,
      netVATToPay,
      invoicesWithVAT: validInvoices.length,
      expensesWithVAT: expenses.length,
    };
  }, [invoices, expenses]);

  // 3. Aged Receivables (Aging Balance)
  const agedReceivables = useMemo(() => {
    const now = new Date().getTime();
    const unpaidInvoices = invoices.filter(
      (i) => i.status !== 'annulee' && i.status !== 'payee' && i.remainingAmount > 0
    );

    let current = 0; // Not due yet
    let days1_30 = 0;
    let days31_60 = 0;
    let days61_90 = 0;
    let days90Plus = 0;

    unpaidInvoices.forEach((inv) => {
      const dueTime = new Date(inv.dueDate).getTime();
      const diffDays = Math.floor((now - dueTime) / (1000 * 3600 * 24));

      if (diffDays <= 0) {
        current += inv.remainingAmount;
      } else if (diffDays <= 30) {
        days1_30 += inv.remainingAmount;
      } else if (diffDays <= 60) {
        days31_60 += inv.remainingAmount;
      } else if (diffDays <= 90) {
        days61_90 += inv.remainingAmount;
      } else {
        days90Plus += inv.remainingAmount;
      }
    });

    const totalUnpaid = current + days1_30 + days31_60 + days61_90 + days90Plus;

    return {
      unpaidInvoices,
      totalUnpaid,
      current,
      days1_30,
      days31_60,
      days61_90,
      days90Plus,
    };
  }, [invoices]);

  // 4. Global Profit & Loss Calculation
  const pnlSummary = useMemo(() => {
    const validInvoices = invoices.filter((i) => i.status !== 'annulee');
    const totalSalesHT = validInvoices.reduce((acc, i) => acc + i.totalHT, 0);

    // Calculate Cost of Goods Sold (COGS)
    let cogsHT = 0;
    validInvoices.forEach((inv) => {
      inv.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const purchaseCost = prod ? prod.purchasePrice : 0;
        cogsHT += purchaseCost * it.quantity;
      });
    });

    const grossMarginHT = totalSalesHT - cogsHT;
    const grossMarginPercent = totalSalesHT > 0 ? ((grossMarginHT / totalSalesHT) * 100).toFixed(1) : '0';

    const totalOperatingExpensesHT = expenses.reduce((acc, e) => acc + e.amountHT, 0);
    const netOperatingProfit = grossMarginHT - totalOperatingExpensesHT;

    return {
      totalSalesHT,
      cogsHT,
      grossMarginHT,
      grossMarginPercent,
      totalOperatingExpensesHT,
      netOperatingProfit,
    };
  }, [invoices, expenses, products]);

  // Export handlers
  const handleExportMonthlySales = () => {
    const rows = monthlySales.map((m) => ({
      mois: m.month,
      nombre_factures: m.invoicesCount,
      chiffre_affaires_ht: m.totalHT,
      tva_collectee: m.totalVAT,
      chiffre_affaires_ttc: m.totalTTC,
      depenses_ttc: m.totalExp,
      resultat_net_commercial: m.netResult,
    }));

    exportToCsv(
      rows,
      [
        { key: 'mois', label: 'Mois' },
        { key: 'nombre_factures', label: 'Nombre Factures' },
        { key: 'chiffre_affaires_ht', label: 'CA HT' },
        { key: 'tva_collectee', label: 'TVA Collectée' },
        { key: 'chiffre_affaires_ttc', label: 'CA TTC' },
        { key: 'depenses_ttc', label: 'Dépenses TTC' },
        { key: 'resultat_net_commercial', label: 'Solde Net' },
      ],
      `rapport_ventes_mensuel_${selectedYear}`
    );
  };

  const handleExportAgedReceivables = () => {
    const rows = agedReceivables.unpaidInvoices.map((inv) => ({
      numero: inv.number,
      client: inv.clientSnapshot?.name || '',
      date_emission: inv.date,
      date_echeance: inv.dueDate,
      total_ttc: inv.totalTTC,
      deja_paye: inv.paidAmount,
      reste_du: inv.remainingAmount,
    }));

    exportToCsv(
      rows,
      [
        { key: 'numero', label: 'N° Facture' },
        { key: 'client', label: 'Client' },
        { key: 'date_emission', label: 'Émise le' },
        { key: 'date_echeance', label: 'Échéance' },
        { key: 'total_ttc', label: 'Total TTC' },
        { key: 'deja_paye', label: 'Payé' },
        { key: 'reste_du', label: 'Reste Dû' },
      ],
      `balance_agee_creances_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            <span>Rapports & Statistiques Financières</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Déclaration de TVA, balance âgée des créances, compte de résultat simplifié et export comptable
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
          >
            <option value={2026}>Exercice 2026</option>
            <option value={2025}>Exercice 2025</option>
            <option value={2024}>Exercice 2024</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveReportTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeReportTab === 'sales'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Évolution Mensuelle CA</span>
        </button>

        <button
          onClick={() => setActiveReportTab('vat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeReportTab === 'vat'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Déclaration TVA</span>
        </button>

        <button
          onClick={() => setActiveReportTab('receivables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeReportTab === 'receivables'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Balance Âgée des Créances</span>
        </button>

        <button
          onClick={() => setActiveReportTab('profit_loss')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeReportTab === 'profit_loss'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Compte de Résultat & Marges</span>
        </button>
      </div>

      {/* 1. SALES MONTHLY EVOLUTION */}
      {activeReportTab === 'sales' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Synthèse mensuelle des Ventes et Dépenses ({selectedYear})
            </span>
            <button
              onClick={handleExportMonthlySales}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Mois</th>
                    <th className="py-3 px-4 text-center">Factures</th>
                    <th className="py-3 px-4 text-right">CA HT</th>
                    <th className="py-3 px-4 text-right">TVA Collectée</th>
                    <th className="py-3 px-4 text-right">CA TTC</th>
                    <th className="py-3 px-4 text-right">Dépenses TTC</th>
                    <th className="py-3 px-4 text-right">Solde Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthlySales.map((m) => (
                    <tr key={m.month} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.month}</td>
                      <td className="py-3 px-4 text-center font-mono">{m.invoicesCount}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(m.totalHT, companySettings.primaryCurrencyCode, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(m.totalVAT, companySettings.primaryCurrencyCode, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-600">
                        {formatCurrency(m.totalTTC, companySettings.primaryCurrencyCode, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        {formatCurrency(m.totalExp, companySettings.primaryCurrencyCode, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={m.netResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatCurrency(m.netResult, companySettings.primaryCurrencyCode, companySettings.currencies)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. VAT DECLARATION */}
      {activeReportTab === 'vat' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 uppercase">TVA Collectée (Sur Ventes)</span>
              <div className="text-2xl font-black text-sky-600 font-mono mt-2">
                {formatCurrency(vatSummary.totalVATCollected, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
              <div className="text-xs text-slate-500 mt-2">{vatSummary.invoicesWithVAT} factures émises</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 uppercase">TVA Déductible (Sur Achats)</span>
              <div className="text-2xl font-black text-amber-600 font-mono mt-2">
                {formatCurrency(vatSummary.totalVATDeductible, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
              <div className="text-xs text-slate-500 mt-2">{vatSummary.expensesWithVAT} pièces de dépenses</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 uppercase">Solde Net TVA à Reverser</span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-2">
                {formatCurrency(
                  Math.max(0, vatSummary.netVATToPay),
                  companySettings.primaryCurrencyCode,
                  companySettings.currencies
                )}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {vatSummary.netVATToPay >= 0 ? 'Montant exigible par le fisc' : 'Crédit de TVA reportable'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notice Fiscale Mauritanie / International</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              La TVA collectée provient de l'ensemble des factures de vente établies au taux légal de 16% (ou autre taux paramétré).
              La TVA déductible correspond aux taxes supportées lors de l'acquisition de biens et services d'exploitation auprès de fournisseurs assujettis disposant d'un NIF valide.
            </p>
          </div>
        </div>
      )}

      {/* 3. AGED RECEIVABLES */}
      {activeReportTab === 'receivables' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">Non Échues</span>
              <div className="text-sm md:text-base font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                {formatCurrency(agedReceivables.current, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-center">
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase">Retard 1-30j</span>
              <div className="text-sm md:text-base font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
                {formatCurrency(agedReceivables.days1_30, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-950/40 rounded-2xl border border-orange-200 dark:border-orange-900 text-center">
              <span className="text-[10px] text-orange-800 dark:text-orange-300 font-bold uppercase">Retard 31-60j</span>
              <div className="text-sm md:text-base font-black text-orange-700 dark:text-orange-400 font-mono mt-1">
                {formatCurrency(agedReceivables.days31_60, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 text-center">
              <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase">Retard 61-90j</span>
              <div className="text-sm md:text-base font-black text-rose-700 dark:text-rose-400 font-mono mt-1">
                {formatCurrency(agedReceivables.days61_90, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="p-4 bg-red-100 dark:bg-red-950/60 rounded-2xl border border-red-300 dark:border-red-900 text-center col-span-2 md:col-span-1">
              <span className="text-[10px] text-red-900 dark:text-red-300 font-bold uppercase">Retard +90j (Critique)</span>
              <div className="text-sm md:text-base font-black text-red-700 dark:text-red-400 font-mono mt-1">
                {formatCurrency(agedReceivables.days90Plus, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Liste détaillée des {agedReceivables.unpaidInvoices.length} factures avec solde dû
            </span>
            <button
              onClick={handleExportAgedReceivables}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
            >
              <Download className="w-4 h-4" />
              <span>Exporter Créances CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">N° Facture</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Échéance</th>
                    <th className="py-3 px-4 text-right">Total TTC</th>
                    <th className="py-3 px-4 text-right">Payé</th>
                    <th className="py-3 px-4 text-right">Reste Dû</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {agedReceivables.unpaidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600">{inv.number}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{inv.clientSnapshot?.name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {formatCurrency(inv.totalTTC, inv.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {formatCurrency(inv.paidAmount, inv.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                        {formatCurrency(inv.remainingAmount, inv.currency, companySettings.currencies)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. PROFIT & LOSS / MARGIN ANALYSIS */}
      {activeReportTab === 'profit_loss' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Compte de Résultat Simplifié & Marges Commerciales
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">1. Chiffre d'Affaires Net Facturé (HT)</span>
                <p className="text-[11px] text-slate-500">Ventes de marchandises et prestations de services</p>
              </div>
              <div className="font-mono font-bold text-sm text-sky-600">
                + {formatCurrency(pnlSummary.totalSalesHT, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="flex justify-between items-center py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">2. Coût d'Achat des Marchandises Vendues (COGS HT)</span>
                <p className="text-[11px] text-slate-500">Prix de revient des articles catalogués vendus</p>
              </div>
              <div className="font-mono font-bold text-sm text-rose-600">
                - {formatCurrency(pnlSummary.cogsHT, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="flex justify-between items-center py-3 px-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800">
              <div>
                <span className="font-bold text-sky-900 dark:text-sky-200 text-sm">MARGE BRUTE COMMERCIALE</span>
                <p className="text-[11px] text-sky-700 dark:text-sky-400">Taux de marge brute : <strong>{pnlSummary.grossMarginPercent}%</strong></p>
              </div>
              <div className="font-mono font-black text-base text-sky-700 dark:text-sky-300">
                = {formatCurrency(pnlSummary.grossMarginHT, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="flex justify-between items-center py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">3. Dépenses d'Exploitation & Charges Générales (HT)</span>
                <p className="text-[11px] text-slate-500">Loyers, télécoms, transport, honoraires, fournitures</p>
              </div>
              <div className="font-mono font-bold text-sm text-rose-600">
                - {formatCurrency(pnlSummary.totalOperatingExpensesHT, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>

            <div className="flex justify-between items-center py-4 px-4 bg-emerald-600 text-white rounded-xl shadow-lg">
              <div>
                <span className="font-bold text-base">RÉSULTAT D'EXPLOITATION ESTIMÉ (EBIT)</span>
                <p className="text-[11px] text-emerald-100">Bénéfice opérationnel net avant impôt sur les sociétés</p>
              </div>
              <div className="font-mono font-black text-xl">
                {formatCurrency(pnlSummary.netOperatingProfit, companySettings.primaryCurrencyCode, companySettings.currencies)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
