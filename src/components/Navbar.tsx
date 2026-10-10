import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Building2,
  CheckCircle2,
  LogOut,
  ShieldAlert,
  Smartphone,
  Truck,
  UserCheck,
  Users,
  Warehouse,
} from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const { currentUser, users, switchUserRole, notifications, resetAllData } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.slice(0, 5).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Pengurus Koperasi',
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-600',
        };
      case 'client':
        return {
          label: 'Klien Tetap',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-600',
        };
      case 'supplier':
        return {
          label: 'Supplier Tetap',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      default:
        return {
          label: 'Pengguna',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-600',
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-rose-800 text-white shadow-md shadow-red-200">
              <span className="font-black text-lg tracking-wider">GMP</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  KOPERASI GARUDA MERAH PUTIH
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                  Resmi RI
                </span>
              </div>
              <p className="text-xs text-slate-700 hidden sm:block">
                Sistem Terpadu Inventaris, Pengadaan Klien & Pasokan Supplier
              </p>
            </div>
          </div>

          {/* Right Tools & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-700 transition cursor-pointer"
                title="Ganti Mode Pengguna / Peran Akun"
              >
                <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                <span className="font-semibold">{badge.label}</span>
                <span className="hidden lg:inline text-slate-600 font-normal truncate max-w-[150px]">
                  • {currentUser.companyName || currentUser.name}
                </span>
                <span className="text-slate-600 text-[10px]">▼</span>
              </button>

              {/* Dropdown Role Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      PILIH PROFIL LOGIN / PERAN
                    </p>
                    <p className="text-xs text-slate-700 mt-0.5">
                      Uji coba sistem dari berbagai sudut pandang akun
                    </p>
                  </div>
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {users.map((user) => {
                      const userBadge = getRoleBadge(user.role);
                      const isCurrent = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchUserRole(user.id);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer ${
                            isCurrent ? 'bg-red-50/60 font-semibold' : ''
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                              user.role === 'admin'
                                ? 'bg-red-600'
                                : user.role === 'client'
                                ? 'bg-blue-600'
                                : 'bg-emerald-600'
                            }`}
                          >
                            {user.role === 'admin' ? (
                              <Building2 className="w-4 h-4" />
                            ) : user.role === 'client' ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <Truck className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {user.name}
                              </p>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${userBadge.bg}`}
                              >
                                {user.role === 'admin'
                                  ? 'Admin'
                                  : user.role === 'client'
                                  ? 'Klien'
                                  : 'Supplier'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 truncate">
                              {user.companyName || user.email}
                            </p>
                          </div>
                          {isCurrent && (
                            <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 self-center" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                    <button
                      onClick={() => {
                        if (confirm('Reset ulang data demo ke default Koperasi Garuda Merah Putih?')) {
                          resetAllData();
                          setShowRoleMenu(false);
                        }
                      }}
                      className="text-[11px] text-slate-700 hover:text-red-600 font-medium px-2 py-1 rounded transition"
                    >
                      Reset Data Demo
                    </button>
                    <span className="text-[11px] text-slate-600">Simulasi Real-Time</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-red-700 hover:bg-slate-100 transition cursor-pointer"
              title="Lihat Log Notifikasi WA & Email"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Current Active User Profile Summary */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-red-100"
              />
              <div className="text-left text-xs leading-tight">
                <p className="font-bold text-slate-800 truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[11px] text-slate-700 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
