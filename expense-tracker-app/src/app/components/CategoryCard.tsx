import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
  onDelete,
  showActions = true,
}) => {
  const { isDarkMode } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;

  return (
    <TouchableOpacity
      style={[styles.container, {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
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
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {category.name}
          </Text>
          {category.description && (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {category.description}
            </Text>
          )}
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {!category.isDefault && onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="delete" size={20} color={theme.colors.error.main} />
            </TouchableOpacity>
          )}
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  content: {
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
});

