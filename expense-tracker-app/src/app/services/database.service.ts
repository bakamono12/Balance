import { getDatabase, generateId } from '../storage/database';
import { User, Category, Transaction, Goal, Budget } from '../types';

// User Service
export const userService = {
  async getUser(): Promise<User | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<any>('SELECT * FROM users LIMIT 1');

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      email: result.email,
      profilePhoto: result.profile_photo,
      currency: result.currency,
      monthlyIncome: result.monthly_income,
      pin: result.pin,
      createdAt: result.created_at,
    };
  },

  async updateUser(user: Partial<User>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (user.name !== undefined) {
      fields.push('name = ?');
      values.push(user.name);
    }
    if (user.email !== undefined) {
      fields.push('email = ?');
      values.push(user.email);
    }
    if (user.profilePhoto !== undefined) {
      fields.push('profile_photo = ?');
      values.push(user.profilePhoto);
    }
    if (user.currency !== undefined) {
      fields.push('currency = ?');
      values.push(user.currency);
    }
    if (user.monthlyIncome !== undefined) {
      fields.push('monthly_income = ?');
      values.push(user.monthlyIncome);
    }
    if (user.pin !== undefined) {
      fields.push('pin = ?');
      values.push(user.pin);
    }

    if (fields.length > 0) {
      await db.runAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = (SELECT id FROM users LIMIT 1)`,
        values
      );
    }
  },
};

// Category Service
export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<any>(
      'SELECT * FROM categories ORDER BY is_default DESC, name ASC'
    );

    return results.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      description: row.description,
      isDefault: row.is_default === 1,
      createdAt: row.created_at,
    }));
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<any>('SELECT * FROM categories WHERE id = ?', [id]);

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      icon: result.icon,
      color: result.color,
      description: result.description,
      isDefault: result.is_default === 1,
      createdAt: result.created_at,
    };
  },

  async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const db = getDatabase();
    const id = await generateId();
    const createdAt = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, description, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, category.name, category.icon, category.color, category.description || null, category.isDefault ? 1 : 0, createdAt]
    );

    return { ...category, id, createdAt };
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (category.name !== undefined) {
      fields.push('name = ?');
      values.push(category.name);
    }
    if (category.icon !== undefined) {
      fields.push('icon = ?');
      values.push(category.icon);
    }
    if (category.color !== undefined) {
      fields.push('color = ?');
      values.push(category.color);
    }
    if (category.description !== undefined) {
      fields.push('description = ?');
      values.push(category.description);
    }

    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const db = getDatabase();
    // Check if category is default
    const category = await this.getCategoryById(id);
    if (category?.isDefault) {
      throw new Error('Cannot delete default category');
    }
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  },
};

// Transaction Service
export const transactionService = {
  async getAllTransactions(limit?: number): Promise<Transaction[]> {
    const db = getDatabase();
    const query = limit
      ? 'SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?'
      : 'SELECT * FROM transactions ORDER BY date DESC, created_at DESC';

    const results = await db.getAllAsync<any>(query, limit ? [limit] : []);

    return results.map(row => ({
      id: row.id,
      type: row.type as 'income' | 'expense' | 'investment',
      amount: row.amount,
      categoryId: row.category_id,
      date: row.date,
      paymentMode: row.payment_mode,
      notes: row.notes,
      fundName: row.fund_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<any>(
      'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [startDate, endDate]
    );

    return results.map(row => ({
      id: row.id,
      type: row.type as 'income' | 'expense' | 'investment',
      amount: row.amount,
      categoryId: row.category_id,
      date: row.date,
      paymentMode: row.payment_mode,
      notes: row.notes,
      fundName: row.fund_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const db = getDatabase();
    const id = await generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO transactions (id, type, amount, category_id, date, payment_mode, notes, fund_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, transaction.type, transaction.amount, transaction.categoryId, transaction.date, transaction.paymentMode, transaction.notes || null, transaction.fundName || null, now, now]
    );

    return { ...transaction, id, createdAt: now, updatedAt: now };
  },

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (transaction.type !== undefined) {
      fields.push('type = ?');
      values.push(transaction.type);
    }
    if (transaction.amount !== undefined) {
      fields.push('amount = ?');
      values.push(transaction.amount);
    }
    if (transaction.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(transaction.categoryId);
    }
    if (transaction.date !== undefined) {
      fields.push('date = ?');
      values.push(transaction.date);
    }
    if (transaction.paymentMode !== undefined) {
      fields.push('payment_mode = ?');
      values.push(transaction.paymentMode);
    }
    if (transaction.notes !== undefined) {
      fields.push('notes = ?');
      values.push(transaction.notes);
    }
    if (transaction.fundName !== undefined) {
      fields.push('fund_name = ?');
      values.push(transaction.fundName);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    if (fields.length > 1) {
      values.push(id);
      await db.runAsync(
        `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  },

  async getTotalByType(type: 'income' | 'expense' | 'investment', startDate?: string, endDate?: string): Promise<number> {
    const db = getDatabase();
    let query = 'SELECT SUM(amount) as total FROM transactions WHERE type = ?';
    const params: any[] = [type];

    if (startDate && endDate) {
      query += ' AND date >= ? AND date <= ?';
      params.push(startDate, endDate);
    }

    const result = await db.getFirstAsync<any>(query, params);
    return result?.total || 0;
  },
};

