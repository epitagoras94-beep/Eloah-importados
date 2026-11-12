export type Gender = 'FEM' | 'MEN' | 'UNISSEX';

export interface Perfume {
  id: string;
  code: string;
  name: string;
  brand: string;
  volume: string;
  gender: Gender;
  costUsd: number;
  exchangeRate: number; // e.g. 5.50
  costBrl: number;      // costUsd * exchangeRate
  sellingPriceBrl: number;
  stockQuantity: number;
  initialStockQuantity: number;
  imageUrl?: string;
  notes?: string;
}

export type InstallmentStatus = 'Pendente' | 'Pago' | 'Atrasado';

export interface SaleItem {
  perfumeId: string;
  perfumeName: string;
  brand: string;
  quantity: number;
  unitCostUsd: number;
  unitCostBrl: number;
  unitSellingPriceBrl: number;
  totalSellingPriceBrl: number;
  unitProfitBrl: number;
  totalProfitBrl: number;
}

export type PaymentMethod =
  | 'PIX'
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Transferência'
  | 'Outro';

export interface Installment {
  id: string;
  saleId: string;
  installmentNumber: number;
  totalInstallments: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  perfumeSummary: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: InstallmentStatus;
  paidDate?: string; // YYYY-MM-DD
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface Sale {
  id: string;
  saleNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  saleDate: string; // YYYY-MM-DD
  items: SaleItem[];
  totalCostBrl: number;
  totalSellingPriceBrl: number;
  totalProfitBrl: number;
  profitMarginPercent: number;
  downPaymentBrl: number;
  installmentsCount: number;
  installmentValueBrl: number;
  isCashSale?: boolean;
  paymentMethod?: PaymentMethod;
  status: 'Ativo' | 'Quitado' | 'Cancelado';
  notes?: string;
}

export interface PaymentLog {
  id: string;
  installmentId: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  perfumeSummary: string;
  installmentInfo: string; // e.g. "Parcela 2 de 3"
  amount: number;
  paidDate: string;
  paymentMethod: string;
  notes?: string;
}

export interface AppSettings {
  dollarRate: number; // default 5.50
  pixKey: string;
  pixType: 'CPF' | 'CNPJ' | 'Celular' | 'E-mail' | 'Aleatória';
  sellerName: string;
  storeName: string;
  defaultMarkupPercent: number;
}
