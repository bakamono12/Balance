import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency, getCurrentMonth, getMonthStartEnd } from '../utils/formatters';
import { transactionService } from '../services/database.service';
import { analyticsService } from '../services/analytics.service';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode, user, transactions, categories, loadTransactions, loadUser } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceChange, setBalanceChange] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadUser();
    await loadTransactions(10);
    await calculateTotals();
  };

  const calculateTotals = async () => {
    const currentMonth = getCurrentMonth();
    const { start, end } = getMonthStartEnd(currentMonth);

    const income = await transactionService.getTotalByType('income', start, end);
    const expense = await transactionService.getTotalByType('expense', start, end);
    const investment = await transactionService.getTotalByType('investment', start, end);

    setTotalIncome(income);
    setTotalExpense(expense);
    setTotalInvestment(investment);

    // Get month-on-month change
    const changes = await analyticsService.getMonthOnMonthChange(currentMonth);
    setBalanceChange(changes.balance);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalBalance = totalIncome - totalExpense;
  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerLeft}>
          <View style={styles.profilePicture}>
            {user?.profilePhoto ? (
              <Image
                source={{ uri: user.profilePhoto }}
                style={styles.profileImage}
              />
            ) : (
              <MaterialIcons name="person" size={24} color={theme.colors.primary} />
            )}
          </View>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              Good Evening
            </Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user?.name || 'User'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialIcons name="settings" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, theme.shadows.large]}>
          <View style={styles.balanceCardContent}>
            <View style={styles.balanceHeader}>
              <View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(totalBalance, user?.currency)}
                </Text>
              </View>

              <View style={styles.trendBadge}>
                <MaterialIcons
                  name={balanceChange >= 0 ? "trending-up" : "trending-down"}
                  size={16}
                  color={balanceChange >= 0 ? "#10b981" : "#ef4444"}
                />
                <Text style={[styles.trendText, { color: balanceChange >= 0 ? "#ffffff" : "#ffffff" }]}>
                  {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.balanceFooter}>
              <View style={styles.statusDot} />
              <Text style={styles.balanceFooterText}>Updated just now</Text>
            </View>
          </View>
        </View>

        {/* Income, Expense & Investment Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.summaryScroll}
          contentContainerStyle={styles.summaryGrid}
        >
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.summaryIcon}>
              <View style={styles.incomeIconBg}>
                <MaterialIcons name="arrow-upward" size={20} color={theme.colors.income.main} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Income
              </Text>
            </View>
            <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>
              {formatCurrency(totalIncome, user?.currency)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.summaryIcon}>
              <View style={styles.expenseIconBg}>
                <MaterialIcons name="arrow-downward" size={20} color={theme.colors.expense.main} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Expense
              </Text>
            </View>
            <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>
              {formatCurrency(totalExpense, user?.currency)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.summaryIcon}>
              <View style={styles.investmentIconBg}>
                <MaterialIcons name="trending-up" size={20} color="#3b82f6" />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Investment
              </Text>
            </View>
            <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>
              {formatCurrency(totalInvestment, user?.currency)}
            </Text>
          </View>
        </ScrollView>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
              <View style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                  View All
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No transactions yet
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => {
                const category = categories.find(c => c.id === transaction.categoryId);
                if (!category) return null;

                return (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    category={category}
                  />
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#137fec20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#324d67',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  balanceCard: {
    borderRadius: 16,
    backgroundColor: '#137fec',
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  balanceCardContent: {
    gap: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#93c5fd',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  balanceFooterText: {
    fontSize: 12,
    color: '#93c5fd',
    fontWeight: '500',
  },
  summaryScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  summaryGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  summaryCard: {
    width: 160,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  summaryIcon: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  incomeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#113a28',
    borderWidth: 1,
    borderColor: '#1a5c3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#3a1d1d',
    borderWidth: 1,
    borderColor: '#5c2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  investmentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1e3a8a',
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});

