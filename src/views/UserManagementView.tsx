import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ROLE_PERMISSIONS } from '../data/mockData';
import { User, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  Building2,
  Truck,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Info,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { users, currentUser, addNewUser, updateUser, deleteUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'client' as UserRole,
    companyName: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      role: 'client',
      companyName: '',
      address: '',
      status: 'active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username || '',
      password: user.password || '',
      email: user.email,
      phone: user.phone,
      role: user.role,
      companyName: user.companyName || '',
      address: user.address || '',
      status: user.status || 'active',
      notes: user.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      showNotification('error', 'Nama dan Nomor Telepon wajib diisi.');
      return;
    }

    const defaultUsername =
      formData.username.trim() ||
      formData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) ||
      'user';
    const defaultPassword = formData.password.trim() || (formData.role === 'admin' ? 'admin123' : `${formData.role}123`);

    if (editingUser) {
      // Update existing user
      updateUser(editingUser.id, {
        name: formData.name.trim(),
        username: defaultUsername,
        password: defaultPassword,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        companyName: formData.companyName.trim() || undefined,
        address: formData.address.trim() || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });
      showNotification('success', `Data pengguna ${formData.name} berhasil diperbarui.`);
    } else {
      // Add new user
      addNewUser(
        {
          name: formData.name.trim(),
          username: defaultUsername,
          password: defaultPassword,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          companyName: formData.companyName.trim() || undefined,
          address: formData.address.trim() || undefined,
          status: formData.status,
          notes: formData.notes.trim() || undefined,
          avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=120&auto=format&fit=crop&q=80`,
        },
        false
      );
      showNotification('success', `Pengguna baru ${formData.name} berhasil ditambahkan dengan username "${defaultUsername}".`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}" (${user.email})? Tindakan ini tidak dapat dibatalkan.`)) {
      const result = deleteUser(user.id);
      if (result.success) {
        showNotification('success', result.message);
      } else {
        showNotification('error', result.message);
      }
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI count
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const clientCount = users.filter((u) => u.role === 'client').length;
  const supplierCount = users.filter((u) => u.role === 'supplier').length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin Koperasi',
          bg: 'bg-red-100 text-red-800 border-red-300',
          dot: 'bg-red-600',
          icon: <Shield className="w-3.5 h-3.5 text-red-600" />,
        };
      case 'client':
        return {
          label: 'Klien Tetap',
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-600',
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
        };
      case 'supplier':
        return {
          label: 'Supplier Tetap',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          icon: <Truck className="w-3.5 h-3.5 text-emerald-600" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold mb-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Kontrol Hak Akses & Peran Pengguna</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sistem Manajemen Pengguna Koperasi
          </h1>
          <p className="text-xs text-slate-500">
            Kelola daftar akun, tetapkan peran (Admin, Klien, Supplier), atur izin operasional, dan pantau status keanggotaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span>{showPermissionsMatrix ? 'Tutup Matriks Izin' : 'Lihat Matriks Hak Akses'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Semua akun terdaftar</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Admin Koperasi</span>
            <Shield className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-700 mt-2">{adminCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Akses penuh sistem</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Klien Tetap</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{clientCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">PO, budget & faktur</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Supplier Tetap</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{supplierCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Stok masuk & tagihan</p>
        </div>
      </div>

      {/* Permissions Matrix Accordion / Details */}
      {showPermissionsMatrix && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                Matriks Hak Akses & Izin Berdasarkan Peran (Role-Based Access Control)
              </h3>
              <p className="text-xs text-slate-500">
                Pemisahan tanggung jawab dan izin akses bagi setiap tipe akun dalam Koperasi Garuda Merah Putih.
              </p>
            </div>
            <button
              onClick={() => setShowPermissionsMatrix(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Tutup ✕
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            {/* Admin Role */}
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-600 text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Admin Koperasi</h4>
                  <span className="text-[10px] font-bold text-red-700">Akses Penuh (Super Admin)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {ROLE_PERMISSIONS.admin.description}
              </p>
              <ul className="space-y-1.5 pt-2 border-t border-red-100 text-[11px]">
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kelola Inventaris & Penyesuaian Stok</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Review, Negosiasi & Setujui PO Klien</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verifikasi Barang Masuk dari Supplier</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Manajemen Pengguna (Tambah, Edit, Hapus)</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Laporan Arus Kas, Margin Profit & SHU</span>
                </li>
              </ul>
            </div>

            {/* Client Role */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Klien Tetap</h4>
                  <span className="text-[10px] font-bold text-blue-700">Pengadaan & Pembayaran</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {ROLE_PERMISSIONS.client.description}
              </p>
              <ul className="space-y-1.5 pt-2 border-t border-blue-100 text-[11px]">
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Lihat Katalog Barang Koperasi</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Buat PO Baru & Tetapkan Target Budget</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pelacakan Status Pengiriman Real-Time</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Monitor Tagihan & Unggah Bukti Bayar</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="line-through">Tidak dapat mengubah stok gudang / melihat klien lain</span>
                </li>
              </ul>
            </div>

            {/* Supplier Role */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Supplier Tetap</h4>
                  <span className="text-[10px] font-bold text-emerald-700">Pasokan Masuk & Tagihan</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {ROLE_PERMISSIONS.supplier.description}
              </p>
              <ul className="space-y-1.5 pt-2 border-t border-emerald-100 text-[11px]">
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Jadwalkan Pengiriman Pasokan ke Gudang</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Monitor Status Penerimaan Fisik Barang</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Lihat Tagihan & Bukti Pencairan Koperasi</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="line-through">Tidak dapat melihat margin / PO klien</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, perusahaan, no HP..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Semua Peran
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
                roleFilter === 'admin' ? 'bg-red-600 text-white' : 'text-slate-500'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setRoleFilter('client')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
                roleFilter === 'client' ? 'bg-blue-600 text-white' : 'text-slate-500'
              }`}
            >
              Klien
            </button>
            <button
              onClick={() => setRoleFilter('supplier')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
                roleFilter === 'supplier' ? 'bg-emerald-600 text-white' : 'text-slate-500'
              }`}
            >
              Supplier
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Profil Pengguna</th>
                <th className="p-3.5">Peran / Izin</th>
                <th className="p-3.5">Perusahaan / Afiliasi</th>
                <th className="p-3.5">No. Telepon & Kontak</th>
                <th className="p-3.5">Status Akun</th>
                <th className="p-3.5 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">Tidak ada pengguna yang cocok</p>
                    <p className="text-xs">Ubah kata kunci pencarian atau filter peran Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const badge = getRoleBadge(user.role);
                  const isCurrentActive = user.id === currentUser.id;
                  const isActive = (user.status || 'active') === 'active';

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCurrentActive ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">
                                {user.name}
                              </span>
                              {isCurrentActive && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">
                                  Anda (Aktif)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              <span>user: <strong className="text-slate-800">{user.username || '-'}</strong></span>
                              <span>•</span>
                              <span>pass: <strong className="text-slate-800">{user.password || '******'}</strong></span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Company & Address */}
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">
                          {user.companyName || '-'}
                        </p>
                        {user.address && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={user.address}>
                            {user.address}
                          </p>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs font-semibold">{user.phone}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {isActive ? '● Aktif' : '○ Non-Aktif'}
                        </span>
                        {user.joinedDate && (
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            Sejak {user.joinedDate}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Edit data pengguna & peran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          {!isCurrentActive && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                              title="Hapus pengguna dari sistem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-100 text-red-700">
                  {editingUser ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Edit Data Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser ? 'Perbarui peran atau informasi akun' : 'Daftarkan admin, klien tetap, atau supplier tetap baru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Role Selection with visual explanation */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Tetapkan Peran & Hak Akses (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      formData.role === 'admin'
                        ? 'border-red-600 bg-red-50 text-red-900 font-bold ring-2 ring-red-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-red-600" />
                    <span>Admin</span>
                    <span className="block text-[9px] text-slate-400 font-normal">Akses Penuh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'client' })}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      formData.role === 'client'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span>Klien Tetap</span>
                    <span className="block text-[9px] text-slate-400 font-normal">Buat PO & Budget</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'supplier' })}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      formData.role === 'supplier'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span>Supplier</span>
                    <span className="block text-[9px] text-slate-400 font-normal">Pasokan Masuk</span>
                  </button>
                </div>

                {/* Role Description Helper */}
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800">
                    Izin Akses {formData.role.toUpperCase()}:
                  </span>{' '}
                  {ROLE_PERMISSIONS[formData.role].description}
                </div>
              </div>

              {/* Name & Company */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap Penanggung Jawab *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Bpk. Ahmad Yani"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Perusahaan / Instansi / Katering
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Contoh: PT Sumber Makmur Nusantara"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Telepon Kontak *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              {/* Login Credentials (Username & Password) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Kredensial Masuk Sistem (Username & Password)
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Username Login
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder={editingUser?.username || 'Contoh: ahmad1 / supplier3'}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <span className="text-[10px] text-slate-400">
                      Bila kosong, dibuat otomatis dari nama pengguna
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kata Sandi (Password)
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser?.password || 'Contoh: user123'}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <span className="text-[10px] text-slate-400">
                      Password untuk otentikasi login
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Kantor / Gudang Pengiriman
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Kawasan Industri Pulogadung Blok B No. 12, Jakarta Timur"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Status & Notes */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="active">Aktif (Dapat Login & Transaksi)</option>
                    <option value="inactive">Non-Aktif (Ditangguhkan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Keanggotaan
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Klien korporat langganan beras..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer shadow-sm"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambahkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
