import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  User,
  InventoryItem,
  StockMovement,
  PurchaseOrder,
  SupplierInbound,
  Invoice,
  NotificationLog,
  POStatus,
  PaymentStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_INVENTORY,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIER_INBOUND,
  INITIAL_INVOICES,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;

  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchUserRole: (userId: string) => void;
  addNewUser: (user: Omit<User, 'id'>, switchActive?: boolean) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => { success: boolean; message: string };
  
  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  
  // Stock Movements
  stockMovements: StockMovement[];
  recordStockMovement: (movement: Omit<StockMovement, 'id' | 'date'>) => void;
  
  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'orderDate' | 'status' | 'paymentStatus' | 'timeline' | 'updatedAt'>) => PurchaseOrder;
  updatePurchaseOrder: (poId: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (poId: string) => { success: boolean; message: string };
  updatePOStatus: (poId: string, status: POStatus, note?: string) => void;
  updatePOPriceAgreement: (poId: string, itemApprovedPrices: { [itemId: string]: number }, note?: string) => void;
  approvePOOffer: (poId: string, notes?: string) => void;
  rejectPOOffer: (poId: string, reason: string) => void;
  convertToOfficialOrder: (poId: string, officialNotes?: string) => PurchaseOrder | undefined;
  
  // Supplier Inbounds
  supplierInbounds: SupplierInbound[];
  createSupplierInbound: (inbound: Omit<SupplierInbound, 'id' | 'inboundNumber' | 'status' | 'paymentStatus'>) => void;
  receiveSupplierInbound: (inboundId: string) => void;
  updateSupplierInbound: (id: string, updates: Partial<SupplierInbound>) => void;
  deleteSupplierInbound: (inboundId: string) => { success: boolean; message: string };
  
  // Invoices & Billing
  invoices: Invoice[];
  uploadPaymentProof: (invoiceId: string, proofUrl: string, paymentMethod: string) => void;
  verifyPayment: (invoiceId: string) => void;
  paySupplierInvoice: (invoiceId: string, paymentMethod: string) => void;
  
  // Notifications
  notifications: NotificationLog[];
  triggerNotification: (
    type: 'WHATSAPP' | 'EMAIL',
    recipientName: string,
    recipientContact: string,
    subject: string,
    message: string,
    reference: string
  ) => void;
  
  // UI Dialog Modals
  activeNotificationModal: { isOpen: boolean; data: NotificationLog | null };
  openNotificationModal: (notif: NotificationLog) => void;
  closeNotificationModal: () => void;
  
  activeInvoiceModal: { isOpen: boolean; data: Invoice | null };
  openInvoiceModal: (inv: Invoice) => void;
  closeInvoiceModal: () => void;

  activePOModal: { isOpen: boolean; data: PurchaseOrder | null };
  openPOModal: (po: PurchaseOrder) => void;
  closePOModal: () => void;

  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'garuda_mp_';
const DATA_VERSION_KEY = 'garuda_mp_clean_v3';

// Clear out old sample data if not migrated
if (typeof window !== 'undefined' && localStorage.getItem(DATA_VERSION_KEY) !== 'yes') {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}inventory`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}movements`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}pos`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}inbounds`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}invoices`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}notifications`);

  // Clean users to purge sample users (client1, client2, supplier1, supplier2)
  const savedUsers = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
  if (savedUsers) {
    try {
      const parsed: User[] = JSON.parse(savedUsers);
      const cleanUsers = parsed.filter(
        (u) =>
          u.id === 'usr-admin-1' ||
          (!u.id.startsWith('usr-client') && !u.id.startsWith('usr-supplier'))
      );
      if (cleanUsers.length === 0) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(INITIAL_USERS));
      } else {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(cleanUsers));
      }
    } catch {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(INITIAL_USERS));
    }
  } else {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(INITIAL_USERS));
  }
  localStorage.setItem(DATA_VERSION_KEY, 'yes');
}

