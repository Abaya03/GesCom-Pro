import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CompanySettings,
  User,
  Client,
  Supplier,
  Category,
  Product,
  Quote,
  DeliveryNote,
  Invoice,
  Payment,
  Expense,
  AuditLog,
  AppNotification,
  BackupData,
  PermissionKey,
  QuoteStatus,
  DeliveryStatus,
  InvoiceStatus,
  DocumentItem,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CLIENTS,
  INITIAL_SUPPLIERS,
  INITIAL_QUOTES,
  INITIAL_DELIVERY_NOTES,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import { generateDocumentNumber } from '../utils/numbering';

interface AppContextType {
  // Authentication & Current active user
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  login: (user: User, rememberMe?: boolean) => void;
  logout: () => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  hasPermission: (permission: PermissionKey) => boolean;

  // Main collections
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;

  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductStock: (id: string, quantityChange: number) => void;

  quotes: Quote[];
  createQuote: (data: Partial<Quote> & { clientId: string; items: DocumentItem[] }) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => void;
  convertQuoteToDeliveryNote: (quoteId: string) => DeliveryNote;
  convertQuoteToInvoice: (quoteId: string) => Invoice;

  deliveryNotes: DeliveryNote[];
  createDeliveryNote: (data: Partial<DeliveryNote> & { clientId: string; items: DocumentItem[] }) => DeliveryNote;
  updateDeliveryNote: (id: string, data: Partial<DeliveryNote>) => void;
  deleteDeliveryNote: (id: string) => void;
  updateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  convertDeliveryNoteToInvoice: (deliveryNoteId: string) => Invoice;

  invoices: Invoice[];
  createInvoice: (data: Partial<Invoice> & { clientId: string; items: DocumentItem[] }) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;

  payments: Payment[];
  addPayment: (data: Omit<Payment, 'id' | 'number' | 'createdAt' | 'createdBy'>) => Payment;
  deletePayment: (id: string) => void;

  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id' | 'number' | 'createdAt' | 'createdBy'>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  auditLogs: AuditLog[];
  logAction: (
    action: AuditLog['action'],
    entityType: AuditLog['entityType'],
    entityId: string | undefined,
    entityNumber: string | undefined,
    description: string,
    details?: Record<string, unknown>
  ) => void;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // System & Data utilities
  exportDatabaseBackup: () => BackupData;
  restoreDatabaseBackup: (backup: BackupData) => boolean;
  resetToDefaultData: () => void;

  // Global Quick Action Trigger
  activeModal: string | null;
  setActiveModal: (modalName: string | null) => void;
  modalPayload: unknown;
  setModalPayload: (payload: unknown) => void;
}

