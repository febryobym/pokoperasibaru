export type UserRole = 'admin' | 'client' | 'supplier';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone: string;
  role: UserRole;
  companyName?: string;
  address?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
  joinedDate?: string;
  notes?: string;
}

export interface RolePermissionConfig {
  role: UserRole;
  label: string;
  description: string;
  badgeColor: string;
  permissions: {
    canViewAllInventory: boolean;
    canManageInventory: boolean;
    canViewAllPOs: boolean;
    canCreatePO: boolean;
    canApprovePO: boolean;
    canManageInbound: boolean;
    canManageOutboundSupply: boolean;
    canViewFinance: boolean;
    canViewAllInvoices: boolean;
    canViewOwnInvoices: boolean;
    canManageUsers: boolean;
    canAccessAuditLogs: boolean;
  };
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Bahan Operasional' | 'Bahan Baku';
  unit: string; // kg, sak, liter, rim, karton, dus
  currentStock: number;
  minStock: number;
  costPrice: number; // HPP dari Supplier (Rp)
  standardPrice: number; // Harga Standar Koperasi (Rp)
  supplierId: string;
  supplierName: string;
  warehouseLocation: string;
  description: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unit: string;
  referenceNo: string; // PO number or Inbound receipt number
  partyName: string; // Supplier name or Client name
  performedBy: string;
  notes: string;
}

export interface POItem {
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  standardPrice: number;
  targetPrice: number; // Budget / Penawaran yang diajukan oleh Klien
  approvedPrice: number; // Harga final yang disetujui Koperasi
  notes?: string;
  category?: 'Bahan Operasional' | 'Bahan Baku';
  supplierName?: string;
  costPrice?: number; // HPP dari Supplier (Rp)
  supplierCostPrice?: number; // Alias HPP dari Supplier
  supplierStatus?: 'MENUNGGU' | 'DITERIMA' | 'DIPROSES';
}

export type POStatus = 
  | 'DIAJUKAN'
  | 'MENUNGGU_REVIEW'
  | 'NEGOSIASI_HARGA'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'PESANAN_RESMI'
  | 'DIPROSES'
  | 'DIKIRIM'
  | 'SELESAI';

export type PaymentStatus = 'BELUM_BAYAR' | 'MENUNGGU_KONFIRMASI' | 'LUNAS';

export interface TrackingStep {
  id: string;
  title: string;
  description: string;
  timestamp?: string;
  status: 'completed' | 'current' | 'pending';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  orderDate: string;
  requiredDate: string;
  items: POItem[];
  totalClientBudget: number;
  totalApprovedAmount: number;
  status: POStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  clientNotes?: string;
  cooperativeNotes?: string;
  supplierNotes?: string;
  invoiceId?: string;
  officialOrderNumber?: string;
  isOfficialOrder?: boolean;
  convertedAt?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  timeline: TrackingStep[];
  updatedAt: string;
}

export interface SupplierInbound {
  id: string;
  inboundNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  receivedDate: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }>;
  totalAmount: number;
  status: 'DIJADWALKAN' | 'DITERIMA_GUDANG' | 'SELESAI';
  paymentStatus: 'BELUM_DIBAYAR' | 'PROSES_PENCAIRAN' | 'LUNAS';
  invoiceNumber?: string;
  warehouseNotes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'CLIENT_BILL' | 'SUPPLIER_PAYABLE';
  referenceNo: string; // PO number or Inbound number
  partyId: string;
  partyName: string;
  partyEmail: string;
  partyPhone: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentProof?: string;
  paymentDate?: string;
  bankAccount: string;
  notes?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'WHATSAPP' | 'EMAIL';
  recipientName: string;
  recipientContact: string; // Phone or Email
  subject: string;
  message: string;
  status: 'TERKIRIM' | 'TERBACA' | 'GAGAL';
  relatedReference: string;
}
