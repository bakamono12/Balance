import { colors } from './colors';
import { spacing, borderRadius, typography, shadows } from './layout';

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    [key: string]: any;
  };
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
}

export const lightTheme: Theme = {
  dark: false,
  colors: {
    ...colors,
    background: colors.background.light,
    surface: colors.surface.light,
    text: colors.text.primary.light,
    textSecondary: colors.text.secondary.light,
    border: colors.border.light,
  },
  spacing,
  borderRadius,
  typography,
  shadows,
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    ...colors,
    background: colors.background.dark,
    surface: colors.surface.dark,
    text: colors.text.primary.dark,
    textSecondary: colors.text.secondary.dark,
    border: colors.border.dark,
  },
  spacing,
  borderRadius,
  typography,
  shadows,
};

export { colors, spacing, borderRadius, typography, shadows };

