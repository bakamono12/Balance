import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store';
import { darkTheme } from '../theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
}

export const FAB: React.FC<FABProps> = ({ onPress, icon = 'add' }) => {
  const { isDarkMode } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;

  const handlePress = () => {
    if (Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.fab, theme.shadows.primary]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon as any} size={28} color="#ffffff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#137fec',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

