import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { LoginView } from './components/auth/LoginView';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { QuotesView } from './components/quotes/QuotesView';
import { DeliveryNotesView } from './components/delivery/DeliveryNotesView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { PaymentsView } from './components/payments/PaymentsView';
import { ClientsView } from './components/clients/ClientsView';
import { ProductsView } from './components/products/ProductsView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { UsersView } from './components/users/UsersView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { hasPermission } = useApp();

  // Keyboard shortcut Ctrl+K / Cmd+K for global omnibar search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'quotes':
        return <QuotesView onNavigateToDocument={handleNavigate} />;
      case 'delivery':
        return <DeliveryNotesView onNavigateToDocument={handleNavigate} />;
      case 'invoices':
        return <InvoicesView onNavigateToDocument={handleNavigate} />;
      case 'payments':
        return <PaymentsView />;
      case 'clients':
        return <ClientsView onNavigateToDocument={handleNavigate} />;
      case 'products':
        return <ProductsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditLogView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Omnibar Search */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
