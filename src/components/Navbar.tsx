import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { currentUser, logout } = useApp();

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

          {/* Right Tools & User Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Role Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
              <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
              <span className="font-bold text-slate-900">{badge.label}</span>
              {currentUser.companyName && (
                <span className="text-slate-500 font-normal truncate max-w-[140px]">
                  • {currentUser.companyName}
                </span>
              )}
            </div>

            {/* Current Active User Profile Summary */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-red-100"
              />
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-bold text-slate-800 truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 capitalize">{currentUser.role}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                  logout();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition cursor-pointer ml-1 shadow-xs"
              title="Keluar dari akun (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
