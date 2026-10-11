import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  Receipt,
  BellRing,
  PlusCircle,
  Clock,
  CheckSquare,
  ShieldCheck,
  Building,
  Users,
  Scale,
  LogOut,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'inventory'
  | 'client-pos'
  | 'supplier-inbound'
  | 'finance'
  | 'financial-reports'
  | 'invoices'
  | 'notifications'
  | 'users'
  // Client tabs
  | 'client-portal'
  | 'client-create-po'
  | 'client-track-orders'
  | 'client-invoices'
  // Supplier tabs
  | 'supplier-orders'
  | 'supplier-portal'
  | 'supplier-products'
  | 'supplier-deliveries'
  | 'supplier-invoices';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, users, purchaseOrders, invoices, supplierInbounds, inventory, logout } = useApp();

  // Badges
  const pendingPOs = purchaseOrders.filter((po) => po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW').length;
  const lowStockCount = inventory.filter((item) => item.currentStock <= item.minStock).length;
  const pendingInvoices = invoices.filter((i) => i.status === 'BELUM_BAYAR').length;
  const pendingApprovalPayment = invoices.filter((i) => i.status === 'MENUNGGU_KONFIRMASI').length;

  const renderNavLinks = () => {
    if (currentUser.role === 'admin') {
      return (
        <>
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Koperasi Executive
          </div>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'dashboard'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dasbor & Arus Barang</span>
          </button>

          <button
            onClick={() => onSelectTab('inventory')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'inventory'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 shrink-0" />
              <span>Inventaris & Stok</span>
            </div>
            {lowStockCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${currentTab === 'inventory' ? 'bg-white text-red-600' : 'bg-amber-100 text-amber-800'}`}>
                {lowStockCount} tipis
              </span>
            )}
          </button>

          <div className="mt-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Transaksi & Operasional
          </div>

          <button
            onClick={() => onSelectTab('client-pos')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'client-pos'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>Purchase Order (Klien)</span>
            </div>
            {pendingPOs > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${currentTab === 'client-pos' ? 'bg-white text-red-600' : 'bg-red-100 text-red-700'}`}>
                {pendingPOs} baru
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('supplier-inbound')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'supplier-inbound'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>Penerimaan Supplier</span>
          </button>

          <div className="mt-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Keuangan & Notifikasi
          </div>

          <button
            onClick={() => onSelectTab('finance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'finance'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Arus Kas & Profit Koperasi</span>
          </button>

          <button
            onClick={() => onSelectTab('financial-reports')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'financial-reports'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>Laporan Keuangan & P&L</span>
          </button>

          <button
            onClick={() => onSelectTab('invoices')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'invoices'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Tagihan & Pembayaran</span>
            </div>
            {pendingApprovalPayment > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${currentTab === 'invoices' ? 'bg-white text-red-600' : 'bg-emerald-100 text-emerald-800'}`}>
                {pendingApprovalPayment} verif
              </span>
            )}
          </button>

          <div className="mt-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Administrasi & Peran
          </div>

          <button
            onClick={() => onSelectTab('users')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'users'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0" />
              <span>Manajemen Pengguna</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentTab === 'users'
                  ? 'bg-white text-red-600'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {users.length}
            </span>
          </button>
        </>
      );
    }

    if (currentUser.role === 'client') {
      return (
        <>
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Portal Klien Tetap
          </div>
          <button
            onClick={() => onSelectTab('client-portal')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'client-portal'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span>Katalog & Status Cepat</span>
          </button>

          <button
            onClick={() => onSelectTab('client-create-po')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'client-create-po'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Buat PO Baru (Set Budget)</span>
          </button>

          <button
            onClick={() => onSelectTab('client-track-orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'client-track-orders'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Lacak Status PO Real-Time</span>
          </button>

          <button
            onClick={() => onSelectTab('client-invoices')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
              currentTab === 'client-invoices'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Tagihan & Bukti Bayar</span>
          </button>
        </>
      );
    }

    // Supplier
    return (
      <>
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Portal Pemasok / Supplier
        </div>
        <button
          onClick={() => onSelectTab('supplier-orders')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
            currentTab === 'supplier-orders'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span>Pesanan Masuk Klien (PO)</span>
        </button>

        <button
          onClick={() => onSelectTab('supplier-portal')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
            currentTab === 'supplier-portal'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span>Dasbor Pasokan Masuk</span>
        </button>

        <button
          onClick={() => onSelectTab('supplier-products')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
            currentTab === 'supplier-products'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>Database Produk & Item Dijual</span>
        </button>

        <button
          onClick={() => onSelectTab('supplier-deliveries')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
            currentTab === 'supplier-deliveries'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Kirim Pasokan Baru</span>
        </button>

        <button
          onClick={() => onSelectTab('supplier-invoices')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
            currentTab === 'supplier-invoices'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 shrink-0" />
          <span>Tagihan & Pencairan Dana</span>
        </button>
      </>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4">
        <div className="space-y-1">{renderNavLinks()}</div>

        {/* Cooperative Official Badge footer */}
        <div className="mt-8 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            <span>Koperasi Garuda Merah Putih</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Legalitas Badan Hukum No: <span className="font-medium text-slate-700">AHU-0012891.AH.01.26</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Status Sistem: <span className="text-emerald-700 font-bold">Online & Real-time</span>
          </p>

          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                logout();
              }
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-700 font-bold text-xs transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer if toggled */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-full bg-white p-4 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <span className="font-extrabold text-slate-900 text-sm">MENU NAVIGASI</span>
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded text-slate-700 hover:bg-slate-100 font-bold text-sm"
                >
                  ✕
                </button>
              </div>
              <div
                className="space-y-1"
                onClick={() => onCloseMobile && onCloseMobile()}
              >
                {renderNavLinks()}
              </div>
            </div>

            {/* Mobile drawer logout */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                    logout();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
