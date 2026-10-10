import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  CreditCard,
  Building,
  FileText,
  DollarSign,
  Download,
} from 'lucide-react';

export const InvoiceDetailModal: React.FC = () => {
  const {
    activeInvoiceModal,
    closeInvoiceModal,
    currentUser,
    uploadPaymentProof,
    verifyPayment,
    paySupplierInvoice,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank Mandiri');
  const [proofUrl, setProofUrl] = useState(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80'
  );
  const [showProofUpload, setShowProofUpload] = useState(false);

  if (!activeInvoiceModal.isOpen || !activeInvoiceModal.data) return null;

  const invoice = activeInvoiceModal.data;
  const isClientBill = invoice.type === 'CLIENT_BILL';
  const isAdmin = currentUser.role === 'admin';
  const isClient = currentUser.role === 'client';
  const isSupplier = currentUser.role === 'supplier';

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmProof = (e: React.FormEvent) => {
    e.preventDefault();
    uploadPaymentProof(invoice.id, proofUrl, paymentMethod);
    setShowProofUpload(false);
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-400" />
            <span className="font-bold text-sm tracking-wide">
              {isClientBill ? 'FAKTUR PENJUALAN KOPERASI' : 'BUKTI HUTANG PEMBELIAN SUPPLIER'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Cetak Faktur"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={closeInvoiceModal}
              className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print:border-none print:shadow-none">
            {/* Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  GMP
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900 tracking-tight">
                    KOPERASI GARUDA MERAH PUTIH
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Badan Hukum Koperasi: AHU-0012891.AH.01.26.TAHUN 2024
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Jl. Merdeka No. 45, Jakarta Pusat | Telp: (021) 3889012
                  </p>
                </div>
              </div>
              <div className="text-right sm:self-center">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    invoice.status === 'LUNAS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : invoice.status === 'MENUNGGU_KONFIRMASI'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {invoice.status === 'LUNAS'
                    ? '✓ LUNAS'
                    : invoice.status === 'MENUNGGU_KONFIRMASI'
                    ? 'VERIFIKASI BAYAR'
                    : 'BELUM LUNAS'}
                </span>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  No: {invoice.invoiceNumber}
                </p>
              </div>
            </div>

            {/* Recipient & Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {isClientBill ? 'DITUJUKAN KEPADA (KLIEN):' : 'PEMASOK / SUPPLIER:'}
                </p>
                <p className="font-bold text-slate-900 text-sm">{invoice.partyName}</p>
                <p className="text-slate-600 mt-0.5">{invoice.partyEmail}</p>
                <p className="text-slate-600">{invoice.partyPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  INFORMASI FAKTUR:
                </p>
                <p className="text-slate-700">
                  Tanggal Terbit: <span className="font-semibold text-slate-900">{invoice.issueDate}</span>
                </p>
                <p className="text-slate-700">
                  Jatuh Tempo: <span className="font-semibold text-red-600">{invoice.dueDate}</span>
                </p>
                <p className="text-slate-700">
                  Referensi Order: <span className="font-mono font-bold text-slate-900">{invoice.referenceNo}</span>
                </p>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-medium">Jumlah Total Tagihan</p>
                <p className="text-2xl font-black text-slate-900">
                  {formatRupiah(invoice.totalAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Jumlah Terbayar</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatRupiah(invoice.paidAmount)}
                </p>
              </div>
            </div>

            {/* Banking Details */}
            <div className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-red-600" />
                  Instruksi Rekening Pembayaran
                </p>
                <p className="text-slate-700 font-medium">{invoice.bankAccount}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sertakan nomor faktur ({invoice.invoiceNumber}) pada keterangan transfer.
                </p>
              </div>

              {/* Payment Proof Preview if present */}
              {invoice.paymentProof && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Bukti Pembayaran Terlampir
                  </p>
                  <p className="text-[11px] text-slate-600 mb-1">
                    Metode: {invoice.paymentMethod || 'Transfer Bank'}
                  </p>
                  <a
                    href={invoice.paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Lihat Foto Bukti Transfer ↗
                  </a>
                </div>
              )}
            </div>

            {invoice.notes && (
              <div className="mt-4 p-2.5 bg-amber-50 rounded-lg text-amber-900 text-xs border border-amber-200">
                <span className="font-bold">Catatan Faktur:</span> {invoice.notes}
              </div>
            )}
          </div>

          {/* Action Triggers depending on user role */}
          {/* 1. Client: Upload Payment Proof */}
          {isClientBill && invoice.status === 'BELUM_BAYAR' && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <button
                onClick={() => setShowProofUpload(!showProofUpload)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Bukti Transfer Pembayaran</span>
              </button>

              {showProofUpload && (
                <form onSubmit={handleConfirmProof} className="mt-4 space-y-3 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Metode Transfer Yang Digunakan
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                      <option value="Transfer Bank BNI / BSI">Transfer Bank BNI / BSI</option>
                      <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                      <option value="QRIS Koperasi Garuda Merah Putih">QRIS Dinamis Koperasi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      URL Bukti Transfer (atau gunakan foto default contoh)
                    </label>
                    <input
                      type="text"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                  >
                    Kirim Bukti Pembayaran Ke Koperasi
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. Admin: Verify Payment from Client */}
          {isAdmin && isClientBill && invoice.status === 'MENUNGGU_KONFIRMASI' && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-bold text-emerald-900 text-xs">
                  Klien telah mengunggah bukti pembayaran
                </p>
                <p className="text-[11px] text-emerald-700">
                  Validasi bahwa mutasi sebesar {formatRupiah(invoice.totalAmount)} telah masuk rekening Koperasi.
                </p>
              </div>
              <button
                onClick={() => verifyPayment(invoice.id)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verifikasi Lunas (Koperasi)</span>
              </button>
            </div>
          )}

          {/* 3. Admin: Pay Supplier Payable */}
          {isAdmin && !isClientBill && invoice.status === 'BELUM_BAYAR' && (
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 text-xs">
                  Kewajiban Pembayaran Pasokan ke Supplier
                </p>
                <p className="text-[11px] text-slate-600">
                  Cairkan dana pembayaran sebesar {formatRupiah(invoice.totalAmount)} ke rekening {invoice.partyName}.
                </p>
              </div>
              <button
                onClick={() => paySupplierInvoice(invoice.id, 'Transfer Kas Koperasi')}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <DollarSign className="w-4 h-4" />
                <span>Cairkan Pembayaran Supplier</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={closeInvoiceModal}
            className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
