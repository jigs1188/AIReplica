import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ProgressBarAndroid } from 'react-native';
import { useNavigation } from 'expo-router';

export default function TrainingScreen() {
  const navigation = useNavigation();
  const [sampleEmail, setSampleEmail] = useState('');
  const [sampleChatReply, setSampleChatReply] = useState('');
  const [sampleComment, setSampleComment] = useState('');

  const handleNext = () => {
    // In a real app, you would save this data and proceed to the next training step
    console.log('Training Data:', { sampleEmail, sampleChatReply, sampleComment });
    // Navigate to the next step or dashboard
    // navigation.navigate('nextTrainingStep');
    alert('Training data saved (simulated). Proceeding to next step.');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-6">
      <Text className="text-3xl font-bold text-purple-700 mb-8">Train Your Clone</Text>

      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Sample Email</Text>
        <TextInput
          className="bg-white p-4 rounded-xl border border-gray-300 text-gray-800"
          placeholder="Enter a sample email you've sent..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          value={sampleEmail}
          onChangeText={setSampleEmail}
        />
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Sample Chat Reply</Text>
        <TextInput
          className="bg-white p-4 rounded-xl border border-gray-300 text-gray-800"
          placeholder="Enter a sample chat reply..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          value={sampleChatReply}
          onChangeText={setSampleChatReply}
        />
      </View>

      <View className="mb-8">
        <Text className="text-lg font-semibold text-gray-700 mb-2">Sample Comment</Text>
        <TextInput
          className="bg-white p-4 rounded-xl border border-gray-300 text-gray-800"
          placeholder="Enter a sample comment you've made..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          value={sampleComment}
        onChangeText={setSampleComment}
        />
      </View>

      {/* Progress Bar */}
      <View className="mb-8">
        <Text className="text-base text-gray-600 mb-2">Step 2 of 3</Text>
        {/* ProgressBarAndroid is for Android, use a custom View for cross-platform or react-native-progress */}
        <View className="h-2 bg-gray-300 rounded-full">
          <View className="w-2/3 h-full bg-purple-600 rounded-full" />
        </View>
      </View>

      <TouchableOpacity
        className="bg-purple-600 px-8 py-4 rounded-2xl shadow-lg w-full items-center"
        onPress={handleNext}
      >
        <Text className="text-white text-lg font-bold">Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
