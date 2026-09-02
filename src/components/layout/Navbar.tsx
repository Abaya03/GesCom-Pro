import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  Plus,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  Receipt,
  CreditCard,
  Wallet,
  Users,
  Package,
  UserCheck,
  ChevronDown,
  Building,
  LogOut,
} from 'lucide-react';
import { getUserRoleLabel } from '../../utils/formatters';

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onOpenSearch: () => void;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  collapsed,
  setCollapsed,
  onOpenSearch,
  onNavigate,
}) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    notifications,
    companySettings,
    setActiveModal,
    logout,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (quickRef.current && !quickRef.current.contains(event.target as Node)) {
        setShowQuickCreate(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;
  const userBadge = getUserRoleLabel(currentUser.role);

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left side: Collapse toggle + Search trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
          title="Afficher/masquer menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Omnibar search button */}
        <div className="relative w-64 md:w-80">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 rounded-lg text-xs transition border-none text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">Rechercher...</span>
            </div>
            <kbd className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      {/* Right side: Quick Action + Notifications + User profile switcher */}
      <div className="flex items-center gap-3">
        {/* Quick create button dropdown */}
        <div className="relative" ref={quickRef}>
          <button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Devis</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {showQuickCreate && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Création Rapide</div>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setActiveModal('create_quote');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Nouveau Devis</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setActiveModal('create_delivery');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <Truck className="w-4 h-4 text-indigo-500" />
                <span>Nouveau Bon de Livraison</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setActiveModal('create_invoice');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Nouvelle Facture</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setActiveModal('create_payment');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Encaisser un Paiement</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setActiveModal('create_client');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>Ajouter un Client</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setActiveModal('create_product');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <Package className="w-4 h-4 text-purple-500" />
                <span>Ajouter un Article</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setActiveModal('create_expense');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition text-left"
              >
                <Wallet className="w-4 h-4 text-rose-500" />
                <span>Enregistrer une Dépense</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition relative"
            title="Notifications & Alertes"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  Alertes & Notifications ({unreadCount})
                </span>
                <span className="text-[10px] text-slate-400">Temps réel</span>
              </div>

              <div className="max-h-72 overflow-y-auto py-2 space-y-1.5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    <span>Toutes les factures et stocks sont à jour !</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.linkTab) onNavigate(n.linkTab);
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        n.type === 'danger'
                          ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
                          : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          n.type === 'danger' ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px]">{n.title}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                          {n.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Switcher Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                {currentUser.name.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'JS'}
              </div>
            )}
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${userBadge.color}`}>
                {userBadge.label}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg mb-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                  @{currentUser.username || currentUser.name.toLowerCase().replace(/\s+/g, '')}
                </div>
                <div className="mt-1.5 text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Rôle actif : {userBadge.label}
                </div>
              </div>

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Changer de profil (Simulation des Rôles)
              </div>

              <div className="space-y-1">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const badge = getUserRoleLabel(u.role);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-600"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{badge.label}</div>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    onNavigate('users');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 font-bold py-1 hover:underline"
                >
                  Gérer les utilisateurs & photos
                </button>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium py-0.5 hover:underline"
                >
                  Paramètres entreprise
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Verrouiller / Déconnexion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
