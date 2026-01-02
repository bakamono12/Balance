import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { Button } from '../components/Button';

// Categorized icon options for better organization
const ICON_CATEGORIES = {
  // Food & Dining
  'Food & Dining': [
    'restaurant', 'fastfood', 'local-cafe', 'local-pizza', 'local-bar',
    'local-dining', 'lunch-dining', 'dinner-dining', 'breakfast-dining',
    'bakery-dining', 'ramen-dining', 'icecream', 'cake', 'coffee',
    'liquor', 'wine-bar', 'restaurant-menu', 'set-meal'
  ],
  // Transportation
  'Transportation': [
    'directions-car', 'directions-bus', 'directions-subway', 'directions-train',
    'local-taxi', 'two-wheeler', 'electric-car', 'electric-bike', 'electric-scooter',
    'local-gas-station', 'local-parking', 'local-shipping', 'airport-shuttle',
    'commute', 'directions-bike', 'directions-walk'
  ],
  // Shopping
  'Shopping': [
    'shopping-bag', 'shopping-cart', 'local-mall', 'store', 'storefront',
    'local-grocery-store', 'local-convenience-store', 'local-offer', 'loyalty',
    'redeem', 'card-giftcard', 'checkroom', 'dry-cleaning'
  ],
  // Entertainment
  'Entertainment': [
    'movie', 'theaters', 'local-movies', 'music-note', 'headphones',
    'sports-esports', 'casino', 'nightlife', 'celebration', 'party-mode',
    'sports', 'sports-soccer', 'sports-basketball', 'sports-tennis', 'sports-baseball',
    'sports-football', 'sports-cricket', 'sports-volleyball', 'sports-golf'
  ],
  // Bills & Utilities
  'Bills & Utilities': [
    'flash-on', 'water-drop', 'wifi', 'phone-iphone', 'smartphone',
    'tv', 'router', 'cell-tower', 'podcasts', 'receipt', 'receipt-long'
  ],
  // Housing & Home
  'Housing & Home': [
    'home', 'house', 'apartment', 'cottage', 'villa', 'cabin',
    'bed', 'kitchen', 'living', 'chair', 'weekend', 'deck',
    'garage', 'roofing', 'construction', 'handyman', 'plumbing',
    'cleaning-services', 'local-laundry-service', 'yard', 'grass'
  ],
  // Health & Fitness
  'Health & Fitness': [
    'local-hospital', 'medical-services', 'local-pharmacy', 'vaccines',
    'medication', 'healing', 'monitor-heart', 'favorite', 'psychology',
    'fitness-center', 'self-improvement', 'spa', 'face', 'content-cut'
  ],
  // Education
  'Education': [
    'school', 'menu-book', 'library-books', 'auto-stories', 'book',
    'history-edu', 'science', 'calculate', 'functions', 'draw',
    'architecture', 'biotech', 'psychology-alt'
  ],
  // Work & Business
  'Work & Business': [
    'work', 'business-center', 'badge', 'attach-money', 'paid',
    'price-check', 'point-of-sale', 'receipt', 'account-balance',
    'credit-card', 'payment', 'currency-exchange', 'request-quote'
  ],
  // Investment & Savings
  'Investment & Savings': [
    'trending-up', 'trending-down', 'show-chart', 'candlestick-chart',
    'savings', 'account-balance-wallet', 'wallet', 'local-atm',
    'currency-bitcoin', 'currency-rupee', 'attach-money', 'euro', 'currency-pound'
  ],
  // Travel
  'Travel': [
    'flight', 'flight-takeoff', 'flight-land', 'luggage', 'travel-explore',
    'map', 'location-on', 'explore', 'tour', 'hotel', 'local-hotel',
    'beach-access', 'pool', 'hiking', 'sailing', 'attractions'
  ],
  // Personal Care
  'Personal Care': [
    'face', 'content-cut', 'spa', 'shower', 'bathtub', 'brush', 'checkroom',
    'watch', 'diamond', 'palette', 'style', 'face-retouching-natural'
  ],
  // Pets
  'Pets': [
    'pets', 'cruelty-free'
  ],
  // Insurance
  'Insurance': [
    'security', 'shield', 'verified-user', 'health-and-safety',
    'local-fire-department', 'car-crash'
  ],
  // Gifts & Donations
  'Gifts & Donations': [
    'card-giftcard', 'redeem', 'volunteer-activism', 'favorite',
    'diversity-3', 'celebration'
  ],
  // Technology
  'Technology': [
    'computer', 'laptop', 'tablet', 'devices', 'phone-iphone',
    'watch', 'headphones', 'keyboard', 'mouse', 'camera',
    'photo-camera', 'videocam', 'gamepad'
  ],
  // Other
  'Other': [
    'more-horiz', 'category', 'label', 'bookmark', 'star',
    'grade', 'help', 'info', 'error'
  ]
};

