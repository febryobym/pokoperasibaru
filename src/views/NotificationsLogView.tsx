import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BellRing,
  MessageSquare,
  Mail,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Eye,
} from 'lucide-react';
import { NotificationLog } from '../types';

export const NotificationsLogView: React.FC = () => {
  const { notifications, openNotificationModal } = useApp();
  const [filterType, setFilterType] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifs = notifications.filter((notif) => {
    const matchesType = filterType === 'ALL' || notif.type === filterType;
    const matchesSearch =
      notif.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.recipientContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.relatedReference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const openWhatsAppDirect = (phone: string, text: string) => {
    const formatted = phone.replace(/\D/g, '').replace(/^0/, '62');
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Log Notifikasi Otomatis (WhatsApp & Email)
          </h1>
          <p className="text-xs text-slate-500">
            Sistem secara otomatis mengirimkan pemberitahuan setiap ada transaksi baru, perubahan status PO, penerimaan gudang, dan penerbitan faktur.
          </p>
        </div>

        <button
          onClick={() =>
            openNotificationModal({
              id: 'new',
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              type: 'WHATSAPP',
              recipientName: '',
              recipientContact: '',
              subject: '',
              message: '',
              status: 'TERKIRIM',
              relatedReference: 'MANUAL',
            })
          }
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Kirim Notifikasi Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari penerima, no HP, atau nomor referensi..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
              filterType === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
            }`}
          >
            Semua Kanal ({notifications.length})
          </button>
          <button
            onClick={() => setFilterType('WHATSAPP')}
            className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
              filterType === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-500'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setFilterType('EMAIL')}
            className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
              filterType === 'EMAIL' ? 'bg-blue-600 text-white' : 'text-slate-500'
            }`}
          >
            Email
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <BellRing className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-sm text-slate-700">Tidak ada riwayat notifikasi</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const isWA = notif.type === 'WHATSAPP';

            return (
              <div
                key={notif.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                      isWA ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  >
                    {isWA ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs text-slate-900">
                        {notif.recipientName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({notif.recipientContact})
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                        Ref: {notif.relatedReference}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        ✓ TERKIRIM OTOMATIS
                      </span>
                    </div>

                    <p className="font-bold text-xs text-slate-700">{notif.subject}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Waktu Pengiriman: {notif.timestamp} WIB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => openNotificationModal(notif)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Rincian</span>
                  </button>

                  {isWA && notif.recipientContact && (
                    <button
                      onClick={() => openWhatsAppDirect(notif.recipientContact, notif.message)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                      title="Buka Langsung di WhatsApp Web"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka WA</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
