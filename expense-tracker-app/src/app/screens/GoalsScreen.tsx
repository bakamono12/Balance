import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { GoalCard } from '../components/GoalCard';
import { Button } from '../components/Button';
import { AddGoalModal } from '../components/AddGoalModal';
import { formatCompactCurrency } from '../utils/formatters';
import { notificationService } from '../services/notification.service';
import { transactionService } from '../services/database.service';

export const GoalsScreen = () => {
  const navigation = useNavigation<any>();
  const { user, goals, categories, loadGoals, loadCategories, addGoal, updateGoal, deleteGoal } = useStore();
  const theme = darkTheme;

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [periodFilter, setPeriodFilter] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Reload goals and update progress every time screen is focused
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        await loadGoals();
        await loadCategories();
        // Update goal progress after loading
        if (goals.length > 0) {
          await updateGoalProgress();
        }
      };
      refreshData();
    }, [selectedMonth, selectedYear, periodFilter])
  );

  // Update goal progress based on actual transactions
  const updateGoalProgress = async () => {
    try {
      const startOfMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const endOfMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-31`;

      for (const goal of goals) {
        if (goal.type === 'expense_limit') {
          // Calculate total expenses for the month
          const totalExpense = await transactionService.getTotalByType(
            'expense',
            startOfMonth,
            endOfMonth
          );

          const progress = (totalExpense / goal.targetAmount) * 100;
          let status: 'on_track' | 'behind' | 'completed' | 'warning' = 'on_track';

          if (progress >= 100) {
            status = 'completed';
          } else if (progress >= 80) {
            status = 'warning';
          } else if (progress >= 50) {
            status = 'on_track';
          }

          if (totalExpense !== goal.currentAmount || status !== goal.status) {
            await updateGoal(goal.id, {
              currentAmount: totalExpense,
              status,
            });
          }

          // Check for notifications
          await notificationService.checkAndNotifyGoalProgress({
            ...goal,
            currentAmount: totalExpense,
          });
        } else if (goal.type === 'category_limit' && goal.categoryId) {
          // Calculate expenses for specific category
          const transactions = await transactionService.getTransactionsByDateRange(
            startOfMonth,
            endOfMonth
          );

          const categoryExpense = transactions
            .filter((t) => t.type === 'expense' && t.categoryId === goal.categoryId)
            .reduce((sum, t) => sum + t.amount, 0);

          const progress = (categoryExpense / goal.targetAmount) * 100;
          let status: 'on_track' | 'behind' | 'completed' | 'warning' = 'on_track';

          if (progress >= 100) {
            status = 'completed';
          } else if (progress >= 80) {
            status = 'warning';
          } else if (progress >= 50) {
            status = 'on_track';
          }

          if (categoryExpense !== goal.currentAmount || status !== goal.status) {
            await updateGoal(goal.id, {
              currentAmount: categoryExpense,
              status,
            });
          }

          // Check for notifications
          await notificationService.checkAndNotifyGoalProgress({
            ...goal,
            currentAmount: categoryExpense,
          });
        } else if (goal.type === 'savings') {
          // For savings goals, check notification based on current amount
          await notificationService.checkAndNotifyGoalProgress(goal);
        }
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setShowModal(true);
  };

  const openEditModal = (goal: any) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleSaveGoal = async (goalData: any) => {
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData);
      } else {
        await addGoal(goalData);
      }
      await loadGoals();
      await updateGoalProgress();
    } catch (error) {
      console.error('Failed to save goal:', error);
      throw error;
    }
  };

  const handleDelete = (goal: any) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoal(goal.id);
            await loadGoals();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete goal');
          }
        },
      },
    ]);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#10b981';
    if (progress >= 75) return '#137fec';
    if (progress >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Filter goals based on creation/update date within the selected period
  const getFilteredGoals = () => {
    return goals.filter((goal) => {
      // Check both createdAt and startDate to find when the goal was initiated
      const createdAtDate = goal.createdAt ? new Date(goal.createdAt) : null;
      const startDateObj = goal.startDate ? new Date(goal.startDate) : null;

      // Use the earlier of the two dates (or whichever is available)
      let goalDate: Date;
      if (createdAtDate && startDateObj) {
        goalDate = createdAtDate < startDateObj ? createdAtDate : startDateObj;
      } else if (createdAtDate) {
        goalDate = createdAtDate;
      } else if (startDateObj) {
        goalDate = startDateObj;
      } else {
        return false; // No valid date, exclude from results
      }

      const goalMonth = goalDate.getMonth();
      const goalYear = goalDate.getFullYear();

      // Check if goal was created in the selected period
      const isInPeriod =
        periodFilter === 'year'
          ? goalYear === selectedYear
          : goalYear === selectedYear && goalMonth === selectedMonth;

      return isInPeriod;
    });
  };

  // Calculate stats based on filtered goals
  const getFilteredStats = () => {
    const filteredGoals = getFilteredGoals();
    let totalSaved = 0;
    let totalExpenseLimit = 0;
    let totalExpenseSpent = 0;
    let completedCount = 0;

    filteredGoals.forEach((goal) => {
      // Only savings goals contribute to totalSaved
      if (goal.type === 'savings') {
        totalSaved += goal.currentAmount || 0;
      }

      // Expense limit and category limit goals
      if (goal.type === 'expense_limit' || goal.type === 'category_limit') {
        totalExpenseLimit += goal.targetAmount || 0;
        totalExpenseSpent += goal.currentAmount || 0;
      }

      // Count completed goals
      if (goal.status === 'completed') {
        completedCount++;
      }
    });

    // Calculate remaining budget for expense limits
    const expenseRemaining = Math.max(0, totalExpenseLimit - totalExpenseSpent);

    return { totalSaved, expenseRemaining, totalExpenseSpent, completedCount, filteredGoals };
  };

  const { totalSaved, expenseRemaining, totalExpenseSpent, completedCount, filteredGoals } = getFilteredStats();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Financial Goals
        </Text>
        <TouchableOpacity onPress={openAddModal}>
          <MaterialIcons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              periodFilter === 'month' && styles.filterButtonActive,
              { backgroundColor: periodFilter === 'month' ? theme.colors.primary : theme.colors.surface },
            ]}
            onPress={() => setPeriodFilter('month')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: periodFilter === 'month' ? '#fff' : theme.colors.textSecondary },
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              periodFilter === 'year' && styles.filterButtonActive,
              { backgroundColor: periodFilter === 'year' ? theme.colors.primary : theme.colors.surface },
            ]}
            onPress={() => setPeriodFilter('year')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: periodFilter === 'year' ? '#fff' : theme.colors.textSecondary },
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month/Year Selector */}
        <View style={styles.selectorContainer}>
          {periodFilter === 'month' && (
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowMonthPicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              <Text style={[styles.selectorText, { color: theme.colors.text }]}>
                {monthNames[selectedMonth]} {selectedYear}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          {periodFilter === 'year' && (
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowYearPicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              <Text style={[styles.selectorText, { color: theme.colors.text }]}>
                {selectedYear}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(19, 127, 236, 0.1)' }]}>
              <MaterialIcons name="savings" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Saved
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatCompactCurrency(totalSaved, user?.currency)}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#f59e0b" />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Budget Left
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatCompactCurrency(expenseRemaining, user?.currency)}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <MaterialIcons name="check-circle" size={20} color="#10b981" />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Completed
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {completedCount}
            </Text>
          </View>
        </View>

        {/* Active Goals Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Active Goals</Text>
          <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>
              {filteredGoals.filter((g) => g.status !== 'completed').length} Active
            </Text>
          </View>
        </View>

        {filteredGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="flag" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Goals Found
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No goals were created in {periodFilter === 'month' ? monthNames[selectedMonth] : ''} {selectedYear}
            </Text>
            <Button title="Add Goal" onPress={openAddModal} style={styles.emptyButton} />
          </View>
        ) : (
          filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              showActions={true}
              onEdit={() => openEditModal(goal)}
              onDelete={() => handleDelete(goal)}
            />
          ))
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <AddGoalModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
        categories={categories}
      />

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Month & Year
              </Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                  Year
                </Text>
                <View style={styles.pickerGrid}>
                  {generateYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        { backgroundColor: theme.colors.background },
                        selectedYear === year && { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedYear === year ? '#fff' : theme.colors.text },
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                  Month
                </Text>
                <View style={styles.pickerGrid}>
                  {monthNames.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        { backgroundColor: theme.colors.background },
                        selectedMonth === index && { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedMonth === index ? '#fff' : theme.colors.text },
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.pickerFooter}>
              <Button
                title="Done"
                onPress={() => setShowMonthPicker(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal visible={showYearPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Year
              </Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.pickerSection}>
                <View style={styles.pickerGrid}>
                  {generateYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        { backgroundColor: theme.colors.background },
                        selectedYear === year && { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => {
                        setSelectedYear(year);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedYear === year ? '#fff' : theme.colors.text },
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterButtonActive: {
    elevation: 2,
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    gap: 6,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goalAmount: {
    fontSize: 14,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalStatText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    paddingTop: 10,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputField: {
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    paddingTop: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    elevation: 4,
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pickerScrollView: {
    padding: 20,
  },
  pickerSection: {
    marginBottom: 24,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pickerItem: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});

