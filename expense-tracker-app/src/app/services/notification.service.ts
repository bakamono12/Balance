import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { goalService } from './database.service';
import { Goal } from '../types';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private initialized = false;
  private notificationsAvailable = false;

  /**
   * Initialize notification permissions
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        this.notificationsAvailable = true;
      } else {
        console.warn('Notification permissions not granted, will use Alert instead');
        this.notificationsAvailable = false;
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Notifications not available in this environment, using Alert fallback:', error);
      this.notificationsAvailable = false;
      this.initialized = true;
    }
  }

  /**
   * Check if a goal has reached 80% and show notification
   */
  async checkAndNotifyGoalProgress(goal: Goal): Promise<void> {
    await this.initialize();

    const progress = (goal.currentAmount / goal.targetAmount) * 100;

    // Check if goal reached 80% and notification hasn't been shown yet
    if (progress >= 80 && !goal.notificationShown) {
      await this.showGoalNotification(goal, progress);

      // Mark notification as shown
      await goalService.updateGoal(goal.id, {
        notificationShown: true,
      });
    }
  }

  /**
   * Show notification for goal progress
   * Uses local notifications if available, otherwise falls back to Alert
   */
  private async showGoalNotification(goal: Goal, progress: number): Promise<void> {
    let title = '';
    let body = '';
    let emoji = '';

    if (goal.type === 'savings') {
      emoji = '🎉';
      title = 'Savings Goal Progress!';
      body = `You've reached ${Math.round(progress)}% of your "${goal.name}" goal! Keep it up!`;
    } else if (goal.type === 'expense_limit') {
      emoji = '⚠️';
      title = 'Expense Limit Alert!';
      body = `You've spent ${Math.round(progress)}% of your "${goal.name}" limit. Be careful with your spending!`;
    } else if (goal.type === 'category_limit') {
      emoji = '⚠️';
      title = 'Category Limit Alert!';
      body = `You've reached ${Math.round(progress)}% of your "${goal.name}" category limit. Consider reducing spending in this category.`;
    }

    try {
      // Try to use local notifications (works in Expo Go)
      if (this.notificationsAvailable) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${emoji} ${title}`,
            body: body,
            sound: true,
            data: { goalId: goal.id, type: goal.type },
          },
          trigger: null, // Show immediately
        });
      } else {
        // Fallback to Alert for environments where notifications aren't available
        Alert.alert(`${emoji} ${title}`, body, [
          { text: 'OK', style: 'default' }
        ]);
      }
    } catch (error) {
      console.warn('Failed to show notification, using Alert fallback:', error);
      // Fallback to Alert if notification fails
      Alert.alert(`${emoji} ${title}`, body, [
        { text: 'OK', style: 'default' }
      ]);
    }
  }

  /**
   * Check all goals and send notifications if needed
   */
  async checkAllGoalsForNotifications(): Promise<void> {
    await this.initialize();

    try {
      const goals = await goalService.getAllGoals();

      for (const goal of goals) {
        if (goal.status !== 'completed') {
          await this.checkAndNotifyGoalProgress(goal);
        }
      }
    } catch (error) {
      console.error('Error checking goals for notifications:', error);
    }
  }

  /**
   * Reset notification shown flag when goal is updated
   * This allows showing notification again if user increases target
   */
  async resetNotificationIfNeeded(goalId: string, oldProgress: number, newProgress: number): Promise<void> {
    // If progress drops below 80%, reset the notification flag
    if (oldProgress >= 80 && newProgress < 80) {
      await goalService.updateGoal(goalId, {
        notificationShown: false,
      });
    }
  }

  /**
   * Cancel all pending notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Failed to cancel notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();

