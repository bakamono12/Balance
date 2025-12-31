import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useStore } from '../store';
import { darkTheme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const { isDarkMode } = useStore();
  const theme = isDarkMode ? darkTheme : darkTheme;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { height: 36, paddingHorizontal: theme.spacing.md },
      medium: { height: 48, paddingHorizontal: theme.spacing.lg },
      large: { height: 56, paddingHorizontal: theme.spacing.xl },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: theme.colors.primary },
      secondary: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      danger: { backgroundColor: theme.colors.error.main },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: theme.typography.fontWeight.bold,
    };

    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: theme.typography.fontSize.sm },
      medium: { fontSize: theme.typography.fontSize.md },
      large: { fontSize: theme.typography.fontSize.lg },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: '#ffffff' },
      secondary: { color: theme.colors.text },
      outline: { color: theme.colors.primary },
      danger: { color: '#ffffff' },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#ffffff' : theme.colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

