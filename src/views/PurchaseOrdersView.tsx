import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  DollarSign,
  Truck,
  MessageSquare,
  FileText,
  AlertCircle,
  Eye,
  Calendar,
  XCircle,
  Award,
  ChevronRight,
  Send,
  X,
  Sparkles,
  Edit3,
  Trash2,
  Printer,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Building,
  Save,
  Check,
  Package,
} from 'lucide-react';
import { POStatus, PurchaseOrder, PaymentStatus, POItem } from '../types';

export const PurchaseOrdersView: React.FC = () => {
  const {
    purchaseOrders,
    openPOModal,
    openInvoiceModal,
    invoices,
    triggerNotification,
    approvePOOffer,
    rejectPOOffer,
    convertToOfficialOrder,
    updatePOStatus,
    updatePurchaseOrder,
    deletePurchaseOrder,
    currentUser,
    users,
    inventory,
    createPurchaseOrder,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Action Dialogs directly inside View
  const [actionTargetPO, setActionTargetPO] = useState<PurchaseOrder | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'CONVERT' | null>(null);
  const [dialogInput, setDialogInput] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Admin View, Edit, Delete Modals
  const [viewModalPO, setViewModalPO] = useState<PurchaseOrder | null>(null);
  const [editModalPO, setEditModalPO] = useState<PurchaseOrder | null>(null);
  const [deleteModalPO, setDeleteModalPO] = useState<PurchaseOrder | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    requiredDate: string;
    deliveryAddress: string;
    status: POStatus;
    paymentStatus: PaymentStatus;
    clientNotes: string;
    cooperativeNotes: string;
    items: POItem[];
  }>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    requiredDate: '',
    deliveryAddress: '',
    status: 'DIAJUKAN',
    paymentStatus: 'BELUM_BAYAR',
    clientNotes: '',
    cooperativeNotes: '',
    items: [],
  });

  // New PO creation modal for Admin
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [newPOClientId, setNewPOClientId] = useState('');
  const [newPOItems, setNewPOItems] = useState<
    Array<{ itemId: string; quantity: number; targetPrice: number }>
  >([]);
  const [newPORangeDate, setNewPORangeDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newPODeliveryAddress, setNewPODeliveryAddress] = useState('');
  const [newPONotes, setNewPONotes] = useState('');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const showBannerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4500);
  };

  // Map inventory supplier unit costs for profitability breakdown
  const itemCostMap = new Map<string, number>(inventory.map((inv) => [inv.id, inv.costPrice]));

  // KPI Calculations
  const totalPOCount = purchaseOrders.length;
  const pendingReviewCount = purchaseOrders.filter(
    (po) => po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW'
  ).length;
  const approvedCount = purchaseOrders.filter((po) => po.status === 'DISETUJUI').length;
  const officialOrderCount = purchaseOrders.filter(
    (po) => po.status === 'PESANAN_RESMI' || po.isOfficialOrder
  ).length;
  const rejectedCount = purchaseOrders.filter((po) => po.status === 'DITOLAK').length;

  const filteredPOs = purchaseOrders.filter((po) => {
    let matchesStatus = false;
    if (statusFilter === 'SEMUA') {
      matchesStatus = true;
    } else if (statusFilter === 'DIAJUKAN') {
      matchesStatus = po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW';
    } else if (statusFilter === 'PESANAN_RESMI') {
      matchesStatus = po.status === 'PESANAN_RESMI' || po.isOfficialOrder === true;
    } else {
      matchesStatus = po.status === statusFilter;
    }

    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.officialOrderNumber &&
        po.officialOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      po.items.some((i) => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: POStatus, isOfficial?: boolean) => {
    if (isOfficial || status === 'PESANAN_RESMI') {
      return {
        label: 'Pesanan Resmi (SPK Terbit)',
        bg: 'bg-blue-100 text-blue-900 border-blue-300',
        badgeDot: 'bg-blue-600',
      };
    }

    switch (status) {
      case 'DIAJUKAN':
      case 'MENUNGGU_REVIEW':
        return {
          label: 'Diajukan (Menunggu Review)',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          badgeDot: 'bg-amber-500',
        };
      case 'NEGOSIASI_HARGA':
        return {
          label: 'Negosiasi Penawaran Harga',
          bg: 'bg-orange-100 text-orange-900 border-orange-300',
          badgeDot: 'bg-orange-500',
        };
      case 'DISETUJUI':
        return {
          label: 'Penawaran Disetujui',
          bg: 'bg-teal-100 text-teal-900 border-teal-300',
          badgeDot: 'bg-teal-600',
        };
      case 'DITOLAK':
        return {
          label: 'Penawaran Ditolak',
          bg: 'bg-red-100 text-red-900 border-red-300',
          badgeDot: 'bg-red-600',
        };
      case 'DIPROSES':
        return {
          label: 'Diproses Gudang',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          badgeDot: 'bg-indigo-600',
        };
      case 'DIKIRIM':
        return {
          label: 'Dalam Pengiriman Armada',
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          badgeDot: 'bg-purple-600',
        };
      case 'SELESAI':
        return {
          label: 'Pesanan Selesai',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          badgeDot: 'bg-emerald-600',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          badgeDot: 'bg-slate-500',
        };
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (po: PurchaseOrder) => {
    setEditModalPO(po);
    setEditForm({
      clientName: po.clientName,
      clientEmail: po.clientEmail,
      clientPhone: po.clientPhone,
      requiredDate: po.requiredDate,
      deliveryAddress: po.deliveryAddress,
      status: po.status,
      paymentStatus: po.paymentStatus,
      clientNotes: po.clientNotes || '',
      cooperativeNotes: po.cooperativeNotes || '',
      items: po.items.map((item) => ({ ...item })),
    });
  };

  // Save Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalPO) return;

    if (editForm.items.length === 0) {
      alert('Purchase Order harus memiliki minimal 1 barang.');
      return;
    }

    const totalClientBudget = editForm.items.reduce(
      (sum, it) => sum + (it.targetPrice || it.standardPrice) * it.quantity,
      0
    );

    const totalApprovedAmount =
      editForm.status === 'DISETUJUI' || editForm.status === 'PESANAN_RESMI'
        ? editForm.items.reduce(
            (sum, it) => sum + (it.approvedPrice || it.targetPrice || it.standardPrice) * it.quantity,
            0
          )
        : totalClientBudget;

    updatePurchaseOrder(editModalPO.id, {
      clientName: editForm.clientName,
      clientEmail: editForm.clientEmail,
      clientPhone: editForm.clientPhone,
      requiredDate: editForm.requiredDate,
      deliveryAddress: editForm.deliveryAddress,
      status: editForm.status,
      paymentStatus: editForm.paymentStatus,
      clientNotes: editForm.clientNotes,
      cooperativeNotes: editForm.cooperativeNotes,
      items: editForm.items,
      totalClientBudget,
      totalApprovedAmount,
    });

    showBannerFeedback(`Purchase Order ${editModalPO.poNumber} berhasil diperbarui.`);
    setEditModalPO(null);
  };

  // Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteModalPO) return;
    const res = deletePurchaseOrder(deleteModalPO.id);
    if (res.success) {
      showBannerFeedback(`Purchase Order ${deleteModalPO.poNumber} berhasil dihapus.`);
    } else {
      showBannerFeedback(res.message);
    }
    setDeleteModalPO(null);
  };

  // Quick Action Dialog Triggers
  const handleOpenApproveModal = (po: PurchaseOrder) => {
    setActionTargetPO(po);
    setActionType('APPROVE');
    setDialogInput(
      `Disetujui penuh sesuai budget yang diajukan senilai ${formatRupiah(po.totalClientBudget)}.`
    );
  };

  const handleOpenRejectModal = (po: PurchaseOrder) => {
    setActionTargetPO(po);
    setActionType('REJECT');
    setDialogInput('');
  };

  const handleOpenConvertModal = (po: PurchaseOrder) => {
    setActionTargetPO(po);
    setActionType('CONVERT');
    setDialogInput('Dikonversi resmi menjadi SPK. Penyiapan logistik dan faktur diterbitkan.');
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTargetPO || !actionType) return;

    if (actionType === 'APPROVE') {
      approvePOOffer(actionTargetPO.id, dialogInput);
      showBannerFeedback(
        `Penawaran PO ${actionTargetPO.poNumber} berhasil DISETUJUI. Notifikasi telah terkirim.`
      );
    } else if (actionType === 'REJECT') {
      if (!dialogInput.trim()) {
        alert('Mohon masukkan alasan penolakan.');
        return;
      }
      rejectPOOffer(actionTargetPO.id, dialogInput);
      showBannerFeedback(
        `Penawaran PO ${actionTargetPO.poNumber} DITOLAK. Alasan telah dikirimkan ke klien.`
      );
    } else if (actionType === 'CONVERT') {
      const converted = convertToOfficialOrder(actionTargetPO.id, dialogInput);
      showBannerFeedback(
        `PO ${actionTargetPO.poNumber} sukses dikonversi menjadi Pesanan Resmi (${converted?.officialOrderNumber || 'SPK'}).`
      );
    }

    setActionTargetPO(null);
    setActionType(null);
    setDialogInput('');
  };

  // Handle Admin creating a new PO on behalf of client
  const handleOpenNewPO = () => {
    const clients = users.filter((u) => u.role === 'client');
    const firstClient = clients[0];
    if (firstClient) {
      setNewPOClientId(firstClient.id);
      setNewPODeliveryAddress(firstClient.address || '');
    }
    if (inventory.length > 0) {
      setNewPOItems([
        {
          itemId: inventory[0].id,
          quantity: 20,
          targetPrice: Math.round(inventory[0].standardPrice * 0.95),
        },
      ]);
    }
    setIsNewPOModalOpen(true);
  };

  const handleSaveAdminPO = (e: React.FormEvent) => {
    e.preventDefault();
    const client = users.find((u) => u.id === newPOClientId);
    if (!client) {
      alert('Pilih klien terlebih dahulu.');
      return;
    }
    if (newPOItems.length === 0) {
      alert('Tambahkan minimal 1 barang pesanan.');
      return;
    }

    const itemsFormatted = newPOItems.map((row) => {
      const itm = inventory.find((i) => i.id === row.itemId)!;
      return {
        itemId: itm.id,
        itemName: itm.name,
        sku: itm.sku,
        quantity: row.quantity,
        unit: itm.unit,
        standardPrice: itm.standardPrice,
        targetPrice: row.targetPrice,
        approvedPrice: row.targetPrice,
        category: itm.category,
        supplierName: itm.supplierName || 'Supplier Mitra Koperasi',
        notes: `Didaftarkan oleh Pengurus Admin Koperasi Garuda Merah Putih`,
      };
    });

    const totalClientBudget = itemsFormatted.reduce(
      (sum, item) => sum + item.targetPrice * item.quantity,
      0
    );

    const created = createPurchaseOrder({
      clientId: client.id,
      clientName: client.companyName || client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      requiredDate: newPORangeDate,
      items: itemsFormatted,
      totalClientBudget,
      totalApprovedAmount: totalClientBudget,
      deliveryAddress: newPODeliveryAddress || client.address || 'Alamat Kantor Pemesan',
      clientNotes: newPONotes || 'Diajukan melalui modul Admin Koperasi',
    });

    setIsNewPOModalOpen(false);
    showBannerFeedback(
      `PO Baru ${created.poNumber} berhasil didaftarkan atas nama ${created.clientName}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Feedback */}
      {actionFeedback && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-100 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header View */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Purchase Order (PO Klien)
            </h1>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200">
              Admin & Klien Portal
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Kelola, review, setujui penawaran harga sesuai budget klien, edit, atau hapus PO, serta konversi menjadi Pesanan Resmi (SPK).
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewPO}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat PO Baru (Klien)</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('SEMUA')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'SEMUA'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Total PO</span>
            <ShoppingCart
              className={`w-4 h-4 ${statusFilter === 'SEMUA' ? 'text-slate-300' : 'text-slate-400'}`}
            />
          </div>
          <div className="text-2xl font-black mt-2">{totalPOCount}</div>
          <p
            className={`text-[10px] mt-1 ${statusFilter === 'SEMUA' ? 'text-slate-300' : 'text-slate-400'}`}
          >
            Semua PO terdaftar
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('DIAJUKAN')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'DIAJUKAN'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Menunggu Review</span>
            <Clock
              className={`w-4 h-4 ${statusFilter === 'DIAJUKAN' ? 'text-amber-200' : 'text-amber-500'}`}
            />
          </div>
          <div className="text-2xl font-black mt-2 text-amber-600 group-[.bg-amber-600]:text-white">
            <span className={statusFilter === 'DIAJUKAN' ? 'text-white' : 'text-amber-600'}>
              {pendingReviewCount}
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 ${statusFilter === 'DIAJUKAN' ? 'text-amber-100' : 'text-amber-600 font-semibold'}`}
          >
            Perlu persetujuan admin
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('DISETUJUI')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'DISETUJUI'
              ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-300'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Penawaran Disetujui</span>
            <CheckCircle2
              className={`w-4 h-4 ${statusFilter === 'DISETUJUI' ? 'text-teal-200' : 'text-teal-600'}`}
            />
          </div>
          <div className="text-2xl font-black mt-2">
            <span className={statusFilter === 'DISETUJUI' ? 'text-white' : 'text-teal-600'}>
              {approvedCount}
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 ${statusFilter === 'DISETUJUI' ? 'text-teal-100' : 'text-slate-400'}`}
          >
            Siap konversi ke SPK
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('PESANAN_RESMI')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'PESANAN_RESMI'
              ? 'bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Pesanan Resmi (SPK)</span>
            <Award
              className={`w-4 h-4 ${statusFilter === 'PESANAN_RESMI' ? 'text-amber-300' : 'text-blue-600'}`}
            />
          </div>
          <div className="text-2xl font-black mt-2">
            <span className={statusFilter === 'PESANAN_RESMI' ? 'text-white' : 'text-blue-600'}>
              {officialOrderCount}
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 ${statusFilter === 'PESANAN_RESMI' ? 'text-blue-100' : 'text-slate-400'}`}
          >
            Surat Pesanan sah
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('DITOLAK')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'DITOLAK'
              ? 'bg-red-700 text-white border-red-700 shadow-md ring-2 ring-red-300'
              : 'bg-white text-slate-800 border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Penawaran Ditolak</span>
            <XCircle
              className={`w-4 h-4 ${statusFilter === 'DITOLAK' ? 'text-red-200' : 'text-red-500'}`}
            />
          </div>
          <div className="text-2xl font-black mt-2">
            <span className={statusFilter === 'DITOLAK' ? 'text-white' : 'text-red-600'}>
              {rejectedCount}
            </span>
          </div>
          <p
            className={`text-[10px] mt-1 ${statusFilter === 'DITOLAK' ? 'text-red-100' : 'text-slate-400'}`}
          >
            Budget tidak sesuai
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. PO, No. SPK, Klien, atau Nama Barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
          {[
            { id: 'SEMUA', label: 'Semua' },
            { id: 'DIAJUKAN', label: 'Diajukan' },
            { id: 'DISETUJUI', label: 'Disetujui' },
            { id: 'PESANAN_RESMI', label: 'Pesanan Resmi (SPK)' },
            { id: 'DITOLAK', label: 'Ditolak' },
            { id: 'NEGOSIASI_HARGA', label: 'Negosiasi' },
            { id: 'DIPROSES', label: 'Diproses' },
            { id: 'DIKIRIM', label: 'Dikirim' },
            { id: 'SELESAI', label: 'Selesai' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredPOs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-sm text-slate-700">Tidak ada Purchase Order ditemukan</p>
            <p className="text-xs">Coba ubah filter status penawaran atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          filteredPOs.map((po) => {
            const badge = getStatusBadge(po.status, po.isOfficialOrder);
            const relatedInv = invoices.find((inv) => inv.referenceNo === po.poNumber);
            const isOfferPending = po.status === 'DIAJUKAN' || po.status === 'MENUNGGU_REVIEW';
            const isOfferApproved = po.status === 'DISETUJUI';
            const isOfferRejected = po.status === 'DITOLAK';
            const isOfficial = po.status === 'PESANAN_RESMI' || po.isOfficialOrder;

            // Compute total supplier cost & cooperative profit for this PO
            const totalSupplierCost = po.items.reduce((sum, itm) => {
              const cost = itemCostMap.get(itm.itemId) ?? Math.round(itm.standardPrice * 0.75);
              return sum + cost * itm.quantity;
            }, 0);
            const cooperativeProfit = po.totalClientBudget - totalSupplierCost;

            return (
              <div
                key={po.id}
                className={`bg-white rounded-2xl border transition overflow-hidden shadow-xs ${
                  isOfferPending
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : isOfferApproved
                    ? 'border-teal-300 ring-1 ring-teal-100'
                    : isOfficial
                    ? 'border-blue-300'
                    : isOfferRejected
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header card with Admin Action Toolbar */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          : 'bg-red-600'
                      }`}
                    >
                      {isOfficial ? (
                        <Award className="w-5 h-5 text-amber-200" />
                      ) : (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-slate-900 font-mono">
                          {po.poNumber}
                        </span>

                        {po.officialOrderNumber && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-700 text-white font-mono flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-300" />
                            {po.officialOrderNumber}
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.badgeDot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Klien Pemesan: <span className="font-bold text-slate-800">{po.clientName}</span>{' '}
                        • Telp: {po.clientPhone}
                      </p>
                    </div>
                  </div>

                  {/* Actions Right Header: View, Edit, Delete for Admin */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="text-left sm:text-right hidden md:block mr-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Jadwal Diperlukan
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-red-600" />
                        {po.requiredDate}
                      </span>
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => setViewModalPO(po)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Lihat Rincian Lengkap PO"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>

                    {/* Admin Edit & Delete Buttons */}
                    {currentUser.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(po)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="Edit Purchase Order ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setDeleteModalPO(po)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="Hapus Purchase Order ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Notice Banners */}
                {isOfferPending && (
                  <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong className="font-bold">Penawaran Menunggu Tindakan Koperasi:</strong> Klien mengajukan anggaran budget Rp {po.totalClientBudget.toLocaleString('id-ID')}. Silakan setujui atau tolak penawaran di bawah.
                      </span>
                    </div>
                  </div>
                )}

                {isOfferApproved && (
                  <div className="px-5 py-2.5 bg-teal-50 border-b border-teal-200 text-teal-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>
                        <strong className="font-bold">Penawaran Budget Disetujui Penuh:</strong> Siap dikonversi menjadi Surat Perintah Kerja (SPK) Pesanan Resmi.
                      </span>
                    </div>
                  </div>
                )}

                {isOfferRejected && (
                  <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 text-red-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        <strong className="font-bold">Penawaran Ditolak:</strong> {po.rejectionReason || 'Alokasi budget belum dapat disetujui.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Body card: Items, Budget & Pricing Details */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Col 1: Ordered Items */}
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Rincian Barang yang Diajukan Klien
                    </span>
                    <div className="space-y-1.5">
                      {po.items.map((item, idx) => {
                        const supCost =
                          itemCostMap.get(item.itemId) ?? Math.round(item.standardPrice * 0.75);
                        const itemMargin = item.targetPrice - supCost;

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{item.itemName}</p>
                              <p className="text-[10px] text-slate-500">
                                Kuantitas:{' '}
                                <span className="font-bold text-slate-700">
                                  {item.quantity} {item.unit}
                                </span>{' '}
                                • Standar Katalog: {formatRupiah(item.standardPrice)}
                              </p>
                              {currentUser.role === 'admin' && (
                                <p className="text-[10px] text-slate-400">
                                  Modal Supplier: {formatRupiah(supCost)} | Profit Koperasi:{' '}
                                  <span
                                    className={`font-semibold ${itemMargin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                  >
                                    {formatRupiah(itemMargin)}/unit
                                  </span>
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-blue-600 italic mt-0.5">{item.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Budget Ditawar Klien</span>
                              <span className="font-bold text-blue-700">
                                {formatRupiah(item.targetPrice)} / {item.unit}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Subtotal: {formatRupiah(item.targetPrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {po.clientNotes && (
                      <p className="text-[11px] text-slate-600 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200">
                        <strong className="font-bold text-slate-700">Catatan Budget Klien:</strong>{' '}
                        {po.clientNotes}
                      </p>
                    )}
                  </div>

                  {/* Col 2: Financial summary & quick actions */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Ringkasan Anggaran & Profit
                      </span>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Budget Ditawar Klien:</span>
                          <span className="font-bold text-blue-700">
                            {formatRupiah(po.totalClientBudget)}
                          </span>
                        </div>
                        {currentUser.role === 'admin' && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Harga Modal Supplier:</span>
                              <span className="font-medium text-slate-700">
                                {formatRupiah(totalSupplierCost)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-700">Profit Koperasi:</span>
                              <span
                                className={cooperativeProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}
                              >
                                {formatRupiah(cooperativeProfit)}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                          <span className="text-slate-700 font-bold">Total Nilai Final:</span>
                          <span className="font-black text-slate-900 text-sm">
                            {formatRupiah(po.totalApprovedAmount || po.totalClientBudget)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Status Pembayaran:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            po.paymentStatus === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : po.paymentStatus === 'MENUNGGU_KONFIRMASI'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {po.paymentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                      {/* Admin Decision Actions */}
                      {currentUser.role === 'admin' && (
                        <div className="flex flex-wrap gap-1.5">
                          {isOfferPending && (
                            <>
                              <button
                                onClick={() => handleOpenApproveModal(po)}
                                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(po)}
                                className="flex-1 py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {isOfferApproved && (
                            <button
                              onClick={() => handleOpenConvertModal(po)}
                              className="w-full py-2 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-300" />
                              <span>Konversi ke Pesanan Resmi (SPK)</span>
                            </button>
                          )}

                          {isOfficial && po.status === 'PESANAN_RESMI' && (
                            <button
                              onClick={() =>
                                updatePOStatus(po.id, 'DIPROSES', 'Barang mulai disiapkan di gudang')
                              }
                              className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Siapkan di Gudang</span>
                            </button>
                          )}
                        </div>
                      )}

                      {relatedInv && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openInvoiceModal(relatedInv)}
                            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 text-center transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Buka Faktur Tagihan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. DETAIL / VIEW MODAL */}
      {/* ========================================================================= */}
      {viewModalPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900 font-mono">
                      {viewModalPO.poNumber}
                    </h3>
                    {viewModalPO.officialOrderNumber && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-700 text-white font-mono flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-300" />
                        {viewModalPO.officialOrderNumber}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadge(viewModalPO.status, viewModalPO.isOfficialOrder).bg}`}
                    >
                      {getStatusBadge(viewModalPO.status, viewModalPO.isOfficialOrder).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dibuat: {viewModalPO.orderDate} • Diperlukan: {viewModalPO.requiredDate}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewModalPO(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-5 space-y-5 text-xs">
              {/* Client & Shipping Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Informasi Klien Pemesan
                  </span>
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {viewModalPO.clientName}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {viewModalPO.clientEmail}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {viewModalPO.clientPhone}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Alamat Pengiriman & Catatan
                  </span>
                  <div className="mt-2 space-y-1">
                    <p className="text-slate-700 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>{viewModalPO.deliveryAddress || 'Alamat kantor pemesan'}</span>
                    </p>
                    {viewModalPO.clientNotes && (
                      <p className="text-slate-500 italic mt-1">
                        <strong>Catatan Klien:</strong> {viewModalPO.clientNotes}
                      </p>
                    )}
                    {viewModalPO.cooperativeNotes && (
                      <p className="text-blue-700 font-medium mt-1">
                        <strong>Catatan Koperasi:</strong> {viewModalPO.cooperativeNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">
                    Rincian Barang & Kalkulasi Keuangan
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {viewModalPO.items.length} jenis komoditas
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                      <tr>
                        <th className="p-3">Nama Barang</th>
                        <th className="p-3 text-center">Kuantitas</th>
                        <th className="p-3 text-right">Standar Katalog</th>
                        <th className="p-3 text-right">Budget Klien</th>
                        {currentUser.role === 'admin' && (
                          <th className="p-3 text-right">Modal Supplier</th>
                        )}
                        {currentUser.role === 'admin' && (
                          <th className="p-3 text-right">Profit Koperasi</th>
                        )}
                        <th className="p-3 text-right">Subtotal Budget</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewModalPO.items.map((it, idx) => {
                        const supCost =
                          itemCostMap.get(it.itemId) ?? Math.round(it.standardPrice * 0.75);
                        const itemMargin = (it.targetPrice || it.standardPrice) - supCost;
                        const subtotal = (it.targetPrice || it.standardPrice) * it.quantity;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <p className="font-bold text-slate-800">{it.itemName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{it.sku}</p>
                              {it.notes && (
                                <p className="text-[10px] text-blue-600 italic">{it.notes}</p>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              {formatRupiah(it.standardPrice)}
                            </td>
                            <td className="p-3 text-right font-bold text-blue-700">
                              {formatRupiah(it.targetPrice)}
                            </td>
                            {currentUser.role === 'admin' && (
                              <td className="p-3 text-right text-slate-600">
                                {formatRupiah(supCost)}
                              </td>
                            )}
                            {currentUser.role === 'admin' && (
                              <td
                                className={`p-3 text-right font-bold ${
                                  itemMargin >= 0 ? 'text-emerald-700' : 'text-red-500'
                                }`}
                              >
                                {formatRupiah(itemMargin)}
                              </td>
                            )}
                            <td className="p-3 text-right font-black text-slate-900">
                              {formatRupiah(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary (Rule: Profit = Client Budget - Supplier Price) */}
              {(() => {
                const totalSupCost = viewModalPO.items.reduce((sum, itm) => {
                  const cost = itemCostMap.get(itm.itemId) ?? Math.round(itm.standardPrice * 0.75);
                  return sum + cost * itm.quantity;
                }, 0);
                const coopProfit = viewModalPO.totalClientBudget - totalSupCost;
                const profitMarginPct =
                  viewModalPO.totalClientBudget > 0
                    ? ((coopProfit / viewModalPO.totalClientBudget) * 100).toFixed(1)
                    : '0';

                return (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Total Budget Klien
                      </span>
                      <span className="font-black text-blue-700 text-sm mt-0.5 block">
                        {formatRupiah(viewModalPO.totalClientBudget)}
                      </span>
                    </div>

                    {currentUser.role === 'admin' && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Total Modal Supplier
                        </span>
                        <span className="font-black text-slate-700 text-sm mt-0.5 block">
                          {formatRupiah(totalSupCost)}
                        </span>
                      </div>
                    )}

                    {currentUser.role === 'admin' && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Profit Koperasi
                        </span>
                        <span
                          className={`font-black text-sm mt-0.5 block ${
                            coopProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {formatRupiah(coopProfit)} ({profitMarginPct}%)
                        </span>
                      </div>
                    )}

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Status Pembayaran
                      </span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                        {viewModalPO.paymentStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Timeline Steps */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Riwayat & Lacak Status Purchase Order
                </span>
                <div className="space-y-2">
                  {viewModalPO.timeline.map((st, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                        st.status === 'completed'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : st.status === 'current'
                          ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {st.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : st.status === 'current' ? (
                          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold">{st.title}</p>
                          {st.description && <p className="text-[10px]">{st.description}</p>}
                        </div>
                      </div>
                      {st.timestamp && (
                        <span className="text-[10px] font-mono text-slate-500">{st.timestamp}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print PO</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewModalPO;
                        setViewModalPO(null);
                        handleOpenEditModal(target);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit PO Ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = viewModalPO;
                        setViewModalPO(null);
                        setDeleteModalPO(target);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus PO</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setViewModalPO(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT PURCHASE ORDER MODAL (ADMIN) */}
      {/* ========================================================================= */}
      {editModalPO && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 text-white rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Edit Purchase Order: <span className="font-mono">{editModalPO.poNumber}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbarui data klien, jadwal, rincian barang, status penawaran, dan catatan.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditModalPO(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              {/* Client Contacts */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Klien / Perusahaan *
                  </label>
                  <input
                    type="text"
                    value={editForm.clientName}
                    onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Klien *
                  </label>
                  <input
                    type="email"
                    value={editForm.clientEmail}
                    onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon *
                  </label>
                  <input
                    type="text"
                    value={editForm.clientPhone}
                    onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Dates & Address */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jadwal Diperlukan (Target Pengiriman) *
                  </label>
                  <input
                    type="date"
                    value={editForm.requiredDate}
                    onChange={(e) => setEditForm({ ...editForm, requiredDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Penawaran / PO *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value as POStatus })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="DIAJUKAN">DIAJUKAN (Menunggu Review)</option>
                    <option value="MENUNGGU_REVIEW">MENUNGGU_REVIEW</option>
                    <option value="NEGOSIASI_HARGA">NEGOSIASI_HARGA</option>
                    <option value="DISETUJUI">DISETUJUI (Penawaran Budget Diterima)</option>
                    <option value="PESANAN_RESMI">PESANAN_RESMI (SPK Terbit)</option>
                    <option value="DIPROSES">DIPROSES (Gudang)</option>
                    <option value="DIKIRIM">DIKIRIM (Armada)</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="DITOLAK">DITOLAK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Pengiriman Tujuan
                </label>
                <input
                  type="text"
                  value={editForm.deliveryAddress}
                  onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Items Management in PO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Daftar Komoditas & Budget Ditawar</span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstAvail =
                        inventory.find((inv) => !editForm.items.some((it) => it.itemId === inv.id)) ||
                        inventory[0];
                      if (firstAvail) {
                        setEditForm({
                          ...editForm,
                          items: [
                            ...editForm.items,
                            {
                              itemId: firstAvail.id,
                              itemName: firstAvail.name,
                              sku: firstAvail.sku,
                              quantity: 10,
                              unit: firstAvail.unit,
                              standardPrice: firstAvail.standardPrice,
                              targetPrice: Math.round(firstAvail.standardPrice * 0.95),
                              approvedPrice: Math.round(firstAvail.standardPrice * 0.95),
                            },
                          ],
                        });
                      }
                    }}
                    className="text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Barang
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editForm.items.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-slate-500">Pilih Barang</label>
                        <select
                          value={row.itemId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            const target = inventory.find((i) => i.id === newId);
                            const updated = [...editForm.items];
                            updated[idx] = {
                              ...updated[idx],
                              itemId: newId,
                              itemName: target ? target.name : updated[idx].itemName,
                              sku: target ? target.sku : updated[idx].sku,
                              unit: target ? target.unit : updated[idx].unit,
                              standardPrice: target ? target.standardPrice : updated[idx].standardPrice,
                              targetPrice: target
                                ? Math.round(target.standardPrice * 0.95)
                                : updated[idx].targetPrice,
                            };
                            setEditForm({ ...editForm, items: updated });
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                        >
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} (Stok: {inv.currentStock} {inv.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-500">Kuantitas</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const updated = [...editForm.items];
                              updated[idx].quantity = Math.max(1, Number(e.target.value));
                              setEditForm({ ...editForm, items: updated });
                            }}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white font-bold text-xs"
                            required
                          />
                          <span className="text-[10px] text-slate-500">{row.unit}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-500">Budget / Unit (Rp)</label>
                        <input
                          type="number"
                          value={row.targetPrice}
                          onChange={(e) => {
                            const updated = [...editForm.items];
                            updated[idx].targetPrice = Math.max(0, Number(e.target.value));
                            setEditForm({ ...editForm, items: updated });
                          }}
                          className="w-full p-1.5 border border-blue-300 rounded bg-blue-50/50 font-bold text-blue-900 text-xs"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        {editForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditForm({
                                ...editForm,
                                items: editForm.items.filter((_, i) => i !== idx),
                              });
                            }}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Hapus barang ini"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Live Preview */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                <span className="font-bold text-blue-900">Total Budget Terhitung:</span>
                <span className="font-black text-blue-900 text-sm">
                  {formatRupiah(
                    editForm.items.reduce(
                      (sum, it) => sum + (it.targetPrice || it.standardPrice) * it.quantity,
                      0
                    )
                  )}
                </span>
              </div>

              {/* Notes */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Klien
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.clientNotes}
                    onChange={(e) => setEditForm({ ...editForm, clientNotes: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Pengurus Koperasi
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.cooperativeNotes}
                    onChange={(e) => setEditForm({ ...editForm, cooperativeNotes: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalPO(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION MODAL (ADMIN) */}
      {/* ========================================================================= */}
      {deleteModalPO && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Purchase Order</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Apakah Anda yakin ingin menghapus Purchase Order berikut dari sistem Koperasi?
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-black text-slate-900 font-mono text-sm">
                  {deleteModalPO.poNumber}
                </p>
                <p className="text-slate-700">
                  Klien: <strong>{deleteModalPO.clientName}</strong>
                </p>
                <p className="text-slate-700">
                  Total Budget: <strong>{formatRupiah(deleteModalPO.totalClientBudget)}</strong>
                </p>
                <p className="text-slate-700">
                  Status: <span className="font-bold uppercase">{deleteModalPO.status}</span>
                </p>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Penghapusan PO ini juga akan membersihkan faktur tagihan terkait jika belum dibayarkan.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeleteModalPO(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus PO Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Action Dialog: Approve, Reject, or Convert */}
      {/* ========================================================================= */}
      {actionTargetPO && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {actionType === 'APPROVE' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {actionType === 'REJECT' && <XCircle className="w-5 h-5 text-red-600" />}
                {actionType === 'CONVERT' && <Award className="w-5 h-5 text-blue-600" />}
                <h3 className="font-bold text-sm text-slate-900">
                  {actionType === 'APPROVE' && 'Setujui Penawaran Budget PO'}
                  {actionType === 'REJECT' && 'Tolak Penawaran Budget PO'}
                  {actionType === 'CONVERT' && 'Konversi Menjadi Pesanan Resmi'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActionTargetPO(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">
                  {actionTargetPO.poNumber} — {actionTargetPO.clientName}
                </p>
                <p className="text-slate-500 mt-1">
                  Total Budget yang Diajukan:{' '}
                  <span className="font-black text-slate-900">
                    {formatRupiah(actionTargetPO.totalClientBudget)}
                  </span>
                </p>
              </div>

              {actionType === 'APPROVE' && (
                <p className="text-emerald-700">
                  Dengan menyetujui penawaran ini, status PO akan berubah menjadi{' '}
                  <strong>DISETUJUI</strong> dan siap untuk dikonversi menjadi Pesanan Resmi (SPK).
                </p>
              )}

              {actionType === 'REJECT' && (
                <p className="text-red-700">
                  Tuliskan alasan penolakan penawaran di bawah ini agar klien dapat memahami kendala dan mengajukan penyesuaian budget.
                </p>
              )}

              {actionType === 'CONVERT' && (
                <p className="text-blue-700">
                  Sistem akan menerbitkan nomor <strong>Surat Perintah Kerja (SPK)</strong> resmi koperasi, mengonfirmasi faktur tagihan, dan memasukkan pesanan ke antrean penyiapan gudang dan pengiriman armada.
                </p>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {actionType === 'REJECT'
                    ? 'Alasan Penolakan (Wajib Diisi) *'
                    : 'Catatan Koperasi (Opsional)'}
                </label>
                <textarea
                  rows={3}
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  required={actionType === 'REJECT'}
                  placeholder={
                    actionType === 'REJECT'
                      ? 'Tuliskan alasan penolakan harga...'
                      : 'Catatan pengurus koperasi...'
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActionTargetPO(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : actionType === 'REJECT'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {actionType === 'APPROVE' && 'Ya, Setujui Penawaran'}
                  {actionType === 'REJECT' && 'Ya, Tolak Penawaran'}
                  {actionType === 'CONVERT' && 'Konversi & Terbitkan SPK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Admin New PO Modal */}
      {/* ========================================================================= */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Buat Purchase Order Baru atas Nama Klien
                </h3>
              </div>
              <button
                onClick={() => setIsNewPOModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminPO} className="mt-4 space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Klien Pemesan *
                  </label>
                  <select
                    value={newPOClientId}
                    onChange={(e) => {
                      setNewPOClientId(e.target.value);
                      const target = users.find((u) => u.id === e.target.value);
                      if (target?.address) setNewPODeliveryAddress(target.address);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {users
                      .filter((u) => u.role === 'client')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.companyName || u.name} ({u.phone})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jadwal Diperlukan *
                  </label>
                  <input
                    type="date"
                    value={newPORangeDate}
                    onChange={(e) => setNewPORangeDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Pengiriman Tujuan *
                </label>
                <input
                  type="text"
                  value={newPODeliveryAddress}
                  onChange={(e) => setNewPODeliveryAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Daftar Barang & Budget Ditawar</span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstUnsel =
                        inventory.find((inv) => !newPOItems.some((sel) => sel.itemId === inv.id)) ||
                        inventory[0];
                      if (firstUnsel) {
                        setNewPOItems([
                          ...newPOItems,
                          {
                            itemId: firstUnsel.id,
                            quantity: 10,
                            targetPrice: Math.round(firstUnsel.standardPrice * 0.95),
                          },
                        ]);
                      }
                    }}
                    className="text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Barang
                  </button>
                </div>

                {newPOItems.map((row, idx) => {
                  const itmData = inventory.find((i) => i.id === row.itemId);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-slate-500">Pilih Barang</label>
                        <select
                          value={row.itemId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            const target = inventory.find((i) => i.id === newId);
                            const updated = [...newPOItems];
                            updated[idx] = {
                              ...updated[idx],
                              itemId: newId,
                              targetPrice: target
                                ? Math.round(target.standardPrice * 0.95)
                                : 100000,
                            };
                            setNewPOItems(updated);
                          }}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                        >
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} (Stok: {inv.currentStock} {inv.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-500">Kuantitas</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const updated = [...newPOItems];
                              updated[idx].quantity = Number(e.target.value);
                              setNewPOItems(updated);
                            }}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white font-bold text-xs"
                            required
                          />
                          <span className="text-[10px] text-slate-500">{itmData?.unit}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-500">Budget / Unit (Rp)</label>
                        <input
                          type="number"
                          value={row.targetPrice}
                          onChange={(e) => {
                            const updated = [...newPOItems];
                            updated[idx].targetPrice = Number(e.target.value);
                            setNewPOItems(updated);
                          }}
                          className="w-full p-1.5 border border-blue-300 rounded bg-blue-50/50 font-bold text-blue-900 text-xs"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        {newPOItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewPOItems(newPOItems.filter((_, i) => i !== idx))}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Klien / Kebutuhan
                </label>
                <textarea
                  rows={2}
                  value={newPONotes}
                  onChange={(e) => setNewPONotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPOModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Daftarkan PO Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
