import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function PlatformIntegrations() {
  const router = useRouter();
  
  React.useEffect(() => {
    // Redirect to integration dashboard
    router.replace('/integration-dashboard');
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading Integrations...</Text>
    </View>
  );
}