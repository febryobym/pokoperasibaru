import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  Plus,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';
import { SupplierInbound } from '../types';

export const SupplierInboundView: React.FC = () => {
  const {
    supplierInbounds,
    receiveSupplierInbound,
    createSupplierInbound,
    updateSupplierInbound,
    deleteSupplierInbound,
    inventory,
    openInvoiceModal,
    invoices,
    currentUser,
    users,
  } = useApp();

  const supplierUsers = users.filter((u) => u.role === 'supplier');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(
    supplierUsers[0]?.companyName || supplierUsers[0]?.name || ''
  );
  const [supplierPhone, setSupplierPhone] = useState(supplierUsers[0]?.phone || '');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Penerimaan pasokan berkala kemitraan');

  // Items to receive
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [customCost, setCustomCost] = useState(inventory[0]?.costPrice || 100000);

  // Edit Inbound State for Admin
  const [editingInbound, setEditingInbound] = useState<SupplierInbound | null>(null);
  const [editSupplier, setEditSupplier] = useState('');
  const [editSupplierPhone, setEditSupplierPhone] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editItemId, setEditItemId] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnitCost, setEditUnitCost] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<SupplierInbound['status']>('DIJADWALKAN');
  const [editPaymentStatus, setEditPaymentStatus] = useState<SupplierInbound['paymentStatus']>('BELUM_DIBAYAR');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const handleCreateInbound = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = inventory.find((i) => i.id === selectedItemId);
    if (!targetItem) return;

    const matchedSupplier = supplierUsers.find(
      (u) => (u.companyName || u.name) === selectedSupplier
    );
    const totalCost = Number(quantity) * Number(customCost);

    createSupplierInbound({
      supplierId: matchedSupplier?.id || 'supplier-id',
      supplierName: selectedSupplier,
      supplierPhone,
      supplierEmail,
      receivedDate: deliveryDate,
      items: [
        {
          itemId: targetItem.id,
          itemName: targetItem.name,
          quantity: Number(quantity),
          unit: targetItem.unit,
          unitCost: Number(customCost),
          totalCost: totalCost,
        },
      ],
      totalAmount: totalCost,
      warehouseNotes: notes,
    });

    setShowScheduleModal(false);
  };

  const handleStartEdit = (inbound: SupplierInbound) => {
    setEditingInbound(inbound);
    setEditSupplier(inbound.supplierName);
    setEditSupplierPhone(inbound.supplierPhone);
    setEditDeliveryDate(inbound.receivedDate);
    const firstItem = inbound.items[0];
    if (firstItem) {
      setEditItemId(firstItem.itemId);
      setEditQuantity(firstItem.quantity);
      setEditUnitCost(firstItem.unitCost);
    } else {
      setEditItemId(inventory[0]?.id || '');
      setEditQuantity(1);
      setEditUnitCost(inventory[0]?.costPrice || 0);
    }
    setEditNotes(inbound.warehouseNotes || '');
    setEditStatus(inbound.status);
    setEditPaymentStatus(inbound.paymentStatus);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInbound) return;

    const targetItem = inventory.find((i) => i.id === editItemId) || {
      id: editItemId,
      name: editingInbound.items[0]?.itemName || 'Barang Pasokan',
      unit: editingInbound.items[0]?.unit || 'Unit',
    };

    const totalCost = Number(editQuantity) * Number(editUnitCost);
    const matchedSupplier = supplierUsers.find(
      (u) => (u.companyName || u.name) === editSupplier
    );

    updateSupplierInbound(editingInbound.id, {
      supplierId: matchedSupplier?.id || editingInbound.supplierId,
      supplierName: editSupplier.trim(),
      supplierPhone: editSupplierPhone.trim(),
      receivedDate: editDeliveryDate,
      status: editStatus,
      paymentStatus: editPaymentStatus,
      items: [
        {
          itemId: targetItem.id,
          itemName: targetItem.name,
          quantity: Number(editQuantity),
          unit: targetItem.unit,
          unitCost: Number(editUnitCost),
          totalCost: totalCost,
        },
      ],
      totalAmount: totalCost,
      warehouseNotes: editNotes,
    });

    setEditingInbound(null);
  };

  const handleDelete = (inbound: SupplierInbound) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus catatan penerimaan supplier "${inbound.inboundNumber}" dari "${inbound.supplierName}"? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      deleteSupplierInbound(inbound.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Penerimaan Barang & Pasokan Supplier
          </h1>
          <p className="text-xs text-slate-500">
            Jadwal pengiriman dari supplier tetap, verifikasi fisik barang masuk ke gudang, dan otomatisasi penambahan stok inventaris.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Jadwalkan Pasokan Masuk</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Pengiriman Masuk</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {supplierInbounds.length} Penerimaan
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dari seluruh jaringan supplier tetap
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Menunggu Tiba di Gudang</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {supplierInbounds.filter((s) => s.status !== 'SELESAI').length} Jadwal
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Perlu diverifikasi oleh tim gudang
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Nilai Pembelian</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(
              supplierInbounds.reduce((acc, s) => acc + s.totalAmount, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kewajiban hutang dagang koperasi
          </p>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {supplierInbounds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Data Penerimaan Supplier</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Klik tombol &quot;Jadwalkan Pasokan Masuk&quot; untuk mencatat jadwal pengiriman barang baru dari supplier.
            </p>
          </div>
        ) : (
          supplierInbounds.map((inbound) => {
            const isDone = inbound.status === 'SELESAI';
            const relatedInv = invoices.find(
              (inv) => inv.referenceNo === inbound.inboundNumber
            );

            return (
              <div
                key={inbound.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl text-white ${
                        isDone ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm font-mono text-slate-900">
                          {inbound.inboundNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDone ? '✓ DITERIMA & STOK MASUK' : 'DIJADWALKAN'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supplier:{' '}
                        <span className="font-bold text-slate-800">
                          {inbound.supplierName}
                        </span>{' '}
                        ({inbound.supplierPhone})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap">
                    <span className="text-slate-500 flex items-center gap-1 mr-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Tgl: <span className="font-semibold text-slate-800">{inbound.receivedDate}</span>
                    </span>

                    {!isDone && (
                      <button
                        onClick={() => receiveSupplierInbound(inbound.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verifikasi & Masuk Stok</span>
                      </button>
                    )}

                    {/* Tombol Edit dan Hapus untuk Role Admin */}
                    {currentUser.role === 'admin' && (
                      <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-2">
                        <button
                          onClick={() => handleStartEdit(inbound)}
                          className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Edit Penerimaan Supplier"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(inbound)}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 font-semibold rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Hapus Penerimaan Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in delivery */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Rincian Barang yang Dikirim
                    </span>
                    <div className="space-y-1.5">
                      {inbound.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{item.itemName}</p>
                            <p className="text-[10px] text-slate-500">
                              Harga Satuan Modal: {formatRupiah(item.unitCost)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 block">
                              +{item.quantity} {item.unit}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Subtotal: {formatRupiah(item.totalCost)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {inbound.warehouseNotes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Catatan Gudang: {inbound.warehouseNotes}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Total Nilai Tagihan Supplier
                      </span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {formatRupiah(inbound.totalAmount)}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Status Pembayaran:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            inbound.paymentStatus === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inbound.paymentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {relatedInv && (
                      <button
                        onClick={() => openInvoiceModal(relatedInv)}
                        className="mt-3 w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 transition text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Faktur Pembayaran ({relatedInv.invoiceNumber})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Inbound Modal (Role Admin) */}
      {editingInbound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Data Penerimaan Supplier
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                {editingInbound.inboundNumber}
              </span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Supplier Pemasok
                </label>
                <div className="space-y-1.5">
                  <select
                    value={editSupplier}
                    onChange={(e) => {
                      const supName = e.target.value;
                      setEditSupplier(supName);
                      const matched = supplierUsers.find(
                        (u) => (u.companyName || u.name) === supName
                      );
                      if (matched) {
                        setEditSupplierPhone(matched.phone);
                      }
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- Pilih dari Daftar Supplier --</option>
                    {supplierUsers.map((u) => (
                      <option key={u.id} value={u.companyName || u.name}>
                        {u.name} {u.companyName ? `(${u.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    placeholder="Atau ketik nama supplier..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon Supplier
                  </label>
                  <input
                    type="tel"
                    value={editSupplierPhone}
                    onChange={(e) => setEditSupplierPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Rencana Masuk
                  </label>
                  <input
                    type="date"
                    value={editDeliveryDate}
                    onChange={(e) => setEditDeliveryDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Pengiriman
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SupplierInbound['status'])}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="DIJADWALKAN">DIJADWALKAN</option>
                    <option value="DITERIMA_GUDANG">DITERIMA GUDANG</option>
                    <option value="SELESAI">SELESAI (Masuk Stok)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as SupplierInbound['paymentStatus'])}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="BELUM_DIBAYAR">BELUM DIBAYAR</option>
                    <option value="PROSES_PENCAIRAN">PROSES PENCAIRAN</option>
                    <option value="LUNAS">LUNAS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Barang yang Dipasok
                </label>
                <select
                  value={editItemId}
                  onChange={(e) => {
                    setEditItemId(e.target.value);
                    const it = inventory.find((i) => i.id === e.target.value);
                    if (it && it.costPrice > 0) setEditUnitCost(it.costPrice);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category}) - Stok: {item.currentStock} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Kuantitas Pasokan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Modal / Beli per Unit (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editUnitCost}
                    onChange={(e) => setEditUnitCost(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-600">Total Nilai Tagihan:</span>
                <span className="font-black text-blue-700 text-sm">
                  {formatRupiah(editQuantity * editUnitCost)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Gudang / Kendaraan
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan pengiriman, no polisi armada, dll..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInbound(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Inbound Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Jadwalkan Penerimaan Pasokan dari Supplier
            </h3>

            <form onSubmit={handleCreateInbound} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Supplier Pemasok
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => {
                    const supName = e.target.value;
                    setSelectedSupplier(supName);
                    const matched = supplierUsers.find(
                      (u) => (u.companyName || u.name) === supName
                    );
                    if (matched) {
                      setSupplierPhone(matched.phone);
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {supplierUsers.length > 0 ? (
                    supplierUsers.map((u) => (
                      <option key={u.id} value={u.companyName || u.name}>
                        {u.companyName || u.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Belum ada supplier terdaftar (Tambahkan di Pengguna)</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon Supplier
                  </label>
                  <input
                    type="tel"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Rencana Masuk
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Barang yang Dipasok
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    const it = inventory.find((i) => i.id === e.target.value);
                    if (it) setCustomCost(it.costPrice);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stok Saat Ini: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Kuantitas Pasokan
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
                    Harga Modal / Beli per Unit (Rp)
                  </label>
                  <input
                    type="number"
                    value={customCost}
                    onChange={(e) => setCustomCost(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-600">Total Nilai Pembelian:</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatRupiah(quantity * customCost)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Gudang / Truk
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
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Simpan Jadwal Pasokan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
