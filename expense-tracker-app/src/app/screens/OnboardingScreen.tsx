import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { Button } from '../components/Button';
import { getCurrencySymbol } from '../utils/formatters';

export const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const { updateUser } = useStore();
  const theme = darkTheme;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loading, setLoading] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !email.trim()) {
        alert('Please fill in all fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!monthlyIncome || parseFloat(monthlyIncome) <= 0) {
        alert('Please enter a valid monthly spending limit');
        return;
      }
      handleComplete();
    }
  };

  const handleComplete = async () => {
    Alert.alert(
      'Create New Account',
      'Creating a new account will replace your existing account data. All transactions, goals, and settings from the previous account will remain in the database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              setLoading(true);
              await updateUser({
                name: name.trim(),
                email: email.trim(),
                currency,
                monthlyIncome: parseFloat(monthlyIncome),
              });
              navigation.replace('Main');
            } catch (error) {
              console.error('Onboarding error:', error);
              alert('Failed to complete setup');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back Button Header */}
      <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            if (step === 1) {
              navigation.goBack();
            } else {
              setStep(1);
            }
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <MaterialIcons name="account-balance-wallet" size={48} color="#ffffff" />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Welcome to Balance
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Let's set up your account in just 2 steps
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.colors.primary, width: `${(step / 2) * 100}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            Step {step} of 2
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Personal Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Full Name *
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
                <MaterialIcons name="person" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Email *
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
                <MaterialIcons name="email" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Currency *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.currencyScroll}
              >
                {currencies.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyChip,
                      {
                        backgroundColor:
                          currency === curr.code ? theme.colors.primary : theme.colors.surface,
                      },
                    ]}
                    onPress={() => setCurrency(curr.code)}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        { color: currency === curr.code ? '#ffffff' : theme.colors.text },
                      ]}
                    >
                      {curr.symbol} {curr.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Financial Settings
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Monthly Spending Limit *
              </Text>
              <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                Set your monthly budget to track your expenses
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                  {getCurrencySymbol(currency)}
                </Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
              <MaterialIcons name="info" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                You can always change these settings later in your profile
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 24 }]}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.backButtonFooter, { backgroundColor: theme.colors.surface }]}
            onPress={() => setStep(step - 1)}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Button
          title={step === 2 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          loading={loading}
          style={styles.nextButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  form: {
    marginBottom: 100,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
  },
  currencyScroll: {
    marginTop: 8,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    flexDirection: 'row',
    gap: 12,
  },
  backButtonFooter: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
  },
});

