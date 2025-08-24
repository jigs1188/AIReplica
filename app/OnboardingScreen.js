import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router'; // Assuming expo-router for navigation

export default function OnboardingScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#E0BBE4', '#957DAD']} // Pastel gradient colors
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center p-6">
      <View className="items-center mb-12">
        <Text className="text-white text-6xl font-bold mb-2">AIReplica</Text>
        <Text className="text-white text-xl font-semibold opacity-80">Create Your Digital Clone</Text>
      </View>

      <TouchableOpacity
        className="bg-white px-8 py-4 rounded-2xl shadow-lg mb-4 w-full max-w-xs items-center"
        onPress={() => navigation.navigate('dashboard')} // Navigate to Dashboard
      >
        <Text className="text-purple-700 text-lg font-bold">Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="border-2 border-white px-8 py-4 rounded-2xl w-full max-w-xs items-center"
        onPress={() => navigation.navigate('login')} // Navigate to Login
      >
        <Text className="text-white text-lg font-bold">Login</Text>
      </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}
