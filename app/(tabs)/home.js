import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard when Home tab is clicked
    router.replace('/dashboard');
  }, []);

  // Show loading while redirecting
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F2FB' }}>
      <ActivityIndicator size="large" color="#6A0572" />
    </View>
  );
}
