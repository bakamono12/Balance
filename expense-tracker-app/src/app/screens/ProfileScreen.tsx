import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { backupService } from '../services/backup.service';
import { clearDatabase, getDatabase } from '../storage/database';
import { Button } from '../components/Button';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { transactionService } from '../services/database.service';
import { format } from 'date-fns';
import { logger } from '../utils/logger';
import { seedDatabase } from '../utils/seedData';

const { Paths } = FileSystem;

// Check if running in development mode
const IS_DEV = __DEV__;

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser, loadUser, logout } = useStore();
  const theme = darkTheme;

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [startDate, setStartDate] = useState('1');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  ];

  useEffect(() => {
    if (user) {
      setMonthlyLimit(user.monthlyIncome?.toString() || '0');
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setSelectedImage(user.profilePhoto || null);
    }
  }, [user, showEditProfileModal]);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      await updateUser({
        name: editName.trim(),
        email: editEmail.trim(),
        profilePhoto: selectedImage ?? undefined,
      });
      await loadUser();
      setShowEditProfileModal(false);
      // Force UI update by re-syncing state
      if (selectedImage === null) {
        setSelectedImage(null);
      }
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    try {
      await updateUser({ currency: currencyCode });
      await loadUser();
      setShowCurrencyModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update currency');
    }
  };

  const handleUpdateLimit = async () => {
    if (!monthlyLimit || parseFloat(monthlyLimit) < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await updateUser({ monthlyIncome: parseFloat(monthlyLimit) });
      await loadUser();
      setShowLimitModal(false);
      Alert.alert('Success', 'Monthly spending limit updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update limit');
    }
  };

  const handleExportData = async () => {
    try {
      await backupService.exportBackup();
      Alert.alert('Success', 'Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImportData = async () => {
    try {
      await backupService.importBackup();
      await loadUser();
      Alert.alert('Success', 'Data imported successfully');
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import data');
    }
  };

  const handleExportCSV = async () => {
    try {
      const transactions = await transactionService.getAllTransactions();

      // Create CSV content
      let csv = 'Date,Type,Category,Amount,Payment Mode,Notes\n';
      transactions.forEach((t) => {
        csv += `${t.date},${t.type},${t.categoryId},${t.amount},${t.paymentMode},"${t.notes || ''}"\n`;
      });

      const fileName = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      const file = new FileSystem.File(Paths.document, fileName);

      await file.write(csv);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions',
        });
      }

      Alert.alert('Success', 'Transactions exported to CSV');
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'This will delete ALL data including transactions, categories, and goals. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDatabase();
              await loadUser();
              Alert.alert('Success', 'Database has been reset. Please restart the app.');
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Failed to reset database');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your data will remain safe and you can login again anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleViewLogs = () => {
    const logs = logger.getLogs();
    const errorLogs = logger.getLogsByLevel('error');
    const warnLogs = logger.getLogsByLevel('warn');

    Alert.alert(
      'Application Logs',
      `Total: ${logs.length}\nErrors: ${errorLogs.length}\nWarnings: ${warnLogs.length}\n\nLast 5 entries:\n\n${logs.slice(-5).map(l => `[${l.level.toUpperCase()}] ${l.message}`).join('\n')}`,
      [
        { text: 'Export Logs', onPress: handleExportLogs },
        { text: 'Clear Logs', onPress: () => {
          logger.clearLogs();
          Alert.alert('Success', 'Logs cleared');
        }},
        { text: 'Close' },
      ]
    );
  };

  const handleExportLogs = async () => {
    try {
      const logsContent = logger.exportLogs();
      const fileName = `app_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.txt`;
      const file = new FileSystem.File(Paths.document, fileName);

      await file.write(logsContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Application Logs',
        });
      }

      Alert.alert('Success', 'Logs exported successfully');
    } catch (error) {
      console.error('Export logs error:', error);
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleSeedData = () => {
    Alert.alert(
      '🧪 Seed Test Data',
      'This will populate your database with test transactions for 2025. This action will add sample data to help with testing and development.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed Data',
          onPress: async () => {
            try {
              const db = getDatabase();
              if (!db) {
                Alert.alert('Error', 'Database not initialized');
                return;
              }

              const result = await seedDatabase(db, true);

              if (result.success) {
                // Reload data to show new transactions
                const { loadTransactions } = useStore.getState();
                await loadUser();
                await loadTransactions(50);
                Alert.alert('Success', result.message + '\n\nPlease navigate to Home or Transactions screen to see the seeded data.');
              } else {
                Alert.alert('Info', result.message);
              }
            } catch (error: any) {
              console.error('Seed data error:', error);
              Alert.alert('Error', `Failed to seed data: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const selectedCurrency = currencies.find((c) => c.code === user?.currency) || currencies[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {user?.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePicture}>
                <MaterialIcons name="person" size={48} color={theme.colors.primary} />
              </View>
            )}
          </View>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {user?.email || 'user@example.com'}
          </Text>
          <TouchableOpacity
            style={[styles.editProfileButton, { backgroundColor: theme.colors.primary + '20' }]}
            onPress={() => setShowEditProfileModal(true)}
          >
            <MaterialIcons name="edit" size={16} color={theme.colors.primary} />
            <Text style={[styles.editProfileText, { color: theme.colors.primary }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>FINANCIAL SETTINGS</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowCurrencyModal(true)}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialIcons name="monetization-on" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Currency</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: theme.colors.textSecondary }]}>
                  {selectedCurrency.symbol} {selectedCurrency.code}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setShowLimitModal(true)}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#f59e0b' + '20' }]}>
                  <MaterialIcons name="account-balance-wallet" size={20} color="#f59e0b" />
                </View>
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Monthly Spending Limit</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[styles.menuValue, { color: theme.colors.textSecondary }]}>
                  {selectedCurrency.symbol}{user?.monthlyIncome || 0}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Categories')}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#ec4899' + '20' }]}>
                  <MaterialIcons name="category" size={20} color="#ec4899" />
                </View>
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Manage Categories</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>DATA & BACKUP</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#10b981' + '20' }]}>
                  <MaterialIcons name="cloud-upload" size={20} color="#10b981" />
                </View>
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Export Backup (JSON)</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleImportData}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#137fec' + '20' }]}>
                  <MaterialIcons name="cloud-download" size={20} color="#137fec" />
                </View>
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Import Backup</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleExportCSV}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#8b5cf6' + '20' }]}>
                  <MaterialIcons name="table-chart" size={20} color="#8b5cf6" />
                </View>
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Export CSV</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {IS_DEV && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                <TouchableOpacity style={styles.menuItem} onPress={handleSeedData}>
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#06b6d4' + '20' }]}>
                      <MaterialIcons name="science" size={20} color="#06b6d4" />
                    </View>
                    <View>
                      <Text style={[styles.menuText, { color: theme.colors.text }]}>Seed Test Data</Text>
                      <Text style={[styles.menuSubtext, { color: theme.colors.textSecondary }]}>Development Only</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleResetDatabase}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#ef4444' + '20' }]}>
                  <MaterialIcons name="delete-forever" size={20} color="#ef4444" />
                </View>
                <Text style={[styles.menuText, { color: '#ef4444' }]}>Reset Database</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#f97316' + '20' }]}>
                  <MaterialIcons name="logout" size={20} color="#f97316" />
                </View>
                <Text style={[styles.menuText, { color: '#f97316' }]}>Logout</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright Section */}
        <View style={styles.copyrightSection}>
          <View style={styles.copyrightRow}>
            <MaterialIcons name="copyright" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.copyrightText, { color: theme.colors.textSecondary }]}>
              2026 Balance
            </Text>
          </View>
          <View style={styles.developedRow}>
            <Text style={[styles.developedText, { color: theme.colors.textSecondary }]}>
              Developed with
            </Text>
            <MaterialIcons name="favorite" size={14} color="#ef4444" style={styles.heartIcon} />
            <Text style={[styles.developedText, { color: theme.colors.textSecondary }]}>
              by Abhishek Pathak
            </Text>
          </View>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Version 1.2.0
          </Text>
        </View>
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyItem,
                    { backgroundColor: user?.currency === currency.code ? theme.colors.primary + '20' : 'transparent' },
                  ]}
                  onPress={() => handleCurrencyChange(currency.code)}
                >
                  <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>{currency.symbol}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={[styles.currencyCode, { color: theme.colors.text }]}>{currency.code}</Text>
                    <Text style={[styles.currencyName, { color: theme.colors.textSecondary }]}>{currency.name}</Text>
                  </View>
                  {user?.currency === currency.code && (
                    <MaterialIcons name="check" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Monthly Limit Modal */}
      <Modal visible={showLimitModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Monthly Spending Limit</Text>
              <TouchableOpacity onPress={() => setShowLimitModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Set your monthly budget to track expenses
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                placeholder="Enter amount"
                placeholderTextColor={theme.colors.textSecondary}
                value={monthlyLimit}
                onChangeText={setMonthlyLimit}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowLimitModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Update"
                onPress={handleUpdateLimit}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {/* Profile Image */}
              <View style={styles.imagePickerSection}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Profile Picture</Text>
                <TouchableOpacity onPress={handlePickImage} style={styles.imagePickerButton} activeOpacity={0.7}>
                  {selectedImage ? (
                    <View style={styles.previewImageContainer}>
                      <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                      <View style={styles.imageOverlay}>
                        <MaterialIcons name="edit" size={20} color="#fff" />
                      </View>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => {
                          Alert.alert(
                            'Remove Photo',
                            'Are you sure you want to remove your profile picture?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () => setSelectedImage(null)
                              }
                            ]
                          );
                        }}
                      >
                        <MaterialIcons name="close" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.imagePickerPlaceholder, {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.primary + '40'
                    }]}>
                      <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                        <MaterialIcons name="add-a-photo" size={32} color={theme.colors.primary} />
                      </View>
                      <Text style={[styles.imagePickerText, { color: theme.colors.text }]}>
                        Tap to select photo
                      </Text>
                      <Text style={[styles.imagePickerSubtext, { color: theme.colors.textSecondary }]}>
                        Choose from gallery
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowEditProfileModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleUpdateProfile}
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
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
  },
  profilePicture: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(19, 127, 236, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    flex: 1,
  },
  menuSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  label: {
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
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
  profileImageContainer: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePickerSection: {
    marginBottom: 24,
  },
  imagePickerButton: {
    alignItems: 'center',
  },
  imagePickerPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderStyle: 'solid',
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePickerSubtext: {
    fontSize: 12,
  },
  previewImageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#137fec',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1a1f2e',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1f2e',
  },
  inputGroup: {
    marginBottom: 20,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 20,
    gap: 8,
  },
  copyrightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyrightText: {
    fontSize: 12,
    fontWeight: '500',
  },
  developedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  developedText: {
    fontSize: 12,
  },
  heartIcon: {
    marginHorizontal: 2,
  },
  versionText: {
    fontSize: 11,
    marginTop: 4,
  },
});

