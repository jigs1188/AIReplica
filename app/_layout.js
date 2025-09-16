import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 AIReplica app starting...');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="professional-main-dashboard" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="main-app" />
      <Stack.Screen name="consumer-auth" />
      <Stack.Screen name="multi-step-auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="training" />
      <Stack.Screen name="subscription-plans" />
      <Stack.Screen name="integration-hub" />
      <Stack.Screen name="contact-manager" />
      <Stack.Screen name="detailed-whatsapp-setup" />
      <Stack.Screen name="auto-reply" />
      <Stack.Screen name="MeetingMemory" />
      <Stack.Screen name="whatsapp-setup" />
      <Stack.Screen name="instagram-setup" />
      <Stack.Screen name="email-setup" />
      <Stack.Screen name="enhanced-whatsapp-setup" />
      <Stack.Screen name="quick-start" />
      <Stack.Screen name="platform-selector" />
      <Stack.Screen name="whatsapp-regular-setup" />
      <Stack.Screen name="qr-display" />
      <Stack.Screen name="test-center" />
      <Stack.Screen name="test-ai-reply" />
      <Stack.Screen name="ai-personality" />
      <Stack.Screen name="improved-whatsapp-setup" />
      <Stack.Screen name="advanced-setup-hub" />
      <Stack.Screen name="linkedin-setup" />
    </Stack>
  );
}
