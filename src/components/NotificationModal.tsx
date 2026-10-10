import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Mail,
  Send,
  ExternalLink,
  Copy,
  Check,
  X,
  PhoneCall,
  Clock,
  Sparkles,
} from 'lucide-react';

export const NotificationModal: React.FC = () => {
  const { activeNotificationModal, closeNotificationModal, triggerNotification } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'compose'>('preview');

  // Custom send form
  const [sendType, setSendType] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!activeNotificationModal.isOpen || !activeNotificationModal.data) {
    return null;
  }

  const notif = activeNotificationModal.data;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = (phone: string) => {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) {
      p = '62' + p.slice(1);
    }
    return p;
  };

  const openWhatsAppDirect = (phone: string, text: string) => {
    const formatted = cleanPhone(phone);
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientContact || !message) return;

    triggerNotification(
      sendType,
      recipientName || 'Mitra Koperasi',
      recipientContact,
      subject || (sendType === 'WHATSAPP' ? 'Pesan Koperasi Garuda Merah Putih' : 'Notifikasi Resmi'),
      message,
      'MANUAL-NOTIF'
    );

    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
      closeNotificationModal();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {notif.type === 'WHATSAPP' ? (
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <MessageSquare className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <Mail className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base leading-tight">
                {notif.type === 'WHATSAPP' ? 'Notifikasi WhatsApp Otomatis' : 'Surat / Email Resmi Koperasi'}
              </h3>
              <p className="text-xs text-red-100">
                Pemberitahuan Otomatis Real-time Status Transaksi
              </p>
            </div>
          </div>
          <button
            onClick={closeNotificationModal}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'preview'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Preview Pesan Terkirim
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'compose'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kirim Notifikasi Manual
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'preview' ? (
            <>
              {/* Metadata */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Penerima:</span>
                  <span className="font-semibold text-slate-800">{notif.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kontak Tujuan:</span>
                  <span className="font-mono font-medium text-slate-800">{notif.recipientContact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Referensi:</span>
                  <span className="font-mono font-bold text-red-600">{notif.relatedReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Kirim:</span>
                  <span className="text-slate-700">{notif.timestamp} WIB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ TERKIRIM
                  </span>
                </div>
              </div>

              {/* Message Display */}
              {notif.type === 'WHATSAPP' ? (
                /* WhatsApp visual phone preview */
                <div className="bg-[#ECE5DD] p-4 rounded-xl border border-emerald-200/50 shadow-inner">
                  <div className="max-w-[85%] bg-[#DCF8C6] p-3 rounded-lg shadow-xs text-xs text-slate-800 ml-auto space-y-2 border border-emerald-200">
                    <p className="font-bold text-[11px] text-emerald-900 border-b border-emerald-200/60 pb-1">
                      Koperasi Garuda Merah Putih
                    </p>
                    <p className="whitespace-pre-line leading-relaxed">{notif.message}</p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-1">
                      <span>{notif.timestamp.split(' ')[1] || '12:00'}</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formal Email letterhead preview */
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  {/* Kop Surat Koperasi */}
                  <div className="border-b-2 border-red-600 pb-3 mb-3 text-center">
                    <h4 className="font-black text-slate-900 tracking-wider text-sm">
                      KOPERASI GARUDA MERAH PUTIH
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Badan Hukum No: AHU-0012891.AH.01.26.TAHUN 2024
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Jl. Merdeka No. 45, Jakarta Pusat | Telp: (021) 3889012 | Email: info@koperasigarudamp.id
                    </p>
                  </div>

                  <div className="text-xs space-y-2">
                    <p className="font-semibold text-slate-800">
                      Subjek: {notif.subject}
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed whitespace-pre-line">
                      {notif.message}
                    </div>
                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                      <p>Hormat kami,</p>
                      <p className="font-bold text-slate-700">Pengurus Koperasi Garuda Merah Putih</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Compose Manual Notification */
            <form onSubmit={handleSendCustom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kanal Notifikasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendType('WHATSAPP')}
                    className={`p-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition ${
                      sendType === 'WHATSAPP'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendType('EMAIL')}
                    className={`p-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition ${
                      sendType === 'EMAIL'
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penerima
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Contoh: PT Sumber Makmur Nusantara / Bpk. Sutrisno"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {sendType === 'WHATSAPP' ? 'Nomor WhatsApp (diawali 08 / 62)' : 'Alamat Email'}
                </label>
                <input
                  type={sendType === 'WHATSAPP' ? 'tel' : 'email'}
                  value={recipientContact}
                  onChange={(e) => setRecipientContact(e.target.value)}
                  placeholder={sendType === 'WHATSAPP' ? '081298765432' : 'mitra@perusahaan.com'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {sendType === 'EMAIL' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Judul Subjek Email
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Update Pengiriman Barang PO-GMP-2026-0042"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Isi Pesan Notifikasi
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis pesan resmi yang ingin dikirimkan kepada mitra..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {sendSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Notifikasi berhasil dikirim dan tersimpan di log sistem!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Kirim Notifikasi Sekarang
              </button>
            </form>
          )}
        </div>

        {/* Footer actions for preview tab */}
        {activeTab === 'preview' && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => handleCopy(notif.message)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin Teks'}
            </button>

            {notif.type === 'WHATSAPP' && notif.recipientContact && (
              <button
                onClick={() => openWhatsAppDirect(notif.recipientContact, notif.message)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka di WhatsApp Web / App
              </button>
            )}

            <button
              onClick={closeNotificationModal}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
