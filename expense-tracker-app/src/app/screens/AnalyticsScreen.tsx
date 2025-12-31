import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { analyticsService } from '../services/analytics.service';
import { formatCurrency, getCurrentMonth, formatMonth, formatCompactCurrency } from '../utils/formatters';
import { logger } from '../utils/logger';
import { addMonths, subMonths, parseISO, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export const AnalyticsScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode, user } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodFilter, setPeriodFilter] = useState<'month' | 'year'>('month');
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [categoryExpenses, setCategoryExpenses] = useState<any[]>([]);
  const [dailySpending, setDailySpending] = useState<any[]>([]);
  const [weeklyIncome, setWeeklyIncome] = useState<any[]>([]);
  const [weeklyExpense, setWeeklyExpense] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [filter, setFilter] = useState<'overview' | 'income' | 'expense'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [touchedDayIndex, setTouchedDayIndex] = useState<number | null>(null);
  const [touchedCashFlowIndex, setTouchedCashFlowIndex] = useState<number | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedMonth, selectedYear, periodFilter, selectedWeek]);

  const loadAnalytics = async () => {
    try {
      logger.info('Loading analytics', { selectedMonth, selectedYear, periodFilter });

      if (periodFilter === 'year') {
        // Load yearly data
        const stats = await analyticsService.getYearlyStats(selectedYear);
        const expenses = await analyticsService.getYearlyCategoryExpenses(selectedYear);

        setMonthlyStats(stats);
        setCategoryExpenses(expenses.slice(0, 5));
        setDailySpending([]);
        setWeeklyIncome([]);
        setWeeklyExpense([]);
      } else {
        // Load monthly data
        const stats = await analyticsService.getMonthlyStats(selectedMonth);
        const expenses = await analyticsService.getCategoryExpenses(selectedMonth);
        const daily = await analyticsService.getDailySpending(selectedMonth);

        // Get week's income and expense for cash flow based on selected month and week
        const monthDate = parseISO(selectedMonth + '-01');
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const weekStartDay = (selectedWeek - 1) * 7 + 1;
        const weekStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), weekStartDay);
        const weekEnd = new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.min(weekStartDay + 6, new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()));

        const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const weekIncome: any[] = [];
        const weekExpense: any[] = [];

        for (const day of daysOfWeek) {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayData = daily.find(d => d.date === dayStr);
          weekIncome.push(dayData?.income || 0);
          weekExpense.push(dayData?.expense || 0);
        }

        logger.debug('Analytics loaded', {
          stats,
          expensesCount: expenses.length,
          dailyCount: daily.length,
          weekIncome,
          weekExpense,
          selectedWeek
        });

        setMonthlyStats(stats);
        setCategoryExpenses(expenses.slice(0, 5));
        setDailySpending(daily);
        setWeeklyIncome(weekIncome);
        setWeeklyExpense(weekExpense);
      }
    } catch (error) {
      logger.error('Failed to load analytics', error);
      console.error('Analytics loading error:', error);
    }
  };

  const handlePreviousMonth = () => {
    const currentDate = parseISO(selectedMonth + '-01');
    const prevMonth = subMonths(currentDate, 1);
    setSelectedMonth(format(prevMonth, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const currentDate = parseISO(selectedMonth + '-01');
    const nextMonth = addMonths(currentDate, 1);
    const now = new Date();

    if (nextMonth <= now) {
      setSelectedMonth(format(nextMonth, 'yyyy-MM'));
    }
  };

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    const now = new Date();
    if (selectedYear < now.getFullYear()) {
      setSelectedYear(prev => prev + 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const pieData = categoryExpenses
    .filter(cat => cat.total > 0)
    .map((cat) => ({
      name: cat.categoryName,
      population: isNaN(cat.total) || !isFinite(cat.total) ? 0 : cat.total,
      color: cat.color,
      legendFontColor: '#92adc9',
      legendFontSize: 12,
    }));

  const totalExpense = categoryExpenses.reduce((sum, cat) => sum + cat.total, 0);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Filter */}
        <View style={styles.periodFilterContainer}>
          <TouchableOpacity
            style={[styles.periodFilterButton, periodFilter === 'month' && styles.periodFilterActive]}
            onPress={() => setPeriodFilter('month')}
          >
            <Text style={[styles.periodFilterText, { color: periodFilter === 'month' ? '#ffffff' : theme.colors.textSecondary }]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodFilterButton, periodFilter === 'year' && styles.periodFilterActive]}
            onPress={() => setPeriodFilter('year')}
          >
            <Text style={[styles.periodFilterText, { color: periodFilter === 'year' ? '#ffffff' : theme.colors.textSecondary }]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month/Year Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={periodFilter === 'month' ? handlePreviousMonth : handlePreviousYear}>
            <MaterialIcons name="chevron-left" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.colors.text }]}>
            {periodFilter === 'month' ? formatMonth(selectedMonth) : selectedYear}
          </Text>
          <TouchableOpacity onPress={periodFilter === 'month' ? handleNextMonth : handleNextYear}>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'overview' && styles.filterChipActive]}
              onPress={() => setFilter('overview')}
            >
              <MaterialIcons
                name="grid-view"
                size={16}
                color={filter === 'overview' ? '#ffffff' : theme.colors.textSecondary}
              />
              <Text style={[styles.filterText, { color: filter === 'overview' ? '#ffffff' : theme.colors.text }]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filter === 'income' && styles.filterChipActive]}
              onPress={() => setFilter('income')}
            >
              <MaterialIcons
                name="arrow-upward"
                size={16}
                color={filter === 'income' ? '#ffffff' : '#10b981'}
              />
              <Text style={[styles.filterText, { color: filter === 'income' ? '#ffffff' : theme.colors.text }]}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filter === 'expense' && styles.filterChipActive]}
              onPress={() => setFilter('expense')}
            >
              <MaterialIcons
                name="arrow-downward"
                size={16}
                color={filter === 'expense' ? '#ffffff' : '#ef4444'}
              />
              <Text style={[styles.filterText, { color: filter === 'expense' ? '#ffffff' : theme.colors.text }]}>
                Expense
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
          <View style={styles.cardsContainer}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardIconContainer}>
                <View style={[styles.cardIconBg, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialIcons name="account-balance-wallet" size={18} color={theme.colors.primary} />
                </View>
              </View>
              <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>TOTAL BALANCE</Text>
              <Text style={[styles.cardValue, { color: theme.colors.text }]}>
                {formatCurrency(monthlyStats?.balance || 0, user?.currency)}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardIconContainer}>
                <View style={[styles.cardIconBg, { backgroundColor: '#10b981' + '20' }]}>
                  <MaterialIcons name="payments" size={18} color="#10b981" />
                </View>
              </View>
              <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>TOTAL INCOME</Text>
              <Text style={[styles.cardValue, { color: theme.colors.text }]}>
                {formatCurrency(monthlyStats?.totalIncome || 0, user?.currency)}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardIconContainer}>
                <View style={[styles.cardIconBg, { backgroundColor: '#ef4444' + '20' }]}>
                  <MaterialIcons name="trending-down" size={18} color="#ef4444" />
                </View>
              </View>
              <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>TOTAL EXPENSE</Text>
              <Text style={[styles.cardValue, { color: theme.colors.text }]}>
                {formatCurrency(monthlyStats?.totalExpense || 0, user?.currency)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Cash Flow Chart - Only show in monthly view */}
        {periodFilter === 'month' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cash Flow</Text>
              <View style={styles.weekSelector}>
                {[1, 2, 3, 4].map(week => (
                  <TouchableOpacity
                    key={week}
                    style={[
                      styles.weekButton,
                      selectedWeek === week && styles.weekButtonActive
                    ]}
                    onPress={() => setSelectedWeek(week)}
                  >
                    <Text style={[
                      styles.weekButtonText,
                      { color: selectedWeek === week ? '#ffffff' : theme.colors.textSecondary }
                    ]}>
                      W{week}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.cashFlowChart}>
            {dayLabels.map((day, index) => {
              const incomeHeight = weeklyIncome[index] || 0;
              const expenseHeight = weeklyExpense[index] || 0;

              // Calculate max value based on filter
              let maxValue = 100;
              if (filter === 'income') {
                maxValue = Math.max(...weeklyIncome, 100);
              } else if (filter === 'expense') {
                maxValue = Math.max(...weeklyExpense, 100);
              } else {
                maxValue = Math.max(...weeklyIncome, ...weeklyExpense, 100);
              }

              const incomePercent = (incomeHeight / maxValue) * 100;
              const expensePercent = (expenseHeight / maxValue) * 100;

              // Show bars based on filter
              const showIncome = filter === 'overview' || filter === 'income';
              const showExpense = filter === 'overview' || filter === 'expense';

              return (
                <TouchableOpacity
                  key={day}
                  style={styles.barContainer}
                  onPress={() => setTouchedCashFlowIndex(index)}
                  activeOpacity={0.7}
                >
                  {touchedCashFlowIndex === index && (
                    (showIncome && incomeHeight > 0) || (showExpense && expenseHeight > 0)
                  ) && (
                    <View style={styles.tooltip}>
                      {showIncome && incomeHeight > 0 && (
                        <Text style={styles.tooltipText}>
                          ↑ {formatCurrency(incomeHeight, user?.currency)}
                        </Text>
                      )}
                      {showExpense && expenseHeight > 0 && (
                        <Text style={styles.tooltipText}>
                          ↓ {formatCurrency(expenseHeight, user?.currency)}
                        </Text>
                      )}
                    </View>
                  )}
                  <View style={styles.barStack}>
                    {showIncome && (
                      <View
                        style={[
                          styles.barIncome,
                          {
                            height: `${incomePercent}%`,
                            backgroundColor: theme.colors.primary
                          }
                        ]}
                      />
                    )}
                    {showExpense && (
                      <View
                        style={[
                          styles.barExpense,
                          {
                            height: `${expensePercent}%`,
                            backgroundColor: '#ef4444'
                          }
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            {(filter === 'overview' || filter === 'income') && (
              <View style={styles.legendItem2}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Income</Text>
              </View>
            )}
            {(filter === 'overview' || filter === 'expense') && (
              <View style={styles.legendItem2}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Expense</Text>
              </View>
            )}
          </View>
        </View>
        )}

        {/* Daily Spending Trend */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {filter === 'income' ? 'Daily Income Trend' : filter === 'expense' ? 'Daily Expense Trend' : 'Daily Net Balance'}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            {filter === 'income'
              ? `Average income: ${formatCurrency((monthlyStats?.totalIncome || 0) / (dailySpending.length || 1), user?.currency)}/day`
              : filter === 'expense'
              ? `Average spending: ${formatCurrency(monthlyStats?.avgDailyExpense || 0, user?.currency)}/day`
              : `Net savings: ${formatCurrency(monthlyStats?.balance || 0, user?.currency)} this month`
            }
          </Text>

          {/* Summary Stats for Overview Mode */}
          {filter === 'overview' && dailySpending.length > 0 && (
            <View style={styles.statsCardsRow}>
              {(() => {
                const dailyNets = dailySpending.map(d => (d.income || 0) - (d.expense || 0));
                const bestDayNet = Math.max(...dailyNets);
                const worstDayNet = Math.min(...dailyNets);
                const bestDayIndex = dailyNets.indexOf(bestDayNet);
                const worstDayIndex = dailyNets.indexOf(worstDayNet);
                const positiveDays = dailyNets.filter(n => n > 0).length;
                const negativeDays = dailyNets.filter(n => n < 0).length;

                return (
                  <>
                    <View style={[styles.statMiniCard, { backgroundColor: theme.colors.background }]}>
                      <MaterialIcons name="trending-up" size={16} color="#10b981" />
                      <View style={styles.statMiniCardContent}>
                        <Text style={[styles.statMiniLabel, { color: theme.colors.textSecondary }]}>Best Day</Text>
                        <Text style={[styles.statMiniValue, { color: '#10b981' }]}>
                          +{formatCompactCurrency(bestDayNet, user?.currency)}
                        </Text>
                        <Text style={[styles.statMiniDay, { color: theme.colors.textSecondary }]}>
                          Day {bestDayIndex + 1}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.statMiniCard, { backgroundColor: theme.colors.background }]}>
                      <MaterialIcons name="trending-down" size={16} color="#ef4444" />
                      <View style={styles.statMiniCardContent}>
                        <Text style={[styles.statMiniLabel, { color: theme.colors.textSecondary }]}>Worst Day</Text>
                        <Text style={[styles.statMiniValue, { color: '#ef4444' }]}>
                          {formatCompactCurrency(worstDayNet, user?.currency)}
                        </Text>
                        <Text style={[styles.statMiniDay, { color: theme.colors.textSecondary }]}>
                          Day {worstDayIndex + 1}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.statMiniCard, { backgroundColor: theme.colors.background }]}>
                      <MaterialIcons name="assessment" size={16} color={theme.colors.primary} />
                      <View style={styles.statMiniCardContent}>
                        <Text style={[styles.statMiniLabel, { color: theme.colors.textSecondary }]}>Balance</Text>
                        <Text style={[styles.statMiniValue, { color: theme.colors.text }]}>
                          {positiveDays}+ / {negativeDays}-
                        </Text>
                        <Text style={[styles.statMiniDay, { color: theme.colors.textSecondary }]}>
                          Days
                        </Text>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>
          )}

          {dailySpending.length > 0 ? (
            <View style={styles.trendChart}>
              {dailySpending.map((day, index) => {
                const income = day.income || 0;
                const expense = day.expense || 0;

                // Choose value based on filter
                let value: number;
                let isPositive = true;

                if (filter === 'overview') {
                  // Net balance = income - expense
                  value = income - expense;
                  isPositive = value >= 0;
                } else if (filter === 'income') {
                  value = income;
                } else {
                  value = expense;
                }

                // Calculate max based on filter
                let maxValue = 100;
                if (filter === 'income') {
                  maxValue = Math.max(...dailySpending.map(d => d.income || 0), 100);
                } else if (filter === 'expense') {
                  maxValue = Math.max(...dailySpending.map(d => d.expense || 0), 100);
                } else {
                  // For overview (net balance), get max absolute value
                  const netValues = dailySpending.map(d => Math.abs((d.income || 0) - (d.expense || 0)));
                  maxValue = Math.max(...netValues, 100);
                }

                const height = (Math.abs(value) / maxValue) * 100;

                // Choose color based on filter and value
                let barColor: string;
                let activeColor: string;

                if (filter === 'overview') {
                  barColor = isPositive ? '#10b981' : '#ef4444';
                  activeColor = isPositive ? '#059669' : '#dc2626';
                } else if (filter === 'income') {
                  barColor = '#10b981';
                  activeColor = '#059669';
                } else {
                  barColor = '#ef4444';
                  activeColor = '#dc2626';
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.trendBarContainer}
                    onPress={() => setTouchedDayIndex(touchedDayIndex === index ? null : index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.trendBarWrapper}>
                      {touchedDayIndex === index && (
                        <View style={styles.trendValueContainer}>
                          {filter === 'overview' ? (
                            <>
                              <Text style={styles.trendValueText}>
                                {isPositive ? '+' : ''}{formatCompactCurrency(value, user?.currency)}
                              </Text>
                              <Text style={[styles.trendValueTextSmall, { fontSize: 7 }]}>
                                ↑{formatCompactCurrency(income, user?.currency)} ↓{formatCompactCurrency(expense, user?.currency)}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.trendValueText}>
                              {formatCompactCurrency(value, user?.currency)}
                            </Text>
                          )}
                        </View>
                      )}
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height: height < 5 ? 5 : `${height}%`,
                            backgroundColor: touchedDayIndex === index ? activeColor : barColor
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.trendDayLabel, { color: theme.colors.textSecondary }]}>
                      {(index + 1) % 5 === 0 || index === 0 || index === dailySpending.length - 1 ? (index + 1) : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No {filter === 'income' ? 'income' : 'spending'} data available
              </Text>
            </View>
          )}
        </View>

        {/* Expense by Category - Hide when income filter is selected */}
        {filter !== 'income' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Expense by Category</Text>

          {categoryExpenses.length > 0 && pieData.length > 0 ? (
            <View style={styles.pieChartContainer}>
              <View style={styles.donutChartWrapper}>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={pieData}
                    width={140}
                    height={140}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="34.5"
                    center={[0, 0]}
                    hasLegend={false}
                    absolute
                  />
                </View>
                <View style={styles.donutHole}>
                  <View style={[styles.donutHoleInner, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.donutCenterLabel, { color: theme.colors.textSecondary }]}>Total</Text>
                    <Text style={[styles.donutCenterValue, { color: theme.colors.text }]}>
                      {formatCurrency(totalExpense, user?.currency).replace(/\.\d+$/, '')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.legendContainer}>
                {categoryExpenses.map((cat, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={styles.legendItemLeft}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.legendLabel, { color: theme.colors.text }]} numberOfLines={1}>
                        {cat.categoryName}
                      </Text>
                    </View>
                    <Text style={[styles.legendValue, { color: theme.colors.text }]}>
                      {Math.round(cat.percentage)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No expense data for this month
              </Text>
            </View>
          )}
        </View>
        )}

        <View style={{ height: 32 }} />
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { paddingBottom: 24 },
  periodFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#182430',
    borderRadius: 12,
    padding: 4,
  },
  periodFilterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodFilterActive: {
    backgroundColor: '#137fec',
  },
  periodFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182430',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
    gap: 12,
  },
  monthText: { fontSize: 14, fontWeight: '600' },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#182430',
    gap: 6,
    borderWidth: 1,
    borderColor: '#324d67',
  },
  filterChipActive: {
    backgroundColor: '#137fec',
    borderColor: '#137fec',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardsScroll: {
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    width: (screenWidth - 48) / 2,
    padding: 20,
    borderRadius: 16,
    gap: 4,
  },
  cardIconContainer: {
    marginBottom: 8,
  },
  cardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  cardValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  weekButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#182430',
  },
  weekButtonActive: {
    backgroundColor: '#137fec',
  },
  weekButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 16 },
  detailsButton: { fontSize: 14, fontWeight: '600' },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statMiniCard: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    gap: 8,
    alignItems: 'center',
  },
  statMiniCardContent: {
    flex: 1,
  },
  statMiniLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statMiniValue: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  statMiniDay: {
    fontSize: 9,
    fontWeight: '500',
  },
  trendValueTextSmall: {
    color: '#92adc9',
    fontSize: 8,
    fontWeight: '500',
    marginTop: 1,
  },
  cashFlowChart: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 12,
  },
  barContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barStack: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 2,
    paddingHorizontal: 2,
  },
  barIncome: {
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    opacity: 0.8,
  },
  barExpense: {
    width: '100%',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.8,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 8,
    paddingLeft: 8,
  },
  donutChartWrapper: {
    position: 'relative',
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    position: 'absolute',
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutHole: {
    position: 'absolute',
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  donutHoleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  donutCenterValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  trendScrollView: {
    marginTop: 8,
  },
  trendChart: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingTop: 30,
    gap: 0.5,
    paddingBottom: 22,
  },
  trendBarContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 9,
  },
  trendBarWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  trendValueContainer: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 3,
    minWidth: 35,
    alignItems: 'center',
  },
  trendValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  trendBar: {
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 4,
  },
  trendDayLabel: {
    fontSize: 7,
    marginTop: 3,
    fontWeight: '600',
    height: 10,
    textAlign: 'center',
    width: '100%',
  },
  tooltip: {
    position: 'absolute',
    top: -50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1000,
    minWidth: 60,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  trendTooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipTextSmall: {
    color: '#92adc9',
    fontSize: 9,
    fontWeight: '500',
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  trendLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 14,
  },
});

