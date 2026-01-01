import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking } from 'react-native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['expensetracker://'],
  config: {
    screens: {
      Main: 'main',
      AddTransaction: 'add_transaction',
    },
  },
};

export const RootNavigator = () => {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Handle deep links from widget
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;

      if (url.includes('add_transaction')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const type = urlParams.get('type');

        if (navigationRef.current) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            navigationRef.current?.navigate('AddTransaction', {
              transaction: null,
              initialType: type || 'expense'
            });
          }, 100);
        }
      }
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep link when app is opened from closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

