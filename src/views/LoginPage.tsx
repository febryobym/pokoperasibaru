import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Building2,
  Truck,
  UserCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Preset admin account for convenience
  const defaultAdmin = {
    username: 'admin',
    password: 'admin123',
    name: 'Administrator Koperasi',
    roleLabel: 'Admin Koperasi',
  };

  const handleSelectAdmin = () => {
    setUsername(defaultAdmin.username);
    setPassword(defaultAdmin.password);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan username dan kata sandi (password).');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.message || 'Username atau kata sandi tidak valid.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Terjadi kendala saat menghubungkan ke database cloud: ' + (err?.message || 'Error'));
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-red-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-red-600 to-rose-800 text-white shadow-xl shadow-red-950/60 ring-4 ring-white/10 mb-4">
          <span className="font-black text-2xl tracking-wider">GMP</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          KOPERASI GARUDA MERAH PUTIH
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
          Sistem Terpadu Inventaris, Pengadaan Klien & Pasokan Supplier
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/30 text-[11px] font-semibold text-red-200 mt-2 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
          <span>Badan Hukum No: AHU-0012891.AH.01.26</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-100 text-slate-800">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan username dan password yang sudah terdaftar di sistem koperasi.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin / client1 / supplier1"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Kata Sandi (Password)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun Anda"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
                <span>Ingat sesi masuk di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-linear-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-sm shadow-md shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick preset selector helper for user convenience */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Akun Bawaan Sistem
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk auto-fill</span>
            </div>

            <button
              type="button"
              onClick={handleSelectAdmin}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                username === defaultAdmin.username
                  ? 'border-red-400 bg-red-50/60 shadow-xs ring-1 ring-red-400/30'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-100 text-red-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {defaultAdmin.roleLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    user: <span className="font-bold text-slate-700">{defaultAdmin.username}</span> | pass:{' '}
                    <span className="font-bold text-slate-700">{defaultAdmin.password}</span>
                  </div>
                </div>
              </div>
              {username === defaultAdmin.username ? (
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 ml-2" />
              ) : (
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md shrink-0 ml-2">
                  Pilih
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Security & Copyright Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Sistem Keamanan Koperasi Garuda Merah Putih • Versi 2.4-Enterprise</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Masuk dengan otentikasi internal username & password tanpa tautan pihak ketiga.
          </p>
        </div>
      </div>
    </div>
  );
};
