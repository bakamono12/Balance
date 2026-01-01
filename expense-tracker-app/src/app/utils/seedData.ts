import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { format } from 'date-fns';

// Helper to generate unique IDs
const generateId = async (): Promise<string> => {
  const uuid = Crypto.randomUUID();
  return uuid;
};

export const seedDatabase = async (db: SQLite.SQLiteDatabase, force: boolean = false) => {
  // Check if we already have transactions
  const existingTransactions = await db.getFirstAsync<any>(
    'SELECT COUNT(*) as count FROM transactions'
  );

  if (!force && existingTransactions && existingTransactions.count > 0) {
    console.log('Database already has data, skipping seed');
    return { success: false, message: 'Database already has data' };
  }

  console.log('Seeding database with comprehensive 2025 test data...');

  try {
    // Get categories
    const categories = await db.getAllAsync<any>('SELECT * FROM categories');
    const foodCat = categories.find(c => c.name === 'Food');
    const transportCat = categories.find(c => c.name === 'Transport');
    const shoppingCat = categories.find(c => c.name === 'Shopping');
    const entertainmentCat = categories.find(c => c.name === 'Entertainment');
    const salaryCat = categories.find(c => c.name === 'Salary');
    const groceryCat = categories.find(c => c.name === 'Grocery');
    const utilitiesCat = categories.find(c => c.name === 'Utilities');
    const healthCat = categories.find(c => c.name === 'Health');
    const rechargeCat = categories.find(c => c.name === 'Recharge');
    const mutualFundsCat = categories.find(c => c.name === 'Mutual Funds');

    // Payment modes to use randomly
    const paymentModes = ['upi', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'wallet'];
    const getRandomPaymentMode = () => paymentModes[Math.floor(Math.random() * paymentModes.length)];

  // Helper function to create transaction
  const createTransaction = async (type: string, amount: number, categoryId: string, date: Date, notes: string, fundName?: string, paymentMode?: string) => {
    const id = await generateId();
    const now = new Date().toISOString();
    const dateStr = format(date, 'yyyy-MM-dd');
    const mode = paymentMode || getRandomPaymentMode();

    await db.runAsync(
      'INSERT INTO transactions (id, type, amount, category_id, date, payment_mode, notes, fund_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, type, amount, categoryId, dateStr, mode, notes, fundName || null, now, now]
    );
  };

  // Generate data for all 12 months of 2025
  for (let month = 0; month < 12; month++) {
    // Salary: 50k for Jan-July, 80k for Aug-Dec
    const salaryAmount = month < 7 ? 50000 : 80000;
    const salaryDate = new Date(2025, month, 1);
    await createTransaction('income', salaryAmount, salaryCat?.id, salaryDate, 'Monthly Salary', undefined, 'bank_transfer');

    // Fixed Investment: 3300 every month
    const investmentDate = new Date(2025, month, 5);
    await createTransaction('investment', 3300, mutualFundsCat?.id, investmentDate, 'SIP Investment', 'HDFC Top 100 Fund', 'upi');

    // Generate random expenses (20-25k total per month)
    const expenseTarget = 20000 + Math.random() * 5000; // Random between 20k-25k
    let totalExpenses = 0;

    // Groceries (4-6k per month, spread across 4 transactions)
    for (let i = 0; i < 4; i++) {
      const amount = 1000 + Math.random() * 500;
      const day = 7 + (i * 7);
      const date = new Date(2025, month, day);
      await createTransaction('expense', amount, groceryCat?.id, date, 'Weekly Groceries');
      totalExpenses += amount;
    }

    // Food/Dining (5-7k per month, spread across 10 transactions)
    for (let i = 0; i < 10; i++) {
      const amount = 300 + Math.random() * 400;
      const day = 3 + (i * 3);
      const date = new Date(2025, month, day);
      const restaurants = ['Zomato Order', 'Restaurant Meal', 'Cafe', 'Food Delivery', 'Lunch'];
      await createTransaction('expense', amount, foodCat?.id, date, restaurants[Math.floor(Math.random() * restaurants.length)]);
      totalExpenses += amount;
    }

    // Transport (2-3k per month)
    for (let i = 0; i < 6; i++) {
      const amount = 200 + Math.random() * 300;
      const day = 5 + (i * 5);
      const date = new Date(2025, month, day);
      const transports = ['Uber Ride', 'Petrol', 'Metro Card Recharge', 'Parking'];
      await createTransaction('expense', amount, transportCat?.id, date, transports[Math.floor(Math.random() * transports.length)]);
      totalExpenses += amount;
    }

    // Utilities (1.5-2k per month)
    const utilityAmount = 1500 + Math.random() * 500;
    const utilityDate = new Date(2025, month, 10);
    await createTransaction('expense', utilityAmount, utilitiesCat?.id, utilityDate, 'Electricity & Internet Bill');
    totalExpenses += utilityAmount;

    // Recharge/Bills (500-800)
    const rechargeAmount = 500 + Math.random() * 300;
    const rechargeDate = new Date(2025, month, 15);
    await createTransaction('expense', rechargeAmount, rechargeCat?.id, rechargeDate, 'Mobile Recharge');
    totalExpenses += rechargeAmount;

    // Entertainment (1-2k per month)
    for (let i = 0; i < 3; i++) {
      const amount = 300 + Math.random() * 400;
      const day = 12 + (i * 7);
      const date = new Date(2025, month, day);
      const entertainment = ['Netflix', 'Movie Tickets', 'Gaming', 'Concert'];
      await createTransaction('expense', amount, entertainmentCat?.id, date, entertainment[Math.floor(Math.random() * entertainment.length)]);
      totalExpenses += amount;
    }

    // Shopping (remaining budget to reach 20-25k, max 2-3 items)
    const remainingBudget = expenseTarget - totalExpenses;
    const shoppingItems = Math.floor(2 + Math.random() * 2); // 2-3 items
    for (let i = 0; i < shoppingItems; i++) {
      const amount = remainingBudget / shoppingItems;
      const day = 8 + (i * 10);
      const date = new Date(2025, month, day);
      const shops = ['Amazon Order', 'Clothing', 'Electronics', 'Accessories'];
      await createTransaction('expense', amount, shoppingCat?.id, date, shops[Math.floor(Math.random() * shops.length)]);
    }

    // Health (occasional, 500-1k every 2 months)
    if (month % 2 === 0) {
      const healthAmount = 500 + Math.random() * 500;
      const healthDate = new Date(2025, month, 20);
      await createTransaction('expense', healthAmount, healthCat?.id, healthDate, 'Medicine/Doctor Visit');
    }

    console.log(`✓ Seeded ${format(new Date(2025, month, 1), 'MMMM yyyy')}`);
  }

  // Seed a few goals
  const goals = [
    {
      name: 'Emergency Fund',
      type: 'savings',
      targetAmount: 100000,
      currentAmount: 45000,
      status: 'on_track',
      icon: 'shield',
      color: '#f59e0b',
    },
    {
      name: 'Europe Trip 2026',
      type: 'savings',
      targetAmount: 150000,
      currentAmount: 30000,
      status: 'on_track',
      icon: 'flight',
      color: '#3b82f6',
    },
    {
      name: 'New Laptop',
      type: 'savings',
      targetAmount: 80000,
      currentAmount: 60000,
      status: 'on_track',
      icon: 'laptop-mac',
      color: '#8b5cf6',
    },
  ];

  for (const goal of goals) {
    const id = await generateId();
    const now = new Date().toISOString();
    const startDate = format(new Date(2025, 0, 1), 'yyyy-MM-dd');
    const targetDate = format(new Date(2026, 0, 1), 'yyyy-MM-dd');

    await db.runAsync(
      'INSERT INTO goals (id, name, type, target_amount, current_amount, start_date, target_date, status, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, goal.name, goal.type, goal.targetAmount, goal.currentAmount, startDate, targetDate, goal.status, goal.icon, goal.color, now, now]
    );
  }

  // Set budgets for all 12 months
  for (let month = 0; month < 12; month++) {
    const monthStr = format(new Date(2025, month, 1), 'yyyy-MM');
    const budgetId = await generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO budgets (id, monthly_limit, current_spent, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [budgetId, 25000, 0, monthStr, now, now]
    );
  }

  console.log('✅ Database seeded successfully with 2025 test data!');
  console.log('\n📊 Expected Results Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Jan-July 2025:');
  console.log('  Income: ₹50,000/month');
  console.log('  Investment: ₹3,300/month (fixed)');
  console.log('  Expenses: ₹20,000-25,000/month (random)');
  console.log('  Savings: ₹22,000-27,000/month');
  console.log('');
  console.log('Aug-Dec 2025:');
  console.log('  Income: ₹80,000/month');
  console.log('  Investment: ₹3,300/month (fixed)');
  console.log('  Expenses: ₹20,000-25,000/month (random)');
  console.log('  Savings: ₹52,000-57,000/month');
  console.log('');
  console.log('Total 2025:');
  console.log('  Total Income: ₹7,40,000');
  console.log('  Total Investment: ₹39,600');
  console.log('  Total Expenses: ₹2,40,000-3,00,000 (avg ₹2,70,000)');
  console.log('  Net Savings: ₹4,00,400-4,60,400 (avg ₹4,30,400)');

  return { success: true, message: 'Database seeded successfully!' };
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return { success: false, message: `Error: ${error.message}` };
  }
};


