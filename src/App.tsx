/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { POTrackerModal } from './components/POTrackerModal';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView';
import { SupplierInboundView } from './views/SupplierInboundView';
import { FinanceBillingView } from './views/FinanceBillingView';
import { ClientPortalView } from './views/ClientPortalView';
import { SupplierPortalView } from './views/SupplierPortalView';
import { UserManagementView } from './views/UserManagementView';
import { FinancialReportsModule } from './components/FinancialReportsModule';
import { LoginPage } from './views/LoginPage';
import { Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync tab with role switches
  useEffect(() => {
    if (currentUser.role === 'admin') {
      setCurrentTab('dashboard');
    } else if (currentUser.role === 'client') {
      setCurrentTab('client-portal');
    } else if (currentUser.role === 'supplier') {
      setCurrentTab('supplier-portal');
    }
  }, [currentUser.role, currentUser.id]);

  const renderContent = () => {
    // Role-based Access Enforcement
    if (currentUser.role === 'client') {
      switch (currentTab) {
        case 'client-portal':
        case 'client-create-po':
          return <ClientPortalView initialSubTab="create-po" />;
        case 'client-track-orders':
          return <ClientPortalView initialSubTab="track" />;
        case 'client-invoices':
          return <ClientPortalView initialSubTab="invoices" />;
        default:
          return <ClientPortalView initialSubTab="create-po" />;
      }
    }

    if (currentUser.role === 'supplier') {
      switch (currentTab) {
        case 'supplier-orders':
          return <SupplierPortalView initialSubTab="orders" />;
        case 'supplier-portal':
        case 'supplier-deliveries':
          return <SupplierPortalView initialSubTab="deliveries" />;
        case 'supplier-products':
          return <SupplierPortalView initialSubTab="products" />;
        case 'supplier-invoices':
          return <SupplierPortalView initialSubTab="invoices" />;
        default:
          return <SupplierPortalView initialSubTab="orders" />;
      }
    }

    // Admin role has full access
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(t) => setCurrentTab(t)} />;
      case 'inventory':
        return <InventoryView />;
      case 'client-pos':
        return <PurchaseOrdersView />;
      case 'supplier-inbound':
        return <SupplierInboundView />;
      case 'finance':
      case 'invoices':
        return <FinanceBillingView />;
      case 'financial-reports':
        return <FinancialReportsModule />;
      case 'users':
        return <UserManagementView />;
      case 'client-portal':
      case 'client-create-po':
        return <ClientPortalView initialSubTab="create-po" />;
      case 'client-track-orders':
        return <ClientPortalView initialSubTab="track" />;
      case 'client-invoices':
        return <ClientPortalView initialSubTab="invoices" />;
      case 'supplier-orders':
        return <SupplierPortalView initialSubTab="orders" />;
      case 'supplier-portal':
      case 'supplier-deliveries':
        return <SupplierPortalView initialSubTab="deliveries" />;
      case 'supplier-products':
        return <SupplierPortalView initialSubTab="products" />;
      case 'supplier-invoices':
        return <SupplierPortalView initialSubTab="invoices" />;
      default:
        return <DashboardView onNavigate={(t) => setCurrentTab(t)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Navbar />

      {/* Mobile Menu Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 p-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
        >
          <Menu className="w-4 h-4 text-red-600" />
          <span>Menu Navigasi</span>
        </button>
        <span className="text-xs font-semibold text-slate-600 truncate max-w-[180px]">
          Akun: <span className="text-red-700 font-bold">{currentUser.name}</span>
        </span>
      </div>

      {/* Main Body with Sidebar + Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <InvoiceDetailModal />
      <POTrackerModal />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <RootApp />
    </AppProvider>
  );
}
