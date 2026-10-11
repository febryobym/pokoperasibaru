import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Calendar,
  MapPin,
  Package,
  Send,
  Boxes,
  Layers,
  Building,
  Trash2,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { POItem, POStatus, PurchaseOrder, InventoryItem } from '../types';

interface ClientPortalViewProps {
  initialSubTab?: 'create-po' | 'track' | 'invoices';
}

interface ClientItemRow {
  rowId: string;
  itemId: string;
  itemName: string;
  sku: string;
  category: 'Bahan Baku' | 'Bahan Operasional';
  supplierName: string;
  unit: string;
  currentStock: number;
  standardPrice: number;
  quantity: number | '';
  targetPrice: number | '';
  notes?: string;
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

  // Separate row states for two stacked tables:
  // 1. Bahan Baku (Atas)
  // 2. Bahan Operasional (Bawah)
  const [rawMaterialRows, setRawMaterialRows] = useState<ClientItemRow[]>([]);
  const [operationalRows, setOperationalRows] = useState<ClientItemRow[]>([]);

  // Automatically populate products into the two tables from inventory
  useEffect(() => {
    const rawItems = inventory.filter((i) => i.category === 'Bahan Baku');
    const opsItems = inventory.filter((i) => i.category === 'Bahan Operasional');

    // Populate Bahan Baku if rows are empty
    setRawMaterialRows((prev) => {
      if (prev.length > 0) return prev;
      return rawItems.map((inv) => ({
        rowId: `raw-${inv.id}`,
        itemId: inv.id,
        itemName: inv.name,
        sku: inv.sku,
        category: 'Bahan Baku',
        supplierName: inv.supplierName || 'Supplier Mitra Koperasi',
        unit: inv.unit,
        currentStock: inv.currentStock,
        standardPrice: inv.standardPrice,
        quantity: '',
        targetPrice: inv.standardPrice || inv.costPrice || '',
        notes: '',
      }));
    });

    // Populate Bahan Operasional if rows are empty
    setOperationalRows((prev) => {
      if (prev.length > 0) return prev;
      return opsItems.map((inv) => ({
        rowId: `ops-${inv.id}`,
        itemId: inv.id,
        itemName: inv.name,
        sku: inv.sku,
        category: 'Bahan Operasional',
        supplierName: inv.supplierName || 'Supplier Mitra Koperasi',
        unit: inv.unit,
        currentStock: inv.currentStock,
        standardPrice: inv.standardPrice,
        quantity: '',
        targetPrice: inv.standardPrice || inv.costPrice || '',
        notes: '',
      }));
    });
  }, [inventory]);

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

  // Add row functions
  const handleAddRawRow = () => {
    const rawInventory = inventory.filter((i) => i.category === 'Bahan Baku');
    const unselected =
      rawInventory.find((inv) => !rawMaterialRows.some((r) => r.itemId === inv.id)) ||
      rawInventory[0];

    if (!unselected) {
      alert('Belum ada produk Bahan Baku lain di inventaris Koperasi.');
      return;
    }

    setRawMaterialRows((prev) => [
      ...prev,
      {
        rowId: `raw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: unselected.id,
        itemName: unselected.name,
        sku: unselected.sku,
        category: 'Bahan Baku',
        supplierName: unselected.supplierName || 'Supplier Mitra Koperasi',
        unit: unselected.unit,
        currentStock: unselected.currentStock,
        standardPrice: unselected.standardPrice,
        quantity: '',
        targetPrice: unselected.standardPrice || unselected.costPrice || '',
        notes: '',
      },
    ]);
  };

  const handleAddOperationalRow = () => {
    const opsInventory = inventory.filter((i) => i.category === 'Bahan Operasional');
    const unselected =
      opsInventory.find((inv) => !operationalRows.some((r) => r.itemId === inv.id)) ||
      opsInventory[0];

    if (!unselected) {
      alert('Belum ada produk Bahan Operasional lain di inventaris Koperasi.');
      return;
    }

    setOperationalRows((prev) => [
      ...prev,
      {
        rowId: `ops-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: unselected.id,
        itemName: unselected.name,
        sku: unselected.sku,
        category: 'Bahan Operasional',
        supplierName: unselected.supplierName || 'Supplier Mitra Koperasi',
        unit: unselected.unit,
        currentStock: unselected.currentStock,
        standardPrice: unselected.standardPrice,
        quantity: '',
        targetPrice: unselected.standardPrice || unselected.costPrice || '',
        notes: '',
      },
    ]);
  };

