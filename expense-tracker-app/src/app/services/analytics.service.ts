import { getDatabase } from '../storage/database';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { getMonthStartEnd } from '../utils/formatters';
import { logger } from '../utils/logger';

// Helper to ensure valid number
const toValidNumber = (value: any): number => {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) {
    logger.warn('Invalid number detected in analytics', { value, type: typeof value });
    return 0;
  }
  return num;
};

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  avgDailyExpense: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface DailySpending {
  date: string;
  income: number;
  expense: number;
}

export const analyticsService = {
  async getMonthlyStats(month: string): Promise<MonthlyStats> {
    const db = getDatabase();
    const { start, end } = getMonthStartEnd(month);

    logger.debug('getMonthlyStats called', { month, start, end });

    // Get total income
    const incomeResult = await db.getFirstAsync<any>(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['income', start, end]
    );

    // Get total expense
    const expenseResult = await db.getFirstAsync<any>(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['expense', start, end]
    );

    const totalIncome = toValidNumber(incomeResult?.total || 0);
    const totalExpense = toValidNumber(expenseResult?.total || 0);
    const transactionCount = toValidNumber(incomeResult?.count || 0) + toValidNumber(expenseResult?.count || 0);

    // Calculate average daily expense
    const daysInMonth = eachDayOfInterval({
      start: parseISO(start),
      end: parseISO(end),
    }).length;
    const avgDailyExpense = daysInMonth > 0 ? totalExpense / daysInMonth : 0;

    const stats = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount,
      avgDailyExpense,
    };

    logger.debug('Monthly stats calculated', stats);

    return stats;
  },

  async getMonthOnMonthChange(currentMonth: string): Promise<{ income: number; expense: number; balance: number }> {
    try {
      const currentDate = parseISO(currentMonth + '-01');
      const previousDate = new Date(currentDate);
      previousDate.setMonth(previousDate.getMonth() - 1);
      const previousMonth = format(previousDate, 'yyyy-MM');

      const currentStats = await this.getMonthlyStats(currentMonth);
      const previousStats = await this.getMonthlyStats(previousMonth);

      const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        income: calculateChange(currentStats.totalIncome, previousStats.totalIncome),
        expense: calculateChange(currentStats.totalExpense, previousStats.totalExpense),
        balance: calculateChange(currentStats.balance, previousStats.balance),
      };
    } catch (error) {
      logger.error('Failed to calculate month-on-month change', error);
      return { income: 0, expense: 0, balance: 0 };
    }
  },

  async getCategoryExpenses(month: string): Promise<CategoryExpense[]> {
    const db = getDatabase();
    const { start, end } = getMonthStartEnd(month);

    logger.debug('getCategoryExpenses called', { month, start, end });

    const results = await db.getAllAsync<any>(
      `SELECT
        c.id as categoryId,
        c.name as categoryName,
        c.icon,
        c.color,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY total DESC`,
      [start, end]
    );

    const totalExpense = results.reduce((sum, r) => sum + toValidNumber(r.total), 0);

    logger.debug('Category expenses calculated', {
      categoriesCount: results.length,
      totalExpense
    });

    return results.map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      icon: row.icon,
      color: row.color,
      total: toValidNumber(row.total),
      percentage: totalExpense > 0 ? (toValidNumber(row.total) / totalExpense) * 100 : 0,
      transactionCount: toValidNumber(row.count),
    }));
  },

  async getCategoryIncome(month: string): Promise<CategoryExpense[]> {
    const db = getDatabase();
    const { start, end } = getMonthStartEnd(month);

    const results = await db.getAllAsync<any>(
      `SELECT
        c.id as categoryId,
        c.name as categoryName,
        c.icon,
        c.color,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'income' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY total DESC`,
      [start, end]
    );

    const totalIncome = results.reduce((sum, r) => sum + r.total, 0);

    return results.map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      icon: row.icon,
      color: row.color,
      total: row.total,
      percentage: totalIncome > 0 ? (row.total / totalIncome) * 100 : 0,
      transactionCount: row.count,
    }));
  },

  async getDailySpending(month: string): Promise<DailySpending[]> {
    const db = getDatabase();
    const { start, end } = getMonthStartEnd(month);

    // Get all days in the month
    const days = eachDayOfInterval({
      start: parseISO(start),
      end: parseISO(end),
    });

    // Get transactions grouped by date
    const results = await db.getAllAsync<any>(
      `SELECT
        date,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE date >= ? AND date <= ?
      GROUP BY date, type
      ORDER BY date`,
      [start, end]
    );

    // Create a map of spending by date
    const spendingMap: Record<string, { income: number; expense: number }> = {};
    results.forEach(row => {
      const dateKey = row.date;
      if (!spendingMap[dateKey]) {
        spendingMap[dateKey] = { income: 0, expense: 0 };
      }
      if (row.type === 'income') {
        spendingMap[dateKey].income = row.total;
      } else {
        spendingMap[dateKey].expense = row.total;
      }
    });

    // Map all days to include zeros for days without transactions
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return {
        date: dateKey,
        income: spendingMap[dateKey]?.income || 0,
        expense: spendingMap[dateKey]?.expense || 0,
      };
    });
  },

  async getWeeklyTrend(): Promise<{ week: string; amount: number }[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<any>(
      `SELECT
        strftime('%Y-%W', date) as week,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as amount
      FROM transactions
      WHERE date >= date('now', '-3 months')
      GROUP BY week
      ORDER BY week`
    );

    return results.map(row => ({
      week: row.week,
      amount: row.amount,
    }));
  },

  async getTopExpenseCategories(limit: number = 5): Promise<CategoryExpense[]> {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const expenses = await this.getCategoryExpenses(currentMonth);
    return expenses.slice(0, limit);
  },

  async getMonthComparison(currentMonth: string, previousMonth: string) {
    const current = await this.getMonthlyStats(currentMonth);
    const previous = await this.getMonthlyStats(previousMonth);

    return {
      current,
      previous,
      incomeChange: previous.totalIncome > 0
        ? ((current.totalIncome - previous.totalIncome) / previous.totalIncome) * 100
        : 0,
      expenseChange: previous.totalExpense > 0
        ? ((current.totalExpense - previous.totalExpense) / previous.totalExpense) * 100
        : 0,
      balanceChange: previous.balance > 0
        ? ((current.balance - previous.balance) / previous.balance) * 100
        : 0,
    };
  },

  async getBudgetProgress(month: string, budgetLimit: number): Promise<{
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
  }> {
    const { totalExpense } = await this.getMonthlyStats(month);
    const remaining = budgetLimit - totalExpense;
    const percentage = budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : 0;

    return {
      spent: totalExpense,
      remaining,
      percentage,
      isOverBudget: totalExpense > budgetLimit,
    };
  },

  async getRecentTransactionsSummary(days: number = 7): Promise<{
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    avgTransaction: number;
  }> {
    const db = getDatabase();
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    );

    const results = await db.getAllAsync<any>(
      `SELECT
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE date >= ? AND date <= ?
      GROUP BY type`,
      [startDate, endDate]
    );

    let totalIncome = 0;
    let totalExpense = 0;
    let totalCount = 0;

    results.forEach(row => {
      totalCount += row.count;
      if (row.type === 'income') {
        totalIncome = row.total;
      } else {
        totalExpense = row.total;
      }
    });

    return {
      totalTransactions: totalCount,
      totalIncome,
      totalExpense,
      avgTransaction: totalCount > 0 ? (totalIncome + totalExpense) / totalCount : 0,
    };
  },

  async getYearlyStats(year: number): Promise<MonthlyStats> {
    const db = getDatabase();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    logger.debug('getYearlyStats called', { year, startDate, endDate });

    // Get total income
    const incomeResult = await db.getFirstAsync<any>(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['income', startDate, endDate]
    );

    // Get total expense
    const expenseResult = await db.getFirstAsync<any>(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
      ['expense', startDate, endDate]
    );

    const totalIncome = toValidNumber(incomeResult?.total || 0);
    const totalExpense = toValidNumber(expenseResult?.total || 0);
    const transactionCount = toValidNumber(incomeResult?.count || 0) + toValidNumber(expenseResult?.count || 0);

    // Calculate average daily expense for the year
    const avgDailyExpense = totalExpense / 365;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount,
      avgDailyExpense,
    };
  },

  async getYearlyCategoryExpenses(year: number): Promise<CategoryExpense[]> {
    const db = getDatabase();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const results = await db.getAllAsync<any>(
      `SELECT
        c.id as categoryId,
        c.name as categoryName,
        c.icon,
        c.color,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY total DESC`,
      [startDate, endDate]
    );

    const totalExpense = results.reduce((sum, r) => sum + toValidNumber(r.total), 0);

    return results.map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      icon: row.icon,
      color: row.color,
      total: toValidNumber(row.total),
      percentage: totalExpense > 0 ? (toValidNumber(row.total) / totalExpense) * 100 : 0,
      transactionCount: toValidNumber(row.count),
    }));
  },
};


