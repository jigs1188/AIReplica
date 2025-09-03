import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 AIReplica app starting...');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="main-app" />
      <Stack.Screen name="simple-dashboard" />
      <Stack.Screen name="consumer-auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="training" />
      <Stack.Screen name="subscription-plans" />
      <Stack.Screen name="ai-replica-dashboard" />
      <Stack.Screen name="integration-dashboard" />
      <Stack.Screen name="auto-reply" />
      <Stack.Screen name="MeetingMemory" />
      <Stack.Screen name="whatsapp-setup" />
      <Stack.Screen name="instagram-setup" />
      <Stack.Screen name="email-setup" />
      <Stack.Screen name="enhanced-whatsapp-setup" />
    </Stack>
  );
}
