import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  Plus,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  Calendar,
  Package,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface SupplierPortalViewProps {
  initialSubTab?: 'deliveries' | 'invoices';
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  initialSubTab = 'deliveries',
}) => {
  const {
    currentUser,
    supplierInbounds,
    invoices,
    inventory,
    createSupplierInbound,
    openInvoiceModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'deliveries' | 'invoices'>(initialSubTab);
  const [showSendModal, setShowSendModal] = useState(false);

  // Form states
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [costPrice, setCostPrice] = useState(inventory[0]?.costPrice || 250000);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Pengiriman armada tronton langsung dari sentra produksi.');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Supplier's deliveries
  const myInbounds = supplierInbounds.filter(
    (s) =>
      s.supplierId === currentUser.id ||
      s.supplierName === currentUser.companyName ||
      s.supplierName === currentUser.name
  );

  // Supplier's receivables from Cooperative
  const myInvoices = invoices.filter(
    (inv) =>
      inv.type === 'SUPPLIER_PAYABLE' &&
      (inv.partyId === currentUser.id ||
        inv.partyName === currentUser.companyName ||
        inv.partyName === currentUser.name)
  );

  const handleSendSupply = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = inventory.find((i) => i.id === selectedItemId);
    if (!itm) return;

    const total = Number(quantity) * Number(costPrice);

    createSupplierInbound({
      supplierId: currentUser.id,
      supplierName: currentUser.companyName || currentUser.name,
      supplierPhone: currentUser.phone,
      supplierEmail: currentUser.email,
      receivedDate: deliveryDate,
      items: [
        {
          itemId: itm.id,
          itemName: itm.name,
          quantity: Number(quantity),
          unit: itm.unit,
          unitCost: Number(costPrice),
          totalCost: total,
        },
      ],
      totalAmount: total,
      warehouseNotes: notes,
    });

    setShowSendModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Profile for Supplier */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg shadow-emerald-900/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100">
              PORTAL PEMASOK / SUPPLIER TETAP
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
              {currentUser.companyName || currentUser.name}
            </h1>
            <p className="text-xs text-emerald-100 mt-0.5">
              Mitra Pemasok Koperasi Garuda Merah Putih | Telp: {currentUser.phone}
            </p>
          </div>

          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Kirim Jadwal Pasokan Baru</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'deliveries'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pengiriman & Status Masuk Gudang ({myInbounds.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tagihan & Pencairan Pembayaran ({myInvoices.length})</span>
        </button>
      </div>

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          {myInbounds.map((inb) => {
            const isDone = inb.status === 'SELESAI';
            const relatedInv = invoices.find(
              (i) => i.referenceNo === inb.inboundNumber
            );

            return (
              <div
                key={inb.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl text-white ${
                        isDone ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {inb.inboundNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDone ? '✓ DITERIMA GUDANG' : 'DALAM JADWAL'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Jadwal Masuk: {inb.receivedDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Nilai Tagihan
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      {formatRupiah(inb.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5">
                  <span className="font-bold text-slate-600 text-[11px]">
                    Barang yang Dikirim:
                  </span>
                  {inb.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">{item.itemName}</span>
                      <span className="font-bold text-slate-900">
                        {item.quantity} {item.unit} @ {formatRupiah(item.unitCost)}
                      </span>
                    </div>
                  ))}
                </div>

                {relatedInv && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Faktur Pembayaran Koperasi: {relatedInv.invoiceNumber}
                    </span>
                    <button
                      onClick={() => openInvoiceModal(relatedInv)}
                      className="font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Cek Status Pembayaran ↗
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {myInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900">
                    {inv.invoiceNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      inv.status === 'LUNAS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.status === 'LUNAS' ? '✓ DANA DICAIRKAN' : 'MENUNGGU PENCAIRAN'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Referensi Pasokan: <span className="font-mono font-bold text-slate-800">{inv.referenceNo}</span> | Jatuh Tempo: {inv.dueDate}
                </p>
                <p className="text-base font-black text-slate-900 mt-1">
                  {formatRupiah(inv.totalAmount)}
                </p>
              </div>

              <button
                onClick={() => openInvoiceModal(inv)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Receipt className="w-4 h-4" />
                <span>Lihat Bukti Faktur</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Send New Supply */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Kirim Jadwal Pasokan Baru ke Gudang Koperasi
            </h3>

            <form onSubmit={handleSendSupply} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Barang Pasokan
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    const itm = inventory.find((i) => i.id === e.target.value);
                    if (itm) setCostPrice(itm.costPrice);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Kuantitas
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Satuan Modal / Beli (Rp)
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rencana Tanggal Pengiriman Tiba di Gudang
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-600">Total Nilai Tagihan:</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatRupiah(quantity * costPrice)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan Kendaraan / Surat Jalan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Kirim Jadwal Pasokan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
