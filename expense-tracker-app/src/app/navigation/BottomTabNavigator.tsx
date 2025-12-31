import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { useStore } from '../store';
import { darkTheme } from '../theme';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const { isDarkMode } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;
  const navigation = useNavigation<any>();
  const [currentRoute, setCurrentRoute] = useState('Home');

  const handleFABPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddTransaction');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#16202a',
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
        screenListeners={{
          state: (e) => {
            const state = e.data.state;
            const routeName = state.routes[state.index].name;
            setCurrentRoute(routeName);
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Stats"
          component={AnalyticsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="bar-chart" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="account-balance-wallet" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Budget"
          component={GoalsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="flag" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Hide FAB on Budget, Stats, and Profile screens */}
      {currentRoute !== 'Budget' && currentRoute !== 'Stats' && currentRoute !== 'Profile' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFABPress}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#137fec',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#137fec',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
});

