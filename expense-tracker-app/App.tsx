import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { initDatabase } from './src/app/storage/database';
import { useStore } from './src/app/store';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { loadUser, loadCategories, loadTransactions } = useStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await initDatabase();

      // Load initial data
      await loadUser();
      await loadCategories();
      await loadTransactions(20);

      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsReady(true);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#137fec" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#101922" />
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#101922',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
