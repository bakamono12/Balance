import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { logger } from './logger';

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
};

// Get currency symbol
export const getCurrencySymbol = (currencyCode: string = 'USD'): string => {
  return CURRENCY_SYMBOLS[currencyCode] || '$';
};

// Currency formatting
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Handle invalid numbers
  if (amount == null || isNaN(amount) || !isFinite(amount)) {
    logger.warn('formatCurrency received invalid amount', {
      amount,
      type: typeof amount,
      isNaN: isNaN(amount),
      isFinite: isFinite(amount),
      currency
    });
    amount = 0;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    logger.error('formatCurrency error', { amount, currency, error });
    return `${currency} 0.00`;
  }
};

// Date formatting
export const formatDate = (dateString: string, formatStr: string = 'MMM dd, yyyy'): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch (error) {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM dd, yyyy hh:mm a');
  } catch (error) {
    return dateString;
  }
};

export const formatRelativeDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  } catch (error) {
    return dateString;
  }
};

// Month helpers
export const getCurrentMonth = (): string => {
  return format(new Date(), 'yyyy-MM');
};

export const getMonthStartEnd = (monthString: string) => {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
};

export const formatMonth = (monthString: string): string => {
  try {
    const [year, month] = monthString.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMMM yyyy');
  } catch (error) {
    return monthString;
  }
};

// Number formatting
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Transaction grouping
export const groupTransactionsByDate = (transactions: any[]): Record<string, any[]> => {
  const grouped: Record<string, any[]> = {};

  transactions.forEach(transaction => {
    const dateKey = formatRelativeDate(transaction.date);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(transaction);
  });

  return grouped;
};

// Amount formatting helpers
export const formatAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
};

export const formatCompactCurrency = (amount: number, currency: string = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${formatAmount(amount)}`;
};


// Time formatting
export const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return formatDate(dateString);
  } catch (error) {
    return dateString;
  }
};

