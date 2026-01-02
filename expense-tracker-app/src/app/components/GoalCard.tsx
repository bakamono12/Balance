import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { Goal } from '../types';
import { formatCurrency } from '../utils/formatters';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onPress,
  onEdit,
  onDelete,
  showActions = false
}) => {
  const { isDarkMode, user, deleteGoal } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;
  const translateX = useRef(new Animated.Value(0)).current;

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const isCompleted = goal.status === 'completed';
  const isBehind = goal.status === 'behind';
  const isWarning = goal.status === 'warning';

  const statusColor = isCompleted
    ? theme.colors.success.main
    : isWarning
    ? '#f59e0b'
    : isBehind
    ? theme.colors.warning.main
    : theme.colors.primary;

  const statusBg = isCompleted
    ? theme.colors.success.dark
    : isWarning
    ? '#f59e0b20'
    : isBehind
    ? theme.colors.warning.dark
    : theme.colors.primary + '20';

  const statusIcon = isCompleted ? 'check-circle' : isWarning ? 'warning' : isBehind ? 'warning' : 'trending-up';

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
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
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
              await deleteGoal(goal.id);
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
        <View style={[styles.container, {
          backgroundColor: theme.colors.surface,
          borderColor: isCompleted ? theme.colors.success.main + '40' : theme.colors.border,
        }]}>
      <View style={styles.header}>
        <View style={styles.iconRow}>
          <View style={[styles.iconContainer, {
            backgroundColor: statusBg,
          }]}>
            <MaterialIcons
              name={goal.icon as any || 'flag'}
              size={24}
              color={statusColor}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={[styles.goalName, { color: theme.colors.text }]}>
              {goal.name}
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>
              {goal.status === 'completed' ? 'Goal Met!' : goal.status === 'warning' ? 'Warning!' : goal.status === 'behind' ? 'Behind' : 'On Track'}
            </Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: statusBg }]}>
          <MaterialIcons name={statusIcon as any} size={14} color={statusColor} />
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.amountRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Saved</Text>
          <Text style={[styles.amountText, { color: theme.colors.text }]}>
            <Text style={{ fontWeight: '700' }}>
              {formatCurrency(goal.currentAmount, user?.currency)}
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontWeight: '400' }}>
              {' / '}{formatCurrency(goal.targetAmount, user?.currency)}
            </Text>
          </Text>
        </View>

        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, {
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: statusColor,
          }]} />
        </View>
      </View>
    </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconRow: {
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
  headerText: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressSection: {
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 14,
  },
  progressBar: {
    height: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
});

