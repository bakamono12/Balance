import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { Button } from '../components/Button';
import { PaymentMode, TransactionType } from '../types';
import { format } from 'date-fns';
import { getCurrencySymbol } from '../utils/formatters';

const paymentModeOptions: { value: PaymentMode; label: string; icon: string }[] = [
  { value: 'upi', label: 'UPI', icon: 'smartphone' },
  { value: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
  { value: 'debit_card', label: 'Debit Card', icon: 'payment' },
  { value: 'cash', label: 'Cash', icon: 'money' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
  { value: 'wallet', label: 'Wallet', icon: 'account-balance-wallet' },
];

const getPaymentModeLabel = (mode: PaymentMode): string => {
  return paymentModeOptions.find(option => option.value === mode)?.label || mode;
};

const getPaymentModeIcon = (mode: PaymentMode): string => {
  return paymentModeOptions.find(option => option.value === mode)?.icon || 'account-balance-wallet';
};

export const AddTransactionScreen = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const { isDarkMode, categories, addTransaction, updateTransaction, user } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;
  const insets = useSafeAreaInsets();

  // Check if we're editing an existing transaction
  const editingTransaction = route?.params?.transaction;
  const isEditMode = !!editingTransaction;

  // Get initial type from widget or default to expense
  const initialType = route?.params?.initialType || editingTransaction?.type || 'expense';

  const [type, setType] = useState<TransactionType>(initialType as TransactionType);
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(editingTransaction?.categoryId || '');
  const [date, setDate] = useState(editingTransaction?.date ? new Date(editingTransaction.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(editingTransaction?.paymentMode || 'upi');
  const [showPaymentModeModal, setShowPaymentModeModal] = useState(false);
  const [notes, setNotes] = useState(editingTransaction?.notes || '');
  const [loading, setLoading] = useState(false);

  // Investment-specific state
  const [fundName, setFundName] = useState(editingTransaction?.fundName || '');

  // Refs for auto-scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const notesFieldRef = useRef<View>(null);
  const investmentFieldRef = useRef<View>(null);

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(cat => {
    if (type === 'investment') {
      return ['Mutual Funds', 'Stocks', 'Gold', 'Fixed Deposit', 'Crypto'].includes(cat.name);
    } else if (type === 'income') {
      return ['Salary'].includes(cat.name);
    } else {
      return !['Mutual Funds', 'Stocks', 'Gold', 'Fixed Deposit', 'Crypto', 'Salary'].includes(cat.name);
    }
  });


  const scrollToField = (fieldRef: React.RefObject<View | null>) => {
    setTimeout(() => {
      if (fieldRef.current && scrollViewRef.current) {
        fieldRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 150, animated: true });
          },
          () => {} // error callback
        );
      }
    }, 300); // Wait for keyboard animation
  };

  const handleSave = async () => {
    if (!amount || !selectedCategory) {
      alert('Please fill/select all required fields');
      return;
    }

    if (type === 'investment' && !fundName.trim()) {
      alert('Please enter investment name');
      return;
    }

    try {
      setLoading(true);

      if (Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (isEditMode && editingTransaction) {
        // Update existing transaction
        await updateTransaction(editingTransaction.id, {
          type,
          amount: parseFloat(amount),
          categoryId: selectedCategory,
          date: format(date, 'yyyy-MM-dd'),
          paymentMode,
          notes: notes || undefined,
          fundName: type === 'investment' ? fundName : undefined,
        });
      } else {
        // Add new transaction
        await addTransaction({
          type,
          amount: parseFloat(amount),
          categoryId: selectedCategory,
          date: format(date, 'yyyy-MM-dd'),
          paymentMode,
          notes: notes || undefined,
          fundName: type === 'investment' ? fundName : undefined,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 80}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.typeSelector}>
          <View style={[styles.typeSelectorContainer, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActive,
              ]}
              onPress={() => setType('expense')}
            >
              <Text style={[
                styles.typeButtonText,
                { color: type === 'expense' ? '#ffffff' : theme.colors.textSecondary },
              ]}>
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonActive,
              ]}
              onPress={() => setType('income')}
            >
              <Text style={[
                styles.typeButtonText,
                { color: type === 'income' ? '#ffffff' : theme.colors.textSecondary },
              ]}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'investment' && styles.typeButtonActive,
              ]}
              onPress={() => setType('investment')}
            >
              <Text style={[
                styles.typeButtonText,
                { color: type === 'investment' ? '#ffffff' : theme.colors.textSecondary },
              ]}>
                Investment
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>
            TOTAL AMOUNT
          </Text>
          <View style={styles.amountInputContainer}>
            <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
              {getCurrencySymbol(user?.currency)}
            </Text>
            <TextInput
              style={[styles.amountInput, { color: theme.colors.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary + '40'}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              CATEGORY
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === category.id
                      ? theme.colors.primary
                      : theme.colors.surface,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialIcons
                  name={category.icon as any}
                  size={20}
                  color={selectedCategory === category.id ? '#ffffff' : category.color}
                />
                <Text style={[
                  styles.categoryChipText,
                  {
                    color: selectedCategory === category.id
                      ? '#ffffff'
                      : theme.colors.text
                  },
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Investment Search Section */}
        {type === 'investment' && (
          <View style={styles.section} ref={investmentFieldRef}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              INVESTMENT NAME
            </Text>
            <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.detailCardLeft}>
                <View style={[styles.detailIcon, { backgroundColor: '#3b82f6' + '20' }]}>
                  <MaterialIcons name="trending-up" size={20} color="#3b82f6" />
                </View>
                <TextInput
                  style={[styles.notesInput, { color: theme.colors.text }]}
                  placeholder="Enter investment name..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={fundName}
                  onChangeText={setFundName}
                  onFocus={() => scrollToField(investmentFieldRef)}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.detailCardLeft}>
              <View style={[styles.detailIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Date
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {format(date, 'MMMM dd, yyyy')}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowPaymentModeModal(true)}
          >
            <View style={styles.detailCardLeft}>
              <View style={[styles.detailIcon, { backgroundColor: '#9c27b0' + '20' }]}>
                <MaterialIcons name={getPaymentModeIcon(paymentMode) as any} size={20} color="#9c27b0" />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Payment Mode
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {getPaymentModeLabel(paymentMode)}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]} ref={notesFieldRef}>
            <View style={styles.detailCardLeft}>
              <View style={[styles.detailIcon, { backgroundColor: theme.colors.textSecondary + '20' }]}>
                <MaterialIcons name="description" size={20} color={theme.colors.textSecondary} />
              </View>
              <TextInput
                style={[styles.notesInput, { color: theme.colors.text }]}
                placeholder="Add a note..."
                placeholderTextColor={theme.colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                onFocus={() => scrollToField(notesFieldRef)}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={isEditMode ? "Update Transaction" : "Save Transaction"}
          onPress={handleSave}
          loading={loading}
          icon={<MaterialIcons name="check-circle" size={20} color="#ffffff" />}
          style={{ flex: 1 }}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* Payment Mode Modal */}
      <Modal
        visible={showPaymentModeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Payment Mode</Text>
              <TouchableOpacity onPress={() => setShowPaymentModeModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.paymentModeList}>
              {paymentModeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.paymentModeOption,
                    {
                      backgroundColor: paymentMode === option.value
                        ? theme.colors.primary + '20'
                        : theme.colors.background,
                      borderColor: paymentMode === option.value
                        ? theme.colors.primary
                        : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setPaymentMode(option.value);
                    setShowPaymentModeModal(false);
                  }}
                >
                  <View style={styles.paymentModeOptionLeft}>
                    <View style={[
                      styles.paymentModeIcon,
                      { backgroundColor: paymentMode === option.value ? theme.colors.primary : '#9c27b0' + '20' }
                    ]}>
                      <MaterialIcons
                        name={option.icon as any}
                        size={24}
                        color={paymentMode === option.value ? '#ffffff' : '#9c27b0'}
                      />
                    </View>
                    <Text style={[
                      styles.paymentModeLabel,
                      { color: paymentMode === option.value ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {paymentMode === option.value && (
                    <MaterialIcons name="check-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20 },
  typeSelector: { paddingVertical: 16 },
  typeSelectorContainer: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#137fec' },
  typeButtonText: { fontSize: 14, fontWeight: '600' },
  amountSection: { alignItems: 'center', paddingVertical: 32 },
  amountLabel: { fontSize: 14, fontWeight: '500', marginBottom: 16, letterSpacing: 0.5 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'baseline' },
  currencySymbol: { fontSize: 36, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 64, fontWeight: '700', minWidth: 150, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  categoriesScroll: { marginHorizontal: -20 },
  categoriesContainer: { paddingHorizontal: 20, gap: 12 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  categoryChipText: { fontSize: 14, fontWeight: '600' },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  detailCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: { fontSize: 12, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600' },
  notesInput: { fontSize: 16, flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  paymentModeList: {
    paddingHorizontal: 24,
  },
  paymentModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  paymentModeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentModeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentModeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

