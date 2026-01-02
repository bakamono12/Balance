import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { darkTheme } from '../theme';
import { Goal, Category } from '../types';
import { format } from 'date-fns';
import { getCurrencySymbol } from '../utils/formatters';
import { useStore } from '../store';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: any) => Promise<void>;
  editingGoal?: Goal | null;
  categories: Category[];
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  onClose,
  onSave,
  editingGoal,
  categories,
}) => {
  const theme = darkTheme;
  const { user } = useStore();
  const [goalType, setGoalType] = useState<'savings' | 'expense_limit'>(
    editingGoal?.type === 'category_limit' ? 'expense_limit' : editingGoal?.type || 'savings'
  );
  const [isCategorySpecific, setIsCategorySpecific] = useState(
    editingGoal?.type === 'category_limit' || false
  );
  const [name, setName] = useState(editingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(
    editingGoal?.targetAmount?.toString() || ''
  );
  const [startDate, setStartDate] = useState(
    editingGoal?.startDate ? new Date(editingGoal.startDate) : new Date()
  );
  const [targetDate, setTargetDate] = useState<Date | null>(
    editingGoal?.targetDate ? new Date(editingGoal.targetDate) : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    editingGoal?.categoryId
  );
  const [selectedIcon, setSelectedIcon] = useState(
    editingGoal?.icon || 'flag'
  );
  const [selectedColor, setSelectedColor] = useState(
    editingGoal?.color || '#137fec'
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const GOAL_ICONS = [
    // Finance & Money
    'flag', 'savings', 'account-balance-wallet', 'trending-up', 'attach-money',
    'euro', 'currency-rupee', 'currency-pound', 'currency-yen', 'currency-bitcoin',
    'account-balance', 'paid', 'payment', 'credit-card', 'local-atm',
    'money-off', 'price-check', 'receipt', 'receipt-long', 'sell',
    // Shopping & Commerce
    'shopping-cart', 'shopping-bag', 'local-mall', 'store', 'storefront',
    'local-offer', 'loyalty', 'redeem', 'card-giftcard', 'volunteer-activism',
    // Food & Dining
    'restaurant', 'fastfood', 'local-cafe', 'local-pizza', 'local-bar',
    'lunch-dining', 'dinner-dining', 'breakfast-dining', 'icecream', 'cake',
    'local-dining', 'restaurant-menu', 'kitchen', 'coffee', 'local-grocery-store',
    // Transportation
    'flight', 'flight-takeoff', 'flight-land', 'directions-car', 'directions-bus',
    'directions-subway', 'directions-train', 'local-taxi', 'two-wheeler', 'electric-car',
    'local-gas-station', 'local-shipping', 'commute', 'directions-bike', 'directions-walk',
    // Home & Living
    'home', 'house', 'apartment', 'cottage', 'bed', 'chair',
    'deck', 'roofing', 'garage', 'yard', 'weekend', 'living',
    // Travel & Leisure
    'beach-access', 'pool', 'hotel', 'luggage', 'map', 'explore',
    'tour', 'hiking', 'sailing', 'attractions', 'travel-explore', 'location-on',
    // Education & Work
    'school', 'work', 'business-center', 'badge', 'menu-book', 'library-books',
    'laptop', 'computer', 'phone-iphone', 'tablet', 'watch', 'keyboard',
    'book', 'history-edu', 'science', 'calculate', 'architecture', 'engineering',
    // Health & Fitness
    'medical-services', 'local-hospital', 'local-pharmacy', 'vaccines', 'healing',
    'fitness-center', 'self-improvement', 'spa', 'face', 'favorite',
    'monitor-heart', 'psychology', 'sports', 'sports-soccer', 'sports-basketball',
    // Entertainment
    'movie', 'theaters', 'music-note', 'headphones', 'sports-esports',
    'casino', 'celebration', 'party-mode', 'nightlife', 'local-activity',
    'camera', 'photo-camera', 'videocam', 'mic', 'gamepad',
    // Utilities & Services
    'flash-on', 'water-drop', 'wifi', 'router', 'tv',
    'phone', 'smartphone', 'devices', 'plumbing', 'cleaning-services',
    // Other
    'pets', 'child-care', 'diamond', 'star', 'emoji-events',
    'military-tech', 'verified', 'security', 'shield', 'favorite-border'
  ];

  const GOAL_COLORS = [
    '#137fec', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
    '#6366f1', '#a855f7', '#22c55e', '#eab308', '#f43f5e'
  ];

  const resetForm = () => {
    setGoalType('savings');
    setIsCategorySpecific(false);
    setName('');
    setTargetAmount('');
    setStartDate(new Date());
    setTargetDate(null);
    setSelectedCategory(undefined);
    setSelectedIcon('flag');
    setSelectedColor('#137fec');
  };

  // Update form state when editingGoal changes
  useEffect(() => {
    if (editingGoal) {
      setGoalType(editingGoal.type === 'category_limit' ? 'expense_limit' : editingGoal.type);
      setIsCategorySpecific(editingGoal.type === 'category_limit');
      setName(editingGoal.name);
      setTargetAmount(editingGoal.targetAmount?.toString() || '');
      setStartDate(editingGoal.startDate ? new Date(editingGoal.startDate) : new Date());
      setTargetDate(editingGoal.targetDate ? new Date(editingGoal.targetDate) : null);
      setSelectedCategory(editingGoal.categoryId);
      setSelectedIcon(editingGoal.icon || 'flag');
      setSelectedColor(editingGoal.color || '#137fec');
    } else {
      resetForm();
    }
  }, [editingGoal, visible]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (goalType === 'expense_limit' && isCategorySpecific && !selectedCategory) {
      Alert.alert('Error', 'Please select a category for category-specific expense limit');
      return;
    }

    try {
      setLoading(true);
      const target = parseFloat(targetAmount);

      // Determine the actual goal type based on goalType and isCategorySpecific
      const actualType = goalType === 'expense_limit' && isCategorySpecific
        ? 'category_limit'
        : goalType;

      const goalData = {
        name: name.trim(),
        type: actualType,
        targetAmount: target,
        currentAmount: editingGoal?.currentAmount || 0,
        startDate: format(startDate, 'yyyy-MM-dd'),
        targetDate: targetDate ? format(targetDate, 'yyyy-MM-dd') : undefined,
        status: 'on_track' as const,
        icon: selectedIcon,
        color: selectedColor,
        categoryId: actualType === 'category_limit' ? selectedCategory : undefined,
        notificationShown: false,
      };

      await onSave(goalData);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategoryName = () => {
    const category = categories.find((c) => c.id === selectedCategory);
    return category?.name || 'Select Category';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              New Goal
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Goal Type Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  goalType === 'savings' && [
                    styles.toggleButtonActive,
                    { backgroundColor: theme.colors.primary },
                  ],
                  { backgroundColor: goalType === 'savings' ? theme.colors.primary : theme.colors.surface },
                ]}
                onPress={() => {
                  setGoalType('savings');
                  setIsCategorySpecific(false);
                }}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: goalType === 'savings' ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  Savings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  goalType === 'expense_limit' && [
                    styles.toggleButtonActive,
                    { backgroundColor: theme.colors.primary },
                  ],
                  { backgroundColor: goalType === 'expense_limit' ? theme.colors.primary : theme.colors.surface },
                ]}
                onPress={() => setGoalType('expense_limit')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: goalType === 'expense_limit' ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  Expense Limit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Specific Option - Only show for Expense Limit */}
            {goalType === 'expense_limit' && (
              <TouchableOpacity
                style={[
                  styles.categoryLimitButton,
                  isCategorySpecific && {
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary
                  },
                  {
                    backgroundColor: isCategorySpecific ? theme.colors.primary + '20' : theme.colors.surface,
                    borderColor: isCategorySpecific ? theme.colors.primary : theme.colors.border
                  },
                ]}
                onPress={() => setIsCategorySpecific(!isCategorySpecific)}
              >
                <MaterialIcons
                  name="category"
                  size={24}
                  color={isCategorySpecific ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryLimitText,
                    { color: isCategorySpecific ? theme.colors.primary : theme.colors.textSecondary },
                  ]}
                >
                  Set limit for specific category
                </Text>
                {isCategorySpecific && (
                  <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}

            {/* Target Amount Display */}
            <View style={styles.targetAmountContainer}>
              <Text style={[styles.targetAmountLabel, { color: theme.colors.textSecondary }]}>
                Target Amount
              </Text>
              <View style={styles.targetAmountInput}>
                <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>
                  {getCurrencySymbol(user?.currency || 'USD')}
                </Text>
                <TextInput
                  style={[styles.targetAmountField, { color: theme.colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary + '60'}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Goal Name Input */}
            <View style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Goal Name
              </Text>
              <TextInput
                style={[styles.inputField, { color: theme.colors.text }]}
                placeholder="e.g. New Laptop"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Icon Selection */}
            <TouchableOpacity
              style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowIconPicker(true)}
            >
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Icon
              </Text>
              <View style={styles.dateDisplay}>
                <View style={[styles.iconPreview, { backgroundColor: selectedColor + '20' }]}>
                  <MaterialIcons name={selectedIcon as any} size={24} color={selectedColor} />
                </View>
                <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Color Selection */}
            <TouchableOpacity
              style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowColorPicker(true)}
            >
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Color
              </Text>
              <View style={styles.dateDisplay}>
                <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Category Selection (only for category-specific expense limit) */}
            {goalType === 'expense_limit' && isCategorySpecific && (
              <TouchableOpacity
                style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Category
                </Text>
                <View style={styles.dateDisplay}>
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {getSelectedCategoryName()}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            )}

            {/* Start Date */}
            <TouchableOpacity
              style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Start Date
              </Text>
              <View style={styles.dateDisplay}>
                <Text style={[styles.dateText, { color: theme.colors.primary }]}>
                  {format(startDate, 'MMMM dd, yyyy') === format(new Date(), 'MMMM dd, yyyy')
                    ? 'Today'
                    : format(startDate, 'MMMM dd, yyyy')}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Target Date */}
            <TouchableOpacity
              style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowTargetDatePicker(true)}
            >
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Target Date
              </Text>
              <View style={styles.dateDisplay}>
                <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                  {targetDate ? format(targetDate, 'MMMM dd, yyyy') : 'Select Date'}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Notification Info */}
            <View style={styles.notificationInfo}>
              <MaterialIcons name="notifications" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.notificationText, { color: theme.colors.textSecondary }]}>
                You will be notified when you reach 80% of this goal.
              </Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Goal'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) setStartDate(date);
              }}
              maximumDate={new Date()}
            />
          )}

          {showTargetDatePicker && (
            <DateTimePicker
              value={targetDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowTargetDatePicker(false);
                if (date) setTargetDate(date);
              }}
              minimumDate={new Date()}
            />
          )}

          {/* Category Picker Modal */}
          <Modal visible={showCategoryPicker} animationType="slide" transparent>
            <View style={styles.pickerOverlay}>
              <View style={[styles.pickerContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
                    Select Category
                  </Text>
                  <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                    <MaterialIcons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {categories
                    .filter((cat) => !['Salary', 'Mutual Funds', 'Stocks', 'Gold', 'Fixed Deposit', 'Crypto'].includes(cat.name))
                    .map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryItem,
                          selectedCategory === category.id && {
                            backgroundColor: theme.colors.primary + '20',
                          },
                        ]}
                        onPress={() => {
                          setSelectedCategory(category.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            { backgroundColor: category.color + '20' },
                          ]}
                        >
                          <MaterialIcons
                            name={category.icon as any}
                            size={24}
                            color={category.color}
                          />
                        </View>
                        <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                          {category.name}
                        </Text>
                        {selectedCategory === category.id && (
                          <MaterialIcons
                            name="check-circle"
                            size={24}
                            color={theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Icon Picker Modal */}
          <Modal visible={showIconPicker} animationType="slide" transparent>
            <View style={styles.pickerOverlay}>
              <View style={[styles.pickerContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
                    Select Icon
                  </Text>
                  <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                    <MaterialIcons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.iconGrid}>
                    {GOAL_ICONS.map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconOption,
                          selectedIcon === icon && {
                            backgroundColor: theme.colors.primary + '20',
                            borderColor: theme.colors.primary,
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => {
                          setSelectedIcon(icon);
                          setShowIconPicker(false);
                        }}
                      >
                        <MaterialIcons
                          name={icon as any}
                          size={36}
                          color={selectedIcon === icon ? theme.colors.primary : theme.colors.text}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Color Picker Modal */}
          <Modal visible={showColorPicker} animationType="slide" transparent>
            <View style={styles.pickerOverlay}>
              <View style={[styles.pickerContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
                    Select Color
                  </Text>
                  <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                    <MaterialIcons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.colorGrid}>
                    {GOAL_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedColor === color && {
                            borderColor: '#ffffff',
                            borderWidth: 3,
                          },
                        ]}
                        onPress={() => {
                          setSelectedColor(color);
                          setShowColorPicker(false);
                        }}
                      >
                        {selectedColor === color && (
                          <MaterialIcons name="check" size={24} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    flex: 1,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    elevation: 4,
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryLimitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
  },
  categoryLimitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  targetAmountContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  targetAmountLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  targetAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '300',
    marginRight: 8,
  },
  targetAmountField: {
    fontSize: 48,
    fontWeight: '300',
    minWidth: 150,
    textAlign: 'left',
  },
  inputCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputField: {
    fontSize: 16,
    fontWeight: '400',
    padding: 0,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '400',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerScroll: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  iconPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOption: {
    width: 70,
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