// Flatten all icons for the grid display
const ICON_OPTIONS = Object.values(ICON_CATEGORIES).flat();

const COLOR_OPTIONS = [
  '#ff9800', '#2196f3', '#14b8a6', '#ec4899', '#9c27b0',
  '#4caf50', '#ff5722', '#8bc34a', '#00bcd4', '#673ab7',
  '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4',
];

export const CategoriesScreen = () => {
  const navigation = useNavigation<any>();
  const { categories, loadCategories, addCategory, updateCategory, deleteCategory } = useStore();
  const theme = darkTheme;

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSelectedIcon(ICON_OPTIONS[0]);
    setSelectedColor(COLOR_OPTIONS[0]);
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setDescription(category.description || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
          description: description.trim() || undefined,
        });
      } else {
        await addCategory({
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
          description: description.trim() || undefined,
          isDefault: false,
        });
      }
      setShowModal(false);
      await loadCategories();
    } catch (error) {
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (category: any) => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              await loadCategories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Manage Categories
        </Text>
        <TouchableOpacity onPress={openAddModal}>
          <MaterialIcons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => openEditModal(category)}
              onLongPress={() => handleDelete(category)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <MaterialIcons name={category.icon as any} size={28} color={category.color} />
              </View>
              <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                {category.name}
              </Text>
              {category.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBodyContent}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Name *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  placeholder="Enter category name"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Description
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  placeholder="Enter description (optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Icon * (Tap to select, Long-press to see Icon name)
                </Text>
                <ScrollView
                  style={styles.iconScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.iconScrollContent}
                >
                  {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                    <View key={categoryName} style={styles.iconCategorySection}>
                      <Text style={[styles.iconCategoryLabel, { color: theme.colors.text }]}>
                        {categoryName}
                      </Text>
                      <View style={styles.iconGrid}>
                        {icons.map((icon) => (
                          <TouchableOpacity
                            key={icon}
                            style={[
                              styles.iconOption,
                              {
                                backgroundColor: selectedIcon === icon
                                  ? theme.colors.primary + '40'
                                  : theme.colors.background,
                              },
                            ]}
                            onPress={() => setSelectedIcon(icon)}
                            onLongPress={() => Alert.alert('Icon Name', icon)}
                          >
                            <MaterialIcons
                              name={icon as any}
                              size={24}
                              color={selectedIcon === icon ? theme.colors.primary : theme.colors.text}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Color *
                </Text>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorOption, { backgroundColor: color }]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <MaterialIcons name="check" size={20} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowModal(false)}
                style={styles.modalButton}
              />
              <Button
                title={editingCategory ? 'Update' : 'Add'}
                onPress={handleSave}
                loading={loading}
                style={styles.modalButton}
              />
            </View>
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
  contentContainer: {
    paddingBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  defaultBadge: {
    backgroundColor: 'rgba(19, 127, 236, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: 10,
    color: '#137fec',
    fontWeight: '600',
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconScrollView: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  iconScrollContent: {
    paddingBottom: 10,
  },
  iconCategorySection: {
    marginBottom: 20,
  },
  iconCategoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButton: {
    flex: 1,
  },
});

