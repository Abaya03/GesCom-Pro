import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Truck,
  Receipt,
  CreditCard,
  Users,
  Building2,
  Package,
  Wallet,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  ChevronRight,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
}) => {
  const { companySettings, hasPermission, invoices, quotes, products, logout } = useApp();

  const pendingInvoicesCount = invoices.filter(
    (i) => i.status === 'en_retard' || i.status === 'partiellement_payee' || i.status === 'emise'
  ).length;
  const pendingQuotesCount = quotes.filter((q) => q.status === 'en_attente' || q.status === 'envoye').length;
  const lowStockCount = products.filter((p) => p.type === 'product' && p.currentStock <= p.minStockAlert).length;

  const menuSections = [
    {
      title: 'PRINCIPAL',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: LayoutDashboard,
          permission: 'view_dashboard' as const,
        },
      ],
    },
    {
      title: 'VENTES & FACTURATION',
      items: [
        {
          id: 'quotes',
          label: 'Devis',
          icon: FileText,
          badge: pendingQuotesCount > 0 ? pendingQuotesCount : undefined,
          badgeColor: 'bg-amber-500',
          permission: 'manage_quotes' as const,
        },
        {
          id: 'delivery',
          label: 'Bons de livraison (BL)',
          icon: Truck,
          permission: 'manage_deliveries' as const,
        },
        {
          id: 'invoices',
          label: 'Factures',
          icon: Receipt,
          badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
          badgeColor: 'bg-rose-500',
          permission: 'manage_invoices' as const,
        },
        {
          id: 'payments',
          label: 'Paiements & Règlements',
          icon: CreditCard,
          permission: 'manage_payments' as const,
        },
      ],
    },
    {
      title: 'GESTION COMMERCIALE',
      items: [
        {
          id: 'clients',
          label: 'Clients',
          icon: Users,
          permission: 'manage_clients' as const,
        },
        {
          id: 'products',
          label: 'Produits & Services',
          icon: Package,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-orange-500',
          permission: 'manage_products' as const,
        },
        {
          id: 'suppliers',
          label: 'Fournisseurs',
          icon: Building2,
          permission: 'manage_suppliers' as const,
        },
        {
          id: 'expenses',
          label: 'Dépenses & Achats',
          icon: Wallet,
          permission: 'manage_expenses' as const,
        },
      ],
    },
    {
      title: 'ANALYSE & PILOTAGE',
      items: [
        {
          id: 'reports',
          label: 'Rapports & Statistiques',
          icon: BarChart3,
          permission: 'view_reports' as const,
        },
        {
          id: 'audit',
          label: 'Journal d\'audit',
          icon: History,
          permission: 'view_audit_log' as const,
        },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        {
          id: 'users',
          label: 'Utilisateurs & Droits',
          icon: ShieldCheck,
          permission: 'manage_users' as const,
        },
        {
          id: 'settings',
          label: 'Paramètres Généraux',
          icon: Settings,
          permission: 'manage_settings' as const,
        },
      ],
    },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {companySettings.logoUrl ? (
            <img
              src={companySettings.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shadow shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow bg-blue-600 shrink-0 text-xs"
            >
              {companySettings.name.substring(0, 2).toUpperCase() || 'MR'}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-wide truncate">
                {companySettings.commercialName || companySettings.name}
              </h2>
              <div className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">NEXUS ERP PRO</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 text-xs font-semibold uppercase tracking-wider">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => hasPermission(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                      isActive
                        ? 'text-white bg-blue-600/15 border-l-4 border-blue-600 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-l-4 border-transparent'
                    } ${collapsed ? 'justify-center !border-l-0' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-blue-400 scale-105' : 'text-slate-400 group-hover:text-blue-400'
                      }`}
                    />
                    {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

                    {!collapsed && 'badge' in item && (item as any).badge !== undefined && (
                      <span
                        className={`text-[10px] text-white px-1.5 py-0.5 rounded font-bold shadow-sm ${(item as any).badgeColor || 'bg-slate-700'}`}
                      >
                        {(item as any).badge}
                      </span>
                    )}

                    {!collapsed && isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile / Active Entity */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-[10px] space-y-2">
        {!collapsed ? (
          <>
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Entreprise Active</div>
              <div className="text-white font-bold truncate text-xs">{companySettings.name}</div>
              <div className="text-slate-400 text-[10px] flex items-center justify-between mt-1">
                <span>{companySettings.city || 'Siège'}</span>
                <span className="font-mono text-blue-400 font-bold">{companySettings.primaryCurrencyCode}</span>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 border border-slate-750 hover:border-rose-900/60 text-slate-400 hover:text-rose-300 transition text-[11px] font-semibold"
              title="Verrouiller / Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Verrouiller session</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="En ligne" />
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
              title="Verrouiller la session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
