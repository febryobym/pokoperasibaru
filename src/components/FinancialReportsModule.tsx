import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Users,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ChevronRight,
  PieChart,
  BarChart3,
  Scale,
  ShieldCheck,
  Building,
  Info,
} from 'lucide-react';

export type ReportTab = 'laba-rugi' | 'arus-kas' | 'profitabilitas' | 'tagihan-pembayaran';
export type TimePeriod = 'harian' | 'mingguan' | 'bulanan';

export const FinancialReportsModule: React.FC = () => {
  const { purchaseOrders, supplierInbounds, invoices, inventory, users, openInvoiceModal } = useApp();

  const [activeTab, setActiveTab] = useState<ReportTab>('laba-rugi');
  const [period, setPeriod] = useState<TimePeriod>('bulanan');
  const [profitViewType, setProfitViewType] = useState<'produk' | 'klien'>('produk');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const formatShortRupiah = (num: number) => {
    if (Math.abs(num) >= 1_000_000_000) {
      return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
    }
    return `Rp ${Number(num || 0).toLocaleString('id-ID')}`;
  };

  // Helper map for item cost prices from supplier
  const itemCostMap = new Map<string, number>();
  inventory.forEach((item) => {
    itemCostMap.set(item.id, item.costPrice);
  });

  // Calculate Profit per Purchase Order:
  // RULE: Profit Koperasi = Budget yang diajukan oleh klien (totalClientBudget) - Total Harga yang didapat dari supplier
  const poFinancials = purchaseOrders.map((po) => {
    const clientBudgetRevenue = po.totalClientBudget; // Revenue from client proposed budget
    let totalSupplierCost = 0;

    po.items.forEach((item) => {
      const supplierUnitCost = itemCostMap.get(item.itemId) || Math.round(item.standardPrice * 0.85);
      totalSupplierCost += supplierUnitCost * item.quantity;
    });

    const cooperativeProfit = clientBudgetRevenue - totalSupplierCost;
    const profitMargin = clientBudgetRevenue > 0 ? (cooperativeProfit / clientBudgetRevenue) * 100 : 0;

    return {
      po,
      clientBudgetRevenue,
      totalSupplierCost,
      cooperativeProfit,
      profitMargin,
    };
  });

  // Aggregated totals across all valid POs
  const overallClientBudgetRevenue = poFinancials.reduce((sum, p) => sum + p.clientBudgetRevenue, 0);
  const overallSupplierCost = poFinancials.reduce((sum, p) => sum + p.totalSupplierCost, 0);
  const overallCooperativeProfit = overallClientBudgetRevenue - overallSupplierCost;
  const overallMargin = overallClientBudgetRevenue > 0
    ? (overallCooperativeProfit / overallClientBudgetRevenue) * 100
    : 0;

  // Operational expenses estimate (logistics, warehouse, packaging ~ 8% of supplier cost)
  const estimatedOperatingExpenses = Math.round(overallSupplierCost * 0.08);
  const netCooperativeProfit = Math.max(0, overallCooperativeProfit - estimatedOperatingExpenses);
  const estimatedSHUAllocation = Math.round(netCooperativeProfit * 0.4); // 40% allocated for Cooperative Members SHU

  // Cash Flow Calculations
  const clientInvoices = invoices.filter((i) => i.type === 'CLIENT_BILL');
  const supplierInvoices = invoices.filter((i) => i.type === 'SUPPLIER_PAYABLE');

  const totalCashIn = clientInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalCashOut = supplierInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const netCashFlow = totalCashIn - totalCashOut;

  // Receivables & Payables
  const totalReceivables = clientInvoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
  const totalPayables = supplierInvoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  // Period-based data series for P&L and Cash Flow
  // Daily series (Last 7 days)
  const dailySeries = [
    { label: '04 Okt', revenue: 7100000, cost: 6200000, profit: 900000, cashIn: 7100000, cashOut: 0 },
    { label: '05 Okt', revenue: 4200000, cost: 3600000, profit: 600000, cashIn: 0, cashOut: 4500000 },
    { label: '06 Okt', revenue: 6250000, cost: 5750000, profit: 500000, cashIn: 0, cashOut: 0 },
    { label: '07 Okt', revenue: 16800000, cost: 19500000, profit: -2700000, cashIn: 0, cashOut: 9300000 }, // Rejected order simulation
    { label: '08 Okt', revenue: 18100000, cost: 16700000, profit: 1400000, cashIn: 18100000, cashOut: 0 },
    { label: '09 Okt', revenue: 18585000, cost: 15300000, profit: 3285000, cashIn: 0, cashOut: 0 },
    { label: '10 Okt (Hari Ini)', revenue: 24750000, cost: 23450000, profit: 1300000, cashIn: 0, cashOut: 0 },
  ];

  // Weekly series (Last 4 weeks)
  const weeklySeries = [
    { label: 'Minggu 1 (1-7 Sep)', revenue: 28500000, cost: 24200000, profit: 4300000, cashIn: 25000000, cashOut: 20000000 },
    { label: 'Minggu 2 (8-14 Sep)', revenue: 35200000, cost: 30100000, profit: 5100000, cashIn: 32000000, cashOut: 28000000 },
    { label: 'Minggu 3 (15-21 Sep)', revenue: 42000000, cost: 36500000, profit: 5500000, cashIn: 40000000, cashOut: 34000000 },
    { label: 'Minggu 4 (22-28 Sep)', revenue: 48900000, cost: 41800000, profit: 7100000, cashIn: 45000000, cashOut: 38000000 },
    { label: 'Minggu 5 Berjalan (Okt)', revenue: overallClientBudgetRevenue, cost: overallSupplierCost, profit: overallCooperativeProfit, cashIn: totalCashIn, cashOut: totalCashOut },
  ];

  // Monthly series (Last 6 months)
  const monthlySeries = [
    { label: 'Mei 2026', revenue: 98000000, cost: 84000000, profit: 14000000, cashIn: 92000000, cashOut: 80000000 },
    { label: 'Jun 2026', revenue: 115000000, cost: 98000000, profit: 17000000, cashIn: 110000000, cashOut: 94000000 },
    { label: 'Jul 2026', revenue: 128000000, cost: 109000000, profit: 19000000, cashIn: 125000000, cashOut: 105000000 },
    { label: 'Agu 2026', revenue: 142000000, cost: 121000000, profit: 21000000, cashIn: 138000000, cashOut: 116000000 },
    { label: 'Sep 2026', revenue: 154600000, cost: 132600000, profit: 22000000, cashIn: 142000000, cashOut: 120000000 },
    { label: 'Okt 2026 (Berjalan)', revenue: overallClientBudgetRevenue, cost: overallSupplierCost, profit: overallCooperativeProfit, cashIn: totalCashIn, cashOut: totalCashOut },
  ];

  const activeSeries = period === 'harian' ? dailySeries : period === 'mingguan' ? weeklySeries : monthlySeries;

  // Product profitability breakdown
  // RULE: Profit = Budget diajukan klien - Harga beli dari supplier
  const productProfitability = inventory.map((inv) => {
    let totalQtyOrdered = 0;
    let totalClientBudget = 0;
    let totalSupplierCost = 0;

    purchaseOrders.forEach((po) => {
      po.items.forEach((item) => {
        if (item.itemId === inv.id) {
          totalQtyOrdered += item.quantity;
          totalClientBudget += item.targetPrice * item.quantity; // Budget diajukan klien
          totalSupplierCost += inv.costPrice * item.quantity; // Harga supplier
        }
      });
    });

    const cooperativeProfit = totalClientBudget - totalSupplierCost;
    const margin = totalClientBudget > 0 ? (cooperativeProfit / totalClientBudget) * 100 : 0;

    return {
      item: inv,
      totalQtyOrdered,
      totalClientBudget,
      totalSupplierCost,
      cooperativeProfit,
      margin,
    };
  }).filter((p) => p.totalQtyOrdered > 0 || p.item.currentStock > 0);

  // Client profitability breakdown
  // RULE: Profit Koperasi dari Klien = Budget Klien - Total HPP Supplier
  const clientUsers = users.filter((u) => u.role === 'client');
  const clientProfitability = clientUsers.map((client) => {
    const clientPOs = purchaseOrders.filter(
      (po) =>
        po.clientId === client.id ||
        po.clientName === client.companyName ||
        po.clientName === client.name
    );

    let totalClientBudget = 0;
    let totalSupplierCost = 0;

    clientPOs.forEach((po) => {
      totalClientBudget += po.totalClientBudget;
      po.items.forEach((it) => {
        const supplierCost = itemCostMap.get(it.itemId) || Math.round(it.standardPrice * 0.85);
        totalSupplierCost += supplierCost * it.quantity;
      });
    });

    const cooperativeProfit = totalClientBudget - totalSupplierCost;
    const margin = totalClientBudget > 0 ? (cooperativeProfit / totalClientBudget) * 100 : 0;

    return {
      client,
      poCount: clientPOs.length,
      totalClientBudget,
      totalSupplierCost,
      cooperativeProfit,
      margin,
    };
  });

  return (
    <div className="space-y-6">
      {/* Notice Card: Profit Calculation Formula */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Prinsip Akuntansi Profit Koperasi Garuda Merah Putih
          </p>
          <p className="text-blue-800 leading-relaxed">
            Sesuai regulasi sistem, <strong>Profit Koperasi</strong> dihitung berdasarkan{' '}
            <strong className="text-blue-950 font-black">
              Budget yang diajukan oleh Klien dikurangi Harga yang didapat dari Supplier
            </strong>{' '}
            (bukan berdasarkan harga disepakati). Seluruh modul Laba Rugi, Arus Kas, dan Profitabilitas menggunakan formula ini secara presisi.
          </p>
        </div>
      </div>

      {/* Module Header & Period Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Modul Pelaporan Keuangan & Analisis Profitabilitas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Laporan terpadu Laba Rugi, Arus Kas, analisis profit per produk/klien, serta pemantauan tagihan dan piutang.
          </p>
        </div>

        {/* Global Period Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-stretch md:self-auto">
          {(['harian', 'mingguan', 'bulanan'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                period === p
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => window.print()}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition ml-1"
            title="Cetak Laporan Keuangan"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('laba-rugi')}
          className={`pb-3 px-4 transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'laba-rugi'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Laporan Laba Rugi ({period})</span>
        </button>

        <button
          onClick={() => setActiveTab('arus-kas')}
          className={`pb-3 px-4 transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'arus-kas'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Laporan Arus Kas ({period})</span>
        </button>

        <button
          onClick={() => setActiveTab('profitabilitas')}
          className={`pb-3 px-4 transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'profitabilitas'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analisis Profitabilitas (Produk & Klien)</span>
        </button>

        <button
          onClick={() => setActiveTab('tagihan-pembayaran')}
          className={`pb-3 px-4 transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'tagihan-pembayaran'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ringkasan Tagihan & Pembayaran</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. LAPORAN LABA RUGI (INCOME STATEMENT / P&L) */}
      {/* ========================================================= */}
      {activeTab === 'laba-rugi' && (
        <div className="space-y-6">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Budget Diajukan Klien (Pendapatan)
              </span>
              <p className="text-xl font-black text-blue-900 mt-1">
                {formatRupiah(overallClientBudgetRevenue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Dari {purchaseOrders.length} transaksi PO terdaftar
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Beban Pokok Penjualan (HPP Supplier)
              </span>
              <p className="text-xl font-black text-slate-800 mt-1">
                {formatRupiah(overallSupplierCost)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Biaya modal beli pasokan supplier
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                Laba Kotor Koperasi (Gross Profit)
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {formatRupiah(overallCooperativeProfit)}
              </p>
              <p className="text-[11px] text-emerald-800 font-bold mt-1">
                Margin: {overallMargin.toFixed(1)}% dari Budget Klien
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs bg-red-50/20">
              <span className="text-[10px] uppercase font-bold text-red-700 block tracking-wider">
                Laba Bersih Koperasi (Net Profit)
              </span>
              <p className="text-xl font-black text-red-700 mt-1">
                {formatRupiah(netCooperativeProfit)}
              </p>
              <p className="text-[11px] text-red-800 font-bold mt-1">
                Est. Cadangan SHU: {formatRupiah(estimatedSHUAllocation)}
              </p>
            </div>
          </div>

          {/* Visual Chart: P&L Trend (Bar Chart SVG) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Visualisasi Grafik Laba Rugi {period.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komparasi Pendapatan Budget Klien vs HPP Supplier vs Profit Koperasi
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-blue-600"></span>
                  <span className="text-slate-700">Budget Klien</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-400"></span>
                  <span className="text-slate-700">HPP Supplier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600"></span>
                  <span className="text-slate-700">Profit Koperasi</span>
                </div>
              </div>
            </div>

            {/* SVG Interactive Chart */}
            <div className="w-full h-64 relative pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 220" preserveAspectRatio="none">
                {/* Grid horizontal lines */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="700" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="130" x2="700" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="180" x2="700" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

                {activeSeries.map((item, idx) => {
                  const maxVal = Math.max(...activeSeries.map((s) => s.revenue), 1);
                  const colWidth = 700 / activeSeries.length;
                  const xCenter = idx * colWidth + colWidth / 2;

                  const revHeight = Math.max(8, (item.revenue / maxVal) * 140);
                  const costHeight = Math.max(6, (item.cost / maxVal) * 140);
                  const profitHeight = Math.max(4, (Math.max(0, item.profit) / maxVal) * 140);

                  const yRev = 180 - revHeight;
                  const yCost = 180 - costHeight;
                  const yProfit = 180 - profitHeight;

                  return (
                    <g key={idx} className="group">
                      {/* Bar 1: Budget Klien */}
                      <rect
                        x={xCenter - 22}
                        y={yRev}
                        width="12"
                        height={revHeight}
                        rx="3"
                        className="fill-blue-600 hover:fill-blue-700 transition"
                      />
                      {/* Bar 2: HPP Supplier */}
                      <rect
                        x={xCenter - 8}
                        y={yCost}
                        width="12"
                        height={costHeight}
                        rx="3"
                        className="fill-slate-400 hover:fill-slate-500 transition"
                      />
                      {/* Bar 3: Profit Koperasi */}
                      <rect
                        x={xCenter + 6}
                        y={yProfit}
                        width="12"
                        height={profitHeight}
                        rx="3"
                        className="fill-emerald-600 hover:fill-emerald-700 transition"
                      />

                      {/* X-axis Label */}
                      <text
                        x={xCenter}
                        y="200"
                        textAnchor="middle"
                        className="text-[10px] fill-slate-500 font-semibold"
                      >
                        {item.label}
                      </text>

                      {/* Hover Tooltip Value */}
                      <text
                        x={xCenter}
                        y={Math.min(yRev, yProfit) - 8}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition"
                      >
                        +{formatShortRupiah(item.profit)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Structured Indonesian Cooperative Income Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  Rincian Laporan Laba Rugi Komprehensif (Metode Multi-Step)
                </h4>
                <p className="text-xs text-slate-500">
                  Koperasi Garuda Merah Putih • Periode: {period.toUpperCase()}
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                Status: Audit Internal Real-Time
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Revenue Section */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between font-bold text-slate-800 text-sm">
                  <span>1. PENDAPATAN USAHA (REVENUE)</span>
                  <span className="font-black text-blue-900">{formatRupiah(overallClientBudgetRevenue)}</span>
                </div>
                <div className="pl-4 space-y-1.5 text-slate-600 text-xs">
                  <div className="flex justify-between">
                    <span>Penjualan Sembako & Material (Budget Klien Diajukan)</span>
                    <span>{formatRupiah(overallClientBudgetRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Retur & Potongan Penjualan</span>
                    <span>Rp 0</span>
                  </div>
                </div>
              </div>

              {/* COGS Section */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between font-bold text-slate-800 text-sm">
                  <span>2. BEBAN POKOK PENJUALAN (HPP SUPPLIER)</span>
                  <span className="font-black text-slate-800">({formatRupiah(overallSupplierCost)})</span>
                </div>
                <div className="pl-4 space-y-1.5 text-slate-600 text-xs">
                  <div className="flex justify-between">
                    <span>Biaya Pembelian Barang dari Supplier Tetap</span>
                    <span>{formatRupiah(overallSupplierCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Biaya Angkut Masuk Supplier (Inbound Freight)</span>
                    <span>Termasuk dalam HPP</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit Highlight */}
              <div className="p-4 bg-emerald-50/50 flex justify-between font-black text-emerald-900 text-sm">
                <span>3. LABA KOTOR KOPERASI (GROSS PROFIT = BUDGET KLIEN - HPP SUPPLIER)</span>
                <span className="text-base text-emerald-700">{formatRupiah(overallCooperativeProfit)}</span>
              </div>

              {/* Operating Expenses */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between font-bold text-slate-800 text-sm">
                  <span>4. BEBAN OPERASIONAL & LOGISTIK</span>
                  <span className="font-black text-red-800">({formatRupiah(estimatedOperatingExpenses)})</span>
                </div>
                <div className="pl-4 space-y-1.5 text-slate-600 text-xs">
                  <div className="flex justify-between">
                    <span>Beban Operasional Armada Pengiriman Koperasi</span>
                    <span>{formatRupiah(Math.round(estimatedOperatingExpenses * 0.55))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beban Pemeliharaan Gudang & Pengepakan</span>
                    <span>{formatRupiah(Math.round(estimatedOperatingExpenses * 0.45))}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                    Hasil Akhir Keuangan Koperasi
                  </span>
                  <p className="text-base font-black">
                    LABA BERSIH KOPERASI (NET PROFIT)
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xl font-black text-emerald-400 block font-mono">
                    {formatRupiah(netCooperativeProfit)}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Alokasi Sisa Hasil Usaha (SHU 40%): {formatRupiah(estimatedSHUAllocation)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LAPORAN ARUS KAS (CASH FLOW STATEMENT) */}
      {/* ========================================================= */}
      {activeTab === 'arus-kas' && (
        <div className="space-y-6">
          {/* Top Cash KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Arus Kas Masuk (Inflow)
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                {formatRupiah(totalCashIn)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Penerimaan riil pembayaran dari klien
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Arus Kas Keluar (Outflow)
                </span>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-700 mt-2">
                {formatRupiah(totalCashOut)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Pengeluaran riil ke supplier dan operasional
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Arus Kas Bersih (Net Cash Flow)
                </span>
                <div className={`p-2 rounded-xl ${netCashFlow >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-black mt-2 ${netCashFlow >= 0 ? 'text-blue-900' : 'text-amber-700'}`}>
                {formatRupiah(netCashFlow)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Surplus likuiditas kas operasional
              </p>
            </div>
          </div>

          {/* Dual Bar Chart: Inflow vs Outflow */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Grafik Arus Kas Masuk vs Kas Keluar ({period.toUpperCase()})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pergerakan likuiditas harian/mingguan/bulanan koperasi
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600"></span>
                  <span className="text-slate-700">Kas Masuk (Pelunasan Klien)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-red-500"></span>
                  <span className="text-slate-700">Kas Keluar (Bayar Supplier)</span>
                </div>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="w-full h-64 relative pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 220" preserveAspectRatio="none">
                <line x1="0" y1="30" x2="700" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="700" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="130" x2="700" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="180" x2="700" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

                {activeSeries.map((item, idx) => {
                  const maxCash = Math.max(...activeSeries.map((s) => Math.max(s.cashIn, s.cashOut)), 1);
                  const colWidth = 700 / activeSeries.length;
                  const xCenter = idx * colWidth + colWidth / 2;

                  const inHeight = Math.max(6, (item.cashIn / maxCash) * 140);
                  const outHeight = Math.max(6, (item.cashOut / maxCash) * 140);

                  const yIn = 180 - inHeight;
                  const yOut = 180 - outHeight;

                  return (
                    <g key={idx} className="group">
                      {/* Bar 1: Cash In */}
                      <rect
                        x={xCenter - 16}
                        y={yIn}
                        width="14"
                        height={inHeight}
                        rx="3"
                        className="fill-emerald-600 hover:fill-emerald-700 transition"
                      />
                      {/* Bar 2: Cash Out */}
                      <rect
                        x={xCenter + 2}
                        y={yOut}
                        width="14"
                        height={outHeight}
                        rx="3"
                        className="fill-red-500 hover:fill-red-600 transition"
                      />

                      <text
                        x={xCenter}
                        y="200"
                        textAnchor="middle"
                        className="text-[10px] fill-slate-500 font-semibold"
                      >
                        {item.label}
                      </text>

                      {/* Tooltip on hover */}
                      <text
                        x={xCenter}
                        y={Math.min(yIn, yOut) - 6}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-slate-800 opacity-0 group-hover:opacity-100 transition"
                      >
                        In: {formatShortRupiah(item.cashIn)} | Out: {formatShortRupiah(item.cashOut)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Cash Flow Statement Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="font-black text-sm text-slate-900">
                Laporan Arus Kas Format Koperasi (Cash Flow Breakdown)
              </h4>
              <p className="text-xs text-slate-500">
                Penerimaan kas dari aktivitas operasional koperasi
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 space-y-2">
                <span className="font-bold text-emerald-900 block text-sm">
                  A. ARUS KAS DARI AKTIVITAS OPERASIONAL (MASUK)
                </span>
                <div className="pl-4 space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Penerimaan pelunasan tagihan dari Klien (PT Sumber Makmur Nusantara, dll)</span>
                    <span className="font-bold text-slate-800">{formatRupiah(totalCashIn)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Penerimaan bunga simpanan / kas bank</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-100">
                    <span>Total Kas Masuk Operasional</span>
                    <span>{formatRupiah(totalCashIn)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <span className="font-bold text-red-900 block text-sm">
                  B. ARUS KAS DARI AKTIVITAS OPERASIONAL (KELUAR)
                </span>
                <div className="pl-4 space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Pembayaran hutang dagang pasokan ke Supplier (PT Semen Nusantara, CV Tani Jaya)</span>
                    <span className="font-bold text-slate-800">({formatRupiah(totalCashOut)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya BBM logistik & operasional armada</span>
                    <span>Termasuk dalam kas keluar</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-700 pt-1 border-t border-slate-100">
                    <span>Total Kas Keluar Operasional</span>
                    <span>({formatRupiah(totalCashOut)})</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 flex justify-between font-black text-slate-900 text-sm">
                <span>KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS</span>
                <span className={netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {formatRupiah(netCashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ANALISIS PROFITABILITAS PER PRODUK & PER KLIEN */}
      {/* ========================================================= */}
      {activeTab === 'profitabilitas' && (
        <div className="space-y-6">
          {/* Sub-toggle: Per Produk vs Per Klien */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Pilih Dimensi Analisis Profitabilitas
              </h3>
              <p className="text-xs text-slate-500">
                Perhitungan: <strong>Budget yang diajukan oleh Klien</strong> dikurangi <strong>Harga Beli dari Supplier</strong>.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setProfitViewType('produk')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  profitViewType === 'produk'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Profitabilitas Per Produk</span>
              </button>
              <button
                onClick={() => setProfitViewType('klien')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  profitViewType === 'klien'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Profitabilitas Per Klien</span>
              </button>
            </div>
          </div>

          {/* VIEW: PER PRODUK */}
          {profitViewType === 'produk' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900">
                    Peringkat Kontribusi Profitabilitas Komoditas Barang
                  </h4>
                  <span className="text-xs text-slate-500">
                    Total {productProfitability.length} Komoditas Aktif
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Produk & SKU</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3 text-right">Vol. Dipesan</th>
                        <th className="p-3 text-right">Budget Klien (Rp)</th>
                        <th className="p-3 text-right">HPP Supplier (Rp)</th>
                        <th className="p-3 text-right font-black text-slate-900">
                          Profit Koperasi (Rp)
                        </th>
                        <th className="p-3 text-center">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productProfitability
                        .sort((a, b) => b.cooperativeProfit - a.cooperativeProfit)
                        .map((p) => {
                          const isHighMargin = p.margin >= 10;
                          return (
                            <tr key={p.item.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3">
                                <p className="font-bold text-slate-900">{p.item.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{p.item.sku}</p>
                              </td>
                              <td className="p-3 text-slate-600">{p.item.category}</td>
                              <td className="p-3 text-right font-bold text-slate-700">
                                {p.totalQtyOrdered} {p.item.unit}
                              </td>
                              <td className="p-3 text-right font-semibold text-blue-900">
                                {formatRupiah(p.totalClientBudget)}
                              </td>
                              <td className="p-3 text-right text-slate-600">
                                {formatRupiah(p.totalSupplierCost)}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700">
                                {formatRupiah(p.cooperativeProfit)}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    isHighMargin
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.margin > 0
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {p.margin.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Horizontal Comparison Bars */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-black text-sm text-slate-900">
                  Grafik Visual Kontribusi Profit per Komoditas (Rp)
                </h4>
                <div className="space-y-3 pt-2">
                  {productProfitability
                    .sort((a, b) => b.cooperativeProfit - a.cooperativeProfit)
                    .map((p) => {
                      const maxProfit = Math.max(
                        ...productProfitability.map((x) => x.cooperativeProfit),
                        1
                      );
                      const barPercent = Math.max(
                        4,
                        Math.min(100, (p.cooperativeProfit / maxProfit) * 100)
                      );

                      return (
                        <div key={p.item.id} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-800">{p.item.name}</span>
                            <span className="font-black text-emerald-700 font-mono">
                              {formatRupiah(p.cooperativeProfit)} ({p.margin.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                              style={{ width: `${barPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PER KLIEN */}
          {profitViewType === 'klien' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900">
                    Peringkat Kontribusi Keuntungan Koperasi per Klien Tetap
                  </h4>
                  <span className="text-xs text-slate-500">
                    Total {clientProfitability.length} Klien Terdaftar
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Klien / Perusahaan</th>
                        <th className="p-3 text-center">Jumlah PO</th>
                        <th className="p-3 text-right">Total Budget Klien (Rp)</th>
                        <th className="p-3 text-right">Total Beban Supplier (Rp)</th>
                        <th className="p-3 text-right font-black text-slate-900">
                          Profit Koperasi (Rp)
                        </th>
                        <th className="p-3 text-center">Rata-rata Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientProfitability
                        .sort((a, b) => b.cooperativeProfit - a.cooperativeProfit)
                        .map((c) => (
                          <tr key={c.client.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">
                                {c.client.companyName || c.client.name}
                              </p>
                              <p className="text-[10px] text-slate-400">{c.client.phone}</p>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700">{c.poCount} PO</td>
                            <td className="p-3 text-right font-semibold text-blue-900">
                              {formatRupiah(c.totalClientBudget)}
                            </td>
                            <td className="p-3 text-right text-slate-600">
                              {formatRupiah(c.totalSupplierCost)}
                            </td>
                            <td className="p-3 text-right font-black text-emerald-700">
                              {formatRupiah(c.cooperativeProfit)}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                                {c.margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Client Comparison Bars */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-black text-sm text-slate-900">
                  Grafik Visual Kontribusi Keuntungan per Klien Tetap
                </h4>
                <div className="space-y-3 pt-2">
                  {clientProfitability
                    .sort((a, b) => b.cooperativeProfit - a.cooperativeProfit)
                    .map((c) => {
                      const maxProfit = Math.max(
                        ...clientProfitability.map((x) => x.cooperativeProfit),
                        1
                      );
                      const barPercent = Math.max(
                        5,
                        Math.min(100, (c.cooperativeProfit / maxProfit) * 100)
                      );

                      return (
                        <div key={c.client.id} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-800">
                              {c.client.companyName || c.client.name}
                            </span>
                            <span className="font-black text-emerald-700 font-mono">
                              {formatRupiah(c.cooperativeProfit)} ({c.margin.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${barPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. RINGKASAN TAGIHAN & PEMBAYARAN TERTUNDA / SELESAI */}
      {/* ========================================================= */}
      {activeTab === 'tagihan-pembayaran' && (
        <div className="space-y-6">
          {/* Dual Overview Cards: Client Receivables vs Supplier Payables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Tagihan Klien (Piutang Koperasi) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      Piutang Tagihan Klien (Client Receivables)
                    </h3>
                    <p className="text-[11px] text-slate-500">Faktur penagihan yang diterbitkan koperasi</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {clientInvoices.length} Faktur
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block">Lunas (Selesai)</span>
                  <p className="text-sm font-black text-emerald-800 mt-1">
                    {formatShortRupiah(
                      clientInvoices.filter((i) => i.status === 'LUNAS').reduce((s, i) => s + i.paidAmount, 0)
                    )}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] text-amber-800 font-bold block">Verifikasi</span>
                  <p className="text-sm font-black text-amber-800 mt-1">
                    {formatShortRupiah(
                      clientInvoices.filter((i) => i.status === 'MENUNGGU_KONFIRMASI').reduce((s, i) => s + i.totalAmount, 0)
                    )}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
                  <span className="text-[10px] text-red-800 font-bold block">Tertunda</span>
                  <p className="text-sm font-black text-red-800 mt-1">
                    {formatShortRupiah(totalReceivables)}
                  </p>
                </div>
              </div>

              {/* Progress Distribution */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Tingkat Kolektibilitas Tagihan</span>
                  <span className="font-bold text-slate-800">
                    {totalCashIn > 0
                      ? Math.round((totalCashIn / (totalCashIn + totalReceivables)) * 100)
                      : 0}
                    % Terbayar
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${
                        totalCashIn > 0
                          ? (totalCashIn / (totalCashIn + totalReceivables)) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-red-400"
                    style={{
                      width: `${
                        totalReceivables > 0
                          ? (totalReceivables / (totalCashIn + totalReceivables)) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Kewajiban Bayar ke Supplier (Hutang Dagang) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      Hutang Pembayaran Supplier (Payables)
                    </h3>
                    <p className="text-[11px] text-slate-500">Kewajiban bayar pasokan barang masuk</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {supplierInvoices.length} Faktur
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block">Sudah Dibayar</span>
                  <p className="text-sm font-black text-emerald-800 mt-1">
                    {formatShortRupiah(totalCashOut)}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] text-amber-800 font-bold block">Pencairan</span>
                  <p className="text-sm font-black text-amber-800 mt-1">
                    {formatShortRupiah(
                      supplierInvoices.filter((i) => i.status === 'MENUNGGU_KONFIRMASI').reduce((s, i) => s + i.totalAmount, 0)
                    )}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
                  <span className="text-[10px] text-red-800 font-bold block">Belum Bayar</span>
                  <p className="text-sm font-black text-red-800 mt-1">
                    {formatShortRupiah(totalPayables)}
                  </p>
                </div>
              </div>

              {/* Progress Distribution */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Tingkat Pelunasan ke Supplier</span>
                  <span className="font-bold text-slate-800">
                    {totalCashOut > 0
                      ? Math.round((totalCashOut / (totalCashOut + totalPayables)) * 100)
                      : 0}
                    % Lunas
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${
                        totalCashOut > 0
                          ? (totalCashOut / (totalCashOut + totalPayables)) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-red-400"
                    style={{
                      width: `${
                        totalPayables > 0
                          ? (totalPayables / (totalCashOut + totalPayables)) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List of Pending Invoices */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  Daftar Tagihan Tertunda & Menunggu Pembayaran
                </h4>
                <p className="text-xs text-slate-500">
                  Prioritaskan penagihan piutang klien dan jadwal jatuh tempo pembayaran supplier
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-lg">
                Perlu Tindakan
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {invoices
                .filter((inv) => inv.status !== 'LUNAS')
                .map((inv) => {
                  const isClient = inv.type === 'CLIENT_BILL';
                  const remaining = inv.totalAmount - inv.paidAmount;

                  return (
                    <div
                      key={inv.id}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl text-white mt-0.5 ${
                            isClient ? 'bg-blue-600' : 'bg-red-600'
                          }`}
                        >
                          {isClient ? <Receipt className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900">
                              {inv.invoiceNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isClient
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-red-100 text-red-900'
                              }`}
                            >
                              {isClient ? 'Piutang Klien' : 'Hutang Supplier'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.status === 'MENUNGGU_KONFIRMASI'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {inv.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-slate-600 font-semibold mt-0.5">
                            Pihak: <span className="font-bold text-slate-900">{inv.partyName}</span> • Ref: {inv.referenceNo}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Tgl Terbit: {inv.issueDate} • Jatuh Tempo: <strong className="text-red-600">{inv.dueDate}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Sisa Tagihan Tertunda
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            {formatRupiah(remaining)}
                          </span>
                        </div>
                        <button
                          onClick={() => openInvoiceModal(inv)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
