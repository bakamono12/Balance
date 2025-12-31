import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
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

