export type UserRole = 'admin' | 'manager' | 'commercial' | 'cashier' | 'viewer';

export type PermissionKey =
  | 'view_dashboard'
  | 'manage_clients'
  | 'manage_suppliers'
  | 'manage_products'
  | 'manage_quotes'
  | 'manage_deliveries'
  | 'manage_invoices'
  | 'manage_payments'
  | 'manage_expenses'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_users'
  | 'view_audit_log'
  | 'export_data'
  | 'delete_records'
  | 'cancel_documents';

export interface User {
  id: string;
  username?: string;
  name: string;
  email?: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  phone?: string;
  lastLogin?: string;
  permissions: Record<PermissionKey, boolean>;
}

export type DocumentTemplateStyle = 'modern' | 'classic' | 'professional' | 'minimalist' | 'elegant';

export interface CustomAdminField {
  id: string;
  label: string;
  value: string;
}

export interface NumberingConfig {
  prefix: string;
  suffix?: string;
  digits: number;
  format: string; // e.g. "FAC/{YEAR}/{NUMBER}"
  nextNumber: number;
  resetAnnually: boolean;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // percentage (e.g. 16, 20, 0)
  isDefault?: boolean;
  isIncluded?: boolean;
  active: boolean;
}

export type TaxConfig = TaxRate;

export interface CurrencyConfig {
  id: string;
  code: string; // 'MRU', 'EUR', 'USD', 'XOF'
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimals: number;
  exchangeRate: number; // relative to primary currency (1 for primary)
  isPrimary: boolean;
  active: boolean;
}

export interface PaymentModeConfig {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface PaymentTermsConfig {
  id: string;
  name: string;
  days: number;
  active: boolean;
}

export interface CompanySettings {
  id: string;
  name: string;
  commercialName: string;
  logoUrl?: string;
  slogan?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  phone: string;
  phone2?: string;
  email: string;
  website?: string;
  nif: string;
  rccm: string;
  tradeRegister?: string;
  taxNumber?: string;
  customAdminFields: CustomAdminField[];
  
  // Banking
  bankName: string;
  bankAccount: string;
  iban: string;
  swift: string;
  
  // Signatory
  managerName: string;
  managerRole: string;
  signatureUrl?: string;
  stampUrl?: string;

  // Visual Customization
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  documentTemplate: DocumentTemplateStyle;
  headerStyle: 'standard' | 'minimal' | 'banner' | 'centered';
  footerStyle: 'simple' | 'detailed' | 'columns';
  showWatermark: boolean;
  watermarkText: string;
  legalNotice: string;
  termsAndConditions: string;

  // Numbering
  numbering: {
    devis: NumberingConfig;
    bl: NumberingConfig;
    facture: NumberingConfig;
    paiement: NumberingConfig;
    depense: NumberingConfig;
  };

  // Financial configs
  currencies: CurrencyConfig[];
  primaryCurrencyCode: string;
  taxes: TaxRate[];
  paymentModes: PaymentModeConfig[];
  paymentTerms: PaymentTermsConfig[];
}

export type ClientType = 'particular' | 'company' | 'administration';

export interface Client {
  id: string;
  code: string;
  type: ClientType;
  name: string;
  companyName?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  phone2?: string;
  email: string;
  nif?: string;
  rccm?: string;
  contactPerson?: string;
  contactRole?: string;
  paymentTermsDays: number;
  creditLimit: number;
  defaultDiscount: number;
  currency: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  companyName?: string;
  category?: string;
  address: string;
  city?: string;
  country?: string;
  phone: string;
  phone2?: string;
  email: string;
  nif?: string;
  rccm?: string;
  contactPerson?: string;
  paymentTermsDays: number;
  currency?: string;
  bankName?: string;
  bankAccount?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  active: boolean;
}

export type ItemType = 'product' | 'service';

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  type: ItemType;
  unit: string; // 'U', 'Kg', 'M', 'Heure', 'Jour', 'Forfait', 'Lot'
  purchasePrice: number;
  sellingPrice: number;
  vatRate: number; // percentage
  defaultDiscount: number; // percentage
  currentStock: number;
  minStockAlert: number;
  imageUrl?: string;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  productId?: string;
  code: string;
  designation: string;
  description?: string;
  quantity: number;
  quantityDelivered?: number; // for BL comparison
  unit: string;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
}

