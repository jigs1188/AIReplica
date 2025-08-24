import React from 'react';
import { View, Text, TouchableOpacity, Image, Switch, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

// Reusable Dashboard Card Component
const DashboardCard = ({ title, iconName, description, onToggle, isToggled, colors, stat, onPress }) => {
  return (
    <TouchableOpacity
      className="rounded-2xl shadow-xl mb-4 w-[45%] overflow-hidden border border-white border-opacity-30"
      style={{ aspectRatio: 1 }}
      onPress={onPress}
    >
      <LinearGradient
        colors={colors || ['#FFFFFF', '#F0F0F0']}
        className="flex-1 p-4 items-center justify-center"
      >
        <MaterialCommunityIcons name={iconName} size={48} color="white" className="mb-3" />
        <Text className="text-xl font-bold text-white text-center mb-1">{title}</Text>
        <Text className="text-white text-sm text-center opacity-80">{description}</Text>
        {stat && <Text className="text-white text-xs mt-2 opacity-70">{stat}</Text>}
        {onToggle && (
          <Switch
            trackColor={{ false: "rgba(255,255,255,0.3)", true: "rgba(255,255,255,0.6)" }}
            thumbColor={isToggled ? "#FFFFFF" : "#F0F0F0"}
            ios_backgroundColor="rgba(255,255,255,0.2)"
            onValueChange={onToggle}
            value={isToggled}
            className="mt-2"
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [autoRepliesEnabled, setAutoRepliesEnabled] = React.useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Top Navbar */}
      <View className="flex-row items-center justify-between p-4 bg-white shadow-md">
        <View className="flex-row items-center">
          <Ionicons name="sparkles-outline" size={30} color="#8B5CF6" className="mr-2" />
          <Text className="text-2xl font-bold text-purple-700">AIReplica</Text>
        </View>
        <TouchableOpacity onPress={() => console.log('User avatar pressed')}>
          <Ionicons name="person-circle-outline" size={35} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Greeting */}
        <Text className="text-3xl font-bold text-gray-800 mt-4 mb-6">Welcome back, Jigs</Text>

        {/* Quick Actions Row */}
        <View className="flex-row justify-around mb-8">
          <TouchableOpacity className="items-center p-4 bg-white rounded-full shadow-md">
            <MaterialCommunityIcons name="reply-all" size={30} color="#8B5CF6" />
            <Text className="text-xs text-gray-600 mt-1">Quick Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center p-4 bg-white rounded-full shadow-md">
            <MaterialCommunityIcons name="lightbulb-on-outline" size={30} color="#8B5CF6" />
            <Text className="text-xs text-gray-600 mt-1">Decision Aid</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center p-4 bg-white rounded-full shadow-md">
            <MaterialCommunityIcons name="microphone-outline" size={30} color="#8B5CF6" />
            <Text className="text-xs text-gray-600 mt-1">Meeting Summary</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Cards Grid */}
        <View className="flex-row flex-wrap justify-center gap-4 mb-8">
          <DashboardCard
            title="Auto-Replies"
            iconName="message-reply-text"
            description="Automate your responses."
            onToggle={() => setAutoRepliesEnabled(previousState => !previousState)}
            isToggled={autoRepliesEnabled}
            colors={['#A2D2FF', '#BDE0FE']}
            stat="12 replies sent today"
            onPress={() => navigation.navigate('chat')}
          />
          <DashboardCard
            title="Decision Assistant"
            iconName="lightbulb-on"
            description="Get AI-powered suggestions."
            colors={['#FFC72C', '#FFD966']}
            stat="Latest: Should I accept meeting?"
            onPress={() => console.log('Navigate to Decision Assistant')}
          />
          <DashboardCard
            title="Meeting Notes"
            iconName="microphone-outline"
            description="Summarize calls & generate action items."
            colors={['#C9F7F5', '#D9FBF9']}
            stat="Last summary: Project X kickoff"
            onPress={() => navigation.navigate('MeetingMemory')}
          />
          <DashboardCard
            title="Tone Manager"
            iconName="palette"
            description="Adjust your clone's communication style."
            colors={['#E0BBE4', '#957DAD']}
            stat="Current mode: Witty"
            onPress={() => navigation.navigate('training')}
          />
          <DashboardCard
            title="Integrations"
            iconName="link-variant"
            description="Connect with your favorite apps."
            colors={['#FFABAB', '#FFD1DC']}
            stat="Gmail, WhatsApp, LinkedIn"
            onPress={() => navigation.navigate('settings')}
          />
        </View>

        {/* Insights Section */}
        <View className="bg-white p-4 rounded-2xl shadow-md flex-row justify-around items-center">
          <View className="items-center">
            <MaterialCommunityIcons name="clock-outline" size={30} color="#8B5CF6" />
            <Text className="text-lg font-bold text-gray-800 mt-1">2.3 hrs saved</Text>
            <Text className="text-sm text-gray-600">this week</Text>
          </View>
          <View className="items-center">
            <MaterialCommunityIcons name="chart-bar" size={30} color="#8B5CF6" />
            <Text className="text-lg font-bold text-gray-800 mt-1">Casual</Text>
            <Text className="text-sm text-gray-600">Most used tone (68%)</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View className="flex-row justify-around items-center bg-white p-4 shadow-lg rounded-t-xl">
        <TouchableOpacity className="items-center p-2 rounded-lg bg-purple-100" onPress={() => navigation.navigate('dashboard')}>
          <Ionicons name="home" size={28} color="#8B5CF6" />
          <Text className="text-xs font-bold text-purple-700">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center p-2 rounded-lg" onPress={() => navigation.navigate('chat')}>
          <Ionicons name="chatbubbles" size={28} color="gray" />
          <Text className="text-xs text-gray-500">Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center p-2 rounded-lg" onPress={() => navigation.navigate('training')}>
          <Ionicons name="bulb" size={28} color="gray" />
          <Text className="text-xs text-gray-500">Train</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center p-2 rounded-lg" onPress={() => navigation.navigate('settings')}>
          <Ionicons name="settings" size={28} color="gray" />
          <Text className="text-xs text-gray-500">Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}