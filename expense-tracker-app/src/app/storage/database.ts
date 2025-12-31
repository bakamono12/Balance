import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { seedDatabase } from '../utils/seedData';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('expense_tracker.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      profile_photo TEXT,
      currency TEXT DEFAULT 'USD',
      monthly_income REAL DEFAULT 0,
      pin TEXT,
      created_at TEXT NOT NULL
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'investment')),
      amount REAL NOT NULL,
      category_id TEXT NOT NULL,
      date TEXT NOT NULL,
      payment_mode TEXT NOT NULL,
      notes TEXT,
      fund_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // Add migration for fund_name column if it doesn't exist
  try {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN fund_name TEXT;
    `);
  } catch (error: any) {
    // Column already exists or other error - safe to ignore
    if (!error.message?.includes('duplicate column name')) {
      console.log('Migration note:', error.message);
    }
  }

  // Fix CHECK constraint to include 'investment' type
  try {
    // Check if we need to migrate the constraint
    const testResult = await db.getFirstAsync<any>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'"
    );

    if (testResult && testResult.sql && !testResult.sql.includes("'investment'")) {
      console.log('Migrating transactions table to support investment type...');

      // Check if fund_name column exists
      const columns = await db.getAllAsync<any>(
        "PRAGMA table_info(transactions)"
      );
      const hasFundName = columns.some((col: any) => col.name === 'fund_name');

      // Create temporary table with correct constraint
      await db.execAsync(`
        -- Create new table with correct constraint
        CREATE TABLE transactions_new (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'investment')),
          amount REAL NOT NULL,
          category_id TEXT NOT NULL,
          date TEXT NOT NULL,
          payment_mode TEXT NOT NULL,
          notes TEXT,
          fund_name TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );
      `);

      // Copy data with or without fund_name column
      if (hasFundName) {
        await db.execAsync(`
          INSERT INTO transactions_new
          SELECT id, type, amount, category_id, date, payment_mode, notes, fund_name, created_at, updated_at
          FROM transactions;
        `);
      } else {
        await db.execAsync(`
          INSERT INTO transactions_new
          SELECT id, type, amount, category_id, date, payment_mode, notes, NULL as fund_name, created_at, updated_at
          FROM transactions;
        `);
      }

      await db.execAsync(`
        -- Drop old table
        DROP TABLE transactions;

        -- Rename new table
        ALTER TABLE transactions_new RENAME TO transactions;

        -- Recreate indexes
        CREATE INDEX idx_transactions_date ON transactions(date);
        CREATE INDEX idx_transactions_category ON transactions(category_id);
        CREATE INDEX idx_transactions_type ON transactions(type);
      `);

      console.log('Migration completed successfully!');
    }
  } catch (error: any) {
    console.log('Migration error (may be safe to ignore):', error.message);
  }

  await db.execAsync(`
    -- Goals table
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('savings', 'expense_limit')),
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      start_date TEXT NOT NULL,
      target_date TEXT,
      status TEXT DEFAULT 'on_track',
      icon TEXT,
      color TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Budgets table
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      monthly_limit REAL NOT NULL,
      current_spent REAL DEFAULT 0,
      month TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Backup config table
    CREATE TABLE IF NOT EXISTS backup_config (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      frequency TEXT DEFAULT 'weekly',
      max_backups INTEGER DEFAULT 5,
      last_backup TEXT
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
  `);

  // Initialize default data
  await initDefaultData(db);

  // Seed test data (COMMENT OUT BEFORE PRODUCTION)
  await seedDatabase();

  return db;
};

const initDefaultData = async (database: SQLite.SQLiteDatabase) => {
  // Check if user exists
  const userResult = await database.getFirstAsync('SELECT COUNT(*) as count FROM users');

  if (!userResult || (userResult as any).count === 0) {
    // Create default user
    const userId = await generateId();
    await database.runAsync(
      'INSERT INTO users (id, name, email, currency, monthly_income, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'User', 'user@example.com', 'USD', 0, new Date().toISOString()]
    );
  }

  // Check if categories exist
  const categoryResult = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories');

  if (!categoryResult || (categoryResult as any).count === 0) {
    const defaultCategories = [
      { name: 'Food', icon: 'restaurant', color: '#ff9800', description: 'Groceries, Restaurants, Snacks' },
      { name: 'Transport', icon: 'directions-car', color: '#2196f3', description: 'Gas, Public Transit, Maintenance' },
      { name: 'Shopping', icon: 'shopping-bag', color: '#14b8a6', description: 'Clothes, Electronics, Gadgets' },
      { name: 'Entertainment', icon: 'movie', color: '#ec4899', description: 'Movies, Games, Events' },
      { name: 'Recharge', icon: 'phone-iphone', color: '#00bcd4', description: 'Mobile, DTH, Bill Payments' },
      { name: 'Grocery', icon: 'local-grocery-store', color: '#8bc34a', description: 'Daily groceries and essentials' },
      { name: 'Travel', icon: 'flight', color: '#673ab7', description: 'Flights, Hotels, Vacation' },
      { name: 'Health', icon: 'local-hospital', color: '#4caf50', description: 'Medical, Fitness, Wellness' },
      { name: 'Utilities', icon: 'flash-on', color: '#ff5722', description: 'Electricity, Water, Internet' },
      { name: 'Salary', icon: 'account-balance-wallet', color: '#0bda5b', description: 'Monthly salary and income' },
      // Investment categories
      { name: 'Mutual Funds', icon: 'trending-up', color: '#3b82f6', description: 'Equity, Debt, Hybrid MFs' },
      { name: 'Stocks', icon: 'show-chart', color: '#10b981', description: 'Direct equity investments' },
      { name: 'Gold', icon: 'stars', color: '#f59e0b', description: 'Digital gold, Gold ETFs' },
      { name: 'Fixed Deposit', icon: 'account-balance', color: '#8b5cf6', description: 'Bank FDs, RDs' },
      { name: 'Crypto', icon: 'currency-bitcoin', color: '#f97316', description: 'Cryptocurrency investments' },
    ];

    for (const category of defaultCategories) {
      const categoryId = await generateId();
      await database.runAsync(
        'INSERT INTO categories (id, name, icon, color, description, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [categoryId, category.name, category.icon, category.color, category.description, 1, new Date().toISOString()]
      );
    }
  }

  // Initialize backup config
  const backupResult = await database.getFirstAsync('SELECT COUNT(*) as count FROM backup_config');
  if (!backupResult || (backupResult as any).count === 0) {
    await database.runAsync(
      'INSERT INTO backup_config (id, frequency, max_backups) VALUES (1, ?, ?)',
      ['weekly', 5]
    );
  }
};

export const generateId = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

export const encryptData = async (data: string): Promise<string> => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash;
};

export const clearDatabase = async (): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Delete all user data but keep table structure
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM goals;
      DELETE FROM budgets;
      DELETE FROM users;
      DELETE FROM categories;
    `);

    // Reinitialize default data
    await initDefaultData(db);

    console.log('Database cleared and reset to initial state');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
};

