import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Modal, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency, formatDate, getCurrentMonth, getMonthStartEnd } from '../utils/formatters';
import { transactionService } from '../services/database.service';
import { analyticsService } from '../services/analytics.service';
import { format } from 'date-fns';

const PAGE_SIZE = 50;

type FlatListItem =
  | { type: 'header'; date: string; id: string }
  | { type: 'transaction'; transaction: any; category: any; id: string };

export const TransactionsScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode, transactions, categories, loadTransactions, user } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;

  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [totalBalance, setTotalBalance] = useState(0);
  const [balanceChange, setBalanceChange] = useState(0);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<typeof transactions>([]);
  const flatListRef = useRef<FlatList>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const loadingRef = useRef(false);
  const onEndReachedCalledDuringMomentum = useRef(true);

  // Precomputed category map for O(1) lookups
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  useEffect(() => {
    const init = async () => {
      await loadData();
      // Load first page after data is loaded
      const filtered = getFilteredTransactions();
      const firstPage = filtered.slice(0, PAGE_SIZE);
      setPaginatedData(firstPage);
    };
    init();
  }, []);

  // Fully reset pagination when filter or search changes
  useEffect(() => {
    if (transactions.length === 0) return; // Don't run before initial load

    setCurrentPage(1);
    loadingRef.current = false;
    setLoadingMore(false);
    onEndReachedCalledDuringMomentum.current = true;

    // Reload data with new filters
    const filtered = getFilteredTransactions();
    const firstPage = filtered.slice(0, PAGE_SIZE);
    setPaginatedData(firstPage);
  }, [filter, searchQuery, startDate, endDate]);

  // Load first page when transactions change (after initial load)
  useEffect(() => {
    if (transactions.length > 0 && paginatedData.length === 0) {
      const filtered = getFilteredTransactions();
      const firstPage = filtered.slice(0, PAGE_SIZE);
      setPaginatedData(firstPage);
    }
  }, [transactions.length]);

  const loadData = async () => {
    await loadTransactions(200); // Load more initially
    await calculateBalance();
  };

  const calculateBalance = async () => {
    const currentMonth = getCurrentMonth();
    const { start, end } = getMonthStartEnd(currentMonth);

    const income = await transactionService.getTotalByType('income', start, end);
    const expense = await transactionService.getTotalByType('expense', start, end);

    setTotalBalance(income - expense);

    // Get month-on-month change
    const changes = await analyticsService.getMonthOnMonthChange(currentMonth);
    setBalanceChange(changes.balance);
  };

  // Memoized filter function to get all matching transactions
  const getFilteredTransactions = useCallback(() => {
    if (!transactions || transactions.length === 0) return [];

    return transactions.filter(t => {
      // Type filter
      if (filter !== 'all' && t.type !== filter) return false;

      // Date range filter
      if (startDate && endDate) {
        const transactionDate = new Date(t.date);
        if (transactionDate < startDate || transactionDate > endDate) return false;
      }

      // Search filter (case-insensitive search across multiple fields)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const category = categories.find(c => c.id === t.categoryId);
        const categoryName = category?.name.toLowerCase() || '';
        const notes = (t.notes || '').toLowerCase();
        const paymentMode = t.paymentMode.replace(/_/g, ' ').toLowerCase();
        const dateStr = format(new Date(t.date), 'MMM dd, yyyy').toLowerCase();
        const amountStr = t.amount.toString();

        // Check if query matches any field (ILIKE behavior)
        const matches =
          categoryName.includes(query) ||
          notes.includes(query) ||
          paymentMode.includes(query) ||
          dateStr.includes(query) ||
          amountStr.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [transactions, filter, startDate, endDate, searchQuery, categories]);

  // Check if more data is available
  const allFiltered = getFilteredTransactions();
  const hasMoreTransactions = paginatedData.length < allFiltered.length;

  // APPEND next page instead of replacing entire array
  const loadMoreTransactions = useCallback(async () => {
    if (loadingRef.current || !hasMoreTransactions || loadingMore || onEndReachedCalledDuringMomentum.current) {
      return;
    }

    onEndReachedCalledDuringMomentum.current = true;
    loadingRef.current = true;
    setLoadingMore(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    // APPEND new items instead of rebuilding entire array
    const startIndex = paginatedData.length;
    const endIndex = startIndex + PAGE_SIZE;
    const newItems = allFiltered.slice(startIndex, endIndex);

    setPaginatedData(prev => [...prev, ...newItems]); // APPEND
    setCurrentPage(prev => prev + 1);

    setLoadingMore(false);
    loadingRef.current = false;
  }, [hasMoreTransactions, loadingMore, allFiltered, paginatedData.length]);

  // Debounced onEndReached
  const handleEndReached = useCallback(() => {
    if (!onEndReachedCalledDuringMomentum.current) {
      loadMoreTransactions();
      onEndReachedCalledDuringMomentum.current = true;
    }
  }, [loadMoreTransactions]);

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setShowDateFilter(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setPaginatedData([]);
    await loadData();
    const filtered = getFilteredTransactions();
    const firstPage = filtered.slice(0, PAGE_SIZE);
    setPaginatedData(firstPage);
    setRefreshing(false);
  };

  // Create flat list with inline date headers - no regrouping on pagination
  const flatListData = useMemo((): FlatListItem[] => {
    const items: FlatListItem[] = [];
    let lastDate = '';

    paginatedData.forEach((transaction) => {
      const transactionDate = transaction.date;

      // Insert date header when date changes
      if (transactionDate !== lastDate) {
        items.push({
          type: 'header',
          date: transactionDate,
          id: `header-${transactionDate}`,
        });
        lastDate = transactionDate;
      }

      // Add transaction with precomputed category
      const category = categoryMap.get(transaction.categoryId);
      if (category) {
        items.push({
          type: 'transaction',
          transaction,
          category,
          id: transaction.id,
        });
      }
    });

    return items;
  }, [paginatedData, categoryMap]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Transactions</Text>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
          <MaterialIcons name={showSearch ? "close" : "search"} size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search by category, note, payment mode, date..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.balanceContent}>
          <View>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Total Balance</Text>
            <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>
              {formatCurrency(totalBalance, user?.currency)}
            </Text>
            <View style={styles.balanceFooter}>
              <MaterialIcons
                name={balanceChange >= 0 ? "trending-up" : "trending-down"}
                size={14}
                color={balanceChange >= 0 ? "#10b981" : "#ef4444"}
              />
              <Text style={[styles.balanceChange, { color: balanceChange >= 0 ? "#10b981" : "#ef4444" }]}>
                {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(1)}% vs last month
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.analyticsButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Stats')}
          >
            <MaterialIcons name="insights" size={22} color="#ffffff" />
            <Text style={styles.analyticsButtonText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, { color: filter === 'all' ? '#ffffff' : theme.colors.text }]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: filter === 'income' ? theme.colors.primary : theme.colors.surface }]}
            onPress={() => setFilter('income')}
          >
            <Text style={[styles.filterText, { color: filter === 'income' ? '#ffffff' : theme.colors.text }]}>
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: filter === 'expense' ? theme.colors.primary : theme.colors.surface }]}
            onPress={() => setFilter('expense')}
          >
            <Text style={[styles.filterText, { color: filter === 'expense' ? '#ffffff' : theme.colors.text }]}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: (startDate && endDate) ? theme.colors.primary : theme.colors.surface }]}
            onPress={() => setShowDateFilter(true)}
          >
            <MaterialIcons name="date-range" size={16} color={(startDate && endDate) ? '#ffffff' : theme.colors.text} />
            <Text style={[styles.filterText, { color: (startDate && endDate) ? '#ffffff' : theme.colors.text }]}>
              {(startDate && endDate) ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}` : 'Date Range'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Date Range Modal */}
      <Modal
        visible={showDateFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Date Range</Text>

            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
              <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                {startDate ? format(startDate, 'MMM dd, yyyy') : 'Select'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>End Date</Text>
              <Text style={[styles.dateValue, { color: theme.colors.text }]}>
                {endDate ? format(endDate, 'MMM dd, yyyy') : 'Select'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={clearDateFilter}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowDateFilter(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      <FlatList
        ref={flatListRef}
        data={flatListData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                  {formatDate(item.date).toUpperCase()}
                </Text>
              </View>
            );
          }

          return (
            <TransactionItem
              transaction={item.transaction}
              category={item.category}
              onEdit={() => {
                navigation.navigate('AddTransaction', {
                  transaction: item.transaction,
                  category: item.category
                });
              }}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        ListFooterComponent={
          hasMoreTransactions && loadingMore ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading more...
              </Text>
            </View>
          ) : paginatedData.length > 0 && !hasMoreTransactions ? (
            <View style={styles.loadingFooter}>
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                All transactions loaded
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No transactions found
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, marginBottom: 8 },
  balanceAmount: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  balanceFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceChange: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  analyticsButton: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  analyticsButtonText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  filterContainer: { paddingHorizontal: 16, marginBottom: 8 },
  filters: { gap: 12 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#182430',
  },
  filterButtonActive: { backgroundColor: '#137fec' },
  filterText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  dateButton: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  loadingOverlayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

