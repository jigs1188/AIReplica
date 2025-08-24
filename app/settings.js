import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CollapsibleCard = ({ title, iconName, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden">
      <TouchableOpacity
        className="flex-row items-center justify-between p-4 border-b border-gray-200"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="flex-row items-center">
          <MaterialCommunityIcons name={iconName} size={24} color="#8B5CF6" className="mr-3" />
          <Text className="text-lg font-semibold text-gray-800">{title}</Text>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="gray" />
      </TouchableOpacity>
      {isExpanded && (
        <View className="p-4">
          {children}
        </View>
      )}
    </View>
  );
};

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="p-6">
        <Text className="text-3xl font-bold text-purple-700 mb-8">Settings</Text>

        <CollapsibleCard title="Connected Apps" iconName="link-variant">
          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Integrate with your favorite platforms.</Text>
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="gmail" size={20} color="#EA4335" className="mr-2" />
              <Text className="text-base text-gray-800">Gmail</Text>
              <TouchableOpacity className="ml-auto px-3 py-1 bg-purple-600 rounded-full"><Text className="text-white text-xs">Connect</Text></TouchableOpacity>
            </View>
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" className="mr-2" />
              <Text className="text-base text-gray-800">WhatsApp</Text>
              <TouchableOpacity className="ml-auto px-3 py-1 bg-purple-600 rounded-full"><Text className="text-white text-xs">Connect</Text></TouchableOpacity>
            </View>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="linkedin" size={20} color="#0A66C2" className="mr-2" />
              <Text className="text-base text-gray-800">LinkedIn</Text>
              <TouchableOpacity className="ml-auto px-3 py-1 bg-purple-600 rounded-full"><Text className="text-white text-xs">Connect</Text></TouchableOpacity>
            </View>
          </View>
        </CollapsibleCard>

        <CollapsibleCard title="Tone Customization" iconName="palette">
          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Refine your clone's communication style.</Text>
            {/* Placeholder for tone customization options */}
            <Text className="text-gray-600">More options coming soon...</Text>
          </View>
        </CollapsibleCard>

        <CollapsibleCard title="Subscription Plan" iconName="crown">
          <View className="mb-4">
            <Text className="text-base text-gray-700 mb-2">Manage your AIReplica subscription.</Text>
            {/* Placeholder for subscription details */}
            <Text className="text-gray-600">Current Plan: Freemium</Text>
            <TouchableOpacity className="mt-3 px-4 py-2 bg-purple-600 rounded-full self-start"><Text className="text-white font-semibold">Upgrade Now</Text></TouchableOpacity>
          </View>
        </CollapsibleCard>
      </ScrollView>
    </SafeAreaView>
  );
}