const STORAGE_KEY = 'GESTCOM_PRO_DATA_V1';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial constants
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_company`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.managerName === 'Brahim Ould Ahmed' || !parsed.managerName) {
          parsed.managerName = 'Brahim Med Moustapha';
        }
        return parsed;
      }
      return INITIAL_COMPANY_SETTINGS;
    } catch {
      return INITIAL_COMPANY_SETTINGS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map((u) => {
          if (u.id === 'usr_admin' || u.username === 'admin' || u.name === 'Brahim Ould Ahmed') {
            return {
              ...u,
              username: 'Abaya',
              name: 'Brahim Med Moustapha',
              password: 'medlemin',
              email: u.email === 'brahim.ahmed@gestcom-pro.com' ? 'Abaya03@gmail.com' : u.email,
            };
          }
          return u;
        });
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => users[0] || INITIAL_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const remembered = localStorage.getItem(`${STORAGE_KEY}_auth_remember`);
      return remembered === 'true';
    } catch {
      return false;
    }
  });

  const login = useCallback((user: User, rememberMe: boolean = false) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      if (rememberMe) {
        localStorage.setItem(`${STORAGE_KEY}_auth_remember`, 'true');
        localStorage.setItem(`${STORAGE_KEY}_last_user_id`, user.id);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_auth_remember`);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_auth_remember`);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_clients`);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_quotes`);
      return saved ? JSON.parse(saved) : INITIAL_QUOTES;
    } catch {
      return INITIAL_QUOTES;
    }
  });

  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_deliveryNotes`);
      return saved ? JSON.parse(saved) : INITIAL_DELIVERY_NOTES;
    } catch {
      return INITIAL_DELIVERY_NOTES;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_auditLogs`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Modal controls
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<unknown>(null);

  // Persistence to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_company`, JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_quotes`, JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_deliveryNotes`, JSON.stringify(deliveryNotes));
  }, [deliveryNotes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_auditLogs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Log action helper
  const logAction = useCallback(
    (
      action: AuditLog['action'],
      entityType: AuditLog['entityType'],
      entityId: string | undefined,
      entityNumber: string | undefined,
      description: string,
      details?: Record<string, unknown>
    ) => {
      const newLog: AuditLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        entityType,
        entityId,
        entityNumber,
        description,
        details,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  // Permission verification
  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      if (currentUser.role === 'admin') return true;
      return !!currentUser.permissions?.[permission];
    },
    [currentUser]
  );

  // Notifications generator based on actual state
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Check overdue invoices
    invoices.forEach((inv) => {
      if (inv.status === 'en_retard' || (inv.dueDate < today && inv.remainingAmount > 0 && inv.status !== 'annulee')) {
        list.push({
          id: `notif_due_${inv.id}`,
          type: 'danger',
          title: `Facture en retard : ${inv.number}`,
          message: `Le client ${inv.clientSnapshot?.name || 'Client'} a un solde impayé de ${inv.remainingAmount} ${inv.currency}. Échéance : ${inv.dueDate}`,
          linkTab: 'invoices',
          linkId: inv.id,
          timestamp: inv.dueDate,
          read: false,
        });
      }
    });

    // Check expiring quotes
    quotes.forEach((q) => {
      if (q.status === 'en_attente' || q.status === 'envoye') {
        const exp = new Date(q.expiryDate);
        const now = new Date();
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 5 && diffDays >= 0) {
          list.push({
            id: `notif_exp_${q.id}`,
            type: 'warning',
            title: `Devis bientôt expiré : ${q.number}`,
            message: `Le devis pour ${q.clientSnapshot?.name} expire dans ${diffDays} jour(s).`,
            linkTab: 'quotes',
            linkId: q.id,
            timestamp: q.expiryDate,
            read: false,
          });
        }
      }
    });

    // Check low stock
    products.forEach((p) => {
      if (p.type === 'product' && p.currentStock <= p.minStockAlert) {
        list.push({
          id: `notif_stock_${p.id}`,
          type: 'warning',
          title: `Alerte Stock : ${p.name}`,
          message: `Stock actuel : ${p.currentStock} ${p.unit} (Seuil d'alerte : ${p.minStockAlert})`,
          linkTab: 'products',
          linkId: p.id,
          timestamp: p.updatedAt,
          read: false,
        });
      }
    });

    return list;
  }, [invoices, quotes, products]);

  const markNotificationAsRead = useCallback((_id: string) => {
    // dynamically calculated
  }, []);

  const clearNotifications = useCallback(() => {
    // dynamically calculated
  }, []);

  // Update Company Settings
  const updateCompanySettings = useCallback(
    (newSettings: Partial<CompanySettings>) => {
      setCompanySettings((prev) => {
        const updated = { ...prev, ...newSettings };
        logAction('update', 'parametres', prev.id, 'PARAM-ENTREPRISE', 'Mise à jour des paramètres de l\'entreprise');
        return updated;
      });
    },
    [logAction]
  );

  // User Management
  const addUser = useCallback(
    (userData: Omit<User, 'id'>) => {
      const newUser: User = {
        ...userData,
        id: 'usr_' + Date.now(),
      };
      setUsers((prev) => [...prev, newUser]);
      logAction('create', 'utilisateur', newUser.id, newUser.name, `Création du compte utilisateur : ${newUser.name} (${newUser.role})`);
    },
    [logAction]
  );

  const updateUser = useCallback(
    (id: string, userData: Partial<User>) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === id) {
            const updated = { ...u, ...userData };
            logAction('update', 'utilisateur', id, updated.name, `Modification du compte utilisateur : ${updated.name}`);
            return updated;
          }
          return u;
        })
      );
    },
    [logAction]
  );

  const deleteUser = useCallback(
    (id: string) => {
      const u = users.find((x) => x.id === id);
      if (u) {
        setUsers((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'utilisateur', id, u.name, `Suppression de l'utilisateur : ${u.name}`);
      }
    },
    [users, logAction]
  );

  // Client Management
  const addClient = useCallback(
    (clientData: Omit<Client, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
      const year = new Date().getFullYear();
      const nextNum = (clients.length + 1).toString().padStart(5, '0');
      const newClient: Client = {
        ...clientData,
        id: 'cli_' + Date.now(),
        code: `CLI-${year}-${nextNum}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setClients((prev) => [newClient, ...prev]);
      logAction('create', 'client', newClient.id, newClient.code, `Création du client : ${newClient.name} (${newClient.code})`);
      return newClient;
    },
    [clients.length, logAction]
  );

  const updateClient = useCallback(
    (id: string, data: Partial<Client>) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const updated = { ...c, ...data, updatedAt: new Date().toISOString() };
            logAction('update', 'client', id, updated.code, `Mise à jour de la fiche client : ${updated.name}`);
            return updated;
          }
          return c;
        })
      );
    },
    [logAction]
  );

  const deleteClient = useCallback(
    (id: string) => {
      const c = clients.find((x) => x.id === id);
      if (c) {
        setClients((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'client', id, c.code, `Suppression du client : ${c.name}`);
      }
    },
    [clients, logAction]
  );

  // Supplier Management
  const addSupplier = useCallback(
    (supplierData: Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
      const year = new Date().getFullYear();
      const nextNum = (suppliers.length + 1).toString().padStart(5, '0');
      const newSupplier: Supplier = {
        ...supplierData,
        id: 'sup_' + Date.now(),
        code: `FRS-${year}-${nextNum}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [newSupplier, ...prev]);
      logAction('create', 'fournisseur', newSupplier.id, newSupplier.code, `Création du fournisseur : ${newSupplier.name}`);
      return newSupplier;
    },
    [suppliers.length, logAction]
  );

  const updateSupplier = useCallback(
    (id: string, data: Partial<Supplier>) => {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const updated = { ...s, ...data, updatedAt: new Date().toISOString() };
            logAction('update', 'fournisseur', id, updated.code, `Mise à jour du fournisseur : ${updated.name}`);
            return updated;
          }
          return s;
        })
      );
    },
    [logAction]
  );

  const deleteSupplier = useCallback(
    (id: string) => {
      const s = suppliers.find((x) => x.id === id);
      if (s) {
        setSuppliers((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'fournisseur', id, s.code, `Suppression du fournisseur : ${s.name}`);
      }
    },
    [suppliers, logAction]
  );

  // Category Management
  const addCategory = useCallback(
    (catData: Omit<Category, 'id'>) => {
      const newCat: Category = {
        ...catData,
        id: 'cat_' + Date.now(),
      };
      setCategories((prev) => [...prev, newCat]);
    },
    []
  );

  const updateCategory = useCallback((id: string, catData: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...catData } : c)));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Product Management
  const addProduct = useCallback(
    (prodData: Omit<Product, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
      const nextNum = (products.length + 1).toString().padStart(4, '0');
      const prefix = prodData.type === 'service' ? 'SRV' : 'PRD';
      const newProd: Product = {
        ...prodData,
        id: 'prod_' + Date.now(),
        code: `${prefix}-${nextNum}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProd, ...prev]);
      logAction('create', 'produit', newProd.id, newProd.code, `Création ${prodData.type === 'service' ? 'du service' : 'du produit'} : ${newProd.name}`);
      return newProd;
    },
    [products.length, logAction]
  );

  const updateProduct = useCallback(
    (id: string, data: Partial<Product>) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const updated = { ...p, ...data, updatedAt: new Date().toISOString() };
            logAction('update', 'produit', id, updated.code, `Mise à jour : ${updated.name}`);
            return updated;
          }
          return p;
        })
      );
    },
    [logAction]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const p = products.find((x) => x.id === id);
      if (p) {
        setProducts((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'produit', id, p.code, `Suppression de l'article : ${p.name}`);
      }
    },
    [products, logAction]
  );

  const updateProductStock = useCallback((id: string, quantityChange: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id && p.type === 'product') {
          return {
            ...p,
            currentStock: Math.max(0, p.currentStock + quantityChange),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  }, []);

  // Quotes (Devis)
  const createQuote = useCallback(
    (data: Partial<Quote> & { clientId: string; items: DocumentItem[] }) => {
      const client = clients.find((c) => c.id === data.clientId) || INITIAL_CLIENTS[0];
      const { formattedNumber, nextConfig } = generateDocumentNumber(companySettings.numbering.devis);

      // update numbering
      setCompanySettings((prev) => ({
        ...prev,
        numbering: {
          ...prev.numbering,
          devis: nextConfig,
        },
      }));

      // Calculate totals
      let subtotalHT = 0;
      let totalHT = 0;

      data.items.forEach((it) => {
        const lineBase = it.quantity * it.unitPrice;
        subtotalHT += lineBase;
        totalHT += lineBase;
      });

      // Manual TVA: if applyVAT is explicitly provided, use it. Otherwise, if totalVAT is specified or defaults to true.
      const applyVAT = data.applyVAT !== undefined ? data.applyVAT : (data.totalVAT !== undefined ? data.totalVAT > 0 : true);
      const vatRate = data.vatRate !== undefined ? data.vatRate : 16;
      const totalVAT = applyVAT ? (data.totalVAT !== undefined ? data.totalVAT : Math.round(totalHT * (vatRate / 100) * 100) / 100) : 0;
      const totalTTC = totalHT + totalVAT;

      const newQuote: Quote = {
        id: 'dev_' + Date.now(),
        number: data.number || formattedNumber,
        date: data.date || new Date().toISOString().split('T')[0],
        expiryDate: data.expiryDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        clientId: client.id,
        clientSnapshot: client,
        object: data.object || '',
        salesperson: data.salesperson || currentUser.name,
        currency: data.currency || companySettings.primaryCurrencyCode,
        items: data.items.map((it) => ({
          ...it,
          discountPercent: 0,
          vatRate: applyVAT ? vatRate : 0,
          totalHT: it.quantity * it.unitPrice,
          totalVAT: applyVAT ? Math.round(it.quantity * it.unitPrice * (vatRate / 100) * 100) / 100 : 0,
          totalTTC: applyVAT ? it.quantity * it.unitPrice * (1 + vatRate / 100) : it.quantity * it.unitPrice,
        })),
        subtotalHT,
        totalDiscount: 0,
        totalHT,
        applyVAT,
        vatRate,
        totalVAT,
        totalTTC,
        notes: data.notes || '',
        terms: data.terms || companySettings.termsAndConditions,
        deliveryTime: data.deliveryTime || '7 jours',
        validityDays: data.validityDays || 30,
        status: data.status || 'brouillon',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };

      setQuotes((prev) => [newQuote, ...prev]);
      logAction('create', 'devis', newQuote.id, newQuote.number, `Création du devis ${newQuote.number} pour ${client.name} (Total: ${newQuote.totalTTC} ${newQuote.currency})`, {
        totalTTC: newQuote.totalTTC,
      });

      return newQuote;
    },
    [clients, companySettings, currentUser.name, logAction]
  );

  const updateQuote = useCallback(
    (id: string, data: Partial<Quote>) => {
      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id === id) {
            let items = data.items || q.items;
            let subtotalHT = 0;
            let totalHT = 0;

            items.forEach((it) => {
              const lineBase = it.quantity * it.unitPrice;
              subtotalHT += lineBase;
              totalHT += lineBase;
            });

            const applyVAT = data.applyVAT !== undefined ? data.applyVAT : (data.totalVAT !== undefined ? data.totalVAT > 0 : (q.applyVAT !== undefined ? q.applyVAT : q.totalVAT > 0));
            const vatRate = data.vatRate !== undefined ? data.vatRate : (q.vatRate || 16);
            const totalVAT = applyVAT ? (data.totalVAT !== undefined ? data.totalVAT : Math.round(totalHT * (vatRate / 100) * 100) / 100) : 0;
            const totalTTC = totalHT + totalVAT;

            const updated: Quote = {
              ...q,
              ...data,
              items: items.map((it) => ({
                ...it,
                discountPercent: 0,
                vatRate: applyVAT ? vatRate : 0,
                totalHT: it.quantity * it.unitPrice,
                totalVAT: applyVAT ? Math.round(it.quantity * it.unitPrice * (vatRate / 100) * 100) / 100 : 0,
                totalTTC: applyVAT ? it.quantity * it.unitPrice * (1 + vatRate / 100) : it.quantity * it.unitPrice,
              })),
              subtotalHT,
              totalDiscount: 0,
              totalHT,
              applyVAT,
              vatRate,
              totalVAT,
              totalTTC,
              updatedAt: new Date().toISOString(),
            };

            logAction('update', 'devis', id, updated.number, `Mise à jour du devis ${updated.number}`);
            return updated;
          }
          return q;
        })
      );
    },
    [logAction]
  );

  const deleteQuote = useCallback(
    (id: string) => {
      const q = quotes.find((x) => x.id === id);
      if (q) {
        setQuotes((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'devis', id, q.number, `Suppression du devis ${q.number}`);
      }
    },
    [quotes, logAction]
  );

  const updateQuoteStatus = useCallback(
    (id: string, status: QuoteStatus) => {
      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id === id) {
            logAction('status_change', 'devis', id, q.number, `Changement statut devis ${q.number} : ${q.status} -> ${status}`);
            return { ...q, status, updatedAt: new Date().toISOString() };
          }
          return q;
        })
      );
    },
    [logAction]
  );

  // Delivery Notes (Bons de livraison)
  const createDeliveryNote = useCallback(
    (data: Partial<DeliveryNote> & { clientId: string; items: DocumentItem[] }) => {
      const client = clients.find((c) => c.id === data.clientId) || INITIAL_CLIENTS[0];
      const { formattedNumber, nextConfig } = generateDocumentNumber(companySettings.numbering.bl);

      setCompanySettings((prev) => ({
        ...prev,
        numbering: {
          ...prev.numbering,
          bl: nextConfig,
        },
      }));

      const newBL: DeliveryNote = {
        id: 'bl_' + Date.now(),
        number: data.number || formattedNumber,
        date: data.date || new Date().toISOString().split('T')[0],
        clientId: client.id,
        clientSnapshot: client,
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        orderReference: data.orderReference || '',
        deliveryAddress: data.deliveryAddress || `${client.address}, ${client.city}`,
        carrier: data.carrier || 'Flotte Entreprise',
        driverName: data.driverName || '',
        items: data.items.map((it) => ({
          ...it,
          quantityDelivered: it.quantityDelivered ?? it.quantity,
        })),
        notes: data.notes || '',
        status: data.status || 'prepare',
        preparedBy: data.preparedBy || currentUser.name,
        deliveredBy: data.deliveredBy || '',
        receivedByCustomerDate: data.receivedByCustomerDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };

      setDeliveryNotes((prev) => [newBL, ...prev]);

      // Deduct stock for delivered items
      newBL.items.forEach((it) => {
        if (it.productId) {
          updateProductStock(it.productId, -it.quantity);
        }
      });

      logAction('create', 'bon_livraison', newBL.id, newBL.number, `Création du bon de livraison ${newBL.number} pour ${client.name}`);

      return newBL;
    },
    [clients, companySettings, currentUser.name, logAction, updateProductStock]
  );

  const updateDeliveryNote = useCallback(
    (id: string, data: Partial<DeliveryNote>) => {
      setDeliveryNotes((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            const updated = { ...b, ...data, updatedAt: new Date().toISOString() };
            logAction('update', 'bon_livraison', id, updated.number, `Mise à jour du bon de livraison ${updated.number}`);
            return updated;
          }
          return b;
        })
      );
    },
    [logAction]
  );

  const deleteDeliveryNote = useCallback(
    (id: string) => {
      const bl = deliveryNotes.find((x) => x.id === id);
      if (bl) {
        setDeliveryNotes((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'bon_livraison', id, bl.number, `Suppression du bon de livraison ${bl.number}`);
      }
    },
    [deliveryNotes, logAction]
  );

  const updateDeliveryStatus = useCallback(
    (id: string, status: DeliveryStatus) => {
      setDeliveryNotes((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            logAction('status_change', 'bon_livraison', id, b.number, `Changement statut BL ${b.number} : ${b.status} -> ${status}`);
            return { ...b, status, updatedAt: new Date().toISOString() };
          }
          return b;
        })
      );
    },
    [logAction]
  );

  // Invoices (Factures)
  const createInvoice = useCallback(
    (data: Partial<Invoice> & { clientId: string; items: DocumentItem[] }) => {
      const client = clients.find((c) => c.id === data.clientId) || INITIAL_CLIENTS[0];
      const { formattedNumber, nextConfig } = generateDocumentNumber(companySettings.numbering.facture);

      setCompanySettings((prev) => ({
        ...prev,
        numbering: {
          ...prev.numbering,
          facture: nextConfig,
        },
      }));

      // Calculate totals
      let subtotalHT = 0;
      let totalHT = 0;

      data.items.forEach((it) => {
        const lineBase = it.quantity * it.unitPrice;
        subtotalHT += lineBase;
        totalHT += lineBase;
      });

      const applyVAT = data.applyVAT !== undefined ? data.applyVAT : (data.totalVAT !== undefined ? data.totalVAT > 0 : true);
      const vatRate = data.vatRate !== undefined ? data.vatRate : 16;
      const totalVAT = applyVAT ? (data.totalVAT !== undefined ? data.totalVAT : Math.round(totalHT * (vatRate / 100) * 100) / 100) : 0;

      const shippingFee = data.shippingFee || 0;
      const extraDiscount = data.extraDiscount || 0;
      const totalTTC = Math.max(0, totalHT + totalVAT + shippingFee - extraDiscount);
      const paidAmount = data.paidAmount || 0;
      const remainingAmount = Math.max(0, totalTTC - paidAmount);

      let status: InvoiceStatus = data.status || 'emise';
      if (paidAmount >= totalTTC && totalTTC > 0) {
        status = 'payee';
      } else if (paidAmount > 0) {
        status = 'partiellement_payee';
      }

      const daysToAdd = client.paymentTermsDays || 30;
      const dueDate =
        data.dueDate ||
        new Date(Date.now() + daysToAdd * 24 * 3600 * 1000).toISOString().split('T')[0];

      const newInvoice: Invoice = {
        id: 'fac_' + Date.now(),
        number: data.number || formattedNumber,
        date: data.date || new Date().toISOString().split('T')[0],
        dueDate,
        clientId: client.id,
        clientSnapshot: client,
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        blId: data.blId,
        blNumber: data.blNumber,
        currency: data.currency || companySettings.primaryCurrencyCode,
        items: data.items.map((it) => ({
          ...it,
          discountPercent: 0,
          vatRate: applyVAT ? vatRate : 0,
          totalHT: it.quantity * it.unitPrice,
          totalVAT: applyVAT ? Math.round(it.quantity * it.unitPrice * (vatRate / 100) * 100) / 100 : 0,
          totalTTC: applyVAT ? it.quantity * it.unitPrice * (1 + vatRate / 100) : it.quantity * it.unitPrice,
        })),
        subtotalHT,
        totalDiscount: 0,
        totalHT,
        applyVAT,
        vatRate,
        totalVAT,
        shippingFee,
        extraDiscount,
        totalTTC,
        paidAmount,
        remainingAmount,
        paymentMethod: data.paymentMethod || 'virement',
        paymentTerms: data.paymentTerms || `${daysToAdd} jours`,
        notes: data.notes || '',
        terms: data.terms || companySettings.termsAndConditions,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };

      setInvoices((prev) => [newInvoice, ...prev]);

      logAction('create', 'facture', newInvoice.id, newInvoice.number, `Création de la facture ${newInvoice.number} pour ${client.name} (Montant TTC: ${newInvoice.totalTTC} ${newInvoice.currency})`);

      return newInvoice;
    },
    [clients, companySettings, currentUser.name, logAction]
  );

  const updateInvoice = useCallback(
    (id: string, data: Partial<Invoice>) => {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === id) {
            const items = data.items || inv.items;
            let subtotalHT = 0;
            let totalHT = 0;

            items.forEach((it) => {
              const lineBase = it.quantity * it.unitPrice;
              subtotalHT += lineBase;
              totalHT += lineBase;
            });

            const applyVAT = data.applyVAT !== undefined ? data.applyVAT : (data.totalVAT !== undefined ? data.totalVAT > 0 : (inv.applyVAT !== undefined ? inv.applyVAT : inv.totalVAT > 0));
            const vatRate = data.vatRate !== undefined ? data.vatRate : (inv.vatRate || 16);
            const totalVAT = applyVAT ? (data.totalVAT !== undefined ? data.totalVAT : Math.round(totalHT * (vatRate / 100) * 100) / 100) : 0;

            const shippingFee = data.shippingFee !== undefined ? data.shippingFee : inv.shippingFee;
            const extraDiscount = data.extraDiscount !== undefined ? data.extraDiscount : inv.extraDiscount;
            const totalTTC = Math.max(0, totalHT + totalVAT + shippingFee - extraDiscount);
            const paidAmount = data.paidAmount !== undefined ? data.paidAmount : inv.paidAmount;
            const remainingAmount = Math.max(0, totalTTC - paidAmount);

            let status = data.status || inv.status;
            if (paidAmount >= totalTTC && totalTTC > 0) {
              status = 'payee';
            } else if (paidAmount > 0 && status !== 'annulee') {
              status = 'partiellement_payee';
            }

            const updated: Invoice = {
              ...inv,
              ...data,
              items: items.map((it) => ({
                ...it,
                discountPercent: 0,
                vatRate: applyVAT ? vatRate : 0,
                totalHT: it.quantity * it.unitPrice,
                totalVAT: applyVAT ? Math.round(it.quantity * it.unitPrice * (vatRate / 100) * 100) / 100 : 0,
                totalTTC: applyVAT ? it.quantity * it.unitPrice * (1 + vatRate / 100) : it.quantity * it.unitPrice,
              })),
              subtotalHT,
              totalDiscount: 0,
              totalHT,
              applyVAT,
              vatRate,
              totalVAT,
              shippingFee,
              extraDiscount,
              totalTTC,
              paidAmount,
              remainingAmount,
              status,
              updatedAt: new Date().toISOString(),
            };

            logAction('update', 'facture', id, updated.number, `Mise à jour facture ${updated.number}`);
            return updated;
          }
          return inv;
        })
      );
    },
    [logAction]
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      const inv = invoices.find((x) => x.id === id);
      if (inv) {
        setInvoices((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'facture', id, inv.number, `Suppression de la facture ${inv.number}`);
      }
    },
    [invoices, logAction]
  );

  const updateInvoiceStatus = useCallback(
    (id: string, status: InvoiceStatus) => {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === id) {
            logAction('status_change', 'facture', id, inv.number, `Changement statut facture ${inv.number} : ${inv.status} -> ${status}`);
            return { ...inv, status, updatedAt: new Date().toISOString() };
          }
          return inv;
        })
      );
    },
    [logAction]
  );

  // Document Transformations (Devis -> BL, Devis -> Facture, BL -> Facture)
  const convertQuoteToDeliveryNote = useCallback(
    (quoteId: string): DeliveryNote => {
      const quote = quotes.find((q) => q.id === quoteId);
      if (!quote) throw new Error('Devis non trouvé');

      const bl = createDeliveryNote({
        clientId: quote.clientId,
        quoteId: quote.id,
        quoteNumber: quote.number,
        orderReference: quote.object || `Selon devis ${quote.number}`,
        deliveryAddress: `${quote.clientSnapshot.address}, ${quote.clientSnapshot.city}`,
        items: quote.items.map((it) => ({ ...it, quantityDelivered: it.quantity })),
        notes: `Créé automatiquement à partir du devis ${quote.number}`,
        status: 'prepare',
      });

      // Update quote with BL link and status 'accepte'
      updateQuote(quote.id, {
        status: 'accepte',
        convertedToBLId: bl.id,
        convertedToBLNumber: bl.number,
      });

      logAction('convert', 'bon_livraison', bl.id, bl.number, `Transformation du devis ${quote.number} en bon de livraison ${bl.number}`);

      return bl;
    },
    [quotes, createDeliveryNote, updateQuote, logAction]
  );

  const convertQuoteToInvoice = useCallback(
    (quoteId: string): Invoice => {
      const quote = quotes.find((q) => q.id === quoteId);
      if (!quote) throw new Error('Devis non trouvé');

      const inv = createInvoice({
        clientId: quote.clientId,
        quoteId: quote.id,
        quoteNumber: quote.number,
        currency: quote.currency,
        items: quote.items,
        applyVAT: quote.applyVAT !== undefined ? quote.applyVAT : (quote.totalVAT > 0),
        vatRate: quote.vatRate || 16,
        totalVAT: quote.totalVAT,
        notes: `Généré à partir du devis ${quote.number}`,
        paymentTerms: `${quote.clientSnapshot.paymentTermsDays || 30} jours`,
        status: 'emise',
      });

      updateQuote(quote.id, {
        status: 'accepte',
        convertedToInvoiceId: inv.id,
        convertedToInvoiceNumber: inv.number,
      });

      logAction('convert', 'facture', inv.id, inv.number, `Transformation du devis ${quote.number} en facture ${inv.number}`);

      return inv;
    },
    [quotes, createInvoice, updateQuote, logAction]
  );

  const convertDeliveryNoteToInvoice = useCallback(
    (deliveryNoteId: string): Invoice => {
      const bl = deliveryNotes.find((b) => b.id === deliveryNoteId);
      if (!bl) throw new Error('Bon de livraison non trouvé');

      const inv = createInvoice({
        clientId: bl.clientId,
        quoteId: bl.quoteId,
        quoteNumber: bl.quoteNumber,
        blId: bl.id,
        blNumber: bl.number,
        currency: companySettings.primaryCurrencyCode,
        items: bl.items,
        notes: `Facturation du bon de livraison ${bl.number}`,
        paymentTerms: `${bl.clientSnapshot.paymentTermsDays || 30} jours`,
        status: 'emise',
      });

      updateDeliveryNote(bl.id, {
        status: 'livre',
        convertedToInvoiceId: inv.id,
        convertedToInvoiceNumber: inv.number,
      });

      // Also mark quote as invoiced if linked
      if (bl.quoteId) {
        updateQuote(bl.quoteId, {
          convertedToInvoiceId: inv.id,
          convertedToInvoiceNumber: inv.number,
        });
      }

      logAction('convert', 'facture', inv.id, inv.number, `Transformation du bon de livraison ${bl.number} en facture ${inv.number}`);

      return inv;
    },
    [deliveryNotes, companySettings.primaryCurrencyCode, createInvoice, updateDeliveryNote, updateQuote, logAction]
  );

  // Payments (Règlements)
  const addPayment = useCallback(
    (data: Omit<Payment, 'id' | 'number' | 'createdAt' | 'createdBy'>) => {
      const { formattedNumber, nextConfig } = generateDocumentNumber(companySettings.numbering.paiement);

      setCompanySettings((prev) => ({
        ...prev,
        numbering: {
          ...prev.numbering,
          paiement: nextConfig,
        },
      }));

      const newPayment: Payment = {
        ...data,
        id: 'pay_' + Date.now(),
        number: formattedNumber,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };

      setPayments((prev) => [newPayment, ...prev]);

      // Update invoice paid amounts and status
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === data.invoiceId) {
            const newPaid = inv.paidAmount + data.amount;
            const newRemaining = Math.max(0, inv.totalTTC - newPaid);
            const newStatus: InvoiceStatus = newRemaining === 0 ? 'payee' : 'partiellement_payee';
            return {
              ...inv,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            };
          }
          return inv;
        })
      );

      logAction(
        'payment_received',
        'paiement',
        newPayment.id,
        newPayment.number,
        `Enregistrement paiement de ${newPayment.amount} ${newPayment.currency} sur facture ${newPayment.invoiceNumber} (Client: ${newPayment.clientName})`,
        { amount: newPayment.amount, invoiceId: newPayment.invoiceId, method: newPayment.paymentMethod }
      );

      return newPayment;
    },
    [companySettings, currentUser.name, logAction]
  );

  const deletePayment = useCallback(
    (id: string) => {
      const p = payments.find((x) => x.id === id);
      if (p) {
        setPayments((prev) => prev.filter((x) => x.id !== id));
        // Recompute invoice paidAmount
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === p.invoiceId) {
              const newPaid = Math.max(0, inv.paidAmount - p.amount);
              const newRemaining = Math.max(0, inv.totalTTC - newPaid);
              let newStatus: InvoiceStatus = inv.status;
              if (newPaid === 0) newStatus = 'emise';
              else if (newRemaining > 0) newStatus = 'partiellement_payee';
              return {
                ...inv,
                paidAmount: newPaid,
                remainingAmount: newRemaining,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              };
            }
            return inv;
          })
        );
        logAction('delete', 'paiement', id, p.number, `Annulation du paiement ${p.number} de ${p.amount} ${p.currency}`);
      }
    },
    [payments, logAction]
  );

  // Expenses (Dépenses)
  const addExpense = useCallback(
    (data: Omit<Expense, 'id' | 'number' | 'createdAt' | 'createdBy'>) => {
      const { formattedNumber, nextConfig } = generateDocumentNumber(companySettings.numbering.depense);

      setCompanySettings((prev) => ({
        ...prev,
        numbering: {
          ...prev.numbering,
          depense: nextConfig,
        },
      }));

      const newExpense: Expense = {
        ...data,
        id: 'dep_' + Date.now(),
        number: formattedNumber,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
      };

      setExpenses((prev) => [newExpense, ...prev]);
      logAction('create', 'depense', newExpense.id, newExpense.number, `Enregistrement dépense ${newExpense.number} (${newExpense.category}) : ${newExpense.amountTTC} ${newExpense.currency}`);

      return newExpense;
    },
    [companySettings, currentUser.name, logAction]
  );

  const updateExpense = useCallback(
    (id: string, data: Partial<Expense>) => {
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id === id) {
            const updated = { ...e, ...data };
            logAction('update', 'depense', id, updated.number, `Mise à jour dépense ${updated.number}`);
            return updated;
          }
          return e;
        })
      );
    },
    [logAction]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const exp = expenses.find((x) => x.id === id);
      if (exp) {
        setExpenses((prev) => prev.filter((x) => x.id !== id));
        logAction('delete', 'depense', id, exp.number, `Suppression de la dépense ${exp.number}`);
      }
    },
    [expenses, logAction]
  );

  // Backup & Restore
  const exportDatabaseBackup = useCallback((): BackupData => {
    const backup: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      companySettings,
      users,
      clients,
      suppliers,
      categories,
      products,
      quotes,
      deliveryNotes,
      invoices,
      payments,
      expenses,
      auditLogs,
    };
    logAction('backup_created', 'systeme', undefined, undefined, 'Création d\'une sauvegarde complète du système');
    return backup;
  }, [companySettings, users, clients, suppliers, categories, products, quotes, deliveryNotes, invoices, payments, expenses, auditLogs, logAction]);

  const restoreDatabaseBackup = useCallback(
    (backup: BackupData): boolean => {
      try {
        if (!backup.companySettings || !backup.clients || !backup.invoices) {
          throw new Error('Format de fichier de sauvegarde non conforme.');
        }

        setCompanySettings(backup.companySettings);
        if (backup.users?.length) setUsers(backup.users);
        if (backup.clients) setClients(backup.clients);
        if (backup.suppliers) setSuppliers(backup.suppliers);
        if (backup.categories) setCategories(backup.categories);
        if (backup.products) setProducts(backup.products);
        if (backup.quotes) setQuotes(backup.quotes);
        if (backup.deliveryNotes) setDeliveryNotes(backup.deliveryNotes);
        if (backup.invoices) setInvoices(backup.invoices);
        if (backup.payments) setPayments(backup.payments);
        if (backup.expenses) setExpenses(backup.expenses);
        if (backup.auditLogs) setAuditLogs(backup.auditLogs);

        logAction('backup_restored', 'systeme', undefined, undefined, `Restauration de la base de données exportée le ${backup.exportedAt}`);
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [logAction]
  );

  const resetToDefaultData = useCallback(() => {
    localStorage.clear();
    setCompanySettings(INITIAL_COMPANY_SETTINGS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setClients(INITIAL_CLIENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setQuotes(INITIAL_QUOTES);
    setDeliveryNotes(INITIAL_DELIVERY_NOTES);
    setInvoices(INITIAL_INVOICES);
    setPayments(INITIAL_PAYMENTS);
    setExpenses(INITIAL_EXPENSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    logAction('update', 'systeme', undefined, undefined, 'Réinitialisation des données aux paramètres d\'usine');
  }, [logAction]);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        currentUser,
        setCurrentUser,
        hasPermission,
        companySettings,
        updateCompanySettings,
        users,
        addUser,
        updateUser,
        deleteUser,
        clients,
        addClient,
        updateClient,
        deleteClient,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        quotes,
        createQuote,
        updateQuote,
        deleteQuote,
        updateQuoteStatus,
        convertQuoteToDeliveryNote,
        convertQuoteToInvoice,
        deliveryNotes,
        createDeliveryNote,
        updateDeliveryNote,
        deleteDeliveryNote,
        updateDeliveryStatus,
        convertDeliveryNoteToInvoice,
        invoices,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        updateInvoiceStatus,
        payments,
        addPayment,
        deletePayment,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        auditLogs,
        logAction,
        notifications,
        markNotificationAsRead,
        clearNotifications,
        exportDatabaseBackup,
        restoreDatabaseBackup,
        resetToDefaultData,
        activeModal,
        setActiveModal,
        modalPayload,
        setModalPayload,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
