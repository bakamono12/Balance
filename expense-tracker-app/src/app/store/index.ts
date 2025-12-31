import { create } from 'zustand';
import { User, Category, Transaction, Goal } from '../types';
import { userService, categoryService, transactionService, goalService } from '../services/database.service';

interface AppState {
  // State
  isDarkMode: boolean;
  user: User | null;
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  isLoading: boolean;

  // User actions
  loadUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  logout: () => void;

  // Category actions
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Transaction actions
  loadTransactions: (limit?: number) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Goal actions
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // UI actions
  toggleDarkMode: () => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  isDarkMode: true,
  user: null,
  categories: [],
  transactions: [],
  goals: [],
  isLoading: false,

  // User actions
  loadUser: async () => {
    try {
      const user = await userService.getUser();
      set({ user });
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  },

  updateUser: async (userData: Partial<User>) => {
    try {
      await userService.updateUser(userData);
      const user = await userService.getUser();
      set({ user });
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },

  logout: () => {
    // Clear all state - user will be redirected to onboarding by navigation
    set({
      user: null,
      transactions: [],
      goals: [],
      categories: [],
    });
  },

  // Category actions
  loadCategories: async () => {
    try {
      const categories = await categoryService.getAllCategories();
      set({ categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  },

  addCategory: async (category: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      await categoryService.createCategory(category);
      const categories = await categoryService.getAllCategories();
      set({ categories });
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  },

  updateCategory: async (id: string, category: Partial<Category>) => {
    try {
      await categoryService.updateCategory(id, category);
      const categories = await categoryService.getAllCategories();
      set({ categories });
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      const categories = await categoryService.getAllCategories();
      set({ categories });
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },

  // Transaction actions
  loadTransactions: async (limit?: number) => {
    try {
      const transactions = await transactionService.getAllTransactions(limit);
      set({ transactions });
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await transactionService.createTransaction(transaction);
      const transactions = await transactionService.getAllTransactions(20);
      set({ transactions });
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>) => {
    try {
      await transactionService.updateTransaction(id, transaction);
      const transactions = await transactionService.getAllTransactions(20);
      set({ transactions });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      await transactionService.deleteTransaction(id);
      const transactions = await transactionService.getAllTransactions(20);
      set({ transactions });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  },

  // Goal actions
  loadGoals: async () => {
    try {
      const goals = await goalService.getAllGoals();
      set({ goals });
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  },

  addGoal: async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await goalService.createGoal(goal);
      const goals = await goalService.getAllGoals();
      set({ goals });
    } catch (error) {
      console.error('Failed to add goal:', error);
      throw error;
    }
  },

  updateGoal: async (id: string, goal: Partial<Goal>) => {
    try {
      await goalService.updateGoal(id, goal);
      const goals = await goalService.getAllGoals();
      set({ goals });
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  },

  deleteGoal: async (id: string) => {
    try {
      await goalService.deleteGoal(id);
      const goals = await goalService.getAllGoals();
      set({ goals });
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  },

  // UI actions
  toggleDarkMode: () => {
    set({ isDarkMode: !get().isDarkMode });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

