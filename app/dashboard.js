import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  RefreshControl,
  ActivityIndicator 
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserSettings, validateAPIKey } from "../utils/aiSettings";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete AIReplica Feature Suite with enhanced descriptions
const features = [
  { 
    title: "🤖 AIReplica Dashboard", 
    subtitle: "Central hub for managing auto-replies and platform integrations", 
    icon: "robot-outline", 
    route: "/ai-replica-dashboard",
    badge: "CORE",
    color: "#6A0572" 
  },
  { 
    title: "🗣️ Clone Chat Interface", 
    subtitle: "Chat with your AI personality twin and test responses", 
    icon: "account-multiple", 
    route: "/(tabs)/clone",
    badge: null,
    color: "#AB47BC" 
  },
  { 
    title: "🎓 Training Center", 
    subtitle: "Train your AI to match your unique communication style", 
    icon: "school", 
    route: "/(tabs)/training",
    badge: "ESSENTIAL",
    color: "#8E44AD" 
  },
  { 
    title: "⚡ Auto-Reply Setup", 
    subtitle: "Configure intelligent responses across all platforms", 
    icon: "reply-all", 
    route: "/auto-reply",
    badge: "AUTO",
    color: "#9B59B6" 
  },
  { 
    title: "🔗 Integration Hub", 
    subtitle: "Connect WhatsApp, Email, Instagram, LinkedIn & more platforms", 
    icon: "link-variant", 
    route: "/integration-dashboard",
    badge: "CONNECT",
    color: "#7B1FA2" 
  },
  { 
    title: "📅 Meeting Memory", 
    subtitle: "AI-powered meeting insights and intelligent follow-ups", 
    icon: "calendar-clock", 
    route: "/MeetingMemory",
    badge: null,
    color: "#673AB7" 
  },
  { 
    title: "📜 Conversation History", 
    subtitle: "Review past conversations and AI decision patterns", 
    icon: "history", 
    route: "/(tabs)/history",
    badge: null,
    color: "#512DA8" 
  },
  { 
    title: "💬 Prompt Templates", 
    subtitle: "Create and manage smart response templates", 
    icon: "text-box-multiple", 
    route: "/(tabs)/prompts",
    badge: null,
    color: "#4527A0" 
  },
  { 
    title: "👑 Subscription Plans", 
    subtitle: "Upgrade for more platforms and advanced features", 
    icon: "crown", 
    route: "/subscription-plans",
    badge: "PRO",
    color: "#FF6B35" 
  },
  { 
    title: "⚙️ Settings & Sync", 
    subtitle: "Configure preferences and sync across devices", 
    icon: "cog-outline", 
    route: "/(tabs)/settings",
    badge: null,
    color: "#607D8B" 
  },
];