  // Change product in row: automatically sets supplier name!
  const handleItemSelect = (
    tableType: 'Bahan Baku' | 'Bahan Operasional',
    rowId: string,
    newItemId: string
  ) => {
    const selectedInv = inventory.find((i) => i.id === newItemId);
    if (!selectedInv) return;

    const updateFn = (rows: ClientItemRow[]): ClientItemRow[] =>
      rows.map((row) => {
        if (row.rowId !== rowId) return row;
        const newTargetPrice: number | '' =
          row.targetPrice !== ''
            ? row.targetPrice
            : selectedInv.standardPrice || selectedInv.costPrice || '';
        return {
          ...row,
          itemId: selectedInv.id,
          itemName: selectedInv.name,
          sku: selectedInv.sku,
          category: selectedInv.category,
          supplierName: selectedInv.supplierName || 'Supplier Mitra Koperasi', // Otomatis Muncul!
          unit: selectedInv.unit,
          currentStock: selectedInv.currentStock,
          standardPrice: selectedInv.standardPrice,
          targetPrice: newTargetPrice,
        };
      });

    if (tableType === 'Bahan Baku') {
      setRawMaterialRows(updateFn);
    } else {
      setOperationalRows(updateFn);
    }
  };

  const handleQuantityChange = (
    tableType: 'Bahan Baku' | 'Bahan Operasional',
    rowId: string,
    val: string
  ) => {
    const qty: number | '' = val === '' ? '' : Math.max(0, Number(val));
    const updateFn = (rows: ClientItemRow[]): ClientItemRow[] =>
      rows.map((row) => (row.rowId === rowId ? { ...row, quantity: qty } : row));

    if (tableType === 'Bahan Baku') {
      setRawMaterialRows(updateFn);
    } else {
      setOperationalRows(updateFn);
    }
  };

  const handlePriceChange = (
    tableType: 'Bahan Baku' | 'Bahan Operasional',
    rowId: string,
    val: string
  ) => {
    const price: number | '' = val === '' ? '' : Math.max(0, Number(val));
    const updateFn = (rows: ClientItemRow[]): ClientItemRow[] =>
      rows.map((row) => (row.rowId === rowId ? { ...row, targetPrice: price } : row));

    if (tableType === 'Bahan Baku') {
      setRawMaterialRows(updateFn);
    } else {
      setOperationalRows(updateFn);
    }
  };

  const handleNotesChange = (
    tableType: 'Bahan Baku' | 'Bahan Operasional',
    rowId: string,
    val: string
  ) => {
    const updateFn = (rows: ClientItemRow[]): ClientItemRow[] =>
      rows.map((row) => (row.rowId === rowId ? { ...row, notes: val } : row));

    if (tableType === 'Bahan Baku') {
      setRawMaterialRows(updateFn);
    } else {
      setOperationalRows(updateFn);
    }
  };

  const handleRemoveRow = (tableType: 'Bahan Baku' | 'Bahan Operasional', rowId: string) => {
    if (tableType === 'Bahan Baku') {
      setRawMaterialRows((prev) => prev.filter((r) => r.rowId !== rowId));
    } else {
      setOperationalRows((prev) => prev.filter((r) => r.rowId !== rowId));
    }
  };

  // Active items calculations
  const activeRawItems = rawMaterialRows.filter(
    (r) => typeof r.quantity === 'number' && r.quantity > 0
  );
  const activeOpsItems = operationalRows.filter(
    (r) => typeof r.quantity === 'number' && r.quantity > 0
  );

  const rawSubtotalBudget = activeRawItems.reduce((acc, r) => {
    return acc + Number(r.quantity) * Number(r.targetPrice || 0);
  }, 0);

  const opsSubtotalBudget = activeOpsItems.reduce((acc, r) => {
    return acc + Number(r.quantity) * Number(r.targetPrice || 0);
  }, 0);

  const calculatedTotalBudget = rawSubtotalBudget + opsSubtotalBudget;
  const totalActiveItemsCount = activeRawItems.length + activeOpsItems.length;

  // Handle Submit PO
  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();

    const allActive = [...activeRawItems, ...activeOpsItems];
    if (allActive.length === 0) {
      alert(
        'Silakan masukkan kuantitas (Quantity > 0) dan harga dari klien untuk minimal satu produk di tabel Bahan Baku atau Bahan Operasional.'
      );
      return;
    }

