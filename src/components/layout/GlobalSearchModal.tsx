import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, Users, Package, FileText, Receipt, Truck, Wallet, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemData?: unknown) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const { clients, products, quotes, invoices, deliveryNotes, expenses, companySettings } = useApp();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'client' | 'product' | 'quote' | 'invoice' | 'delivery' | 'expense';
      tab: string;
      data: unknown;
      amount?: number;
    }> = [];

    // Search Clients
    clients.forEach((c) => {
      if (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q))
      ) {
        list.push({
          id: c.id,
          title: c.name,
          subtitle: `Client ${c.code} • ${c.phone} • ${c.city}`,
          category: 'client',
          tab: 'clients',
          data: c,
        });
      }
    });

    // Search Products
    products.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      ) {
        list.push({
          id: p.id,
          title: p.name,
          subtitle: `Réf: ${p.code} • Stock: ${p.currentStock} ${p.unit} • ${formatCurrency(p.sellingPrice, p.currency, companySettings.currencies)}`,
          category: 'product',
          tab: 'products',
          data: p,
          amount: p.sellingPrice,
        });
      }
    });

    // Search Quotes
    quotes.forEach((dev) => {
      if (
        dev.number.toLowerCase().includes(q) ||
        dev.clientSnapshot?.name.toLowerCase().includes(q) ||
        (dev.object && dev.object.toLowerCase().includes(q))
      ) {
        list.push({
          id: dev.id,
          title: `Devis ${dev.number}`,
          subtitle: `${dev.clientSnapshot?.name} • ${formatDate(dev.date)} • Statut: ${dev.status}`,
          category: 'quote',
          tab: 'quotes',
          data: dev,
          amount: dev.totalTTC,
        });
      }
    });

    // Search Invoices
    invoices.forEach((inv) => {
      if (
        inv.number.toLowerCase().includes(q) ||
        inv.clientSnapshot?.name.toLowerCase().includes(q) ||
        (inv.notes && inv.notes.toLowerCase().includes(q))
      ) {
        list.push({
          id: inv.id,
          title: `Facture ${inv.number}`,
          subtitle: `${inv.clientSnapshot?.name} • Échéance: ${formatDate(inv.dueDate)} • Reste: ${formatCurrency(inv.remainingAmount, inv.currency, companySettings.currencies)}`,
          category: 'invoice',
          tab: 'invoices',
          data: inv,
          amount: inv.totalTTC,
        });
      }
    });

    // Search Delivery Notes
    deliveryNotes.forEach((bl) => {
      if (
        bl.number.toLowerCase().includes(q) ||
        bl.clientSnapshot?.name.toLowerCase().includes(q) ||
        (bl.orderReference && bl.orderReference.toLowerCase().includes(q))
      ) {
        list.push({
          id: bl.id,
          title: `Bon de Livraison ${bl.number}`,
          subtitle: `${bl.clientSnapshot?.name} • Date: ${formatDate(bl.date)} • Statut: ${bl.status}`,
          category: 'delivery',
          tab: 'delivery',
          data: bl,
        });
      }
    });

    // Search Expenses
    expenses.forEach((exp) => {
      if (
        exp.number.toLowerCase().includes(q) ||
        exp.description.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q)
      ) {
        list.push({
          id: exp.id,
          title: `Dépense ${exp.number} (${exp.category})`,
          subtitle: `${exp.description} • ${formatDate(exp.date)}`,
          category: 'expense',
          tab: 'expenses',
          data: exp,
          amount: exp.amountTTC,
        });
      }
    });

    return list.slice(0, 12);
  }, [query, clients, products, quotes, invoices, deliveryNotes, expenses, companySettings]);

  if (!isOpen) return null;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'client':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'product':
        return <Package className="w-4 h-4 text-emerald-500" />;
      case 'quote':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'invoice':
        return <Receipt className="w-4 h-4 text-sky-500" />;
      case 'delivery':
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'expense':
        return <Wallet className="w-4 h-4 text-rose-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 pt-16 md:pt-24">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search bar input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Rechercher partout (N° facture, devis, client, article, montant...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm md:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-mono border border-slate-200 dark:border-slate-700"
          >
            ÉCHAP
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query && results.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucun résultat correspondant à « {query} ».
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-slate-400 text-xs">
              Tapez un numéro de document, un nom de client ou un produit pour rechercher rapidement.
            </div>
          )}

          {results.map((res) => (
            <button
              key={`${res.category}_${res.id}`}
              onClick={() => {
                onNavigate(res.tab, res.data);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getCategoryIcon(res.category)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600">
                    {res.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{res.subtitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                {res.amount !== undefined && (
                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                    {formatCurrency(res.amount, companySettings.primaryCurrencyCode, companySettings.currencies)}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
