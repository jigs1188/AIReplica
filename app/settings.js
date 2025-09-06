import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth } from "../firebase";
import { 
  getUserSettings, 
  saveUserSettings, 
  syncSettingsToCloud, 
  restoreSettingsFromCloud, 
  exportUserSettings, 
  resetToDefaultSettings 
} from "../utils/aiSettings";

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [autoReply, setAutoReply] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('unknown');
  
  const user = auth.currentUser;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getUserSettings();
      setNotifications(settings.notifications ?? true);
      setAutoReply(settings.autoSave ?? false);
      // Load sync status
      setSyncStatus(user ? 'available' : 'signed-out');
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const handleSyncToCloud = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to sync settings to cloud.");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await syncSettingsToCloud(user.uid);
      Alert.alert(
        result.success ? "Success" : "Error",
        result.success ? "☁️ Settings synced to cloud!" : "❌ " + result.message
      );
      setSyncStatus('synced');
    } catch (_error) {
      Alert.alert("Error", "❌ Failed to sync settings to cloud");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to restore settings from cloud.");
      return;
    }
    
    Alert.alert(
      "Restore Settings",
      "This will replace your current settings with cloud backup. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Restore", style: "default", onPress: async () => {
          setIsLoading(true);
          try {
            const result = await restoreSettingsFromCloud(user.uid);
            if (result.success) {
              await loadSettings();
              Alert.alert("Success", "☁️ Settings restored from cloud!");
              setSyncStatus('synced');
            } else {
              Alert.alert("Info", "📱 " + result.message);
            }
          } catch (_error) {
            Alert.alert("Error", "❌ Failed to restore settings from cloud");
          } finally {
            setIsLoading(false);
          }
        }}
      ]
    );
  };

  const handleExportSettings = async () => {
    try {
      const result = await exportUserSettings();
      if (result.success) {
        const exportString = JSON.stringify(result.data, null, 2);
        await Share.share({
          message: `AI Replica Settings Export\n\n${exportString}`,
          title: 'AI Replica Settings Export'
        });
      } else {
        Alert.alert("Error", "❌ Failed to export settings");
      }
    } catch (_error) {
      Alert.alert("Error", "❌ Failed to export settings");
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "This will reset all settings to defaults. This cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: async () => {
          setIsLoading(true);
          try {
            const result = await resetToDefaultSettings();
            if (result.success) {
              await loadSettings();
              Alert.alert("Success", "🔄 Settings reset to defaults!");
              setSyncStatus('reset');
            } else {
              Alert.alert("Error", "❌ " + result.message);
            }
          } catch (_error) {
            Alert.alert("Error", "❌ Failed to reset settings");
          } finally {
            setIsLoading(false);
          }
        }}
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, hasSwitch, switchValue, onSwitchChange }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons name={icon} size={24} color="#6A0572" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          thumbColor="#6A0572"
          trackColor={{ false: "#767577", true: "#AB47BC" }}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => router.replace("/SplashScreen") }
      ]
    );
  };

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="cog" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            icon="account-circle"
            title="Profile"
            subtitle="Manage your account details"
            onPress={() => Alert.alert("Profile", "Coming soon!")}
          />
          <SettingItem
            icon="key-variant"
            title="API Keys"
            subtitle="Manage OpenAI, DeepSeek keys"
            onPress={() => Alert.alert("API Keys", "Coming soon!")}
          />
        </View>

        {/* AI Personality Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Personality</Text>
          <SettingItem
            icon="robot"
            title="AI Personality"
            subtitle="Configure how your AI clone behaves"
            onPress={() => router.push("/ai-personality")}
          />
          <SettingItem
            icon="message-text"
            title="Communication Style"
            subtitle="Set formal, casual, or friendly tone"
            onPress={() => Alert.alert("Communication Style", "Professional, Casual, Friendly, or Custom")}
          />
          <SettingItem
            icon="brain"
            title="Response Preferences"
            subtitle="Length, detail level, and behavior"
            onPress={() => Alert.alert("Response Preferences", "Configure response length and behavior")}
          />
        </View>

        {/* AI Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>
          <SettingItem
            icon="brain"
            title="AI Personality"
            subtitle="Configure your clone's personality and style"
            onPress={() => router.push("/ai-personality")}
          />
          <SettingItem
            icon="script-text"
            title="Prompt Templates"
            subtitle="Manage quick response templates"
            onPress={() => router.push("/prompts")}
          />
          <SettingItem
            icon="school"
            title="Training Center"
            subtitle="Teach your clone with examples"
            onPress={() => router.push("/training")}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingItem
            icon="bell"
            title="Notifications"
            subtitle="Get notified of new messages"
            hasSwitch={true}
            switchValue={notifications}
            onSwitchChange={setNotifications}
          />
          <SettingItem
            icon="reply"
            title="Auto Reply"
            subtitle="Let clone auto-respond"
            hasSwitch={true}
            switchValue={autoReply}
            onSwitchChange={setAutoReply}
          />
          <SettingItem
            icon="theme-light-dark"
            title="Dark Mode"
            subtitle="Switch between light and dark themes"
            hasSwitch={true}
            switchValue={darkMode}
            onSwitchChange={setDarkMode}
          />
        </View>

        {/* Integrations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integrations</Text>
          <SettingItem
            icon="gmail"
            title="Gmail"
            subtitle="Connect your Gmail account"
            onPress={() => Alert.alert("Gmail", "Gmail integration coming soon! This will allow your clone to draft and respond to emails.")}
          />
          <SettingItem
            icon="whatsapp"
            title="WhatsApp"
            subtitle="Connect WhatsApp Business API"
            onPress={() => Alert.alert("WhatsApp", "WhatsApp integration coming soon! Auto-respond to messages with your clone.")}
          />
          <SettingItem
            icon="microsoft-teams"
            title="Microsoft Teams"
            subtitle="Connect Teams for meetings"
            onPress={() => Alert.alert("Teams", "Teams integration coming soon! Your clone will attend meetings and take notes.")}
          />
          <SettingItem
            icon="slack"
            title="Slack"
            subtitle="Connect Slack workspace"
            onPress={() => Alert.alert("Slack", "Slack integration coming soon! Your clone will help manage Slack conversations.")}
          />
          <SettingItem
            icon="twitter"
            title="Twitter/X"
            subtitle="Connect your Twitter account"
            onPress={() => Alert.alert("Twitter", "Twitter integration coming soon! Your clone will help manage your social media presence.")}
          />
          <SettingItem
            icon="linkedin"
            title="LinkedIn"
            subtitle="Connect LinkedIn for professional networking"
            onPress={() => Alert.alert("LinkedIn", "LinkedIn integration coming soon! Professional networking with your AI clone.")}
          />
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Settings</Text>
          <SettingItem
            icon="view-dashboard"
            title="Integration Dashboard"
            subtitle="Comprehensive settings & status overview"
            onPress={() => router.push('/ai-replica-dashboard')}
          />
          <SettingItem
            icon="cloud-sync"
            title="Sync to Cloud"
            subtitle={user ? "Backup settings to cloud" : "Sign in required"}
            onPress={handleSyncToCloud}
          />
          <SettingItem
            icon="cloud-download"
            title="Restore from Cloud"
            subtitle={user ? "Restore settings from cloud" : "Sign in required"}
            onPress={handleRestoreFromCloud}
          />
          <SettingItem
            icon="export"
            title="Export Settings"
            subtitle="Share your settings configuration"
            onPress={handleExportSettings}
          />
          <SettingItem
            icon="restore"
            title="Reset to Defaults"
            subtitle="⚠️ Reset all settings to factory defaults"
            onPress={handleResetSettings}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help using AIReplica"
            onPress={() => Alert.alert("Help", "Contact: support@aireplica.com")}
          />
          <SettingItem
            icon="information"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert("About", "AIReplica v1.0.0\nYour Personal Digital Clone")}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FF4444",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