    const missingPrice = allActive.find(
      (r) => r.targetPrice === '' || Number(r.targetPrice) <= 0
    );
    if (missingPrice) {
      alert(
        `Mohon lengkapi harga dari klien yang valid untuk barang "${missingPrice.itemName}".`
      );
      return;
    }

    const poItems: POItem[] = allActive.map((row) => ({
      itemId: row.itemId,
      itemName: row.itemName,
      sku: row.sku,
      quantity: Number(row.quantity),
      unit: row.unit,
      standardPrice: row.standardPrice,
      targetPrice: Number(row.targetPrice),
      approvedPrice: Number(row.targetPrice), // pending cooperative review
      category: row.category,
      supplierName: row.supplierName,
      notes: row.notes || undefined,
    }));

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
    const newRaw: ClientItemRow[] = [];
    const newOps: ClientItemRow[] = [];

    po.items.forEach((it, idx) => {
      const inv = inventory.find((i) => i.id === it.itemId);
      const category = it.category || inv?.category || 'Bahan Baku';
      const row: ClientItemRow = {
        rowId: `reorder-${idx}-${Date.now()}`,
        itemId: it.itemId,
        itemName: it.itemName,
        sku: it.sku,
        category,
        supplierName: it.supplierName || inv?.supplierName || 'Supplier Mitra Koperasi',
        unit: it.unit,
        currentStock: inv?.currentStock || 0,
        standardPrice: it.standardPrice,
        quantity: it.quantity,
        targetPrice: it.targetPrice,
        notes: it.notes || `Penyesuaian ulang PO ${po.poNumber}`,
      };
      if (category === 'Bahan Baku') {
        newRaw.push(row);
      } else {
        newOps.push(row);
      }
    });

    if (newRaw.length > 0) setRawMaterialRows(newRaw);
    if (newOps.length > 0) setOperationalRows(newOps);
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

