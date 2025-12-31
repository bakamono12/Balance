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

const ICON_OPTIONS = [
  'restaurant', 'directions-car', 'shopping-bag', 'movie', 'phone-iphone',
  'local-grocery-store', 'flight', 'local-hospital', 'flash-on', 'home',
  'school', 'fitness-center', 'pets', 'sports-esports', 'music-note',
  'brush', 'directions-bus', 'local-gas-station', 'local-cafe', 'fastfood',
];

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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
                  Icon *
                </Text>
                <View style={styles.iconGrid}>
                  {ICON_OPTIONS.map((icon) => (
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