let globalIdCounter = 0;
export const generateUniqueId = (prefix: string) => {
  globalIdCounter += 1;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${globalIdCounter}-${rand}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (u) =>
            u.id === 'usr-admin-1' ||
            (!u.id.startsWith('usr-client') && !u.id.startsWith('usr-supplier'))
        );
        if (filtered.length > 0) {
          return filtered.map((u) => {
            const matchInitial = INITIAL_USERS.find((init) => init.id === u.id);
            return {
              ...u,
              username: u.username || matchInitial?.username || (u.role === 'admin' ? 'admin' : u.id.replace('usr-', '')),
              password: u.password || matchInitial?.password || (u.role === 'admin' ? 'admin123' : `${u.role}123`),
            };
          });
        }
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}is_authenticated`);
    return saved === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        if (parsed.id.startsWith('usr-client') || parsed.id.startsWith('usr-supplier')) {
          return INITIAL_USERS[0];
        }
        const matchInitial = INITIAL_USERS.find((init) => init.id === parsed.id);
        return {
          ...parsed,
          username: parsed.username || matchInitial?.username || (parsed.role === 'admin' ? 'admin' : 'user'),
          password: parsed.password || matchInitial?.password || 'admin123',
        };
      } catch {
        return INITIAL_USERS[0];
      }
    }
    return INITIAL_USERS[0];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}inventory`);
    return saved ? JSON.parse(saved) : [];
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}movements`);
    if (!saved) return [];
    try {
      const parsed: StockMovement[] = JSON.parse(saved);
      const seen = new Set<string>();
      return parsed.map((item, idx) => {
        if (!item.id || seen.has(item.id)) {
          const uniqueId = `${item.id || 'mov'}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
          seen.add(uniqueId);
          return { ...item, id: uniqueId };
        }
        seen.add(item.id);
        return item;
      });
    } catch {
      return [];
    }
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}pos`);
    return saved ? JSON.parse(saved) : [];
  });

  const [supplierInbounds, setSupplierInbounds] = useState<SupplierInbound[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}inbounds`);
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}invoices`);
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // Modal states
  const [activeNotificationModal, setActiveNotificationModal] = useState<{
    isOpen: boolean;
    data: NotificationLog | null;
  }>({ isOpen: false, data: null });

  const [activeInvoiceModal, setActiveInvoiceModal] = useState<{
    isOpen: boolean;
    data: Invoice | null;
  }>({ isOpen: false, data: null });

  const [activePOModal, setActivePOModal] = useState<{
    isOpen: boolean;
    data: PurchaseOrder | null;
  }>({ isOpen: false, data: null });

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}inventory`, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}movements`, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}pos`, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}inbounds`, JSON.stringify(supplierInbounds));
  }, [supplierInbounds]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}is_authenticated`, String(isAuthenticated));
  }, [isAuthenticated]);

  // Firestore synchronization on mount for PuchaseOrder database
  useEffect(() => {
    let isMounted = true;
    const samplePOIds = [
      'po-new-diajukan',
      'po-new-disetujui',
      'po-new-ditolak',
      'po-new-resmi',
      'po-1',
      'po-2',
      'po-3',
    ];
    const syncFirestorePOs = async () => {
      try {
        const poColRef = collection(db, 'purchaseOrders');
        const snapshot = await getDocs(poColRef);
        if (!snapshot.empty) {
          const remotePOs: PurchaseOrder[] = [];
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data() as PurchaseOrder;
            if (
              samplePOIds.includes(docSnap.id) ||
              samplePOIds.includes(data.id) ||
              data.clientName?.includes('Sumber Makmur') ||
              data.clientName?.includes('Berkah Abadi')
            ) {
              // Delete old sample PO from Firestore permanently
              deleteDoc(doc(db, 'purchaseOrders', docSnap.id)).catch(() => {});
            } else {
              remotePOs.push(data);
            }
          }
          if (isMounted) {
            setPurchaseOrders(remotePOs);
          }
        } else {
          // Never seed sample data!
          if (isMounted) {
            setPurchaseOrders([]);
          }
        }
      } catch (err) {
        console.warn('Firestore sync notice:', err);
      }
    };
    syncFirestorePOs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helpers & Authentication
  const login = (usernameInput: string, passwordInput: string): { success: boolean; message?: string } => {
    const trimmedUser = usernameInput.trim().toLowerCase();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, message: 'Username dan kata sandi (password) wajib diisi.' };
    }

    const matchedUser = users.find((u) => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uEmailPrefix = uEmail.split('@')[0];

      if (uName === trimmedUser) return true;
      if (trimmedUser === 'admin' && u.role === 'admin') return true;
      if (trimmedUser === 'client' && u.role === 'client') return true;
      if (trimmedUser === 'supplier' && u.role === 'supplier') return true;
      if (uEmailPrefix === trimmedUser) return true;
      return false;
    });

    if (!matchedUser) {
      return {
        success: false,
        message: 'Username tidak terdaftar. Masukkan username akun yang telah ditentukan (contoh: admin, client1, supplier1).',
      };
    }

    const expectedPassword = matchedUser.password || (matchedUser.role === 'admin' ? 'admin123' : `${matchedUser.role}123`);
    if (trimmedPass !== expectedPassword) {
      return {
        success: false,
        message: 'Kata sandi salah. Silakan coba kembali dengan kata sandi yang sesuai.',
      };
    }

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(matchedUser));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}is_authenticated`, 'true');
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}is_authenticated`, 'false');
  };

  const switchUserRole = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) setCurrentUser(found);
  };

  const addNewUser = (userData: Omit<User, 'id'>, switchActive = false): User => {
    const newUser: User = {
      ...userData,
      id: generateUniqueId('usr'),
      status: userData.status || 'active',
      joinedDate: userData.joinedDate || new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [newUser, ...prev]);
    if (switchActive) {
      setCurrentUser(newUser);
    }
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string): { success: boolean; message: string } => {
    if (currentUser.id === id) {
      return {
        success: false,
        message: 'Tidak dapat menghapus akun yang saat ini sedang aktif digunakan oleh Anda.',
      };
    }
    const target = users.find((u) => u.id === id);
    if (!target) {
      return { success: false, message: 'Data pengguna tidak ditemukan.' };
    }
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (target.role === 'admin' && adminCount <= 1) {
      return {
        success: false,
        message: 'Tidak dapat menghapus satu-satunya akun Administrator Koperasi.',
      };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    return {
      success: true,
      message: `Pengguna ${target.name} (${target.role}) berhasil dihapus dari sistem.`,
    };
  };

  const triggerNotification = (
    _type: 'WHATSAPP' | 'EMAIL',
    _recipientName: string,
    _recipientContact: string,
    _subject: string,
    _message: string,
    _reference: string
  ) => {
    // Disabled: Semua notifikasi WhatsApp & Email telah dihilangkan sesuai permintaan
  };

  const triggerDualNotification = (
    _clientName: string,
    _phone: string,
    _email: string,
    _subject: string,
    _waMsg: string,
    _emailMsg: string,
    _reference: string
  ) => {
    // Disabled: Semua notifikasi WhatsApp & Email telah dihilangkan sesuai permintaan
  };

  // Inventory actions
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: generateUniqueId('itm'),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setInventory((prev) => [newItem, ...prev]);

    // Record initial movement if stock > 0
    if (newItem.currentStock > 0) {
      recordStockMovement({
        itemId: newItem.id,
        itemName: newItem.name,
        sku: newItem.sku,
        type: 'IN',
        quantity: newItem.currentStock,
        unit: newItem.unit,
        referenceNo: 'INIT-STOK',
        partyName: newItem.supplierName,
        performedBy: currentUser.name,
        notes: 'Stok awal pendaftaran barang baru.',
      });
    }
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : item
      )
    );
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const recordStockMovement = (movement: Omit<StockMovement, 'id' | 'date'>) => {
    const newMov: StockMovement = {
      ...movement,
      id: generateUniqueId('mov'),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setStockMovements((prev) => [newMov, ...prev]);
  };

  // PO actions
  const createPurchaseOrder = (
    poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'orderDate' | 'status' | 'paymentStatus' | 'timeline' | 'updatedAt'>
  ): PurchaseOrder => {
    const now = new Date();
    const poNum = `PO-GMP-${now.getFullYear()}-${String(purchaseOrders.length + 44).padStart(4, '0')}`;
    const invNum = `INV-GMP/${now.getFullYear()}/X/${String(invoices.length + 92).padStart(4, '0')}`;
    const invoiceId = generateUniqueId('inv-client');

    const newPO: PurchaseOrder = {
      ...poData,
      id: generateUniqueId('po'),
      poNumber: poNum,
      orderDate: now.toISOString().split('T')[0],
      status: 'DIAJUKAN',
      paymentStatus: 'BELUM_BAYAR',
      invoiceId: invoiceId,
      updatedAt: now.toISOString().replace('T', ' ').substring(0, 16),
      timeline: [
        {
          id: '1',
          title: 'Penawaran PO Diajukan Klien',
          description: `Klien mengajukan penawaran dengan target budget Rp ${poData.totalClientBudget.toLocaleString('id-ID')}`,
          timestamp: now.toISOString().replace('T', ' ').substring(0, 16),
          status: 'completed',
        },
        {
          id: '2',
          title: 'Review Penawaran oleh Koperasi',
          description: 'Pengurus Koperasi meninjau rincian barang, HPP, dan alokasi budget',
          status: 'current',
        },
        {
          id: '3',
          title: 'Konversi Menjadi Pesanan Resmi',
          description: 'Penerbitan Surat Perintah Kerja (SPK) & penyiapan gudang',
          status: 'pending',
        },
        {
          id: '4',
          title: 'Pengiriman Armada Koperasi',
          description: 'Armada logistik mengirimkan pesanan ke alamat tujuan',
          status: 'pending',
        },
        {
          id: '5',
          title: 'Serah Terima Barang & Selesai',
          description: 'Pemeriksaan fisik barang dan penandatanganan BAST',
          status: 'pending',
        },
      ],
    };

    // Auto-create invoice
    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invNum,
      type: 'CLIENT_BILL',
      referenceNo: poNum,
      partyId: poData.clientId,
      partyName: poData.clientName,
      partyEmail: poData.clientEmail,
      partyPhone: poData.clientPhone,
      issueDate: now.toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: poData.totalApprovedAmount || poData.totalClientBudget,
      paidAmount: 0,
      status: 'BELUM_BAYAR',
      bankAccount: 'Bank Mandiri 123-00-9988776-5 a/n Koperasi Garuda Merah Putih',
      notes: `Faktur Penawaran atas PO ${poNum} - Menunggu review & persetujuan koperasi`,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);

    // Save to Firestore
    setDoc(doc(db, 'purchaseOrders', newPO.id), newPO).catch((err) =>
      console.warn('Firestore write error (create PO):', err)
    );

    // Send dual automated notifications: to Admin & Client
    triggerDualNotification(
      'Pengurus Koperasi Garuda Merah Putih',
      '081298765432',
      'pengurus@koperasigarudamp.id',
      `Penawaran PO Baru: ${poNum} dari ${poData.clientName}`,
      `[PENGAJUAN PO] Penawaran PO Baru ${poNum} diterima dari ${poData.clientName} dengan total budget Rp ${poData.totalClientBudget.toLocaleString('id-ID')}. Segera tinjau & tentukan persetujuan di sistem.`,
      `Pemberitahuan: Klien ${poData.clientName} telah mengajukan penawaran PO ${poNum} dengan budget Rp ${poData.totalClientBudget.toLocaleString('id-ID')}.`,
      poNum
    );

    triggerDualNotification(
      poData.clientName,
      poData.clientPhone,
      poData.clientEmail,
      `Penawaran PO ${poNum} Berhasil Diajukan - Koperasi Garuda Merah Putih`,
      `Halo ${poData.clientName}, pengajuan PO ${poNum} Anda dengan budget Rp ${poData.totalClientBudget.toLocaleString('id-ID')} telah berhasil diterima Koperasi Garuda Merah Putih. Status saat ini: DIAJUKAN (Menunggu Review Koperasi).`,
      `Terima kasih. Penawaran PO ${poNum} Anda sedang ditinjau oleh pengurus Koperasi Garuda Merah Putih.`,
      poNum
    );

    return newPO;
  };

  const updatePurchaseOrder = (poId: string, updates: Partial<PurchaseOrder>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          const updated = { ...po, ...updates, updatedAt: nowStr };
          // If items changed, recalculate total client budget and approved amounts if not provided
          if (updates.items && updates.totalClientBudget === undefined) {
            updated.totalClientBudget = updates.items.reduce(
              (sum, it) => sum + (it.targetPrice || it.standardPrice) * it.quantity,
              0
            );
          }
          if (updates.items && updates.totalApprovedAmount === undefined) {
            updated.totalApprovedAmount = updates.items.reduce(
              (sum, it) => sum + (it.approvedPrice || it.targetPrice || it.standardPrice) * it.quantity,
              0
            );
          }
          // Sync to Firestore
          setDoc(doc(db, 'purchaseOrders', poId), updated).catch((err) =>
            console.warn('Firestore update error (update PO):', err)
          );
          return updated;
        }
        return po;
      })
    );

    // If related invoice exists, update partyName or totalAmount
    if (updates.clientName || updates.totalApprovedAmount || updates.totalClientBudget) {
      setInvoices((prev) =>
        prev.map((inv) => {
          const targetPO = purchaseOrders.find((p) => p.id === poId);
          if (targetPO && (inv.referenceNo === targetPO.poNumber || inv.id === targetPO.invoiceId)) {
            return {
              ...inv,
              partyName: updates.clientName || inv.partyName,
              partyEmail: updates.clientEmail || inv.partyEmail,
              partyPhone: updates.clientPhone || inv.partyPhone,
              totalAmount: updates.totalApprovedAmount ?? updates.totalClientBudget ?? inv.totalAmount,
            };
          }
          return inv;
        })
      );
    }
  };

  const deletePurchaseOrder = (poId: string): { success: boolean; message: string } => {
    const target = purchaseOrders.find((p) => p.id === poId);
    if (!target) {
      return { success: false, message: 'Data Purchase Order tidak ditemukan.' };
    }
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== poId));
    // Remove from Firestore
    deleteDoc(doc(db, 'purchaseOrders', poId)).catch((err) =>
      console.warn('Firestore delete error (delete PO):', err)
    );
    // Remove linked invoice if any
    if (target.invoiceId || target.poNumber) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== target.invoiceId && inv.referenceNo !== target.poNumber));
    }
    // Close modal if this PO is active
    if (activePOModal.data?.id === poId) {
      setActivePOModal({ isOpen: false, data: null });
    }
    return { success: true, message: `Purchase Order ${target.poNumber} berhasil dihapus.` };
  };

  const updatePOStatus = (poId: string, newStatus: POStatus, note?: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedTimeline = po.timeline.map((step) => {
      if ((newStatus === 'DISETUJUI' || newStatus === 'PESANAN_RESMI') && step.id === '2') {
        return { ...step, status: 'completed' as const, timestamp: nowStr, description: note || 'Disetujui oleh Koperasi' };
      }
      if (newStatus === 'PESANAN_RESMI' && step.id === '3') {
        return { ...step, status: 'completed' as const, timestamp: nowStr, description: note || 'Dikonversi menjadi Pesanan Resmi' };
      }
      if (newStatus === 'DIPROSES' && (step.id === '1' || step.id === '2' || step.id === '3')) {
        return { ...step, status: 'completed' as const, timestamp: step.timestamp || nowStr };
      }
      if (newStatus === 'DIPROSES' && step.id === '4') {
        return { ...step, status: 'current' as const };
      }
      if (newStatus === 'DIKIRIM') {
        if (Number(step.id) <= 3) return { ...step, status: 'completed' as const };
        if (step.id === '4') return { ...step, status: 'current' as const, timestamp: nowStr, description: note || 'Armada diberangkatkan' };
      }
      if (newStatus === 'SELESAI') {
        return { ...step, status: 'completed' as const, timestamp: step.timestamp || nowStr };
      }
      if (newStatus === 'DITOLAK' && step.id === '2') {
        return { ...step, status: 'completed' as const, timestamp: nowStr, title: 'Penawaran Ditolak', description: note || 'Penawaran belum dapat disetujui' };
      }
      return step;
    });

    // If order is DIKIRIM or SELESAI, deduct stock and record stock movements if not already deducted
    if ((newStatus === 'DIKIRIM' || newStatus === 'SELESAI') && po.status !== 'DIKIRIM' && po.status !== 'SELESAI') {
      const nowStrMov = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const newMovements: StockMovement[] = [];

      po.items.forEach((item) => {
        setInventory((prev) =>
          prev.map((inv) =>
            inv.id === item.itemId
              ? { ...inv, currentStock: Math.max(0, inv.currentStock - item.quantity) }
              : inv
          )
        );

        newMovements.push({
          id: generateUniqueId('mov'),
          date: nowStrMov,
          itemId: item.itemId,
          itemName: item.itemName,
          sku: item.sku,
          type: 'OUT',
          quantity: item.quantity,
          unit: item.unit,
          referenceNo: po.officialOrderNumber || po.poNumber,
          partyName: po.clientName,
          performedBy: currentUser.name,
          notes: `Pengeluaran barang untuk pesanan ${po.officialOrderNumber || po.poNumber}.`,
        });
      });

      if (newMovements.length > 0) {
        setStockMovements((prev) => [...newMovements, ...prev]);
      }
    }

    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          const updated = {
            ...p,
            status: newStatus,
            cooperativeNotes: note || p.cooperativeNotes,
            timeline: updatedTimeline,
            updatedAt: nowStr,
          };
          setDoc(doc(db, 'purchaseOrders', poId), updated).catch(console.warn);
          return updated;
        }
        return p;
      })
    );

    // Auto trigger notification
    const statusLabels: Record<POStatus, string> = {
      DIAJUKAN: 'Penawaran Diajukan (Menunggu Review)',
      MENUNGGU_REVIEW: 'Menunggu Review Koperasi',
      NEGOSIASI_HARGA: 'Negosiasi Harga Penawaran',
      DISETUJUI: 'Penawaran Disetujui',
      DITOLAK: 'Penawaran Ditolak',
      PESANAN_RESMI: 'Pesanan Resmi Diterbitkan',
      DIPROSES: 'Sedang Disiapkan di Gudang',
      DIKIRIM: 'Sedang Dikirim Armada Koperasi',
      SELESAI: 'Pesanan Selesai & Diterima',
    };

    triggerDualNotification(
      po.clientName,
      po.clientPhone,
      po.clientEmail,
      `Status Terkini ${po.poNumber}: ${statusLabels[newStatus]}`,
      `[GARUDA MERAH PUTIH] Status penawaran/pesanan Anda (${po.poNumber}) telah diupdate: ${statusLabels[newStatus]}. ${note ? `Catatan: ${note}` : ''}`,
      `Update Status Pesanan Koperasi Garuda Merah Putih: PO ${po.poNumber} kini berstatus "${statusLabels[newStatus]}". ${note || ''}`,
      po.poNumber
    );
  };

  const approvePOOffer = (poId: string, notes?: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedTimeline = po.timeline.map((step) => {
      if (step.id === '1') return { ...step, status: 'completed' as const };
      if (step.id === '2') {
        return {
          ...step,
          status: 'completed' as const,
          timestamp: nowStr,
          title: 'Penawaran Budget Disetujui',
          description: notes || 'Admin Koperasi menyetujui penawaran harga sesuai budget klien.',
        };
      }
      if (step.id === '3') {
        return {
          ...step,
          status: 'current' as const,
          description: 'Siap dikonversi menjadi Pesanan Resmi (Penerbitan SPK)',
        };
      }
      return step;
    });

    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          const updated = {
            ...p,
            status: 'DISETUJUI' as const,
            approvalNotes: notes || 'Penawaran budget telah disetujui penuh oleh Koperasi Garuda Merah Putih.',
            cooperativeNotes: notes || p.cooperativeNotes,
            timeline: updatedTimeline,
            updatedAt: nowStr,
          };
          setDoc(doc(db, 'purchaseOrders', poId), updated).catch(console.warn);
          return updated;
        }
        return p;
      })
    );

    triggerDualNotification(
      po.clientName,
      po.clientPhone,
      po.clientEmail,
      `Penawaran PO Disetujui: ${po.poNumber}`,
      `Kabar baik! Koperasi Garuda Merah Putih telah MENYETUJUI penawaran budget untuk PO ${po.poNumber} senilai Rp ${po.totalClientBudget.toLocaleString('id-ID')}. ${notes ? `Catatan: ${notes}` : ''} Pesanan siap dikonversi menjadi Pesanan Resmi.`,
      `Pemberitahuan Persetujuan Penawaran PO: Penawaran harga Anda pada PO ${po.poNumber} telah disetujui oleh Koperasi Garuda Merah Putih.`,
      po.poNumber
    );
  };

  const rejectPOOffer = (poId: string, reason: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedTimeline = po.timeline.map((step) => {
      if (step.id === '2') {
        return {
          ...step,
          status: 'completed' as const,
          timestamp: nowStr,
          title: 'Penawaran Ditolak Koperasi',
          description: `Alasan penolakan: ${reason}`,
        };
      }
      return step;
    });

    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          const updated = {
            ...p,
            status: 'DITOLAK' as const,
            rejectionReason: reason,
            cooperativeNotes: `Penawaran ditolak: ${reason}`,
            timeline: updatedTimeline,
            updatedAt: nowStr,
          };
          setDoc(doc(db, 'purchaseOrders', poId), updated).catch(console.warn);
          return updated;
        }
        return p;
      })
    );

    triggerDualNotification(
      po.clientName,
      po.clientPhone,
      po.clientEmail,
      `Pemberitahuan Penawaran PO Ditolak: ${po.poNumber}`,
      `Salam Koperasi. Mohon maaf, penawaran budget untuk PO ${po.poNumber} belum dapat kami setujui saat ini. Alasan: "${reason}". Anda dapat mengajukan penawaran baru dengan penyesuaian budget.`,
      `Pemberitahuan: Penawaran budget pada PO ${po.poNumber} belum dapat dipenuhi oleh Koperasi Garuda Merah Putih. Alasan: ${reason}`,
      po.poNumber
    );
  };

  const convertToOfficialOrder = (poId: string, officialNotes?: string): PurchaseOrder | undefined => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return undefined;

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const officialNo = `SPK-GMP-${now.getFullYear()}-${String(purchaseOrders.filter((p) => p.isOfficialOrder).length + 101).padStart(4, '0')}`;

    const updatedTimeline = po.timeline.map((step) => {
      if (step.id === '1' || step.id === '2') return { ...step, status: 'completed' as const };
      if (step.id === '3') {
        return {
          ...step,
          status: 'completed' as const,
          timestamp: nowStr,
          title: `Pesanan Resmi Diterbitkan (${officialNo})`,
          description: officialNotes || `Dikonversi resmi menjadi Surat Perintah Kerja No. ${officialNo}`,
        };
      }
      if (step.id === '4') {
        return {
          ...step,
          status: 'current' as const,
          description: 'Penyiapan barang & jadwal armada pengiriman ke lokasi pemesan',
        };
      }
      return step;
    });

    let updatedPO: PurchaseOrder | undefined;

    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          updatedPO = {
            ...p,
            status: 'PESANAN_RESMI',
            isOfficialOrder: true,
            officialOrderNumber: officialNo,
            convertedAt: nowStr,
            cooperativeNotes: officialNotes || `Pesanan Resmi diterbitkan: ${officialNo}`,
            timeline: updatedTimeline,
            updatedAt: nowStr,
          };
          setDoc(doc(db, 'purchaseOrders', poId), updatedPO).catch(console.warn);
          return updatedPO;
        }
        return p;
      })
    );

    // Update related invoice reference
    if (po.invoiceId) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === po.invoiceId
            ? {
                ...inv,
                notes: `Faktur Resmi atas Surat Pesanan Kerja ${officialNo} (Ref PO: ${po.poNumber})`,
              }
            : inv
        )
      );
    }

    triggerDualNotification(
      po.clientName,
      po.clientPhone,
      po.clientEmail,
      `Surat Pesanan Resmi Diterbitkan: ${officialNo} (Ref: ${po.poNumber})`,
      `Koperasi Garuda Merah Putih telah resmi menerbitkan Surat Pesanan Kerja (SPK) No. ${officialNo} atas PO ${po.poNumber}. Total nilai: Rp ${(po.totalApprovedAmount || po.totalClientBudget).toLocaleString('id-ID')}. Pesanan sedang disiapkan di gudang.`,
      `Konfirmasi Pesanan Resmi Koperasi Garuda Merah Putih: PO ${po.poNumber} telah dikonversi menjadi Pesanan Resmi ${officialNo}. Silakan cek surat jalan dan faktur di sistem.`,
      officialNo
    );

    return updatedPO;
  };

  const updatePOPriceAgreement = (
    poId: string,
    itemApprovedPrices: { [itemId: string]: number },
    note?: string
  ) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    let newTotal = 0;
    const updatedItems = po.items.map((item) => {
      const approvedPrice = itemApprovedPrices[item.itemId] ?? item.approvedPrice ?? item.targetPrice;
      newTotal += approvedPrice * item.quantity;
      return {
        ...item,
        approvedPrice,
      };
    });

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              items: updatedItems,
              totalApprovedAmount: newTotal,
              status: 'DISETUJUI',
              cooperativeNotes: note || 'Harga kesepakatan telah disetujui bersama.',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : p
      )
    );

    // Update corresponding invoice amount
    if (po.invoiceId) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === po.invoiceId
            ? { ...inv, totalAmount: newTotal, notes: `Disesuaikan dengan harga kesepakatan final Rp ${newTotal.toLocaleString('id-ID')}` }
            : inv
        )
      );
    }

    triggerDualNotification(
      po.clientName,
      po.clientPhone,
      po.clientEmail,
      `Kesepakatan Harga Disetujui: PO ${po.poNumber}`,
      `Kabar baik! Koperasi Garuda Merah Putih telah menyetujui harga PO ${po.poNumber} dengan total Rp ${newTotal.toLocaleString('id-ID')}. Pesanan akan segera disiapkan di gudang.`,
      `Koperasi Garuda Merah Putih mengonfirmasi persetujuan harga pada PO ${po.poNumber}. Total tagihan: Rp ${newTotal.toLocaleString('id-ID')}.`,
      po.poNumber
    );
  };

  // Supplier Inbounds
  const createSupplierInbound = (
    inboundData: Omit<SupplierInbound, 'id' | 'inboundNumber' | 'status' | 'paymentStatus'>
  ) => {
    const now = new Date();
    const inboundNum = `INB-GMP-${now.getFullYear()}-${String(supplierInbounds.length + 20).padStart(4, '0')}`;
    const invNum = `INV-SUP-${now.getFullYear()}-${String(invoices.length + 16).padStart(4, '0')}`;
    const newInbound: SupplierInbound = {
      ...inboundData,
      id: generateUniqueId('inb'),
      inboundNumber: inboundNum,
      status: 'DIJADWALKAN',
      paymentStatus: 'BELUM_DIBAYAR',
      invoiceNumber: invNum,
    };

    // Create supplier invoice payable
    const newInvoice: Invoice = {
      id: generateUniqueId('inv-sup'),
      invoiceNumber: invNum,
      type: 'SUPPLIER_PAYABLE',
      referenceNo: inboundNum,
      partyId: inboundData.supplierId,
      partyName: inboundData.supplierName,
      partyEmail: inboundData.supplierEmail,
      partyPhone: inboundData.supplierPhone,
      issueDate: inboundData.receivedDate,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: inboundData.totalAmount,
      paidAmount: 0,
      status: 'BELUM_BAYAR',
      bankAccount: `Rekening Supplier: ${inboundData.supplierName}`,
      notes: `Hutang dagang Koperasi Garuda Merah Putih atas penerimaan barang ${inboundNum}`,
    };

    setSupplierInbounds((prev) => [newInbound, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);

    triggerDualNotification(
      inboundData.supplierName,
      inboundData.supplierPhone,
      inboundData.supplierEmail,
      `Jadwal Pengiriman Masuk: ${inboundNum}`,
      `Salam Kemitraan! Pengiriman barang ${inboundNum} telah dijadwalkan masuk ke Gudang Koperasi Garuda Merah Putih pada ${inboundData.receivedDate}. Tagihan ${invNum} telah dicatat.`,
      `Pengiriman barang ke Gudang Koperasi Garuda Merah Putih dijadwalkan pada ${inboundData.receivedDate}. Rincian tercatat di portal supplier.`,
      inboundNum
    );
  };

  const receiveSupplierInbound = (inboundId: string) => {
    const inbound = supplierInbounds.find((i) => i.id === inboundId);
    if (!inbound || inbound.status === 'SELESAI') return;

    const nowStrMov = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newMovements: StockMovement[] = [];

    // 1. Update inventory stocks
    inbound.items.forEach((item) => {
      setInventory((prev) =>
        prev.map((inv) =>
          inv.id === item.itemId
            ? { ...inv, currentStock: inv.currentStock + item.quantity }
            : inv
        )
      );

      // Record stock movement IN
      newMovements.push({
        id: generateUniqueId('mov'),
        date: nowStrMov,
        itemId: item.itemId,
        itemName: item.itemName,
        sku: inventory.find((i) => i.id === item.itemId)?.sku || 'SKU-INB',
        type: 'IN',
        quantity: item.quantity,
        unit: item.unit,
        referenceNo: inbound.inboundNumber,
        partyName: inbound.supplierName,
        performedBy: currentUser.name,
        notes: `Penerimaan barang dari supplier ${inbound.supplierName}. Verifikasi kondisi baik.`,
      });
    });

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    // 2. Mark inbound as SELESAI
    setSupplierInbounds((prev) =>
      prev.map((i) => (i.id === inboundId ? { ...i, status: 'SELESAI' } : i))
    );

    // Notification to supplier
    triggerDualNotification(
      inbound.supplierName,
      inbound.supplierPhone,
      inbound.supplierEmail,
      `Barang Diterima & Masuk Gudang: ${inbound.inboundNumber}`,
      `Barang dari ${inbound.supplierName} (${inbound.inboundNumber}) telah resmi diterima dan masuk stok Koperasi Garuda Merah Putih. Tagihan masuk antrean pencairan. Terima kasih!`,
      `Konfirmasi Penerimaan: Barang atas PO Masuk ${inbound.inboundNumber} telah dicek dan masuk stok gudang koperasi.`,
      inbound.inboundNumber
    );
  };

  const updateSupplierInbound = (id: string, updates: Partial<SupplierInbound>) => {
    setSupplierInbounds((prev) =>
      prev.map((inbound) => {
        if (inbound.id !== id) return inbound;
        const updated = { ...inbound, ...updates };

        if (updates.totalAmount !== undefined || updates.supplierName || updates.receivedDate) {
          setInvoices((prevInv) =>
            prevInv.map((inv) =>
              inv.referenceNo === inbound.inboundNumber
                ? {
                    ...inv,
                    totalAmount: updates.totalAmount ?? inv.totalAmount,
                    partyName: updates.supplierName ?? inv.partyName,
                    partyPhone: updates.supplierPhone ?? inv.partyPhone,
                    issueDate: updates.receivedDate ?? inv.issueDate,
                  }
                : inv
            )
          );
        }
        return updated;
      })
    );
  };

  const deleteSupplierInbound = (inboundId: string): { success: boolean; message: string } => {
    const target = supplierInbounds.find((i) => i.id === inboundId);
    if (!target) {
      return { success: false, message: 'Data penerimaan supplier tidak ditemukan.' };
    }

    setSupplierInbounds((prev) => prev.filter((i) => i.id !== inboundId));

    if (target.inboundNumber) {
      setInvoices((prev) => prev.filter((inv) => inv.referenceNo !== target.inboundNumber));
    }

    deleteDoc(doc(db, 'supplierInbounds', inboundId)).catch((err) =>
      console.warn('Firestore delete error (delete inbound):', err)
    );

    return { success: true, message: `Penerimaan supplier ${target.inboundNumber} berhasil dihapus.` };
  };

  // Invoices & Billing
  const uploadPaymentProof = (invoiceId: string, proofUrl: string, paymentMethod: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              status: 'MENUNGGU_KONFIRMASI',
              paymentProof: proofUrl,
              paymentMethod,
              paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : i
      )
    );

    // Update PO payment status
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.invoiceId === invoiceId ? { ...po, paymentStatus: 'MENUNGGU_KONFIRMASI' } : po
      )
    );

    // Alert koperasi admin
    triggerDualNotification(
      'Bendahara Koperasi Garuda Merah Putih',
      '081298765432',
      'bendahara@koperasigarudamp.id',
      `Bukti Pembayaran Diunggah: ${inv.invoiceNumber}`,
      `Klien ${inv.partyName} telah mengirimkan bukti pembayaran sebesar Rp ${inv.totalAmount.toLocaleString('id-ID')} via ${paymentMethod} untuk tagihan ${inv.invoiceNumber}. Silakan verifikasi di menu Keuangan.`,
      `Pemberitahuan: Bukti bayar baru telah diunggah untuk tagihan ${inv.invoiceNumber}. Periksa rekening mutasi dan lakukan verifikasi.`,
      inv.invoiceNumber
    );
  };

  const verifyPayment = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              status: 'LUNAS',
              paidAmount: i.totalAmount,
              paymentDate: i.paymentDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : i
      )
    );

    // Update PO payment status
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.invoiceId === invoiceId ? { ...po, paymentStatus: 'LUNAS' } : po
      )
    );

    triggerDualNotification(
      inv.partyName,
      inv.partyPhone,
      inv.partyEmail,
      `Kuitansi Lunas: ${inv.invoiceNumber}`,
      `Terima kasih! Pembayaran tagihan ${inv.invoiceNumber} sebesar Rp ${inv.totalAmount.toLocaleString('id-ID')} telah berhasil diverifikasi oleh Koperasi Garuda Merah Putih. Status: LUNAS.`,
      `Kuitansi Resmi Koperasi Garuda Merah Putih: Pembayaran Anda sebesar Rp ${inv.totalAmount.toLocaleString('id-ID')} telah lunas. Terima kasih atas kerja sama Anda.`,
      inv.invoiceNumber
    );
  };

  const paySupplierInvoice = (invoiceId: string, paymentMethod: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              status: 'LUNAS',
              paidAmount: i.totalAmount,
              paymentMethod,
              paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : i
      )
    );

    // Update supplier inbound status
    setSupplierInbounds((prev) =>
      prev.map((s) =>
        s.invoiceNumber === inv.invoiceNumber ? { ...s, paymentStatus: 'LUNAS' } : s
      )
    );

    triggerDualNotification(
      inv.partyName,
      inv.partyPhone,
      inv.partyEmail,
      `Pencairan Dana Pembayaran: ${inv.invoiceNumber}`,
      `Koperasi Garuda Merah Putih telah mentransfer pembayaran sebesar Rp ${inv.totalAmount.toLocaleString('id-ID')} via ${paymentMethod} ke rekening ${inv.partyName}. Mohon periksa mutasi rekening Anda.`,
      `Konfirmasi Pembayaran Tagihan: Dana pembayaran Rp ${inv.totalAmount.toLocaleString('id-ID')} telah berhasil dicairkan oleh Koperasi Garuda Merah Putih.`,
      inv.invoiceNumber
    );
  };

  // Modals
  const openNotificationModal = (notif: NotificationLog) => {
    setActiveNotificationModal({ isOpen: true, data: notif });
  };
  const closeNotificationModal = () => {
    setActiveNotificationModal({ isOpen: false, data: null });
  };

  const openInvoiceModal = (inv: Invoice) => {
    setActiveInvoiceModal({ isOpen: true, data: inv });
  };
  const closeInvoiceModal = () => {
    setActiveInvoiceModal({ isOpen: false, data: null });
  };

  const openPOModal = (po: PurchaseOrder) => {
    setActivePOModal({ isOpen: true, data: po });
  };
  const closePOModal = () => {
    setActivePOModal({ isOpen: false, data: null });
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setInventory([]);
    setStockMovements([]);
    setPurchaseOrders([]);
    setSupplierInbounds([]);
    setInvoices([]);
    setNotifications([]);
    localStorage.clear();
    localStorage.setItem(DATA_VERSION_KEY, 'yes');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentUser,
        users,
        setCurrentUser,
        switchUserRole,
        addNewUser,
        updateUser,
        deleteUser,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        stockMovements,
        recordStockMovement,
        purchaseOrders,
        createPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        updatePOStatus,
        updatePOPriceAgreement,
        approvePOOffer,
        rejectPOOffer,
        convertToOfficialOrder,
        supplierInbounds,
        createSupplierInbound,
        receiveSupplierInbound,
        updateSupplierInbound,
        deleteSupplierInbound,
        invoices,
        uploadPaymentProof,
        verifyPayment,
        paySupplierInvoice,
        notifications,
        triggerNotification,
        activeNotificationModal,
        openNotificationModal,
        closeNotificationModal,
        activeInvoiceModal,
        openInvoiceModal,
        closeInvoiceModal,
        activePOModal,
        openPOModal,
        closePOModal,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
