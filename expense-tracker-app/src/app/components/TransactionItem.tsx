import React, { useRef, useState, memo } from 'react';
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
  readOnly?: boolean;
}

const TransactionItemComponent: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  onPress,
  onEdit,
  onDelete,
  readOnly = false,
}) => {
  const { isDarkMode, user, deleteTransaction } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;
  const translateX = useRef(new Animated.Value(0)).current;
  const [isRevealed, setIsRevealed] = useState(false);

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
        // Disable swipe if readOnly
        if (readOnly) return false;
        // Only activate on horizontal swipe
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // Add subtle feedback when swipe starts
        // @ts-ignore - accessing internal animated value
        translateX.setOffset(translateX._value);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe, limit to action width
        const newValue = Math.max(Math.min(gestureState.dx, 0), -150);
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        const threshold = -50;

        if (gestureState.dx < threshold) {
          // Reveal actions
          Animated.spring(translateX, {
            toValue: -150,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          setIsRevealed(true);
        } else {
          // Hide actions
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          setIsRevealed(false);
        }
      },
    })
  ).current;

  const closeActions = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    setIsRevealed(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            closeActions();
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
    closeActions();
    if (onEdit) {
      onEdit();
    }
  };

  const handlePress = () => {
    if (isRevealed) {
      closeActions();
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <View style={styles.wrapper}>
      {!readOnly && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={22} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ translateX: readOnly ? 0 : translateX }],
          },
        ]}
        {...(readOnly ? {} : panResponder.panHandlers)}
      >
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }]}
          onPress={handlePress}
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
              {transaction.notes && (
                <Text style={[styles.notes, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {transaction.notes}
                </Text>
              )}
              <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                {formatTimeAgo(transaction.createdAt)} • {getPaymentModeLabel(transaction.paymentMode)}
              </Text>
            </View>
          </View>

          <View style={styles.rightContent}>
            <Text style={[styles.amount, { color: amountColor }]}>
              {amountPrefix}{formatCurrency(transaction.amount, user?.currency)}
            </Text>
            {!readOnly && (
              <MaterialIcons name="chevron-left" size={16} color={theme.colors.textSecondary} style={styles.swipeHint} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Export memoized version to prevent re-renders during pagination
export const TransactionItem = memo(TransactionItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.category.id === nextProps.category.id
  );
});


const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 16,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 80,
    flexDirection: 'row',
  },
  actionButton: {
    width: 75,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContainer: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 80,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  notes: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 12,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  swipeHint: {
    opacity: 0.3,
  },
});

