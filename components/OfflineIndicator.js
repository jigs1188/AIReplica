import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleConnectionChange = (isConnected) => {
      setIsOffline(!isConnected);
    };

    // For web
    if (typeof window !== 'undefined') {
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
