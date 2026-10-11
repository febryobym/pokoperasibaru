import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Edit,
  Layers,
} from 'lucide-react';
import { InventoryItem } from '../types';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    stockMovements,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    currentUser,
    users,
  } = useApp();

  const suppliers = users.filter((u) => u.role === 'supplier');

  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit item state (admin can edit product name and details)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'Bahan Operasional' as InventoryItem['category'],
    unit: '',
    minStock: 10,
    supplierId: '',
    supplierName: '',
    warehouseLocation: '',
    description: '',
  });

  // Form states for new item (without costPrice & standardPrice as requested)
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    category: 'Bahan Operasional' as InventoryItem['category'],
    unit: 'Unit',
    currentStock: 0,
    minStock: 10,
    costPrice: 0,
    standardPrice: 0,
    supplierId: '',
    supplierName: '',
    warehouseLocation: 'Gudang Utama',
    description: '',
  });

  const formatRupiah = (num: number) => {
    if (!num || num === 0) return '-';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  // Filter items
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'Semua' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filter movements
  const filteredMovements = stockMovements.filter((mov) => {
    const matchesType = movementFilter === 'ALL' || mov.type === movementFilter;
    const matchesSearch =
      mov.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.sku || !newItem.name) return;

    addInventoryItem({
      sku: newItem.sku.toUpperCase(),
      name: newItem.name.trim(),
      category: newItem.category,
      unit: newItem.unit,
      currentStock: Number(newItem.currentStock || 0),
      minStock: Number(newItem.minStock || 0),
      costPrice: 0,
      standardPrice: 0,
      supplierId: newItem.supplierId,
      supplierName: newItem.supplierName.trim() || 'Supplier Umum',
      warehouseLocation: newItem.warehouseLocation,
      description: newItem.description,
    });

    setShowAddModal(false);
    setNewItem({
      sku: '',
      name: '',
      category: 'Bahan Operasional',
      unit: 'Unit',
      currentStock: 0,
      minStock: 10,
      costPrice: 0,
      standardPrice: 0,
      supplierId: '',
      supplierName: '',
      warehouseLocation: 'Gudang Utama',
      description: '',
    });
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      category: (item.category === 'Bahan Baku' ? 'Bahan Baku' : 'Bahan Operasional') as InventoryItem['category'],
      unit: item.unit,
      minStock: item.minStock || 0,
      supplierId: item.supplierId || '',
      supplierName: item.supplierName || '',
      warehouseLocation: item.warehouseLocation || '',
      description: item.description || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editForm.name.trim()) return;

    updateInventoryItem(editingItem.id, {
      name: editForm.name.trim(),
      category: editForm.category,
      unit: editForm.unit,
      minStock: Number(editForm.minStock || 0),
      supplierId: editForm.supplierId,
      supplierName: editForm.supplierName.trim(),
      warehouseLocation: editForm.warehouseLocation,
      description: editForm.description,
    });

    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Inventaris & Stok Koperasi
          </h1>
          <p className="text-xs text-slate-500">
            Katalog stok fisik, titik pemesanan ulang (minimum stok), serta arus keluar masuk barang harian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'items'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Stok Barang ({inventory.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'movements'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Riwayat Arus Keluar & Masuk ({stockMovements.length})</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'items'
                ? 'Cari nama barang, SKU, supplier...'
                : 'Cari referensi PO, barang, mitra...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        {activeTab === 'items' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Kategori:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Bahan Operasional">Bahan Operasional</option>
              <option value="Bahan Baku">Bahan Baku</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Arus:
            </span>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setMovementFilter('ALL')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  movementFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setMovementFilter('IN')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  movementFilter === 'IN' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                }`}
              >
                Masuk (Supplier)
              </button>
              <button
                onClick={() => setMovementFilter('OUT')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  movementFilter === 'OUT' ? 'bg-blue-600 text-white' : 'text-slate-500'
                }`}
              >
                Keluar (Klien)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Catalog Table */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">SKU & Barang</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Stok Saat Ini</th>
                  <th className="p-3.5">Satuan</th>
                  <th className="p-3.5">HPP (Modal)</th>
                  <th className="p-3.5">Harga Standar Koperasi</th>
                  <th className="p-3.5">Supplier Tetap</th>
                  <th className="p-3.5">Lokasi Gudang</th>
                  {currentUser.role === 'admin' && <th className="p-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'admin' ? 9 : 8} className="p-8 text-center text-slate-400">
                      Belum ada data barang inventaris. Klik &quot;Tambah Barang Baru&quot; untuk mendaftarkan barang.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] font-bold text-red-600 block">
                            {item.sku}
                          </span>
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-bold text-slate-900 text-xs block">
                              {item.name}
                            </span>
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="opacity-70 hover:opacity-100 text-blue-600 hover:text-blue-800 p-0.5 rounded transition cursor-pointer"
                                title="Edit Nama Produk"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                          </div>
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
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-black text-sm ${
                                isLow ? 'text-amber-600' : 'text-slate-900'
                              }`}
                            >
                              {item.currentStock}
                            </span>
                            {isLow && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                Min {item.minStock}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">{item.unit}</td>
                        <td className="p-3.5 text-slate-600">{formatRupiah(item.costPrice)}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {formatRupiah(item.standardPrice)}
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{item.supplierName}</td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {item.warehouseLocation}
                        </td>
                        {currentUser.role === 'admin' && (
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                title="Edit Nama Produk"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus barang ${item.name} dari inventaris?`)) {
                                    deleteInventoryItem(item.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Hapus Barang"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movements History */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Waktu & Tanggal</th>
                  <th className="p-3.5">Arus Gerak</th>
                  <th className="p-3.5">SKU & Nama Barang</th>
                  <th className="p-3.5">Jumlah Mutasi</th>
                  <th className="p-3.5">Mitra Transaksi</th>
                  <th className="p-3.5">No. Dokumen / PO</th>
                  <th className="p-3.5">Petugas Input</th>
                  <th className="p-3.5">Catatan Gudang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Belum ada riwayat mutasi stok barang.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov, idx) => {
                    const isOut = mov.type === 'OUT';
                    return (
                      <tr key={`${mov.id}-${idx}`} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-mono text-[11px] text-slate-500">
                          {mov.date} WIB
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              isOut
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                KELUAR (KLIEN)
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft className="w-3 h-3" />
                                MASUK (SUPPLIER)
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800 block">{mov.itemName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{mov.sku}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-black text-sm ${
                              isOut ? 'text-blue-700' : 'text-emerald-700'
                            }`}
                          >
                            {isOut ? '-' : '+'}
                            {mov.quantity} {mov.unit}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{mov.partyName}</td>
                        <td className="p-3.5 font-mono font-bold text-red-700">
                          {mov.referenceNo}
                        </td>
                        <td className="p-3.5 text-slate-600">{mov.performedBy}</td>
                        <td className="p-3.5 text-slate-500 text-[11px] max-w-[200px]">
                          {mov.notes}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Edit Nama Produk & Data Barang (Role Admin) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Nama Produk & Data Barang
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold">
                {editingItem.sku}
              </span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Produk / Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Contoh: Beras Premium Rojo Lele"
                  className="w-full p-2.5 border-2 border-blue-500 rounded-lg font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-blue-600 mt-1 font-medium">
                  Perubahan nama produk akan langsung diperbarui di inventaris koperasi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Produk
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value as InventoryItem['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Bahan Operasional">Bahan Operasional</option>
                    <option value="Bahan Baku">Bahan Baku</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batas Minimum Stok
                  </label>
                  <input
                    type="number"
                    value={editForm.minStock}
                    onChange={(e) =>
                      setEditForm({ ...editForm, minStock: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lokasi Rak / Gudang
                  </label>
                  <input
                    type="text"
                    value={editForm.warehouseLocation}
                    onChange={(e) =>
                      setEditForm({ ...editForm, warehouseLocation: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  Supplier Pemasok
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={editForm.supplierId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const found = suppliers.find((s) => s.id === selectedId);
                      if (found) {
                        setEditForm({
                          ...editForm,
                          supplierId: found.id,
                          supplierName: found.companyName || found.name,
                        });
                      } else {
                        setEditForm({
                          ...editForm,
                          supplierId: '',
                        });
                      }
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="">-- Pilih dari Supplier Terdaftar --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} {sup.companyName ? `(${sup.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editForm.supplierName}
                    onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })}
                    placeholder="Nama Supplier (Disesuaikan)"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Barang
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Spesifikasi, grade atau instruksi khusus..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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

      {/* Modal: Pendaftaran Barang Inventaris Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 p-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              Pendaftaran Barang Inventaris Baru
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SKU Barang
                  </label>
                  <input
                    type="text"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    placeholder="Contoh: BOP-001"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Produk
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        category: e.target.value as InventoryItem['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Bahan Operasional">Bahan Operasional</option>
                    <option value="Bahan Baku">Bahan Baku</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang Lengkap
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Contoh: Kertas HVS A4 80gr"
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="Rim / Sak / Kg"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batas Minimum
                  </label>
                  <input
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Note: 'harga standard jual' dan 'HPP dari supplier' telah dihilangkan sesuai permintaan user */}

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  Supplier Pemasok
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <select
                      value={newItem.supplierId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const found = suppliers.find((s) => s.id === selectedId);
                        if (found) {
                          setNewItem({
                            ...newItem,
                            supplierId: found.id,
                            supplierName: found.companyName || found.name,
                          });
                        } else {
                          setNewItem({
                            ...newItem,
                            supplierId: '',
                          });
                        }
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="">-- Pilih Supplier Terdaftar --</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} {sup.companyName ? `(${sup.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Pilih dari master supplier terdaftar
                    </span>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newItem.supplierName}
                      onChange={(e) => setNewItem({ ...newItem, supplierName: e.target.value })}
                      placeholder="Nama Supplier Pemasok"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Nama pemasok (bisa disesuaikan)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi Rak / Gudang
                </label>
                <input
                  type="text"
                  value={newItem.warehouseLocation}
                  onChange={(e) =>
                    setNewItem({ ...newItem, warehouseLocation: e.target.value })
                  }
                  placeholder="Gudang Blok A-01"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Spesifikasi
                </label>
                <textarea
                  rows={2}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Kualitas, mutu, atau catatan penyimpanan..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Simpan Barang ke Inventaris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
