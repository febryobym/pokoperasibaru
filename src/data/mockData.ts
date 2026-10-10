import { User, UserRole, RolePermissionConfig, InventoryItem, StockMovement, PurchaseOrder, SupplierInbound, Invoice, NotificationLog } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionConfig> = {
  admin: {
    role: 'admin',
    label: 'Pengurus / Admin Koperasi',
    description: 'Akses penuh ke seluruh operasional koperasi: inventaris stok, persetujuan PO, penerimaan supplier, keuangan, laporan laba, dan manajemen pengguna.',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    permissions: {
      canViewAllInventory: true,
      canManageInventory: true,
      canViewAllPOs: true,
      canCreatePO: true,
      canApprovePO: true,
      canManageInbound: true,
      canManageOutboundSupply: true,
      canViewFinance: true,
      canViewAllInvoices: true,
      canViewOwnInvoices: true,
      canManageUsers: true,
      canAccessAuditLogs: true,
    },
  },
  client: {
    role: 'client',
    label: 'Klien / Pelanggan Tetap',
    description: 'Hanya bisa melihat pesanan mereka, membuat PO baru dengan anggaran budget kustom, melacak status pesanan secara real-time, serta memonitor tagihan & bukti pembayaran mereka.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    permissions: {
      canViewAllInventory: false,
      canManageInventory: false,
      canViewAllPOs: false,
      canCreatePO: true,
      canApprovePO: false,
      canManageInbound: false,
      canManageOutboundSupply: false,
      canViewFinance: false,
      canViewAllInvoices: false,
      canViewOwnInvoices: true,
      canManageUsers: false,
      canAccessAuditLogs: false,
    },
  },
  supplier: {
    role: 'supplier',
    label: 'Supplier / Pemasok Tetap',
    description: 'Hanya bisa melihat stok masuk, mengelola stok keluar/pasokan ke koperasi, serta melihat tagihan & pembayaran pencairan dana yang sudah dilakukan.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    permissions: {
      canViewAllInventory: false,
      canManageInventory: false,
      canViewAllPOs: false,
      canCreatePO: false,
      canApprovePO: false,
      canManageInbound: true,
      canManageOutboundSupply: true,
      canViewFinance: false,
      canViewAllInvoices: false,
      canViewOwnInvoices: true,
      canManageUsers: false,
      canAccessAuditLogs: false,
    },
  },
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Administrator Koperasi',
    username: 'admin',
    password: 'admin123',
    email: 'admin@koperasigarudamp.id',
    phone: '08123456789',
    role: 'admin',
    companyName: 'Koperasi Garuda Merah Putih',
    address: 'Jl. Merdeka No. 45, Jakarta Pusat',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    status: 'active',
    joinedDate: '2024-01-01',
    notes: 'Akun Utama Administrator Koperasi',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const INITIAL_SUPPLIER_INBOUND: SupplierInbound[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];
