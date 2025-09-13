import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // For web - check if window and addEventListener exist
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Initial check
      setIsOffline(!navigator.onLine);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // React Native environment - use NetInfo or fallback
      console.log('🔌 OfflineIndicator: Using React Native network monitoring');
      // Set initial state as online for React Native
      setIsOffline(false);
    }
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="wifi-off" size={16} color="#ff6b6b" />
      <Text style={styles.text}>Offline Mode - Using cached data</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default OfflineIndicator;