export type QuoteStatus = 'brouillon' | 'envoye' | 'en_attente' | 'accepte' | 'refuse' | 'expire' | 'annule';

export interface Quote {
  id: string;
  number: string;
  date: string;
  expiryDate: string;
  clientId: string;
  clientSnapshot: Client;
  object?: string;
  salesperson?: string;
  currency: string;
  items: DocumentItem[];
  subtotalHT: number;
  totalDiscount: number;
  totalHT: number;
  applyVAT?: boolean;
  vatRate?: number;
  totalVAT: number;
  totalTTC: number;
  notes?: string;
  terms?: string;
  deliveryTime?: string;
  validityDays?: number;
  status: QuoteStatus;
  convertedToBLId?: string;
  convertedToBLNumber?: string;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type DeliveryStatus = 'brouillon' | 'prepare' | 'livre' | 'partiellement_livre' | 'annule';

export interface DeliveryNote {
  id: string;
  number: string;
  date: string;
  clientId: string;
  clientSnapshot: Client;
  quoteId?: string;
  quoteNumber?: string;
  orderReference?: string;
  deliveryAddress: string;
  carrier?: string;
  driverName?: string;
  items: DocumentItem[];
  notes?: string;
  status: DeliveryStatus;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  preparedBy?: string;
  deliveredBy?: string;
  receivedByCustomerDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type InvoiceStatus = 'brouillon' | 'emise' | 'partiellement_payee' | 'payee' | 'en_retard' | 'annulee';

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  clientId: string;
  clientSnapshot: Client;
  quoteId?: string;
  quoteNumber?: string;
  blId?: string;
  blNumber?: string;
  currency: string;
  items: DocumentItem[];
  subtotalHT: number;
  totalDiscount: number;
  totalHT: number;
  applyVAT?: boolean;
  vatRate?: number;
  totalVAT: number;
  shippingFee: number;
  extraDiscount: number;
  totalTTC: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
  paymentTerms?: string;
  orderReference?: string;
  paymentConditions?: string;
  notes?: string;
  terms?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type PaymentMethod = 'especes' | 'virement' | 'cheque' | 'carte' | 'mobile_money' | 'autre';

export interface Payment {
  id: string;
  number: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  bankName?: string;
  notes?: string;
  currency: string;
  createdAt: string;
  createdBy: string;
}

export interface Expense {
  id: string;
  number: string;
  date: string;
  category: string;
  supplierId?: string;
  supplierName?: string;
  description: string;
  amountHT: number;
  vatRate: number;
  amountVAT: number;
  amountTTC: number;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
  currency: string;
  createdAt: string;
  createdBy: string;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'convert'
  | 'status_change'
  | 'payment_received'
  | 'backup_created'
  | 'backup_restored'
  | 'login';

export type AuditEntityType =
  | 'entreprise'
  | 'client'
  | 'fournisseur'
  | 'produit'
  | 'devis'
  | 'bon_livraison'
  | 'facture'
  | 'paiement'
  | 'depense'
  | 'utilisateur'
  | 'parametres'
  | 'systeme';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityNumber?: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  message: string;
  linkTab?: string;
  linkId?: string;
  timestamp: string;
  read: boolean;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  companySettings: CompanySettings;
  users: User[];
  clients: Client[];
  suppliers: Supplier[];
  categories: Category[];
  products: Product[];
  quotes: Quote[];
  deliveryNotes: DeliveryNote[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}
