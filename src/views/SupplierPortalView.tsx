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
} from 'lucide-react';
import { InventoryItem } from '../types';

interface SupplierPortalViewProps {
  initialSubTab?: 'deliveries' | 'invoices' | 'products';
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  initialSubTab = 'deliveries',
}) => {
  const {
    currentUser,
    supplierInbounds,
    invoices,
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    createSupplierInbound,
    openInvoiceModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'deliveries' | 'invoices' | 'products'>(initialSubTab);

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
      unit: newProduct.unit.trim() || 'Unit',
      currentStock: Number(newProduct.availableStock || 0),
      minStock: 10,
      costPrice: Number(newProduct.costPrice || 0),
      standardPrice: 0,
      supplierId: currentUser.id,
      supplierName: currentUser.companyName || currentUser.name,
      warehouseLocation: newProduct.warehouseLocation.trim() || 'Gudang Sentra Pemasok',
      description: newProduct.description.trim(),
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
      category: (item.category === 'Bahan Operasional' ? 'Bahan Operasional' : 'Bahan Baku') as InventoryItem['category'],
      unit: item.unit,
      costPrice: item.costPrice || 0,
      availableStock: item.currentStock || 0,
      warehouseLocation: item.warehouseLocation || '',
      description: item.description || '',
    });
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProductForm.name.trim()) return;

    updateInventoryItem(editingProduct.id, {
      name: editProductForm.name.trim(),
      category: editProductForm.category,
      unit: editProductForm.unit.trim() || 'Unit',
      currentStock: Number(editProductForm.availableStock || 0),
      costPrice: Number(editProductForm.costPrice || 0),
      warehouseLocation: editProductForm.warehouseLocation.trim(),
      description: editProductForm.description.trim(),
    });

    setEditingProduct(null);
  };

  const handleDeleteProduct = (item: InventoryItem) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus produk "${item.name}" (${item.sku}) dari database produk yang Anda jual?`
      )
    ) {
      deleteInventoryItem(item.id);
    }
  };

  const handleQuickSend = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setCostPrice(item.costPrice || 0);
    setShowSendModal(true);
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
      <div className="flex border-b border-slate-200 overflow-x-auto">
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

      {/* TAB 1: Deliveries Tab */}
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
            })
          )}
        </div>
      )}

      {/* TAB 2: Database Produk & Item yang Dijual oleh Supplier */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Total Produk Saya</span>
                <Boxes className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1.5">
                {myProducts.length} <span className="text-xs font-normal text-slate-500">Item Produk</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Terdaftar di database pasokan koperasi
              </p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Bahan Baku</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 mt-1.5">
                {myProducts.filter((p) => p.category === 'Bahan Baku').length}{' '}
                <span className="text-xs font-normal text-slate-500">Komoditas</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hasil pertanian, perkebunan & material baku
              </p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Bahan Operasional</span>
                <Package className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-blue-600 mt-1.5">
                {myProducts.filter((p) => p.category === 'Bahan Operasional').length}{' '}
                <span className="text-xs font-normal text-slate-500">Item Operasional</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kebutuhan logistik, perlengkapan & operasional
              </p>
            </div>
          </div>

          {/* Action Header & Search Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Cari nama produk, SKU, spesifikasi..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500">Kategori:</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Bahan Baku">Bahan Baku</option>
                  <option value="Bahan Operasional">Bahan Operasional</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Produk</span>
              </button>
            </div>
          </div>

          {/* Products List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">SKU & Nama Produk</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Satuan</th>
                    <th className="p-3.5">Harga Penawaran / Modal</th>
                    <th className="p-3.5">Stok Siap Pasok</th>
                    <th className="p-3.5">Asal Gudang / Sentra</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600 text-sm">
                          {myProducts.length === 0
                            ? 'Belum ada produk yang dimasukkan ke database.'
                            : 'Tidak ada produk yang cocok dengan pencarian.'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          {myProducts.length === 0
                            ? 'Daftarkan barang, komoditas, dan item yang siap Anda jual ke Koperasi Garuda Merah Putih.'
                            : 'Coba ubah kata kunci pencarian atau filter kategori Anda.'}
                        </p>
                        {myProducts.length === 0 && (
                          <button
                            onClick={() => setShowAddProductModal(true)}
                            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Daftarkan Produk Pertama Anda</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] font-bold text-emerald-700 block">
                            {item.sku}
                          </span>
                          <span className="font-bold text-slate-900 text-xs block">
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-[10px] text-slate-400 line-clamp-1">
                              {item.description}
                            </span>
                          )}
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
                        <td className="p-3.5 text-slate-600 font-medium">{item.unit}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {item.costPrice ? formatRupiah(item.costPrice) : '-'}
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-sm text-slate-800">
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {item.warehouseLocation || 'Sentra Pemasok'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleQuickSend(item)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition cursor-pointer flex items-center gap-1 border border-emerald-200 shadow-2xs"
                              title="Kirim Pasokan Item Ini ke Gudang Koperasi"
                            >
                              <Send className="w-3 h-3" />
                              <span>Kirim Pasokan</span>
                            </button>
                            <button
                              onClick={() => handleStartEditProduct(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200 bg-white"
                              title="Edit Detail Produk"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-slate-200 bg-white"
                              title="Hapus Produk dari Database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {myInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Tagihan Pembayaran</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Tagihan hutang dagang akan otomatis tercatat setiap kali ada jadwal pengiriman pasokan yang masuk.
              </p>
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
            ))
          )}
        </div>
      )}

      {/* MODAL 1: Tambah Produk Baru ke Database Supplier */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Masukkan Produk Baru ke Database Penjualan
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode SKU Produk
                  </label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Contoh: SUP-BRS-01 (Opsional)"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Kosongkan jika ingin dibuat otomatis
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Produk <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category: e.target.value as InventoryItem['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Bahan Operasional">Bahan Operasional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Produk / Item Komoditas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Contoh: Beras Premium Setra Ramos 25kg"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="Kg / Sak / Dus / Rim"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Modal / Beli (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.costPrice}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasitas Pasokan
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.availableStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, availableStock: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asal Sentra / Lokasi Gudang Pemasok
                </label>
                <input
                  type="text"
                  value={newProduct.warehouseLocation}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, warehouseLocation: e.target.value })
                  }
                  placeholder="Contoh: Sentra Penggilingan Padi Karawang Blok C"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Spesifikasi Mutu & Keterangan Produk
                </label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  placeholder="Kadar air, derajat sosoh, masa kedaluwarsa, atau standar mutu..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Simpan ke Database Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Produk Database Supplier */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Data Produk Supplier
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                {editingProduct.sku}
              </span>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Produk / Item Komoditas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editProductForm.name}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, name: e.target.value })
                  }
                  className="w-full p-2.5 border-2 border-blue-500 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Produk
                  </label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        category: e.target.value as InventoryItem['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Bahan Operasional">Bahan Operasional</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={editProductForm.unit}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, unit: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Penawaran / Modal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editProductForm.costPrice}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasitas Pasokan Siap Kirim
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asal Sentra / Lokasi Gudang Pemasok
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
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Spesifikasi & Mutu Produk
                </label>
                <textarea
                  rows={2}
                  value={editProductForm.description}
                  onChange={(e) =>
                    setEditProductForm({
                      ...editProductForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Kirim Jadwal Pasokan Baru */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Kirim Jadwal Pasokan Baru ke Gudang Koperasi
            </h3>

            <form onSubmit={handleSendSupply} className="space-y-3.5 text-xs">
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
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
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
