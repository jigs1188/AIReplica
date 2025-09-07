import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabsIndex() {
  const router = useRouter();
  
  React.useEffect(() => {
    // Redirect to main dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Redirecting...</Text>
    </View>
  );
}