// Goal Service
export const goalService = {
  async getAllGoals(): Promise<Goal[]> {
    const db = getDatabase();
    const results = await db.getAllAsync<any>(
      'SELECT * FROM goals ORDER BY created_at DESC'
    );

    return results.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      targetAmount: row.target_amount,
      currentAmount: row.current_amount,
      startDate: row.start_date,
      targetDate: row.target_date,
      status: row.status,
      icon: row.icon,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const db = getDatabase();
    const id = await generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO goals (id, name, type, target_amount, current_amount, start_date, target_date, status, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, goal.name, goal.type, goal.targetAmount, goal.currentAmount, goal.startDate, goal.targetDate || null, goal.status, goal.icon || null, goal.color || null, now, now]
    );

    return { ...goal, id, createdAt: now, updatedAt: now };
  },

  async updateGoal(id: string, goal: Partial<Goal>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (goal.name !== undefined) {
      fields.push('name = ?');
      values.push(goal.name);
    }
    if (goal.targetAmount !== undefined) {
      fields.push('target_amount = ?');
      values.push(goal.targetAmount);
    }
    if (goal.currentAmount !== undefined) {
      fields.push('current_amount = ?');
      values.push(goal.currentAmount);
    }
    if (goal.targetDate !== undefined) {
      fields.push('target_date = ?');
      values.push(goal.targetDate);
    }
    if (goal.status !== undefined) {
      fields.push('status = ?');
      values.push(goal.status);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    if (fields.length > 1) {
      values.push(id);
      await db.runAsync(
        `UPDATE goals SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async deleteGoal(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
  },
};

// Budget Service
export const budgetService = {
  async getBudgetForMonth(month: string): Promise<Budget | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM budgets WHERE month = ?',
      [month]
    );

    if (!result) return null;

    return {
      id: result.id,
      monthlyLimit: result.monthly_limit,
      currentSpent: result.current_spent,
      month: result.month,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  },

  async setBudget(month: string, limit: number): Promise<Budget> {
    const db = getDatabase();
    const existing = await this.getBudgetForMonth(month);

    if (existing) {
      await db.runAsync(
        'UPDATE budgets SET monthly_limit = ?, updated_at = ? WHERE month = ?',
        [limit, new Date().toISOString(), month]
      );
      return { ...existing, monthlyLimit: limit };
    }

    const id = await generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO budgets (id, monthly_limit, current_spent, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, limit, 0, month, now, now]
    );

    return {
      id,
      monthlyLimit: limit,
      currentSpent: 0,
      month,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateCurrentSpent(month: string, amount: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE budgets SET current_spent = ?, updated_at = ? WHERE month = ?',
      [amount, new Date().toISOString(), month]
    );
  },
};

