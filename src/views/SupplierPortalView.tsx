import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  Plus,
  DollarSign,
  Receipt,
  Calendar,
  Package,
  FileText,
  Search,
  Edit,
  Trash2,
  Send,
  Boxes,
  Layers,
  ShoppingCart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Check,
  ShieldCheck,
  Info,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { InventoryItem, PurchaseOrder, POItem } from '../types';

interface SupplierPortalViewProps {
  initialSubTab?: 'orders' | 'deliveries' | 'invoices' | 'products';
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  initialSubTab = 'orders',
}) => {
  const {
    currentUser,
    supplierInbounds,
    invoices,
    inventory,
    purchaseOrders,
    updatePurchaseOrder,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    createSupplierInbound,
    openInvoiceModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'deliveries' | 'invoices' | 'products'>(
    initialSubTab
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Modal Send Supply States
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [costPrice, setCostPrice] = useState(inventory[0]?.costPrice || 250000);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Pengiriman armada tronton langsung dari sentra produksi.');

  // Supplier Products Management States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Semua');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'Bahan Baku' as InventoryItem['category'],
    unit: 'Kg',
    costPrice: 50000,
    availableStock: 100,
    warehouseLocation: '',
    description: '',
  });

  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    category: 'Bahan Baku' as InventoryItem['category'],
    unit: '',
    costPrice: 0,
    availableStock: 0,
    warehouseLocation: '',
    description: '',
  });

  // =========================================================================
  // Incoming Client POs & HPP Input States
  // =========================================================================
  const [selectedPOForHPP, setSelectedPOForHPP] = useState<PurchaseOrder | null>(null);
  const [hppInputs, setHppInputs] = useState<{ [itemId: string]: number | '' }>({});
  const [supplierOrderNotes, setSupplierOrderNotes] = useState('');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'NEED_HPP' | 'ACCEPTED'>('ALL');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const supplierIdentifier = currentUser.companyName || currentUser.name;

  // Helper: check if a POItem is supplied by current supplier
  const isItemForCurrentSupplier = (item: POItem) => {
    const sName = item.supplierName?.toLowerCase().trim();
    const myComp = (currentUser.companyName || '').toLowerCase().trim();
    const myName = currentUser.name.toLowerCase().trim();

    if (sName && (sName === myComp || sName === myName)) {
      return true;
    }

    // Match by item in inventory
    const matchingInv = inventory.find((inv) => inv.id === item.itemId);
    if (matchingInv) {
      if (matchingInv.supplierId === currentUser.id) return true;
      const invSupp = matchingInv.supplierName?.toLowerCase().trim();
      if (invSupp && (invSupp === myComp || invSupp === myName)) return true;
    }

    return false;
  };

  // Filter POs containing items from this supplier
  const myIncomingPOs = purchaseOrders.filter((po) =>
    po.items.some(isItemForCurrentSupplier)
  );

  // Count orders that need HPP
  const pendingHPPOrdersCount = myIncomingPOs.filter((po) =>
    po.items.some(
      (it) =>
        isItemForCurrentSupplier(it) &&
        (!it.costPrice || it.costPrice === 0) &&
        (!it.supplierCostPrice || it.supplierCostPrice === 0)
    )
  ).length;

  // Filtered incoming POs for tab
  const filteredIncomingPOs = myIncomingPOs.filter((po) => {
    if (orderFilter === 'ALL') return true;
    const hasPendingHPP = po.items.some(
      (it) =>
        isItemForCurrentSupplier(it) &&
        (!it.costPrice || it.costPrice === 0) &&
        (!it.supplierCostPrice || it.supplierCostPrice === 0)
    );
    if (orderFilter === 'NEED_HPP') return hasPendingHPP;
    if (orderFilter === 'ACCEPTED') return !hasPendingHPP;
    return true;
  });

  // Open modal to accept order and input HPP
  const handleOpenHPPModal = (po: PurchaseOrder) => {
    setSelectedPOForHPP(po);
    const initialInputs: { [itemId: string]: number | '' } = {};
    po.items.filter(isItemForCurrentSupplier).forEach((it) => {
      const matchingInv = inventory.find((i) => i.id === it.itemId);
      const existingHpp =
        it.costPrice || it.supplierCostPrice || matchingInv?.costPrice || '';
      initialInputs[it.itemId] = existingHpp;
    });
    setHppInputs(initialInputs);
    setSupplierOrderNotes(
      po.supplierNotes ||
        'Pesanan telah kami terima. Kuantitas dan spesifikasi barang siap dipenuhi sesuai jadwal.'
    );
  };

  // Submit HPP and save to Admin's product database
  const handleSaveHPP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForHPP) return;

    const supplierItems = selectedPOForHPP.items.filter(isItemForCurrentSupplier);

    // Validate that HPP is filled for all items
    for (const it of supplierItems) {
      const entered = hppInputs[it.itemId];
      if (entered === '' || Number(entered) <= 0) {
        alert(`Mohon masukkan harga HPP yang valid untuk produk "${it.itemName}".`);
        return;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Update Database Produk di Role Admin (inventory)
    // "nomor ID produk yang sama dengan supplier, harga HPP dan semua informasi produk akan tersimpan di database produk role 'admin'"
    supplierItems.forEach((it) => {
      const enteredHPP = Number(hppInputs[it.itemId]);
      updateInventoryItem(it.itemId, {
        costPrice: enteredHPP, // HPP tersimpan di master database produk role Admin!
        supplierId: currentUser.id,
        supplierName: currentUser.companyName || currentUser.name,
      });
    });

    // 2. Update Purchase Order items & status
    const updatedItems = selectedPOForHPP.items.map((it) => {
      if (isItemForCurrentSupplier(it)) {
        const enteredHPP = Number(hppInputs[it.itemId]);
        return {
          ...it,
          costPrice: enteredHPP,
          supplierCostPrice: enteredHPP,
          supplierStatus: 'DITERIMA' as const,
        };
      }
      return it;
    });

    const updatedTimeline = [...selectedPOForHPP.timeline];
    const existingStepIdx = updatedTimeline.findIndex((s) => s.id === 'step-supplier-hpp');
    const stepData = {
      id: 'step-supplier-hpp',
      title: `Pesanan Diterima oleh Supplier (${currentUser.companyName || currentUser.name})`,
      description: `Supplier telah mengonfirmasi penerimaan pesanan dan menetapkan harga HPP resmi produk ke database.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed' as const,
    };

    if (existingStepIdx >= 0) {
      updatedTimeline[existingStepIdx] = stepData;
    } else {
      updatedTimeline.push(stepData);
    }

    updatePurchaseOrder(selectedPOForHPP.id, {
      items: updatedItems,
      timeline: updatedTimeline,
      supplierNotes: supplierOrderNotes,
      status: selectedPOForHPP.status === 'DIAJUKAN' ? 'DIPROSES' : selectedPOForHPP.status,
    });

    alert(
      `Pesanan ${selectedPOForHPP.poNumber} berhasil diterima!\n\nHarga HPP dan seluruh informasi produk telah berhasil tersimpan ke database produk role Admin dengan Nomor ID Produk yang sama.`
    );
    setSelectedPOForHPP(null);
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

  // Supplier's own products & items sold to Cooperative
  const myProducts = inventory.filter(
    (item) =>
      item.supplierId === currentUser.id ||
      item.supplierName === (currentUser.companyName || currentUser.name)
  );

  const filteredProducts = myProducts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCat =
      productCategoryFilter === 'Semua' || item.category === productCategoryFilter;
    return matchesSearch && matchesCat;
  });

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

  // Add Product to Database
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    const safePrefix = (currentUser.username || 'SUP').toUpperCase().slice(0, 4);
    const genSku =
      newProduct.sku.trim() ||
      `SUP-${safePrefix}-${Date.now().toString().slice(-4)}`;

    addInventoryItem({
      sku: genSku.toUpperCase(),
      name: newProduct.name.trim(),
      category: newProduct.category,
      unit: newProduct.unit.trim() || 'Kg',
      currentStock: Number(newProduct.availableStock || 0),
      minStock: 10,
      costPrice: Number(newProduct.costPrice || 0),
      standardPrice: Math.round(Number(newProduct.costPrice || 0) * 1.15),
      supplierId: currentUser.id,
      supplierName: currentUser.companyName || currentUser.name,
      warehouseLocation: newProduct.warehouseLocation.trim() || 'Gudang Mitra Supplier',
      description: newProduct.description.trim() || 'Barang pasokan resmi dari mitra supplier terdaftar.',
    });

    setShowAddProductModal(false);
    setNewProduct({
      sku: '',
      name: '',
      category: 'Bahan Baku',
      unit: 'Kg',
      costPrice: 50000,
      availableStock: 100,
      warehouseLocation: '',
      description: '',
    });
  };

  const handleStartEditProduct = (item: InventoryItem) => {
    setEditingProduct(item);
    setEditProductForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPrice,
      availableStock: item.currentStock,
      warehouseLocation: item.warehouseLocation,
      description: item.description,
    });
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateInventoryItem(editingProduct.id, {
      name: editProductForm.name.trim(),
      category: editProductForm.category,
      unit: editProductForm.unit.trim(),
      costPrice: Number(editProductForm.costPrice),
      currentStock: Number(editProductForm.availableStock),
      warehouseLocation: editProductForm.warehouseLocation.trim(),
      description: editProductForm.description.trim(),
    });

    setEditingProduct(null);
  };

  const handleDeleteProduct = (item: InventoryItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${item.name}" dari katalog Anda?`)) {
      deleteInventoryItem(item.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile for Supplier */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg shadow-emerald-950/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100">
                PORTAL PEMASOK / SUPPLIER TETAP
              </span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                Koperasi Garuda Merah Putih
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
              {currentUser.companyName || currentUser.name}
            </h1>
            <p className="text-xs text-emerald-100 mt-0.5">
              Mitra Pemasok Koperasi | Kontak: {currentUser.phone} • Email: {currentUser.email}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-emerald-400/40"
            >
              <Package className="w-4 h-4" />
              <span>+ Masukkan Produk Baru</span>
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Kirim Jadwal Pasokan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {/* TAB 1: Incoming Orders from Clients */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Pesanan Masuk dari Klien (PO)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {myIncomingPOs.length}
          </span>
          {pendingHPPOrdersCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold border border-amber-300 animate-pulse">
              {pendingHPPOrdersCount} Perlu HPP
            </span>
          )}
        </button>

        {/* TAB 2: Products Database */}
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Database Produk & Item Dijual ({myProducts.length})</span>
        </button>

        {/* TAB 3: Inbound Deliveries */}
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'deliveries'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pengiriman & Status Masuk Gudang ({myInbounds.length})</span>
        </button>

        {/* TAB 4: Invoices & Payments */}
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tagihan & Pencairan Pembayaran ({myInvoices.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB: INCOMING POs FROM CLIENTS (PESANAN MASUK DARI KLIEN) */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          {/* Information & Monitoring Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Monitoring & Konfirmasi Pesanan Masuk (PO Klien)
                </h4>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  Pesanan Purchase Order dari Klien yang ditujukan untuk produk Anda. Setelah menerima pesanan, masukkan <strong>Harga HPP (Modal)</strong> untuk masing-masing barang. Nomor ID produk yang sama dan seluruh informasi produk serta HPP akan otomatis tersimpan ke <strong>database produk role Admin</strong>.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setOrderFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  orderFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Semua ({myIncomingPOs.length})
              </button>
              <button
                onClick={() => setOrderFilter('NEED_HPP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  orderFilter === 'NEED_HPP'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Perlu HPP ({pendingHPPOrdersCount})
              </button>
              <button
                onClick={() => setOrderFilter('ACCEPTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  orderFilter === 'ACCEPTED'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                HPP Tersimpan ({myIncomingPOs.length - pendingHPPOrdersCount})
              </button>
            </div>
          </div>

          {filteredIncomingPOs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Pesanan Masuk dari Klien</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Saat klien membuat Purchase Order (PO) yang memuat produk pasokan Anda, pesanan tersebut akan langsung muncul di sini untuk dikonfirmasi dan dimasukkan harga HPP-nya.
              </p>
            </div>
          ) : (
            filteredIncomingPOs.map((po) => {
              const supplierItems = po.items.filter(isItemForCurrentSupplier);
              const hasUnsetHpp = supplierItems.some(
                (it) => (!it.costPrice || it.costPrice === 0) && (!it.supplierCostPrice || it.supplierCostPrice === 0)
              );

              return (
                <div
                  key={po.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:shadow-md space-y-4"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/70">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {po.poNumber}
                        </span>
                        {hasUnsetHpp ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Perlu Masukkan HPP</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Diterima • HPP Tersimpan di DB Admin</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                          Status PO: {po.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          Klien: {po.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Tgl PO: {po.orderDate}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Target Kirim: {po.requiredDate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenHPPModal(po)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs self-start sm:self-auto ${
                        hasUnsetHpp
                          ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>
                        {hasUnsetHpp ? 'Terima Pesanan & Masukkan HPP' : 'Perbarui Harga HPP'}
                      </span>
                    </button>
                  </div>

                  {/* Card Content: Items Table */}
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Rincian Produk Dipesan dari {currentUser.companyName || currentUser.name}:
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Alamat Pengiriman: <strong className="text-slate-800">{po.deliveryAddress}</strong>
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Nomor ID Produk (Sama dengan Admin)</th>
                            <th className="p-3">Nama Produk & SKU</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3 text-center">Kuantitas Pesanan</th>
                            <th className="p-3">Harga Ditawar Klien</th>
                            <th className="p-3 bg-emerald-50 text-emerald-950 font-black">
                              Harga HPP dari Supplier
                            </th>
                            <th className="p-3 text-right">Subtotal HPP Supplier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {supplierItems.map((item, idx) => {
                            const effectiveHpp = item.costPrice || item.supplierCostPrice || 0;
                            const lineTotalHpp = effectiveHpp * item.quantity;

                            return (
                              <tr key={idx} className="hover:bg-slate-50/70 transition">
                                {/* Product ID */}
                                <td className="p-3">
                                  <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block max-w-fit">
                                    {item.itemId}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    ID Database Admin
                                  </span>
                                </td>

                                {/* Product Name & SKU */}
                                <td className="p-3">
                                  <span className="font-bold text-slate-900 block">{item.itemName}</span>
                                  <span className="text-[10px] font-mono text-slate-500">{item.sku}</span>
                                </td>

                                {/* Category */}
                                <td className="p-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      item.category === 'Bahan Baku'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {item.category || 'Bahan Baku'}
                                  </span>
                                </td>

                                {/* Quantity */}
                                <td className="p-3 text-center font-bold text-slate-800">
                                  {item.quantity} {item.unit}
                                </td>

                                {/* Client Offer Price */}
                                <td className="p-3 text-slate-700">
                                  <span className="font-semibold block">{formatRupiah(item.targetPrice)}</span>
                                  <span className="text-[10px] text-slate-400">per {item.unit}</span>
                                </td>

                                {/* Supplier HPP */}
                                <td className="p-3 bg-emerald-50/40">
                                  {effectiveHpp > 0 ? (
                                    <div>
                                      <span className="font-black text-emerald-900 text-xs block">
                                        {formatRupiah(effectiveHpp)}
                                      </span>
                                      <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-100 px-1 py-0.2 rounded inline-block mt-0.5">
                                        ✓ Tersimpan di DB Admin
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-200 inline-block">
                                      Belum Diinput
                                    </span>
                                  )}
                                </td>

                                {/* Subtotal HPP */}
                                <td className="p-3 text-right font-black text-slate-900">
                                  {effectiveHpp > 0 ? (
                                    formatRupiah(lineTotalHpp)
                                  ) : (
                                    <span className="text-slate-400 font-normal italic">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {po.clientNotes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <strong className="font-semibold text-slate-700">Catatan Klien:</strong> {po.clientNotes}
                      </p>
                    )}

                    {po.supplierNotes && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                        <strong className="font-semibold text-emerald-900">Catatan Konfirmasi Supplier:</strong> {po.supplierNotes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT HARGA HPP & TERIMA PESANAN */}
      {/* ========================================================================= */}
      {selectedPOForHPP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  Konfirmasi Penerimaan Pesanan & Masukkan HPP
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Ref PO: <strong>{selectedPOForHPP.poNumber}</strong> • Klien: {selectedPOForHPP.clientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPOForHPP(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveHPP} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900 mb-1">
                  <Info className="w-4 h-4 text-emerald-700" />
                  Sinkronisasi Otomatis ke Database Produk Role Admin:
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Setelah Anda memasukkan harga HPP di bawah dan mengonfirmasi, <strong>Nomor ID Produk yang sama</strong>, <strong>Harga HPP (Modal)</strong>, dan seluruh informasi produk akan langsung tersimpan di database produk role Admin.
                </p>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Pengiriman</span>
                  <span className="font-bold text-slate-800">{selectedPOForHPP.requiredDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Alamat Pengiriman</span>
                  <span className="font-medium text-slate-800 truncate block" title={selectedPOForHPP.deliveryAddress}>
                    {selectedPOForHPP.deliveryAddress}
                  </span>
                </div>
              </div>

              {/* Items HPP input table */}
              <div className="space-y-3">
                <label className="block font-bold text-slate-800 text-xs">
                  Daftar Produk & Input Harga HPP (Modal Supplier) *:
                </label>

                {selectedPOForHPP.items
                  .filter(isItemForCurrentSupplier)
                  .map((item, idx) => {
                    const enteredHPP = Number(hppInputs[item.itemId] || 0);
                    const subtotalHpp = enteredHPP * item.quantity;
                    const marginPerUnit = item.targetPrice - enteredHPP;

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{item.itemName}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                ID: {item.itemId}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              SKU: <span className="font-mono">{item.sku}</span> • Kategori:{' '}
                              <strong>{item.category || 'Bahan Baku'}</strong> • Kuantitas:{' '}
                              <strong className="text-slate-800">
                                {item.quantity} {item.unit}
                              </strong>
                            </p>
                          </div>

                          <div className="text-right sm:text-right">
                            <span className="text-[10px] text-slate-400 block">Penawaran Klien:</span>
                            <span className="font-bold text-blue-900 text-xs">
                              {formatRupiah(item.targetPrice)} / {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* HPP Input Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="block font-semibold text-emerald-950 mb-1">
                              Harga HPP dari Supplier (Modal / {item.unit}) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 font-bold text-emerald-800 text-xs">
                                Rp
                              </span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Contoh: 120000"
                                value={hppInputs[item.itemId] ?? ''}
                                onChange={(e) =>
                                  setHppInputs({
                                    ...hppInputs,
                                    [item.itemId]: e.target.value === '' ? '' : Number(e.target.value),
                                  })
                                }
                                className="w-full pl-9 pr-3 py-2 border border-emerald-400 rounded-lg font-black text-emerald-900 text-xs bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                required
                              />
                            </div>
                          </div>

                          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[11px]">Total Nilai HPP Supplier:</span>
                              <strong className="text-emerald-900">{formatRupiah(subtotalHpp)}</strong>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-400">Margin Koperasi:</span>
                              <span
                                className={`font-semibold ${
                                  marginPerUnit >= 0 ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {formatRupiah(marginPerUnit)} / {item.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Supplier Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Konfirmasi Penerimaan Supplier
                </label>
                <textarea
                  rows={2}
                  value={supplierOrderNotes}
                  onChange={(e) => setSupplierOrderNotes(e.target.value)}
                  placeholder="Contoh: Stok barang siap dan spesifikasi sesuai pesanan. Pengiriman akan dilakukan tepat waktu..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPOForHPP(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer transition text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition shadow-md flex items-center gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Terima Pesanan & Simpan HPP ke Database Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DELIVERIES & INBOUNDS */}
      {/* ========================================================================= */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          {myInbounds.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Pengiriman Pasokan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Gunakan tombol &quot;Kirim Jadwal Pasokan Baru&quot; untuk menjadwalkan armada pengiriman pasokan ke gudang koperasi.
              </p>
            </div>
          ) : (
            myInbounds.map((inb) => {
              const isDone = inb.status === 'SELESAI';
              const relatedInv = invoices.find((i) => i.referenceNo === inb.inboundNumber);

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
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Total Nilai Pasokan
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatRupiah(inb.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    {inb.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{item.itemName}</span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            {item.quantity} {item.unit} @ {formatRupiah(item.unitCost)}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatRupiah(item.totalCost)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Inbound footer info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Catatan Armada: {inb.warehouseNotes || '-'}
                    </span>
                    {relatedInv && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Status Pembayaran:</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            relatedInv.status === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : relatedInv.status === 'MENUNGGU_KONFIRMASI'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {relatedInv.status.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCTS DATABASE */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari produk / SKU saya..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Bahan Operasional">Bahan Operasional</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Produk Baru</span>
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Produk Terdaftar</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Daftarkan produk atau item pasokan Anda ke database agar dapat dipilih oleh Klien saat membuat Purchase Order (PO).
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">ID & SKU Produk</th>
                      <th className="p-3.5">Nama Produk</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Satuan</th>
                      <th className="p-3.5">Harga HPP (Modal)</th>
                      <th className="p-3.5">Kapasitas Stok</th>
                      <th className="p-3.5">Lokasi Gudang</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] block max-w-fit">
                            ID: {item.id}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                            SKU: {item.sku}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {item.description}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.category === 'Bahan Baku'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{item.unit}</td>
                        <td className="p-3.5 font-black text-emerald-900">
                          {formatRupiah(item.costPrice)}
                        </td>
                        <td className="p-3.5 text-slate-800">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {item.warehouseLocation}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEditProduct(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Edit Data Produk"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INVOICES & PAYMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {myInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Tagihan Pembayaran</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Faktur tagihan pembayaran dari koperasi akan diterbitkan otomatis setiap kali pengiriman pasokan selesai diterima gudang.
              </p>
            </div>
          ) : (
            myInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
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
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Referensi Surat Jalan: <span className="font-mono font-bold text-slate-700">{inv.referenceNo}</span> • Jatuh Tempo: {inv.dueDate}
                  </p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {formatRupiah(inv.totalAmount)}
                  </p>
                </div>

                <button
                  onClick={() => openInvoiceModal(inv)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Lihat Bukti Pencairan / Faktur</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DAFTAR PRODUK BARU */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-200" />
                Daftarkan Produk Baru ke Database
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Produk / Item *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beras Premium Ramos 25kg"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Produk *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category: e.target.value as InventoryItem['category'],
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Bahan Operasional">Bahan Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan Unit (Kemasan) *
                  </label>
                  <input
                    type="text"
                    placeholder="Kg, Sak, Rim, Dus, Liter"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga HPP / Modal Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.costPrice}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-emerald-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasitas Stok Tersedia
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.availableStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, availableStock: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi Gudang / Asal Pengiriman
                </label>
                <input
                  type="text"
                  placeholder="Gudang Sentra Produksi, Karawang"
                  value={newProduct.warehouseLocation}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, warehouseLocation: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Spesifikasi Produk
                </label>
                <textarea
                  rows={2}
                  placeholder="Kualitas grade A, kadar air < 14%, kemasan karung berlapis..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PRODUK */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit className="w-5 h-5 text-emerald-200" />
                  Edit Data Produk & HPP
                </h3>
                <span className="text-[10px] text-emerald-200 font-mono">
                  ID: {editingProduct.id} • SKU: {editingProduct.sku}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={editProductForm.name}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, name: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        category: e.target.value as InventoryItem['category'],
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Bahan Operasional">Bahan Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan Unit *
                  </label>
                  <input
                    type="text"
                    value={editProductForm.unit}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, unit: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga HPP / Modal Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editProductForm.costPrice}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-emerald-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasitas Stok Tersedia
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editProductForm.availableStock}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        availableStock: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi Gudang
                </label>
                <input
                  type="text"
                  value={editProductForm.warehouseLocation}
                  onChange={(e) =>
                    setEditProductForm({
                      ...editProductForm,
                      warehouseLocation: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Spesifikasi
                </label>
                <textarea
                  rows={2}
                  value={editProductForm.description}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, description: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KIRIM PASOKAN BARU */}
      {/* ========================================================================= */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-200" />
                Jadwalkan Pengiriman Pasokan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendSupply} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Komoditas / Barang Pasokan *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    const itm = inventory.find((i) => i.id === e.target.value);
                    if (itm) setCostPrice(itm.costPrice || 100000);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {myProducts.length > 0 && (
                    <optgroup label="⭐ Produk Terdaftar Saya">
                      {myProducts.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.category}) - Stok: {inv.currentStock} {inv.unit}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Katalog Barang Koperasi">
                    {inventory
                      .filter(
                        (i) =>
                          i.supplierId !== currentUser.id &&
                          i.supplierName !== (currentUser.companyName || currentUser.name)
                      )
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.category})
                        </option>
                      ))}
                  </optgroup>
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
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Satuan Modal / Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
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
                <span className="font-black text-emerald-800 text-sm">
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
                  placeholder="No polisi armada, supir, rute pengiriman..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer transition"
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