  const rawInventoryList = inventory.filter((i) => i.category === 'Bahan Baku');
  const opsInventoryList = inventory.filter((i) => i.category === 'Bahan Operasional');

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
                Status saat ini: <strong className="text-white">DIAJUKAN (Menunggu Review Koperasi)</strong>. Pengajuan Anda telah terdaftar dalam sistem.
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
            Sistem pengajuan Purchase Order (PO) dengan pembagian dua tabel terpisah: <strong>Bahan Baku</strong> & <strong>Bahan Operasional</strong> (kategori ditetapkan oleh Admin Koperasi). Masukkan nama produk, nama supplier akan muncul otomatis, lalu isi kuantitas dan harga penawaran Anda.
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
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Formulir Pembuatan PO Baru
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Produk otomatis tampil pada 2 tabel atas bawah (Bahan Baku & Bahan Operasional). Nama supplier muncul otomatis setelah memilih produk, Anda cukup mengisi kuantitas dan harga dari klien.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Kategori Hanya Ditentukan Oleh Admin</span>
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitPO} className="space-y-8 text-xs">
            {/* ========================================================================= */}
            {/* TABEL 1 (ATAS): BAHAN BAKU */}
            {/* ========================================================================= */}
            <div className="border border-amber-200/80 rounded-2xl overflow-hidden shadow-xs bg-amber-50/20">
              {/* Table Header / Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900">
                        1. Tabel Pemesanan Bahan Baku
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                        Ditetapkan Admin: Bahan Baku
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Daftar komoditas bahan baku produksi. Supplier pemasok otomatis terdeteksi dari database master inventaris.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddRawRow}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Bahan Baku</span>
                </button>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-100/60 text-slate-700 uppercase text-[10px] font-bold border-b border-amber-200">
                    <tr>
                      <th className="p-3 w-10 text-center">Status</th>
                      <th className="p-3 min-w-[200px]">Nama Produk (Bahan Baku) *</th>
                      <th className="p-3 min-w-[170px]">
                        <span className="flex items-center gap-1 text-slate-800 font-extrabold">
                          <Building className="w-3.5 h-3.5 text-amber-700" />
                          Supplier Pemasok (Otomatis)
                        </span>
                      </th>
                      <th className="p-3 w-28">Satuan & Stok</th>
                      <th className="p-3 w-32 bg-amber-100/80">Kuantitas (Qty) *</th>
                      <th className="p-3 w-40 bg-blue-100/60 text-blue-900">Harga dari Klien (Rp) *</th>
                      <th className="p-3 w-36 text-right font-extrabold">Subtotal Budget</th>
                      <th className="p-3 w-14 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/70 bg-white">
                    {rawMaterialRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto text-amber-300 mb-2" />
                          <p className="font-semibold text-slate-600">
                            Belum ada barang kategori Bahan Baku di katalog inventaris.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Role Admin yang berwenang mendaftarkan barang baru dengan kategori Bahan Baku.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      rawMaterialRows.map((row, idx) => {
                        const isOrdered = typeof row.quantity === 'number' && row.quantity > 0;
                        const lineSubtotal =
                          Number(row.quantity || 0) * Number(row.targetPrice || 0);

                        return (
                          <tr
                            key={row.rowId}
                            className={`transition hover:bg-amber-50/40 ${
                              isOrdered ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            {/* Status Indicator */}
                            <td className="p-3 text-center">
                              {isOrdered ? (
                                <span
                                  className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] mx-auto font-bold shadow-xs"
                                  title="Termasuk dalam pemesanan PO"
                                >
                                  ✓
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {idx + 1}
                                </span>
                              )}
                            </td>

                            {/* Product Name Selector */}
                            <td className="p-3">
                              {rawInventoryList.length > 0 ? (
                                <div>
                                  <select
                                    value={row.itemId}
                                    onChange={(e) =>
                                      handleItemSelect('Bahan Baku', row.rowId, e.target.value)
                                    }
                                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    required
                                  >
                                    {rawInventoryList.map((inv) => (
                                      <option key={inv.id} value={inv.id}>
                                        {inv.name} ({inv.sku})
                                      </option>
                                    ))}
                                  </select>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    SKU: <span className="font-mono">{row.sku}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="font-bold text-slate-800">{row.itemName}</span>
                              )}
                            </td>

                            {/* Supplier Name (Otomatis Muncul) */}
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs">
                                <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate" title={row.supplierName}>
                                  {row.supplierName || 'Supplier Mitra Koperasi'}
                                </span>
                              </div>
                            </td>

                            {/* Unit & Current Stock */}
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{row.unit}</span>
                              <span className="text-[10px] text-slate-400 block">
                                Stok: {row.currentStock} {row.unit}
                              </span>
                            </td>

                            {/* Quantity Input */}
                            <td className="p-3 bg-amber-50/50">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={row.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange('Bahan Baku', row.rowId, e.target.value)
                                  }
                                  className="w-full p-2 border border-amber-300 rounded-lg bg-white font-black text-amber-950 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                                  {row.unit}
                                </span>
                              </div>
                            </td>

                            {/* Price from Client Input */}
                            <td className="p-3 bg-blue-50/40">
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-[10px] font-bold text-blue-700">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={row.targetPrice}
                                  onChange={(e) =>
                                    handlePriceChange('Bahan Baku', row.rowId, e.target.value)
                                  }
                                  className="w-full pl-8 pr-2 py-2 border border-blue-300 rounded-lg bg-white font-black text-blue-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>
                              {row.standardPrice > 0 && (
                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                  Katalog: {formatRupiah(row.standardPrice)}
                                </span>
                              )}
                            </td>

                            {/* Line Subtotal */}
                            <td className="p-3 text-right">
                              <p className="font-black text-slate-900 text-xs">
                                {formatRupiah(lineSubtotal)}
                              </p>
                              {isOrdered && (
                                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded">
                                  Aktif Dipesan
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow('Bahan Baku', row.rowId)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Hapus baris ini dari pengajuan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Table Footer */}
                  {rawMaterialRows.length > 0 && (
                    <tfoot className="bg-amber-100/40 border-t border-amber-200 font-bold text-xs">
                      <tr>
                        <td colSpan={4} className="p-3 text-slate-600">
                          Total Baris Bahan Baku: {rawMaterialRows.length} item • Dipesan:{' '}
                          <span className="text-amber-900 font-black">
                            {activeRawItems.length} item
                          </span>
                        </td>
                        <td colSpan={2} className="p-3 text-right text-slate-700 font-bold">
                          Subtotal Anggaran Bahan Baku:
                        </td>
                        <td className="p-3 text-right font-black text-amber-900 text-sm">
                          {formatRupiah(rawSubtotalBudget)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TABEL 2 (BAWAH): BAHAN OPERASIONAL */}
            {/* ========================================================================= */}
            <div className="border border-indigo-200/80 rounded-2xl overflow-hidden shadow-xs bg-indigo-50/20">
              {/* Table Header / Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900">
                        2. Tabel Pemesanan Bahan Operasional
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300 uppercase">
                        Ditetapkan Admin: Bahan Operasional
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Daftar perlengkapan dan bahan operasional usaha. Supplier pemasok otomatis terdeteksi dari database master inventaris.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddOperationalRow}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Bahan Operasional</span>
                </button>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-100/60 text-slate-700 uppercase text-[10px] font-bold border-b border-indigo-200">
                    <tr>
                      <th className="p-3 w-10 text-center">Status</th>
                      <th className="p-3 min-w-[200px]">Nama Produk (Bahan Operasional) *</th>
                      <th className="p-3 min-w-[170px]">
                        <span className="flex items-center gap-1 text-slate-800 font-extrabold">
                          <Building className="w-3.5 h-3.5 text-indigo-700" />
                          Supplier Pemasok (Otomatis)
                        </span>
                      </th>
                      <th className="p-3 w-28">Satuan & Stok</th>
                      <th className="p-3 w-32 bg-indigo-100/80">Kuantitas (Qty) *</th>
                      <th className="p-3 w-40 bg-blue-100/60 text-blue-900">Harga dari Klien (Rp) *</th>
                      <th className="p-3 w-36 text-right font-extrabold">Subtotal Budget</th>
                      <th className="p-3 w-14 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-100/70 bg-white">
                    {operationalRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          <Boxes className="w-8 h-8 mx-auto text-indigo-300 mb-2" />
                          <p className="font-semibold text-slate-600">
                            Belum ada barang kategori Bahan Operasional di katalog inventaris.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Role Admin yang berwenang mendaftarkan barang baru dengan kategori Bahan Operasional.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      operationalRows.map((row, idx) => {
                        const isOrdered = typeof row.quantity === 'number' && row.quantity > 0;
                        const lineSubtotal =
                          Number(row.quantity || 0) * Number(row.targetPrice || 0);

                        return (
                          <tr
                            key={row.rowId}
                            className={`transition hover:bg-indigo-50/40 ${
                              isOrdered ? 'bg-indigo-50/30' : ''
                            }`}
                          >
                            {/* Status Indicator */}
                            <td className="p-3 text-center">
                              {isOrdered ? (
                                <span
                                  className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] mx-auto font-bold shadow-xs"
                                  title="Termasuk dalam pemesanan PO"
                                >
                                  ✓
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {idx + 1}
                                </span>
                              )}
                            </td>

                            {/* Product Name Selector */}
                            <td className="p-3">
                              {opsInventoryList.length > 0 ? (
                                <div>
                                  <select
                                    value={row.itemId}
                                    onChange={(e) =>
                                      handleItemSelect('Bahan Operasional', row.rowId, e.target.value)
                                    }
                                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    required
                                  >
                                    {opsInventoryList.map((inv) => (
                                      <option key={inv.id} value={inv.id}>
                                        {inv.name} ({inv.sku})
                                      </option>
                                    ))}
                                  </select>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    SKU: <span className="font-mono">{row.sku}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="font-bold text-slate-800">{row.itemName}</span>
                              )}
                            </td>

                            {/* Supplier Name (Otomatis Muncul) */}
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs">
                                <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate" title={row.supplierName}>
                                  {row.supplierName || 'Supplier Mitra Koperasi'}
                                </span>
                              </div>
                            </td>

                            {/* Unit & Current Stock */}
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{row.unit}</span>
                              <span className="text-[10px] text-slate-400 block">
                                Stok: {row.currentStock} {row.unit}
                              </span>
                            </td>

                            {/* Quantity Input */}
                            <td className="p-3 bg-indigo-50/50">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={row.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange('Bahan Operasional', row.rowId, e.target.value)
                                  }
                                  className="w-full p-2 border border-indigo-300 rounded-lg bg-white font-black text-indigo-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                                  {row.unit}
                                </span>
                              </div>
                            </td>

                            {/* Price from Client Input */}
                            <td className="p-3 bg-blue-50/40">
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-[10px] font-bold text-blue-700">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={row.targetPrice}
                                  onChange={(e) =>
                                    handlePriceChange('Bahan Operasional', row.rowId, e.target.value)
                                  }
                                  className="w-full pl-8 pr-2 py-2 border border-blue-300 rounded-lg bg-white font-black text-blue-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>
                              {row.standardPrice > 0 && (
                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                  Katalog: {formatRupiah(row.standardPrice)}
                                </span>
                              )}
                            </td>

                            {/* Line Subtotal */}
                            <td className="p-3 text-right">
                              <p className="font-black text-slate-900 text-xs">
                                {formatRupiah(lineSubtotal)}
                              </p>
                              {isOrdered && (
                                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded">
                                  Aktif Dipesan
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow('Bahan Operasional', row.rowId)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Hapus baris ini dari pengajuan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Table Footer */}
                  {operationalRows.length > 0 && (
                    <tfoot className="bg-indigo-100/40 border-t border-indigo-200 font-bold text-xs">
                      <tr>
                        <td colSpan={4} className="p-3 text-slate-600">
                          Total Baris Bahan Operasional: {operationalRows.length} item • Dipesan:{' '}
                          <span className="text-indigo-900 font-black">
                            {activeOpsItems.length} item
                          </span>
                        </td>
                        <td colSpan={2} className="p-3 text-right text-slate-700 font-bold">
                          Subtotal Anggaran Bahan Operasional:
                        </td>
                        <td className="p-3 text-right font-black text-indigo-900 text-sm">
                          {formatRupiah(opsSubtotalBudget)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Total Budget Summary Card Combining Both Tables */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-md">
                    Total Anggaran Penawaran PO Klien
                  </span>
                  <span className="text-xs text-slate-300">
                    ({totalActiveItemsCount} Macam Barang Siap Dipesan)
                  </span>
                </div>
                <p className="text-3xl font-black text-white tracking-tight">
                  {formatRupiah(calculatedTotalBudget)}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>Bahan Baku: <strong>{formatRupiah(rawSubtotalBudget)}</strong> ({activeRawItems.length} item)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    <span>Bahan Operasional: <strong>{formatRupiah(opsSubtotalBudget)}</strong> ({activeOpsItems.length} item)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 text-xs text-slate-200 min-w-[240px]">
                <div className="flex items-center gap-2 font-bold text-white mb-1">
                  <Info className="w-4 h-4 text-amber-300" />
                  <span>Informasi Persetujuan</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Status awal: <strong className="text-amber-300">DIAJUKAN</strong>. Pengurus Koperasi akan meninjau penawaran harga dan menerbitkan SPK resmi setelah disetujui.
                </p>
              </div>
            </div>

            {/* Delivery address & target date */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Tanggal Pengiriman Diperlukan *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    value={neededDate}
                    onChange={(e) => setNeededDate(e.target.value)}
                    className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg font-medium bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Pengiriman / Gudang Penerima *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg font-medium bg-white"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Catatan Khusus Klien / Rincian Tambahan Penawaran
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Contoh: Pengiriman jam kerja, sertakan sertifikat analisa barang, atau penawaran harga kemitraan..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pengajuan Purchase Order (PO) ke Koperasi Garuda Merah Putih</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Track Orders */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          {/* Tracking filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            {[
              { id: 'SEMUA', label: 'Semua Status' },
              { id: 'DIAJUKAN', label: 'Dalam Review' },
              { id: 'DISETUJUI', label: 'Disetujui' },
              { id: 'PESANAN_RESMI', label: 'Pesanan Resmi (SPK)' },
              { id: 'DIKIRIM', label: 'Sedang Dikirim' },
              { id: 'SELESAI', label: 'Selesai' },
              { id: 'DITOLAK', label: 'Ditolak' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTrackFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  trackFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredMyPOs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">Tidak ada pengajuan PO ditemukan</p>
              <p className="text-xs mt-1">Coba pilih filter lain atau buat pengajuan PO baru.</p>
              <button
                onClick={() => setActiveTab('create-po')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Buat PO Baru
              </button>
            </div>
          ) : (
            filteredMyPOs.map((po) => {
              const badgeInfo = getStatusBadgeInfo(po.status, po.isOfficialOrder);

              return (
                <div
                  key={po.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:shadow-md"
                >
                  {/* Card top banner */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {po.poNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${badgeInfo.badgeClass}`}
                        >
                          {badgeInfo.label}
                        </span>
                        {po.isOfficialOrder && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                            SPK: {po.officialOrderNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Tgl PO: <span className="font-semibold text-slate-700">{po.orderDate}</span> • Jadwal Diperlukan:{' '}
                        <span className="font-semibold text-slate-700">{po.requiredDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => openPOModal(po)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Lacak Timeline</span>
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
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
                          {po.items
                            .map(
                              (i) =>
                                `${i.itemName} (${i.quantity} ${i.unit} @ ${formatRupiah(
                                  i.targetPrice
                                )}${i.supplierName ? ` • Supplier: ${i.supplierName}` : ''})`
                            )
                            .join(', ')}
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
