import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function OneClickPlatformSetup() {
  const router = useRouter();
  
  React.useEffect(() => {
    // Redirect to real one-click platform setup
    router.replace('/real-one-click-platform-setup');
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading Platform Setup...</Text>
    </View>
  );
}