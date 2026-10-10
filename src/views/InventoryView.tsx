import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  TrendingDown,
  Warehouse,
  Truck,
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
  } = useApp();

  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new item
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    category: 'Sembako & Pangan' as InventoryItem['category'],
    unit: 'Karung',
    currentStock: 50,
    minStock: 20,
    costPrice: 150000,
    standardPrice: 175000,
    supplierId: 'usr-supplier-1',
    supplierName: 'CV Tani Jaya Agro Makmur',
    warehouseLocation: 'Gudang Utama Blok A',
    description: '',
  });

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
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
      name: newItem.name,
      category: newItem.category,
      unit: newItem.unit,
      currentStock: Number(newItem.currentStock),
      minStock: Number(newItem.minStock),
      costPrice: Number(newItem.costPrice),
      standardPrice: Number(newItem.standardPrice),
      supplierId: newItem.supplierId,
      supplierName: newItem.supplierName,
      warehouseLocation: newItem.warehouseLocation,
      description: newItem.description,
    });

    setShowAddModal(false);
    setNewItem({
      sku: '',
      name: '',
      category: 'Sembako & Pangan',
      unit: 'Karung',
      currentStock: 50,
      minStock: 20,
      costPrice: 150000,
      standardPrice: 175000,
      supplierId: 'usr-supplier-1',
      supplierName: 'CV Tani Jaya Agro Makmur',
      warehouseLocation: 'Gudang Utama Blok A',
      description: '',
    });
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
              <option value="Sembako & Pangan">Sembako & Pangan</option>
              <option value="Material Konstruksi">Material Konstruksi</option>
              <option value="ATK & Kantor">ATK & Kantor</option>
              <option value="Produk UMKM Anggota">Produk UMKM Anggota</option>
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
                {filteredItems.map((item) => {
                  const isLow = item.currentStock <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] font-bold text-red-600 block">
                          {item.sku}
                        </span>
                        <span className="font-bold text-slate-900 text-xs block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {item.description}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
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
                        </td>
                      )}
                    </tr>
                  );
                })}
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
                {filteredMovements.map((mov, idx) => {
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 p-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              Pendaftaran Barang Inventaris Baru
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SKU Barang
                  </label>
                  <input
                    type="text"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    placeholder="GMP-BRS-09"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        category: e.target.value as InventoryItem['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Sembako & Pangan">Sembako & Pangan</option>
                    <option value="Material Konstruksi">Material Konstruksi</option>
                    <option value="ATK & Kantor">ATK & Kantor</option>
                    <option value="Produk UMKM Anggota">Produk UMKM Anggota</option>
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
                  placeholder="Contoh: Beras Premium Pandan Wangi 25kg"
                  className="w-full p-2 border border-slate-300 rounded-lg"
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
                    placeholder="Karung / Sak / Dus"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    HPP Beli Supplier (Rp)
                  </label>
                  <input
                    type="number"
                    value={newItem.costPrice}
                    onChange={(e) => setNewItem({ ...newItem, costPrice: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Standar Jual (Rp)
                  </label>
                  <input
                    type="number"
                    value={newItem.standardPrice}
                    onChange={(e) =>
                      setNewItem({ ...newItem, standardPrice: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supplier Pemasok
                  </label>
                  <input
                    type="text"
                    value={newItem.supplierName}
                    onChange={(e) => setNewItem({ ...newItem, supplierName: e.target.value })}
                    placeholder="CV Tani Jaya Agro Makmur"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lokasi Rak/Gudang
                  </label>
                  <input
                    type="text"
                    value={newItem.warehouseLocation}
                    onChange={(e) =>
                      setNewItem({ ...newItem, warehouseLocation: e.target.value })
                    }
                    placeholder="Gudang Blok B-03"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Spesifikasi
                </label>
                <textarea
                  rows={2}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Kualitas, masa simpan, atau instruksi penyimpanan..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
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
