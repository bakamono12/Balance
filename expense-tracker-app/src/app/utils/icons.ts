import { MaterialIcons } from '@expo/vector-icons';

// Map of category names to icon names
export const categoryIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  food: 'restaurant',
  transport: 'directions-car',
  shopping: 'shopping-bag',
  entertainment: 'movie',
  recharge: 'phone-iphone',
  grocery: 'local-grocery-store',
  travel: 'flight',
  health: 'local-hospital',
  utilities: 'flash-on',
  salary: 'attach-money',
  housing: 'home',
  education: 'school',
  insurance: 'security',
  investment: 'trending-up',
  savings: 'savings',
  other: 'more-horiz',
};

// Payment mode icons
export const paymentModeIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  upi: 'smartphone',
  credit_card: 'credit-card',
  debit_card: 'payment',
  cash: 'money',
  bank_transfer: 'account-balance',
  wallet: 'account-balance-wallet',
};

// Transaction type icons
export const transactionTypeIcons = {
  income: 'arrow-downward' as keyof typeof MaterialIcons.glyphMap,
  expense: 'arrow-upward' as keyof typeof MaterialIcons.glyphMap,
};

// Goal icons
export const goalIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  savings: 'savings',
  expense_limit: 'account-balance-wallet',
  vacation: 'flight',
  car: 'directions-car',
  house: 'home',
  education: 'school',
  emergency: 'warning',
  retirement: 'elderly',
  investment: 'trending-up',
  other: 'flag',
};

// Status icons
export const statusIcons = {
  on_track: 'check-circle' as keyof typeof MaterialIcons.glyphMap,
  behind: 'warning' as keyof typeof MaterialIcons.glyphMap,
  completed: 'done-all' as keyof typeof MaterialIcons.glyphMap,
  at_risk: 'error' as keyof typeof MaterialIcons.glyphMap,
};

// Get icon for category
export const getCategoryIcon = (category: string): keyof typeof MaterialIcons.glyphMap => {
  const lowerCategory = category.toLowerCase();
  return categoryIcons[lowerCategory] || categoryIcons.other;
};

// Get icon for payment mode
export const getPaymentModeIcon = (mode: string): keyof typeof MaterialIcons.glyphMap => {
  const lowerMode = mode.toLowerCase();
  return paymentModeIcons[lowerMode] || paymentModeIcons.cash;
};

// Get icon for transaction type
export const getTransactionTypeIcon = (type: 'income' | 'expense'): keyof typeof MaterialIcons.glyphMap => {
  return transactionTypeIcons[type];
};

// Get icon for goal type
export const getGoalIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
  const lowerType = type.toLowerCase();
  return goalIcons[lowerType] || goalIcons.other;
};

// Get icon for status
export const getStatusIcon = (status: string): keyof typeof MaterialIcons.glyphMap => {
  const lowerStatus = status.toLowerCase();
  return statusIcons[lowerStatus as keyof typeof statusIcons] || statusIcons.on_track;
};

// Common navigation icons
export const navigationIcons = {
  home: 'home' as keyof typeof MaterialIcons.glyphMap,
  transactions: 'list' as keyof typeof MaterialIcons.glyphMap,
  analytics: 'bar-chart' as keyof typeof MaterialIcons.glyphMap,
  profile: 'person' as keyof typeof MaterialIcons.glyphMap,
  settings: 'settings' as keyof typeof MaterialIcons.glyphMap,
  categories: 'category' as keyof typeof MaterialIcons.glyphMap,
  goals: 'flag' as keyof typeof MaterialIcons.glyphMap,
  back: 'arrow-back' as keyof typeof MaterialIcons.glyphMap,
  close: 'close' as keyof typeof MaterialIcons.glyphMap,
  add: 'add' as keyof typeof MaterialIcons.glyphMap,
  edit: 'edit' as keyof typeof MaterialIcons.glyphMap,
  delete: 'delete' as keyof typeof MaterialIcons.glyphMap,
  search: 'search' as keyof typeof MaterialIcons.glyphMap,
  filter: 'filter-list' as keyof typeof MaterialIcons.glyphMap,
  sort: 'sort' as keyof typeof MaterialIcons.glyphMap,
  more: 'more-vert' as keyof typeof MaterialIcons.glyphMap,
};

// Get all available category icons for selection
export const getAllCategoryIcons = (): string[] => {
  return Object.keys(categoryIcons);
};

// Get all available goal icons for selection
export const getAllGoalIcons = (): string[] => {
  return Object.keys(goalIcons);
};

