import { Platform } from 'react-native';

/**
 * 🎨 Cross-platform shadow utility
 * Handles both React Native and Web shadow styles
 * Fixes deprecation warnings for shadow props
 */

export const createShadow = (config) => {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.1,
    shadowRadius = 4,
    elevation = 2
  } = config;

  if (Platform.OS === 'web') {
    // Use boxShadow for web
    const { width, height } = shadowOffset;
    return {
      boxShadow: `${width}px ${height}px ${shadowRadius}px rgba(${hexToRgb(shadowColor)}, ${shadowOpacity})`,
      // Fallback for browsers that don't support boxShadow
      WebkitBoxShadow: `${width}px ${height}px ${shadowRadius}px rgba(${hexToRgb(shadowColor)}, ${shadowOpacity})`,
      MozBoxShadow: `${width}px ${height}px ${shadowRadius}px rgba(${hexToRgb(shadowColor)}, ${shadowOpacity})`
    };
  } else {
    // Use native shadow props for iOS/Android
    return {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      elevation // Android elevation
    };
  }
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  // Handle both #RGB and #RRGGBB formats
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  
  if (!result) {
    // Handle color names or fallback to black
    return '0, 0, 0';
  }
  
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

// Common shadow presets
export const shadowPresets = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  }
};

// Usage examples:
// const cardStyle = createShadow(shadowPresets.card);
// const customStyle = createShadow({ shadowColor: '#6A0572', shadowOpacity: 0.3 });
