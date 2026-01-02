// Core Types
export type TransactionType = 'income' | 'expense' | 'investment';
export type PaymentMode = 'upi' | 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'wallet';
export type GoalType = 'savings' | 'expense_limit' | 'category_limit';
export type GoalStatus = 'on_track' | 'behind' | 'completed' | 'warning';

export interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  currency: string;
  monthlyIncome: number;
  createdAt: string;
  pin?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  paymentMode: PaymentMode;
  notes?: string;
  fundName?: string; // For MF/SIP investments
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate?: string;
  status: GoalStatus;
  icon?: string;
  color?: string;
  categoryId?: string; // For category_limit goals
  notificationShown?: boolean; // Track if 80% notification was shown
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  monthlyLimit: number;
  currentSpent: number;
  month: string; // YYYY-MM format
  createdAt: string;
  updatedAt: string;
}

export interface BackupConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  lastBackup?: string;
}

// Analytics Types
export interface MonthlyStats {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
  color: string;
}

export interface DailySpending {
  date: string;
  amount: number;
}