const FeatureCard = ({ title, subtitle, iconName, onPress, color = "#6A0572", badge = null }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      backgroundColor: "#fff",
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: color,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderLeftWidth: 4,
      borderLeftColor: color,
    }}
    activeOpacity={0.88}
  >
    <View style={{ 
      width: 52, 
      height: 52, 
      borderRadius: 14, 
      backgroundColor: `${color}15`, 
      justifyContent: "center", 
      alignItems: "center" 
    }}>
      <MaterialCommunityIcons name={iconName} size={28} color={color} />
    </View>
    <View style={{ marginLeft: 16, flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#222", flex: 1 }}>{title}</Text>
        {badge && (
          <View style={{ 
            backgroundColor: color, 
            paddingHorizontal: 8, 
            paddingVertical: 2, 
            borderRadius: 10,
            marginLeft: 8 
          }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 13, color: "#666", lineHeight: 18 }}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
  </TouchableOpacity>
);

const StatCard = ({ icon, value, label, color }) => (
  <View style={{ 
    flex: 1, 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 16, 
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: color,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  }}>
    <View style={{ 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: `${color}20`, 
      justifyContent: "center", 
      alignItems: "center",
      marginBottom: 8 
    }}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={{ fontSize: 18, fontWeight: "bold", color: "#222" }}>{value}</Text>
    <Text style={{ fontSize: 12, color: "#666", textAlign: "center" }}>{label}</Text>
  </View>
);

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState(0);
  const [todayMessages, setTodayMessages] = useState(0);
  const [apiStatus, setApiStatus] = useState('checking');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        // Redirect to auth if not logged in
        router.replace('/consumer-auth');
      } else {
        console.log('✅ User authenticated:', currentUser.email);
      }
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#F6F2FB" }}>
        <ActivityIndicator size="large" color="#6A0572" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading AIReplica...</Text>
      </View>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load user settings
      const settings = await getUserSettings();
      setUserSettings(settings);
      
      // Check API status
      const api = await validateAPIKey();
      setApiStatus(api.isValid ? 'connected' : 'error');
      
      // Load connected platforms count
      let platformCount = 0;
      const platforms = ['whatsapp', 'instagram', 'email', 'linkedin', 'telegram', 'slack'];
      
      for (const platform of platforms) {
        const stored = await AsyncStorage.getItem(`@platform_${platform}`);
        if (stored) platformCount++;
      }
      
      setConnectedPlatforms(platformCount);
      
      // Load today's messages (from storage or mock)
      const storedMessages = await AsyncStorage.getItem('@today_messages');
      setTodayMessages(storedMessages ? parseInt(storedMessages) : Math.floor(Math.random() * 50));
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Active';
      case 'error': return 'Setup';
      default: return 'Loading';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F2FB" }}>
      {/* Enhanced Top navbar */}
      <LinearGradient
        colors={["#6A0572", "#AB47BC"]}
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          justifyContent: "space-between", 
          paddingHorizontal: 18, 
          paddingVertical: 16 
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={require("../assets/images/logo.jpg")} style={{ width: 42, height: 42, borderRadius: 10 }} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}>AIReplica</Text>
            <Text style={{ fontSize: 12, color: "#E1BEE7" }}>Personal Communication Assistant</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity 
            style={{ padding: 8, marginRight: 4 }} 
            onPress={() => router.push("/integration-dashboard")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ padding: 8 }} 
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Ionicons name="person-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={{ padding: 18 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#222", marginBottom: 4 }}>
            Welcome back! 👋
          </Text>
          <Text style={{ fontSize: 16, color: "#666" }}>
            {user?.displayName || user?.email || "AIReplica User"}
          </Text>
        </View>

        {/* Status Overview Cards */}
        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          <StatCard 
            icon="robot" 
            value={getStatusText(apiStatus)} 
            label="AI Status" 
            color={getStatusColor(apiStatus)} 
          />
          <StatCard 
            icon="link-variant" 
            value={connectedPlatforms.toString()} 
            label="Platforms Connected" 
            color="#10B981" 
          />
          <StatCard 
            icon="message-reply-text" 
            value={todayMessages.toString()} 
            label="Messages Today" 
            color="#3B82F6" 
          />
        </View>

        {/* Hero / AIReplica Auto-Reply CTA */}
        <LinearGradient
          colors={["#6A0572", "#AB47BC"]}
          style={{ borderRadius: 20, padding: 24, marginBottom: 24 }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>
            🤖 Your AI Clone is Ready!
          </Text>
          <Text style={{ color: "#E1BEE7", fontSize: 16, marginBottom: 18, lineHeight: 22 }}>
            Auto-reply to messages, emails, and comments using your personal communication style across all platforms.
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => router.push("/ai-replica-dashboard")}
              style={{ 
                backgroundColor: "#fff", 
                paddingHorizontal: 24, 
                paddingVertical: 14, 
                borderRadius: 26, 
                marginRight: 12,
                flexDirection: "row",
                alignItems: "center"
              }}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="robot" size={20} color="#6A0572" style={{ marginRight: 8 }} />
              <Text style={{ color: "#6A0572", fontWeight: "700", fontSize: 16 }}>Auto-Reply Hub</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/clone")}
              style={{ 
                backgroundColor: "rgba(255,255,255,0.2)", 
                paddingHorizontal: 20, 
                paddingVertical: 14, 
                borderRadius: 26,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.3)"
              }}
              activeOpacity={0.9}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Test Clone</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Complete Feature Suite */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#222", marginBottom: 8 }}>
            Complete Feature Suite
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginBottom: 18 }}>
            Everything you need for intelligent communication automation
          </Text>
        </View>

        {/* Feature Cards */}
        {isLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6A0572" />
            <Text style={{ color: "#666", marginTop: 16 }}>Loading features...</Text>
          </View>
        ) : (
          features.map((f) => (
            <FeatureCard
              key={f.title}
              title={f.title}
              subtitle={f.subtitle}
              iconName={f.icon}
              onPress={() => router.push(f.route)}
              color={f.color}
              badge={f.badge}
            />
          ))
        )}

        {/* Tips Section */}
        <View style={{ 
          backgroundColor: "#FFF3CD", 
          borderRadius: 16, 
          padding: 18, 
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: "#F59E0B"
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <MaterialCommunityIcons name="lightbulb" size={20} color="#F59E0B" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#92400E", marginLeft: 8 }}>
              Pro Tip
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: "#92400E", lineHeight: 20 }}>
            Add 5+ sample replies in Training Center for a strong clone voice. Connect your most-used platforms first for maximum impact.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}