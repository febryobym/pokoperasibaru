import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Package,
  Truck,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Building,
  RefreshCw,
  Plus,
  Eye,
  FileText,
  Users,
  BarChart3,
  Scale,
  Receipt,
  Info,
} from 'lucide-react';
import { TabType } from '../components/Sidebar';
import { FinancialReportsModule } from '../components/FinancialReportsModule';

interface DashboardViewProps {
  onNavigate: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    users,
    inventory,
    stockMovements,
    purchaseOrders,
    supplierInbounds,
    invoices,
    openPOModal,
    openInvoiceModal,
  } = useApp();

  const [activeDashboardTab, setActiveDashboardTab] = useState<'inventory-flow' | 'financial-reports'>('inventory-flow');
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  // Helper map for item cost prices from supplier
  const itemCostMap = new Map<string, number>();
  inventory.forEach((item) => {
    itemCostMap.set(item.id, item.costPrice);
  });

  // Financial calculations
  const totalStockValue = inventory.reduce(
    (acc, item) => acc + item.currentStock * item.costPrice,
    0
  );

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStock);

  // Client billing
  const clientInvoices = invoices.filter((i) => i.type === 'CLIENT_BILL');
  const totalRevenue = clientInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalReceivables = clientInvoices
    .filter((i) => i.status !== 'LUNAS')
    .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

  // Supplier payables
  const supplierInvoices = invoices.filter((i) => i.type === 'SUPPLIER_PAYABLE');
  const totalExpenses = supplierInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalPayables = supplierInvoices
    .filter((i) => i.status !== 'LUNAS')
    .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

  // CRITICAL CALCULATION RULE:
  // "Profit Koperasi adalah profit yang didapatkan dari budget yang diajukan oleh klien dikurangi harga yang didapat dari supplier, bukan harga disepakati."
  let totalClientBudgetRevenue = 0;
  let totalSupplierCost = 0;

  purchaseOrders.forEach((po) => {
    totalClientBudgetRevenue += po.totalClientBudget;
    po.items.forEach((item) => {
      const supplierUnitCost = itemCostMap.get(item.itemId) || Math.round(item.standardPrice * 0.85);
      totalSupplierCost += supplierUnitCost * item.quantity;
    });
  });

  const cooperativeProfitFromBudget = totalClientBudgetRevenue - totalSupplierCost;
  const overallMarginPercent = totalClientBudgetRevenue > 0
    ? (cooperativeProfitFromBudget / totalClientBudgetRevenue) * 100
    : 0;

  // Stock flow counts
  const totalInboundVolume = stockMovements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalOutboundVolume = stockMovements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + m.quantity, 0);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // 7-day flow calculated dynamically from real stockMovements
  const flowDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const inQty = stockMovements
      .filter((m) => m.type === 'IN' && m.date && m.date.startsWith(dateStr))
      .reduce((acc, m) => acc + m.quantity, 0);
    const outQty = stockMovements
      .filter((m) => m.type === 'OUT' && m.date && m.date.startsWith(dateStr))
      .reduce((acc, m) => acc + m.quantity, 0);
    return { day: dayLabel, inQty, outQty };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-red-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-red-100 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/20">
            <span>🔴 Induk Koperasi Usaha Bersama</span>
            <span>•</span>
            <span>Real-Time Warehouse & Financial Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Dasbor Terpadu Inventaris & Laporan Keuangan Koperasi
          </h1>
          <p className="mt-2 text-red-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Pantau arus keluar masuk stok barang setiap hari, kontrol penawaran harga sesuai budget klien tetap, verifikasi pasokan supplier, serta tinjau laporan Laba Rugi, Arus Kas, dan profitabilitas koperasi secara terpusat.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveDashboardTab('inventory-flow')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 ${
                activeDashboardTab === 'inventory-flow'
                  ? 'bg-white text-red-800'
                  : 'bg-red-900/60 hover:bg-red-900/80 text-white border border-white/20'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Arus Inventaris & Stok</span>
            </button>
            <button
              onClick={() => setActiveDashboardTab('financial-reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 ${
                activeDashboardTab === 'financial-reports'
                  ? 'bg-white text-red-800'
                  : 'bg-red-900/60 hover:bg-red-900/80 text-white border border-white/20'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Laporan Keuangan Komprehensif (P&L & Arus Kas)</span>
            </button>
            <button
              onClick={() => onNavigate('client-pos')}
              className="px-4 py-2 bg-red-900/60 hover:bg-red-900/80 text-white rounded-xl text-xs font-bold transition border border-white/20 cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Tinjau PO Klien ({purchaseOrders.filter((p) => p.status === 'DIAJUKAN' || p.status === 'MENUNGGU_REVIEW').length})</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
      </div>

      {/* Main View Switcher Mode */}
      {activeDashboardTab === 'financial-reports' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <button
              onClick={() => setActiveDashboardTab('inventory-flow')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              ← Kembali ke Dasbor Arus Inventaris
            </button>
          </div>
          <FinancialReportsModule />
        </div>
      ) : (
        /* ================= INVENTORY & EXECUTIVE FLOW ================= */
        <div className="space-y-6">
          {/* KPI Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Valuasi Stok */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Valuasi Stok Koperasi
                </span>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-900">
                  {formatRupiah(totalStockValue)}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>{inventory.length} Jenis SKU Terdaftar</span>
                </p>
              </div>
            </div>

            {/* Card 2: Arus Barang Keluar (Penjualan) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Barang Keluar
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-900">
                  {totalOutboundVolume} Unit
                </div>
                <p className="text-xs text-blue-600 mt-1 font-semibold flex items-center gap-1">
                  <span>{purchaseOrders.length} Pesanan Diproses</span>
                </p>
              </div>
            </div>

            {/* Card 3: Arus Barang Masuk (Pasokan) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Barang Masuk Supplier
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-900">
                  {totalInboundVolume} Unit
                </div>
                <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                  <span>{supplierInbounds.length} Pengiriman Gudang</span>
                </p>
              </div>
            </div>

            {/* Card 4: Keuntungan Koperasi (RULE: Budget Klien - Biaya Supplier) */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Profit Koperasi (Budget - HPP)
                </span>
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-emerald-700">
                  {formatRupiah(cooperativeProfitFromBudget)}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-bold">
                    Margin: {overallMarginPercent.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => setActiveDashboardTab('financial-reports')}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Buka Laporan ↗
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Alerts if low */}
          {lowStockItems.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-amber-900">
                    Peringatan: {lowStockItems.length} Barang Membutuhkan Restock Pasokan Segera!
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {lowStockItems.map((i) => `${i.name} (Sisa ${i.currentStock} ${i.unit})`).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('supplier-inbound')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
              >
                Pesan Pasokan Supplier
              </button>
            </div>
          )}

          {/* Main Analytics: Daily In/Out Flow Chart & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Arus Masuk vs Keluar Barang Harian */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Arus Keluar Masuk Barang Harian
                  </h2>
                  <p className="text-xs text-slate-500">
                    Volume pergerakan stok dari pemasok (Inbound) vs pengiriman ke klien tetap (Outbound)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
                    Masuk (Supplier)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium ml-2">
                    <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block"></span>
                    Keluar (Klien)
                  </span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="pt-4">
                <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200">
                  {flowDays.map((item, idx) => {
                    const maxVal = 260;
                    const inHeight = Math.min(100, Math.round((item.inQty / maxVal) * 100));
                    const outHeight = Math.min(100, Math.round((item.outQty / maxVal) * 100));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                          {/* Inbound bar */}
                          <div
                            style={{ height: `${Math.max(item.inQty > 0 ? 8 : 0, inHeight)}%` }}
                            className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition relative group/bar"
                          >
                            {item.inQty > 0 && (
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap pointer-events-none z-20">
                                +{item.inQty}
                              </div>
                            )}
                          </div>

                          {/* Outbound bar */}
                          <div
                            style={{ height: `${Math.max(item.outQty > 0 ? 8 : 0, outHeight)}%` }}
                            className="w-1/2 max-w-[20px] bg-blue-500 hover:bg-blue-600 rounded-t-sm transition relative group/bar"
                          >
                            {item.outQty > 0 && (
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap pointer-events-none z-20">
                                -{item.outQty}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 mt-2">
                          {item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Report Teaser Banner */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">
                    Modul Laporan Keuangan Lengkap Tersedia
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Tinjau Laporan Laba Rugi Harian/Mingguan/Bulanan, Arus Kas Masuk & Keluar, serta Analisis Margin per Klien.
                  </p>
                </div>
                <button
                  onClick={() => setActiveDashboardTab('financial-reports')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Buka Modul Keuangan Lengkap</span>
                </button>
              </div>
            </div>

            {/* Right Col: Quick Status & Pending Orders */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Antrean PO & Penawaran Klien
                </h3>
                <p className="text-xs text-slate-500">
                  Status penawaran budget dari mitra koperasi
                </p>

                <div className="mt-4 space-y-3">
                  {purchaseOrders.slice(0, 4).map((po) => (
                    <div
                      key={po.id}
                      onClick={() => openPOModal(po)}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 font-mono">
                            {po.poNumber}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                              po.status === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'DISETUJUI'
                                ? 'bg-teal-100 text-teal-800'
                                : po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {po.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                          {po.clientName}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Budget Ditawar</span>
                        <span className="font-black text-blue-900 text-xs">
                          {formatRupiah(po.totalClientBudget)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('client-pos')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer text-center"
              >
                Lihat Semua Purchase Order ({purchaseOrders.length})
              </button>
            </div>
          </div>

          {/* Recent Stock Movement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Riwayat Keluar Masuk Barang Terkini
                </h3>
                <p className="text-xs text-slate-500">
                  Log mutasi stok harian terverifikasi sistem koperasi
                </p>
              </div>

              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
              >
                Buka Riwayat Lengkap →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Waktu</th>
                    <th className="p-3.5">Nama Barang & SKU</th>
                    <th className="p-3.5">Tipe Mutasi</th>
                    <th className="p-3.5">Jumlah</th>
                    <th className="p-3.5">Pihak Terkait</th>
                    <th className="p-3.5">No. Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements.slice(0, 6).map((mov, idx) => (
                    <tr key={`${mov.id}-${idx}`} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {mov.date}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{mov.itemName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{mov.sku}</span>
                      </td>
                      <td className="p-3.5">
                        {mov.type === 'IN' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                            <ArrowDownRight className="w-3 h-3" /> MASUK (IN)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                            <ArrowUpRight className="w-3 h-3" /> KELUAR (OUT)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {mov.quantity} {mov.unit}
                      </td>
                      <td className="p-3.5 text-slate-600">{mov.partyName}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {mov.referenceNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
