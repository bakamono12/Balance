import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { Transaction, Category, PaymentMode } from '../types';
import { formatCurrency, formatTimeAgo } from '../utils/formatters';

const getPaymentModeLabel = (mode: PaymentMode): string => {
  const labels: Record<PaymentMode, string> = {
    upi: 'UPI',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    wallet: 'Wallet',
  };
  return labels[mode] || mode;
};

interface TransactionItemProps {
  transaction: Transaction;
  category: Category;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean; // Show edit/delete swipe actions
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const { isDarkMode, user, deleteTransaction } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;
  const translateX = useRef(new Animated.Value(0)).current;

  const isIncome = transaction.type === 'income';
  const isInvestment = transaction.type === 'investment';
  const amountColor = isIncome
    ? theme.colors.income.main
    : isInvestment
    ? '#3b82f6'
    : theme.colors.text;
  const amountPrefix = isIncome ? '+' : '-';

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return showActions && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (showActions && gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -140));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!showActions) return;
        if (gestureState.dx < -60) {
          Animated.spring(translateX, {
            toValue: -140,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            if (onDelete) {
              onDelete();
            } else {
              await deleteTransaction(transaction.id);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Action Buttons - only show if showActions is true */}
      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEdit}>
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <MaterialIcons name="delete" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Swipeable Content */}
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...(showActions ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          style={[styles.container, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.leftContent}>
            <View style={[styles.iconContainer, {
              backgroundColor: category.color + '20',
            }]}>
              <MaterialIcons
                name={category.icon as any}
                size={24}
                color={category.color}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                {transaction.fundName || category.name}
              </Text>
              <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                {formatTimeAgo(transaction.createdAt)} • {getPaymentModeLabel(transaction.paymentMode)}
              </Text>
            </View>
          </View>

          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix}{formatCurrency(transaction.amount, user?.currency)}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 70,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  animatedContainer: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

