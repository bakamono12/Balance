import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { darkTheme } from '../theme';
import { Button } from '../components/Button';
import { userService } from '../services/database.service';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { loadUser } = useStore();
  const theme = darkTheme;

  const [existingUser, setExistingUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    try {
      const user = await userService.getUser();
      setExistingUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await loadUser();
      navigation.replace('Main');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleCreateNewAccount = () => {
    navigation.navigate('Onboarding');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!existingUser) {
    // No user exists, go to onboarding
    navigation.replace('Onboarding');
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="account-balance-wallet" size={64} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back!</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Sign in to continue
          </Text>
        </View>

        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {existingUser.profilePhoto ? (
                <Image source={{ uri: existingUser.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialIcons name="person" size={40} color={theme.colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>{existingUser.name}</Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{existingUser.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={`Continue as ${existingUser.name}`}
            onPress={handleLogin}
            icon={<MaterialIcons name="login" size={20} color="#ffffff" />}
          />

          <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNewAccount}>
            <Text style={[styles.createNewText, { color: theme.colors.textSecondary }]}>
              Create New Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#137fec20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  userCard: {
    backgroundColor: '#1a2332',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  actions: {
    gap: 16,
  },
  createNewButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  createNewText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

