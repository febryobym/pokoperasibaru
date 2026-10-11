import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  MessageSquare,
  Mail,
  ChevronRight,
  ShieldCheck,
  Send,
  MapPin,
  Calendar,
  Package,
  XCircle,
  Award,
  Printer,
  Sparkles,
} from 'lucide-react';
import { POStatus } from '../types';

export const POTrackerModal: React.FC = () => {
  const {
    activePOModal,
    closePOModal,
    currentUser,
    updatePOStatus,
    updatePOPriceAgreement,
    approvePOOffer,
    rejectPOOffer,
    convertToOfficialOrder,
    openInvoiceModal,
    invoices,
    triggerNotification,
  } = useApp();

  const [negotiateMode, setNegotiateMode] = useState(false);
  const [counterPrices, setCounterPrices] = useState<{ [itemId: string]: number }>({});
  const [negoNote, setNegoNote] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Approval, rejection, and conversion modal dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvalNoteInput, setApprovalNoteInput] = useState('Penawaran budget telah ditinjau dan disetujui penuh sesuai spesifikasi.');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('Alokasi budget yang diajukan berada di bawah Harga Pokok Pembelian (HPP) pasokan supplier.');
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [officialNoteInput, setOfficialNoteInput] = useState('Dikonversi resmi menjadi Surat Perintah Kerja (SPK) untuk pengadaan dan pengiriman langsung.');

  if (!activePOModal.isOpen || !activePOModal.data) return null;

  const po = activePOModal.data;
  const isAdmin = currentUser.role === 'admin';
  const isClient = currentUser.role === 'client';

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const relatedInvoice = invoices.find((inv) => inv.referenceNo === po.poNumber);

  const handleApplyNegotiation = (e: React.FormEvent) => {
    e.preventDefault();
    updatePOPriceAgreement(po.id, counterPrices, negoNote || 'Penawaran harga terbaik dari koperasi.');
    setNegotiateMode(false);
  };

  const handleStatusChange = (newStatus: POStatus) => {
    updatePOStatus(po.id, newStatus, statusNote || undefined);
    setStatusNote('');
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    approvePOOffer(po.id, approvalNoteInput);
    setShowApproveDialog(false);
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReasonInput.trim()) return;
    rejectPOOffer(po.id, rejectionReasonInput.trim());
    setShowRejectDialog(false);
  };

  const handleConfirmConversion = (e: React.FormEvent) => {
    e.preventDefault();
    convertToOfficialOrder(po.id, officialNoteInput);
    setShowConvertDialog(false);
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'DIAJUKAN':
      case 'MENUNGGU_REVIEW':
        return { label: 'Penawaran Diajukan (Menunggu Review)', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'NEGOSIASI_HARGA':
        return { label: 'Negosiasi Penawaran Harga', bg: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'DISETUJUI':
        return { label: 'Penawaran Disetujui', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'DITOLAK':
        return { label: 'Penawaran Ditolak', bg: 'bg-red-100 text-red-800 border-red-300' };
      case 'PESANAN_RESMI':
        return { label: 'Pesanan Resmi (SPK Terbit)', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'DIPROSES':
        return { label: 'Sedang Disiapkan Gudang', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'DIKIRIM':
        return { label: 'Dalam Pengiriman Armada', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'SELESAI':
        return { label: 'Pesanan Selesai & Diterima', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const badge = getStatusBadge(po.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">{po.poNumber}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    po.status === 'SELESAI'
                      ? 'bg-emerald-500 text-white'
                      : po.status === 'DIKIRIM'
                      ? 'bg-purple-500 text-white'
                      : po.status === 'PESANAN_RESMI' || po.isOfficialOrder
                      ? 'bg-blue-500 text-white'
                      : po.status === 'DISETUJUI'
                      ? 'bg-teal-500 text-white'
                      : po.status === 'DITOLAK'
                      ? 'bg-red-500 text-white'
                      : po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW'
                      ? 'bg-amber-500 text-white'
                      : po.status === 'NEGOSIASI_HARGA'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {po.isOfficialOrder ? 'PESANAN RESMI (SPK)' : po.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pemesan: <span className="text-white font-semibold">{po.clientName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={closePOModal}
              className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Official Order Banner (SPK) */}
          {po.isOfficialOrder && (
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                  <Award className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                      Dokumen Resmi Sah
                    </span>
                    <span className="text-xs text-blue-200">Koperasi Garuda Merah Putih</span>
                  </div>
                  <h4 className="font-black text-base mt-0.5 font-mono">
                    {po.officialOrderNumber}
                  </h4>
                  <p className="text-[11px] text-blue-100">
                    Dikonversi resmi pada {po.convertedAt} WIB • Ref PO: {po.poNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-900 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 text-blue-700" />
                <span>Cetak SPK Resmi</span>
              </button>
            </div>
          )}

          {/* Rejection Notification if rejected */}
          {po.status === 'DITOLAK' && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300 flex items-start gap-3 text-xs">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 text-sm">Penawaran PO Ini Ditolak oleh Koperasi</p>
                <p className="text-red-700 mt-1 leading-relaxed">
                  <span className="font-semibold">Alasan Penolakan:</span> {po.rejectionReason || 'Alokasi budget yang diajukan belum dapat dipenuhi oleh koperasi.'}
                </p>
                <p className="text-slate-500 text-[11px] mt-1.5">
                  Klien dapat mengajukan penawaran Purchase Order baru dengan target budget yang disesuaikan.
                </p>
              </div>
            </div>
          )}

          {/* Approval Notes if present */}
          {po.status === 'DISETUJUI' && po.approvalNotes && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-300 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-teal-900 text-sm">Penawaran Budget Disetujui Penuh</p>
                <p className="text-teal-700 mt-0.5 leading-relaxed">
                  {po.approvalNotes}
                </p>
                {isAdmin && (
                  <p className="text-teal-800 font-bold text-[11px] mt-2">
                    Langkah Berikutnya: Klik tombol "Konversi Menjadi Pesanan Resmi" di bawah untuk menerbitkan Surat Pesanan Kerja (SPK).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tracking Timeline Progress */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-600" />
              Lini Masa Pelacakan Status Real-Time
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {po.timeline.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';

                return (
                  <div key={step.id} className="relative group">
                    {/* Step Icon */}
                    <div
                      className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p
                        className={`text-xs font-bold ${
                          isCompleted
                            ? 'text-slate-800'
                            : isCurrent
                            ? 'text-blue-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                      {step.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {step.timestamp} WIB
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items & Budget Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-600" />
                <h4 className="font-bold text-xs text-slate-800">
                  Rincian Barang & Kustomisasi Budget
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                {po.items.length} Macam Barang
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nama Barang / SKU</th>
                    <th className="p-3">Kuantitas</th>
                    <th className="p-3">Katalog Koperasi</th>
                    <th className="p-3 text-blue-700 bg-blue-50/50">Budget Diajukan</th>
                    <th className="p-3 text-emerald-700 bg-emerald-50/50">Harga Disepakati</th>
                    <th className="p-3 text-right">Subtotal Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {po.items.map((item) => {
                    const finalP = item.approvedPrice || item.targetPrice;
                    return (
                      <tr key={item.itemId} className="hover:bg-slate-50/60">
                        <td className="p-3 font-semibold text-slate-800">
                          {item.itemName}
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.sku}
                            </span>
                            {item.category && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  item.category === 'Bahan Baku'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {item.category}
                              </span>
                            )}
                            {item.supplierName && (
                              <span className="text-[9px] text-slate-500 font-medium">
                                • Supplier: {item.supplierName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-700">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-slate-500 line-through">
                          {formatRupiah(item.standardPrice)}
                        </td>
                        <td className="p-3 font-semibold text-blue-700 bg-blue-50/30">
                          {formatRupiah(item.targetPrice)}
                        </td>
                        <td className="p-3 font-bold text-emerald-700 bg-emerald-50/30">
                          {formatRupiah(finalP)}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          {formatRupiah(finalP * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Budget Summary Box */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-xs text-slate-600">
                <p>
                  Total Anggaran Pengajuan Klien:{' '}
                  <span className="font-semibold text-blue-700">
                    {formatRupiah(po.totalClientBudget)}
                  </span>
                </p>
                {po.cooperativeNotes && (
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Catatan Koperasi: {po.cooperativeNotes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Nilai PO Disetujui
                </span>
                <span className="text-xl font-black text-slate-900">
                  {formatRupiah(po.totalApprovedAmount || po.totalClientBudget)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Shipping Info */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                Alamat Tujuan Pengiriman
              </div>
              <p className="text-slate-600 leading-relaxed">{po.deliveryAddress}</p>
              {po.clientNotes && (
                <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                  Catatan Klien: {po.clientNotes}
                </p>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
                  <Calendar className="w-4 h-4 text-red-600" />
                  Jadwal & Status Tagihan
                </div>
                <p className="text-slate-600">
                  Tanggal Pemesanan: <span className="font-semibold text-slate-800">{po.orderDate}</span>
                </p>
                <p className="text-slate-600">
                  Target Dibutuhkan:{' '}
                  <span className="font-semibold text-red-600">{po.requiredDate}</span>
                </p>
              </div>

              {relatedInvoice && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Faktur: {relatedInvoice.invoiceNumber}
                  </span>
                  <button
                    onClick={() => openInvoiceModal(relatedInvoice)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Buka Faktur ↗
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Negotiation Drawer (If Admin opens counter-offer) */}
          {negotiateMode && isAdmin && (
            <form
              onSubmit={handleApplyNegotiation}
              className="bg-amber-50 p-4 rounded-xl border border-amber-300 space-y-3 text-xs"
            >
              <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Tetapkan Penyesuaian Harga / Negosiasi Win-Win
              </h5>
              <div className="space-y-2">
                {po.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-amber-200"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{item.itemName}</p>
                      <p className="text-[10px] text-slate-500">
                        Budget Klien: {formatRupiah(item.targetPrice)} | Standar Koperasi:{' '}
                        {formatRupiah(item.standardPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Rp</span>
                      <input
                        type="number"
                        defaultValue={counterPrices[item.itemId] ?? item.approvedPrice ?? item.targetPrice}
                        onChange={(e) =>
                          setCounterPrices({
                            ...counterPrices,
                            [item.itemId]: Number(e.target.value),
                          })
                        }
                        className="w-28 p-1.5 border border-slate-300 rounded font-bold text-slate-800"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Catatan Kesepakatan untuk Klien
                </label>
                <input
                  type="text"
                  value={negoNote}
                  onChange={(e) => setNegoNote(e.target.value)}
                  placeholder="Contoh: Kami berikan harga khusus kemitraan volume besar..."
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  Simpan & Setujui Harga Kesepakatan
                </button>
                <button
                  type="button"
                  onClick={() => setNegotiateMode(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Admin Workflow Actions */}
          {isAdmin && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Aksi Keputusan Pengurus Koperasi
              </h5>
              <div className="flex flex-wrap gap-2">
                {(po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW') && (
                  <>
                    <button
                      onClick={() => setShowApproveDialog(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Setujui Penawaran Klien
                    </button>
                    <button
                      onClick={() => setShowRejectDialog(true)}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak Penawaran
                    </button>
                    <button
                      onClick={() => setNegotiateMode(true)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-4 h-4" />
                      Ajukan Negosiasi Harga
                    </button>
                  </>
                )}

                {po.status === 'NEGOSIASI_HARGA' && (
                  <button
                    onClick={() => setShowApproveDialog(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Konfirmasi Persetujuan Final Klien
                  </button>
                )}

                {po.status === 'DISETUJUI' && (
                  <button
                    onClick={() => setShowConvertDialog(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    Konversi Menjadi Pesanan Resmi (Terbitkan SPK)
                  </button>
                )}

                {po.status === 'PESANAN_RESMI' && (
                  <button
                    onClick={() => handleStatusChange('DIPROSES')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Package className="w-4 h-4" />
                    Mulai Siapkan di Gudang
                  </button>
                )}

                {po.status === 'DIPROSES' && (
                  <button
                    onClick={() => handleStatusChange('DIKIRIM')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Truck className="w-4 h-4" />
                    Berangkatkan Armada Pengiriman (Update Stok Out)
                  </button>
                )}

                {po.status === 'DIKIRIM' && (
                  <button
                    onClick={() => handleStatusChange('SELESAI')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Tandai Pesanan Selesai & Diterima Klien
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dialog 1: Modal Persetujuan Penawaran */}
          {showApproveDialog && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-3 text-xs animate-in fade-in">
              <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Konfirmasi Persetujuan Penawaran Budget Klien
              </h5>
              <p className="text-emerald-700">
                Anda akan menyetujui total penawaran budget sebesar{' '}
                <span className="font-black text-emerald-900">
                  {formatRupiah(po.totalClientBudget)}
                </span>{' '}
                dari klien {po.clientName}.
              </p>
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">
                  Catatan Persetujuan Koperasi (Opsional)
                </label>
                <input
                  type="text"
                  value={approvalNoteInput}
                  onChange={(e) => setApprovalNoteInput(e.target.value)}
                  className="w-full p-2 border border-emerald-300 rounded-lg bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Ya, Setujui Penawaran
                </button>
                <button
                  type="button"
                  onClick={() => setShowApproveDialog(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Dialog 2: Modal Penolakan Penawaran */}
          {showRejectDialog && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-300 space-y-3 text-xs animate-in fade-in">
              <h5 className="font-bold text-red-900 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                Tolak Penawaran Budget Klien
              </h5>
              <p className="text-red-700">
                Tuliskan alasan penolakan secara jelas agar dapat ditinjau oleh pemohon.
              </p>
              <div>
                <label className="block font-semibold text-red-900 mb-1">
                  Alasan Penolakan Penawaran *
                </label>
                <textarea
                  rows={2}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full p-2 border border-red-300 rounded-lg bg-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Simpan Penolakan
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Dialog 3: Modal Konversi ke Pesanan Resmi (SPK) */}
          {showConvertDialog && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-300 space-y-3 text-xs animate-in fade-in">
              <h5 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Konversi PO Menjadi Pesanan Resmi (Terbitkan SPK Sah)
              </h5>
              <p className="text-blue-700">
                Tindakan ini akan mengunci harga kesepakatan final, menerbitkan Surat Perintah Kerja Resmi (SPK), dan mengarahkan ke penyiapan gudang & faktur penagihan.
              </p>
              <div>
                <label className="block font-semibold text-blue-900 mb-1">
                  Catatan Dokumen SPK Resmi
                </label>
                <input
                  type="text"
                  value={officialNoteInput}
                  onChange={(e) => setOfficialNoteInput(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-lg bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmConversion}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  Terbitkan SPK Resmi Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setShowConvertDialog(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={closePOModal}
            className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
