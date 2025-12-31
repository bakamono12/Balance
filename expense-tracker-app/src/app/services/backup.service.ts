import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../storage/database';
import { format } from 'date-fns';

const { Paths } = FileSystem;

export interface BackupConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  lastBackup?: string;
}

export const backupService = {
  async createBackup(): Promise<string> {
    try {
      const db = getDatabase();

      const users = await db.getAllAsync('SELECT * FROM users');
      const categories = await db.getAllAsync('SELECT * FROM categories');
      const transactions = await db.getAllAsync('SELECT * FROM transactions');
      const goals = await db.getAllAsync('SELECT * FROM goals');
      const budgets = await db.getAllAsync('SELECT * FROM budgets');

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: { users, categories, transactions, goals, budgets },
      };

      const fileName = `expense_tracker_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`;
      const file = new FileSystem.File(Paths.document, fileName);

      await file.write(JSON.stringify(backupData, null, 2));

      await db.runAsync(
        'UPDATE backup_config SET last_backup = ? WHERE id = 1',
        [new Date().toISOString()]
      );

      return file.uri;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('Failed to create backup');
    }
  },

  async exportBackup(): Promise<void> {
    try {
      const filePath = await this.createBackup();

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Expense Tracker Backup',
      });
    } catch (error) {
      console.error('Failed to export backup:', error);
      throw error;
    }
  },

  async importBackup(): Promise<void> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;

      const file = new FileSystem.File(fileUri);
      const fileContent = await file.text();

      const backupData = JSON.parse(fileContent);

      if (!backupData.version || !backupData.data) {
        throw new Error('Invalid backup file format');
      }

      await this.restoreFromBackup(backupData.data);
    } catch (error) {
      console.error('Failed to import backup:', error);
      throw new Error('Failed to import backup');
    }
  },

  async restoreFromBackup(data: any): Promise<void> {
    const db = getDatabase();

    try {
      await db.execAsync(`
        DELETE FROM transactions;
        DELETE FROM goals;
        DELETE FROM budgets;
        DELETE FROM users;
        DELETE FROM categories WHERE is_default = 0;
      `);

      if (data.users && data.users.length > 0) {
        for (const user of data.users) {
          await db.runAsync(
            'INSERT INTO users (id, name, email, profile_photo, currency, monthly_income, pin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, user.name, user.email, user.profile_photo, user.currency, user.monthly_income, user.pin, user.created_at]
          );
        }
      }

      if (data.categories) {
        for (const category of data.categories) {
          if (!category.is_default) {
            await db.runAsync(
              'INSERT OR REPLACE INTO categories (id, name, icon, color, description, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [category.id, category.name, category.icon, category.color, category.description, category.is_default, category.created_at]
            );
          }
        }
      }

      if (data.transactions) {
        for (const transaction of data.transactions) {
          await db.runAsync(
            'INSERT INTO transactions (id, type, amount, category_id, date, payment_mode, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [transaction.id, transaction.type, transaction.amount, transaction.category_id, transaction.date, transaction.payment_mode, transaction.notes, transaction.created_at, transaction.updated_at]
          );
        }
      }

      if (data.goals) {
        for (const goal of data.goals) {
          await db.runAsync(
            'INSERT INTO goals (id, name, type, target_amount, current_amount, start_date, target_date, status, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [goal.id, goal.name, goal.type, goal.target_amount, goal.current_amount, goal.start_date, goal.target_date, goal.status, goal.icon, goal.color, goal.created_at, goal.updated_at]
          );
        }
      }

      if (data.budgets) {
        for (const budget of data.budgets) {
          await db.runAsync(
            'INSERT INTO budgets (id, monthly_limit, current_spent, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [budget.id, budget.monthly_limit, budget.current_spent, budget.month, budget.created_at, budget.updated_at]
          );
        }
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw new Error('Failed to restore backup');
    }
  },

  async getBackupConfig(): Promise<BackupConfig> {
    const db = getDatabase();
    const result = await db.getFirstAsync<any>('SELECT * FROM backup_config WHERE id = 1');

    return {
      frequency: result?.frequency || 'weekly',
      maxBackups: result?.max_backups || 5,
      lastBackup: result?.last_backup,
    };
  },

  async updateBackupConfig(config: Partial<BackupConfig>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (config.frequency) {
      fields.push('frequency = ?');
      values.push(config.frequency);
    }
    if (config.maxBackups !== undefined) {
      fields.push('max_backups = ?');
      values.push(config.maxBackups);
    }

    if (fields.length > 0) {
      await db.runAsync(`UPDATE backup_config SET ${fields.join(', ')} WHERE id = 1`, values);
    }
  },
};

