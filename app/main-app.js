/**
 * Main App Entry Point
 * Simple, clean app flow
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Simple screens
import SimpleDashboard from './simple-dashboard';
import ConsumerAuth from './consumer-auth';

export default function MainApp() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
      
      if (user) {
        console.log('✅ User authenticated:', user.email);
      } else {
        console.log('🔓 User not authenticated');
      }
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6A0572" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading AIReplica...</Text>
      </View>
    );
  }

  // Show dashboard if user is authenticated, otherwise show auth
  return user ? <SimpleDashboard /> : <ConsumerAuth />;
}
