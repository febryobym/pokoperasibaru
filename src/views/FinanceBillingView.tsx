import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Scale,
  BarChart3,
  Info,
} from 'lucide-react';
import { Invoice } from '../types';
import { FinancialReportsModule } from '../components/FinancialReportsModule';

export const FinanceBillingView: React.FC = () => {
  const {
    invoices,
    purchaseOrders,
    inventory,
    openInvoiceModal,
    verifyPayment,
    paySupplierInvoice,
    currentUser,
  } = useApp();

  const [activeFinanceTab, setActiveFinanceTab] = useState<'invoices-ledger' | 'reports'>('invoices-ledger');
  const [filterType, setFilterType] = useState<'ALL' | 'CLIENT' | 'SUPPLIER'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState('');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Financial calculations
  const clientBills = invoices.filter((i) => i.type === 'CLIENT_BILL');
  const supplierPayables = invoices.filter((i) => i.type === 'SUPPLIER_PAYABLE');

  // Arus kas masuk riil
  const totalCashIn = clientBills.reduce((acc, i) => acc + i.paidAmount, 0);
  // Arus kas keluar riil
  const totalCashOut = supplierPayables.reduce((acc, i) => acc + i.paidAmount, 0);
  // Net cash balance
  const netCashflow = totalCashIn - totalCashOut;

  // Piutang klien
  const totalReceivable = clientBills
    .filter((i) => i.status !== 'LUNAS')
    .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

  // Hutang supplier
  const totalPayable = supplierPayables
    .filter((i) => i.status !== 'LUNAS')
    .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

  // CRITICAL RULE:
  // "Profit Koperasi adalah profit yang didapatkan dari budget yang diajukan oleh klien dikurangi harga yang didapat dari supplier, bukan harga disepakati."
  const itemCostMap = new Map<string, number>();
  inventory.forEach((item) => {
    itemCostMap.set(item.id, item.costPrice);
  });

  let totalClientBudgetRevenue = 0;
  let totalSupplierCost = 0;

  purchaseOrders.forEach((po) => {
    totalClientBudgetRevenue += po.totalClientBudget;
    po.items.forEach((item) => {
      const cost = itemCostMap.get(item.itemId) || Math.round(item.standardPrice * 0.85);
      totalSupplierCost += cost * item.quantity;
    });
  });

  const grossProfitFromBudget = totalClientBudgetRevenue - totalSupplierCost;
  // Estimasi SHU (Sisa Hasil Usaha untuk anggota koperasi ~ 40% dari profit)
  const estimatedSHU = Math.round(Math.max(0, grossProfitFromBudget) * 0.4);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'CLIENT' && inv.type === 'CLIENT_BILL') ||
      (filterType === 'SUPPLIER' && inv.type === 'SUPPLIER_PAYABLE');

    const matchesStatus =
      filterStatus === 'SEMUA' || inv.status === filterStatus;

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Keuangan, Arus Kas & Monitoring Tagihan
          </h1>
          <p className="text-xs text-slate-500">
            Pemantauan real-time arus kas masuk (klien), kas keluar (supplier), profitabilitas koperasi, dan piutang/hutang berjalan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kas Real-Time Koperasi Aktif
          </span>
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kas Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kas Masuk (Klien)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatRupiah(totalCashIn)}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Dari {clientBills.filter((i) => i.status === 'LUNAS').length} Transaksi Lunas
            </p>
          </div>
        </div>

        {/* Kas Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kas Keluar (Supplier)
            </span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatRupiah(totalCashOut)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pembayaran pasokan barang
            </p>
          </div>
        </div>

        {/* Keuntungan Koperasi (RULE: Budget Klien - Biaya Supplier) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Profit Koperasi (Budget - HPP)
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {formatRupiah(grossProfitFromBudget)}
            </div>
            <p className="text-xs text-emerald-800 font-semibold mt-1">
              Budget Klien - Modal Beli Supplier
            </p>
          </div>
        </div>

        {/* Estimasi SHU */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estimasi Alokasi SHU
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-blue-700">
              {formatRupiah(estimatedSHU)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hak Sisa Hasil Usaha Anggota (40%)
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher: Invoices vs Full Reports */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setActiveFinanceTab('invoices-ledger')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeFinanceTab === 'invoices-ledger'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Daftar Tagihan & Faktur Pembayaran</span>
          </button>
          <button
            onClick={() => setActiveFinanceTab('reports')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeFinanceTab === 'reports'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Modul Laporan Keuangan Lengkap (P&L, Arus Kas & Margin)</span>
          </button>
        </div>
      </div>

      {activeFinanceTab === 'reports' ? (
        <FinancialReportsModule />
      ) : (
        <>
          {/* Receivables & Payables Snapshot */}
          <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Total Piutang Belum Tertagih (Klien)
            </span>
            <p className="text-xl font-black text-amber-900 mt-0.5">
              {formatRupiah(totalReceivable)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-2 py-1 rounded bg-amber-200/70 text-amber-900">
              {clientBills.filter((i) => i.status !== 'LUNAS').length} Tagihan Berjalan
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Total Hutang Pembelian Pasokan (Supplier)
            </span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {formatRupiah(totalPayable)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-800">
              {supplierPayables.filter((i) => i.status !== 'LUNAS').length} Belum Dibayar
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Monitoring Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Monitoring Tagihan & Faktur Pembayaran
            </h2>
            <p className="text-xs text-slate-500">
              Pantau status penagihan ke klien dan pencairan pembayaran ke supplier tetap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Type */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                  filterType === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('CLIENT')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                  filterType === 'CLIENT' ? 'bg-blue-600 text-white' : 'text-slate-500'
                }`}
              >
                Piutang Klien
              </button>
              <button
                onClick={() => setFilterType('SUPPLIER')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                  filterType === 'SUPPLIER' ? 'bg-red-600 text-white' : 'text-slate-500'
                }`}
              >
                Hutang Supplier
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor faktur atau nama mitra..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">No. Faktur</th>
                <th className="p-3">Tipe Transaksi</th>
                <th className="p-3">Mitra (Klien / Supplier)</th>
                <th className="p-3">Jatuh Tempo</th>
                <th className="p-3">Jumlah Tagihan</th>
                <th className="p-3">Status Bayar</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const isClient = inv.type === 'CLIENT_BILL';
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Ref: {inv.referenceNo}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isClient
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isClient ? 'TAGIHAN KLIEN' : 'HUTANG SUPPLIER'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {inv.partyName}
                      <span className="block text-[10px] text-slate-400">
                        {inv.partyPhone}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {inv.dueDate}
                    </td>
                    <td className="p-3 font-black text-slate-900">
                      {formatRupiah(inv.totalAmount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'LUNAS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'MENUNGGU_KONFIRMASI'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openInvoiceModal(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Faktur</span>
                        </button>

                        {/* Quick validation if Admin */}
                        {currentUser.role === 'admin' &&
                          isClient &&
                          inv.status === 'MENUNGGU_KONFIRMASI' && (
                            <button
                              onClick={() => verifyPayment(inv.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer"
                              title="Verifikasi Mutasi Masuk Lunas"
                            >
                              Verif Lunas
                            </button>
                          )}

                        {currentUser.role === 'admin' &&
                          !isClient &&
                          inv.status === 'BELUM_BAYAR' && (
                            <button
                              onClick={() => paySupplierInvoice(inv.id, 'Transfer Bank')}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer"
                              title="Cairkan Pembayaran Pasokan"
                            >
                              Bayar Supplier
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}
</div>
  );
};
