import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  DollarSign,
  Calendar,
  MapPin,
  Package,
  Send,
  Upload,
  XCircle,
  Award,
  Printer,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { POItem, POStatus, PurchaseOrder } from '../types';

interface ClientPortalViewProps {
  initialSubTab?: 'create-po' | 'track' | 'invoices';
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  initialSubTab = 'create-po',
}) => {
  const {
    currentUser,
    inventory,
    purchaseOrders,
    invoices,
    createPurchaseOrder,
    openPOModal,
    openInvoiceModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'create-po' | 'track' | 'invoices'>(initialSubTab);
  const [trackFilter, setTrackFilter] = useState<string>('SEMUA');

  // New PO form state
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      itemId: string;
      quantity: number;
      targetPrice: number;
      notes?: string;
    }>
  >([
    {
      itemId: inventory[0]?.id || '',
      quantity: 20,
      targetPrice: inventory[0] ? Math.round(inventory[0].standardPrice * 0.95) : 340000,
      notes: '',
    },
  ]);

  const [neededDate, setNeededDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    currentUser.address || 'Gudang Logistik Perusahaan, Kawasan Industri Pulogadung, Jakarta'
  );
  const [clientNotes, setClientNotes] = useState(
    'Pengiriman jam kerja. Mohon konfirmasi kesesuaian penawaran budget yang kami ajukan.'
  );
  const [submittedPO, setSubmittedPO] = useState<PurchaseOrder | null>(null);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Filter client's own data
  const myPOs = purchaseOrders.filter(
    (po) =>
      po.clientId === currentUser.id ||
      po.clientName === currentUser.companyName ||
      po.clientName === currentUser.name
  );

  const myInvoices = invoices.filter(
    (inv) =>
      inv.type === 'CLIENT_BILL' &&
      (inv.partyId === currentUser.id ||
        inv.partyName === currentUser.companyName ||
        inv.partyName === currentUser.name)
  );

  // Status counts for client
  const clientPendingCount = myPOs.filter(
    (po) => po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW'
  ).length;
  const clientApprovedCount = myPOs.filter((po) => po.status === 'DISETUJUI').length;
  const clientOfficialCount = myPOs.filter(
    (po) => po.status === 'PESANAN_RESMI' || po.isOfficialOrder
  ).length;
  const clientRejectedCount = myPOs.filter((po) => po.status === 'DITOLAK').length;

  const handleAddItemRow = () => {
    const firstUnselected = inventory.find(
      (item) => !selectedItems.some((sel) => sel.itemId === item.id)
    );
    const itemToAdd = firstUnselected || inventory[0];
    if (itemToAdd) {
      setSelectedItems([
        ...selectedItems,
        {
          itemId: itemToAdd.id,
          quantity: 10,
          targetPrice: Math.round(itemToAdd.standardPrice * 0.95),
          notes: '',
        },
      ]);
    }
  };

  const handleRemoveItemRow = (idx: number) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  // Total budget calculation
  const calculatedTotalBudget = selectedItems.reduce((acc, row) => {
    return acc + Number(row.quantity || 0) * Number(row.targetPrice || 0);
  }, 0);

  // Standard total for comparison
  const calculatedStandardTotal = selectedItems.reduce((acc, row) => {
    const inv = inventory.find((i) => i.id === row.itemId);
    return acc + Number(row.quantity || 0) * Number(inv?.standardPrice || 0);
  }, 0);

  const budgetDifference = calculatedStandardTotal - calculatedTotalBudget;

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;

    const poItems: POItem[] = selectedItems.map((row) => {
      const invItem = inventory.find((i) => i.id === row.itemId)!;
      return {
        itemId: invItem.id,
        itemName: invItem.name,
        sku: invItem.sku,
        quantity: Number(row.quantity),
        unit: invItem.unit,
        standardPrice: invItem.standardPrice,
        targetPrice: Number(row.targetPrice),
        approvedPrice: Number(row.targetPrice), // pending cooperative review
        notes: row.notes || undefined,
      };
    });

    const newPO = createPurchaseOrder({
      clientId: currentUser.id,
      clientName: currentUser.companyName || currentUser.name,
      clientEmail: currentUser.email,
      clientPhone: currentUser.phone,
      requiredDate: neededDate,
      deliveryAddress,
      clientNotes,
      items: poItems,
      totalClientBudget: calculatedTotalBudget,
      totalApprovedAmount: calculatedTotalBudget,
    });

    setSubmittedPO(newPO);
    setActiveTab('track');
  };

  // Re-order or adjust budget from a rejected PO
  const handleReorderOrAdjustBudget = (po: PurchaseOrder) => {
    setSelectedItems(
      po.items.map((it) => ({
        itemId: it.itemId,
        quantity: it.quantity,
        targetPrice: it.standardPrice, // reset to standard or let client tweak
        notes: `Penyesuaian penawaran ulang untuk ref: ${po.poNumber}`,
      }))
    );
    setDeliveryAddress(po.deliveryAddress);
    setClientNotes(`Pengajuan penawaran ulang yang disesuaikan setelah evaluasi PO ${po.poNumber}.`);
    setActiveTab('create-po');
  };

  // Filtered tracking POs
  const filteredMyPOs = myPOs.filter((po) => {
    if (trackFilter === 'SEMUA') return true;
    if (trackFilter === 'DIAJUKAN') return po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW';
    if (trackFilter === 'PESANAN_RESMI') return po.status === 'PESANAN_RESMI' || po.isOfficialOrder;
    return po.status === trackFilter;
  });

  const getStatusBadgeInfo = (status: POStatus, isOfficial?: boolean) => {
    if (isOfficial || status === 'PESANAN_RESMI') {
      return {
        label: 'Pesanan Resmi (SPK Terbit)',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        desc: 'Pesanan telah disahkan dan SPK resmi telah diterbitkan oleh koperasi.',
      };
    }
    switch (status) {
      case 'DIAJUKAN':
      case 'MENUNGGU_REVIEW':
        return {
          label: 'Diajukan (Menunggu Review Koperasi)',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          desc: 'Pengurus koperasi sedang meninjau rincian barang dan budget yang Anda ajukan.',
        };
      case 'DISETUJUI':
        return {
          label: 'Penawaran Disetujui',
          badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
          desc: 'Penawaran budget Anda telah disetujui penuh! Menunggu penerbitan Surat Perintah Kerja (SPK).',
        };
      case 'DITOLAK':
        return {
          label: 'Penawaran Ditolak',
          badgeClass: 'bg-red-100 text-red-900 border-red-300',
          desc: 'Penawaran budget belum dapat dipenuhi oleh koperasi. Anda dapat menyesuaikan budget dan mengajukan ulang.',
        };
      case 'NEGOSIASI_HARGA':
        return {
          label: 'Negosiasi Penawaran Harga',
          badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
          desc: 'Koperasi mengajukan tawaran penyesuaian harga khusus untuk kesepakatan terbaik.',
        };
      case 'DIPROSES':
        return {
          label: 'Sedang Disiapkan Gudang',
          badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          desc: 'Barang pesanan sedang dipacking dan disiapkan oleh tim gudang koperasi.',
        };
      case 'DIKIRIM':
        return {
          label: 'Dalam Pengiriman Armada',
          badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
          desc: 'Armada logistik koperasi sedang dalam perjalanan ke alamat tujuan Anda.',
        };
      case 'SELESAI':
        return {
          label: 'Selesai & Diterima',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          desc: 'Pesanan telah diterima dan serah terima (BAST) telah selesai.',
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
          desc: '',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Submission Feedback */}
      {submittedPO && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-sm">
                Purchase Order {submittedPO.poNumber} Berhasil Diajukan!
              </p>
              <p className="text-xs text-emerald-100">
                Status saat ini: <strong className="text-white">DIAJUKAN (Menunggu Review Koperasi)</strong>. Notifikasi otomatis via WhatsApp dan Email telah terkirim.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubmittedPO(null)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition cursor-pointer self-end sm:self-auto"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 block">
            Portal Klien Tetap
          </span>
          <h1 className="text-2xl font-black mt-0.5 tracking-tight">
            {currentUser.companyName || currentUser.name}
          </h1>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            Sistem pengajuan Purchase Order (PO) fleksibel dengan penetapan budget sesuai anggaran Anda, pelacakan status penawaran real-time, serta monitoring tagihan resmi koperasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs text-center min-w-[90px]">
            <span className="text-[10px] text-blue-200 block font-semibold">Total PO</span>
            <span className="text-xl font-black">{myPOs.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-center min-w-[90px]">
            <span className="text-[10px] text-amber-200 block font-semibold">In Review</span>
            <span className="text-xl font-black text-amber-300">{clientPendingCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-400/40 text-center min-w-[90px]">
            <span className="text-[10px] text-teal-200 block font-semibold">Disetujui</span>
            <span className="text-xl font-black text-teal-300">{clientApprovedCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400/40 text-center min-w-[90px]">
            <span className="text-[10px] text-blue-200 block font-semibold">SPK Resmi</span>
            <span className="text-xl font-black text-blue-200">{clientOfficialCount}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('create-po')}
          className={`pb-3 px-4 font-bold text-sm transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'create-po'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Ajukan Purchase Order (PO) & Tetapkan Budget</span>
        </button>

        <button
          onClick={() => setActiveTab('track')}
          className={`pb-3 px-4 font-bold text-sm transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'track'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Lacak Status Penawaran & Pesanan</span>
          {clientPendingCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {clientPendingCount} review
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 font-bold text-sm transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Faktur & Pembayaran Tagihan</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {myInvoices.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Create PO Form */}
      {activeTab === 'create-po' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Formulir Pengajuan Purchase Order Fleksibel
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih barang komoditas koperasi, tentukan jumlah kuantitas, dan ajukan harga penawaran sesuai alokasi anggaran Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto border border-blue-200 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Baris Barang</span>
            </button>
          </div>

          <form onSubmit={handleSubmitPO} className="space-y-6 text-xs">
            {/* Dynamic Items Rows */}
            <div className="space-y-3">
              {selectedItems.map((row, idx) => {
                const itemData = inventory.find((i) => i.id === row.itemId);
                const subtotal = Number(row.quantity || 0) * Number(row.targetPrice || 0);
                const standardSubtotal = Number(row.quantity || 0) * Number(itemData?.standardPrice || 0);
                const diff = standardSubtotal - subtotal;

                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Item Select */}
                      <div className="md:col-span-5">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Barang Koperasi *
                        </label>
                        <select
                          value={row.itemId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            const targetItm = inventory.find((i) => i.id === newId);
                            const updated = [...selectedItems];
                            updated[idx] = {
                              ...updated[idx],
                              itemId: newId,
                              targetPrice: targetItm
                                ? Math.round(targetItm.standardPrice * 0.95)
                                : updated[idx].targetPrice,
                            };
                            setSelectedItems(updated);
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                          required
                        >
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} (Tersedia: {inv.currentStock} {inv.unit})
                            </option>
                          ))}
                        </select>
                        {itemData && (
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                            <span>Katalog Standar: <strong>{formatRupiah(itemData.standardPrice)}</strong> / {itemData.unit}</span>
                            <span>•</span>
                            <span>Stok Fisik: <strong>{itemData.currentStock} {itemData.unit}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Kuantitas *
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const updated = [...selectedItems];
                              updated[idx].quantity = Number(e.target.value);
                              setSelectedItems(updated);
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                            required
                          />
                          <span className="text-[11px] text-slate-500 font-semibold shrink-0">
                            {itemData?.unit}
                          </span>
                        </div>
                      </div>

                      {/* Target Price (Client Budget per unit) */}
                      <div className="md:col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-blue-900">
                            Budget Ditawar / Unit (Rp) *
                          </label>
                          {diff > 0 && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                              Hemat Rp {diff.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          value={row.targetPrice}
                          onChange={(e) => {
                            const updated = [...selectedItems];
                            updated[idx].targetPrice = Number(e.target.value);
                            setSelectedItems(updated);
                          }}
                          className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50/60 font-black text-blue-900"
                          required
                        />
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="md:col-span-2 text-right flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-0.5 text-[10px] uppercase">
                            Subtotal Budget
                          </label>
                          <p className="text-sm font-black text-slate-900">
                            {formatRupiah(subtotal)}
                          </p>
                        </div>
                        {selectedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition ml-2 cursor-pointer"
                            title="Hapus baris"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Row item specific note */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Catatan Barang:</span>
                      <input
                        type="text"
                        placeholder="Opsional: spesifikasi kemasan, merk, atau batch..."
                        value={row.notes || ''}
                        onChange={(e) => {
                          const updated = [...selectedItems];
                          updated[idx].notes = e.target.value;
                          setSelectedItems(updated);
                        }}
                        className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-[11px]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Budget Summary Card */}
            <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                  Total Anggaran Pengajuan Budget Klien
                </span>
                <p className="text-2xl font-black text-blue-900 mt-0.5">
                  {formatRupiah(calculatedTotalBudget)}
                </p>
                {budgetDifference !== 0 && (
                  <p className="text-[11px] text-blue-700 mt-1">
                    Nilai Katalog Standar: {formatRupiah(calculatedStandardTotal)}{' '}
                    {budgetDifference > 0 ? (
                      <span className="font-bold text-emerald-700">
                        (Hemat Rp {budgetDifference.toLocaleString('id-ID')} / {Math.round((budgetDifference / calculatedStandardTotal) * 100)}%)
                      </span>
                    ) : (
                      <span className="text-slate-600">(Lebih tinggi Rp {Math.abs(budgetDifference).toLocaleString('id-ID')})</span>
                    )}
                  </p>
                )}
              </div>

              <div className="text-right text-xs text-blue-800 bg-white/70 p-3 rounded-xl border border-blue-200/60">
                <p className="font-bold">{selectedItems.length} Macam Barang Diajukan</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Status otomatis: <strong className="text-amber-700 font-bold">DIAJUKAN</strong> (Menunggu Review Koperasi)
                </p>
              </div>
            </div>

            {/* Delivery address & metadata */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Tanggal Pengiriman Diperlukan *
                </label>
                <input
                  type="date"
                  value={neededDate}
                  onChange={(e) => setNeededDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Pengiriman / Gudang Penerima *
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">
                Catatan Khusus Klien / Alasan Pengajuan Budget
              </label>
              <textarea
                rows={2}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Contoh: Kami memesan dalam jumlah rutin bulanan, mohon persetujuan harga khusus kemitraan..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pengajuan Purchase Order (PO) ke Koperasi Garuda Merah Putih</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Track Orders Real-time */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          {/* Tracking Sub-filters */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 mr-2">Filter Penawaran:</span>
            {[
              { id: 'SEMUA', label: 'Semua Status' },
              { id: 'DIAJUKAN', label: 'Diajukan (Review)' },
              { id: 'DISETUJUI', label: 'Disetujui' },
              { id: 'PESANAN_RESMI', label: 'Pesanan Resmi (SPK)' },
              { id: 'DITOLAK', label: 'Ditolak' },
              { id: 'DIKIRIM', label: 'Sedang Dikirim' },
              { id: 'SELESAI', label: 'Selesai' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setTrackFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  trackFilter === pill.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {filteredMyPOs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">Tidak ada Purchase Order pada filter ini</p>
              <p className="text-xs mt-1">Coba pilih filter lain atau buat pengajuan PO baru.</p>
              <button
                onClick={() => setActiveTab('create-po')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Buat PO Baru
              </button>
            </div>
          ) : (
            filteredMyPOs.map((po) => {
              const badgeInfo = getStatusBadgeInfo(po.status, po.isOfficialOrder);
              const isOfferPending = po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW';
              const isOfferApproved = po.status === 'DISETUJUI';
              const isOfferRejected = po.status === 'DITOLAK';
              const isOfficial = po.status === 'PESANAN_RESMI' || po.isOfficialOrder;

              return (
                <div
                  key={po.id}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition ${
                    isOfferPending
                      ? 'border-amber-300 ring-1 ring-amber-100'
                      : isOfferApproved
                      ? 'border-teal-300 ring-1 ring-teal-100'
                      : isOfficial
                      ? 'border-blue-300'
                      : isOfferRejected
                      ? 'border-red-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 text-white rounded-xl shadow-xs ${
                          isOfficial
                            ? 'bg-blue-600'
                            : isOfferApproved
                            ? 'bg-teal-600'
                            : isOfferRejected
                            ? 'bg-red-600'
                            : isOfferPending
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {isOfficial ? (
                          <Award className="w-5 h-5 text-amber-200" />
                        ) : (
                          <Truck className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {po.poNumber}
                          </span>

                          {po.officialOrderNumber && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-700 text-white font-mono flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-300" />
                              {po.officialOrderNumber}
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${badgeInfo.badgeClass}`}
                          >
                            {badgeInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tgl PO: <span className="font-semibold text-slate-700">{po.orderDate}</span> • Jadwal Diperlukan:{' '}
                          <span className="font-semibold text-red-600">{po.requiredDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPOModal(po)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lacak Timeline Lengkap</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Banner Message */}
                  {isOfferPending && (
                    <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Status Penawaran: Diajukan.</strong> Pengurus Koperasi sedang meninjau rincian barang dan budget yang diajukan.
                        </span>
                      </div>
                    </div>
                  )}

                  {isOfferApproved && (
                    <div className="px-5 py-2.5 bg-teal-50 border-b border-teal-200 text-teal-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>
                          <strong>Penawaran Anda Disetujui Penuh!</strong> Pengurus Koperasi akan segera mengonversi PO ini menjadi Surat Perintah Kerja (SPK) Pesanan Resmi.
                        </span>
                      </div>
                    </div>
                  )}

                  {isOfferRejected && (
                    <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Penawaran Ditolak:</strong> {po.rejectionReason || 'Alokasi budget belum dapat disetujui.'}
                          <p className="text-slate-600 text-[11px] mt-0.5">
                            Anda dapat mengajukan ulang dengan penyesuaian harga atau kuantitas.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReorderOrAdjustBudget(po)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ajukan Ulang / Sesuaikan Budget</span>
                      </button>
                    </div>
                  )}

                  {isOfficial && (
                    <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          <strong>Pesanan Resmi Aktif (No. {po.officialOrderNumber}):</strong> Barang sedang disiapkan untuk pengiriman armada koperasi.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Body with progress bar and items */}
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Visual 5-step progress pill */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {po.timeline.map((step, idx) => (
                        <div
                          key={step.id}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            step.status === 'completed'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : step.status === 'current'
                              ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold ring-2 ring-blue-200'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <span className="text-[10px] block font-bold">Langkah {idx + 1}</span>
                          <span className="text-xs block truncate mt-0.5 font-semibold">
                            {step.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quick item summary & Total */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-slate-100">
                      <div className="text-slate-600">
                        <span>Rincian Barang: </span>
                        <span className="font-semibold text-slate-800">
                          {po.items.map((i) => `${i.itemName} (${i.quantity} ${i.unit} @ ${formatRupiah(i.targetPrice)})`).join(', ')}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-slate-500 text-[11px]">Total Anggaran Budget PO: </span>
                        <span className="font-black text-slate-900 text-sm ml-1">
                          {formatRupiah(po.totalApprovedAmount || po.totalClientBudget)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Client Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {myInvoices.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">Belum ada tagihan aktif</p>
              <p className="text-xs mt-1">Faktur akan diterbitkan otomatis saat penawaran PO Anda disetujui.</p>
            </div>
          ) : (
            myInvoices.map((inv) => (
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        inv.status === 'LUNAS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'MENUNGGU_KONFIRMASI'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Referensi PO: <span className="font-mono font-bold text-slate-800">{inv.referenceNo}</span> • Jatuh Tempo: {inv.dueDate}
                  </p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {formatRupiah(inv.totalAmount)}
                  </p>
                  {inv.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">{inv.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openInvoiceModal(inv)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Lihat & Bayar Tagihan</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
