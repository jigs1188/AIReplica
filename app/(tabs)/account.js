import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, Switch, Share } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  syncSettingsToCloud, 
  restoreSettingsFromCloud, 
  exportUserSettings, 
  importUserSettings, 
  resetToDefaultSettings 
} from '../../utils/aiSettings';

export default function AccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('Professional');
  const [isLoading, setIsLoading] = useState(false);
  
  // New integration settings
  const [autoSaveMessages, setAutoSaveMessages] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [preferredModel, setPreferredModel] = useState('deepseek/deepseek-chat');
  const [maxTokens, setMaxTokens] = useState('1000');
  const [temperature, setTemperature] = useState('0.7');

  const user = auth.currentUser;
  const router = useRouter();

  const communicationStyles = ['Casual', 'Professional', 'Friendly', 'Formal'];
  const availableModels = [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3.1 (Free)', description: 'Fast and intelligent' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'OpenAI model' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Anthropic model' }
  ];

  const fetchAccountData = async () => {
    if (user) {
      setEmail(user.email || '');
      
      // Load from Firebase
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || '');
        setBio(data.bio || '');
        setCommunicationStyle(data.communicationStyle || 'Professional');
        setPreferredModel(data.preferredModel || 'deepseek/deepseek-chat');
        setMaxTokens(data.maxTokens || '1000');
        setTemperature(data.temperature || '0.7');
      }
      
      // Load local settings
      try {
        const localSettings = await AsyncStorage.getItem('appSettings');
        if (localSettings) {
          const settings = JSON.parse(localSettings);
          setAutoSaveMessages(settings.autoSaveMessages ?? true);
          setEnableNotifications(settings.enableNotifications ?? true);
        }
      } catch (error) {
        console.log('Error loading local settings:', error);
      }
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to save account settings.");
      return;
    }

    setIsLoading(true);
    try {
      // Save to Firebase
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        bio: bio.trim(),
        communicationStyle,
        preferredModel,
        maxTokens: parseInt(maxTokens) || 1000,
        temperature: parseFloat(temperature) || 0.7,
        updatedAt: new Date(),
      }, { merge: true });

      // Save local settings
      const localSettings = {
        autoSaveMessages,
        enableNotifications,
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(localSettings));

      Alert.alert("Success", "✅ Account settings saved successfully!");
    } catch (error) {
      console.error("Error saving account data:", error);
      Alert.alert("Error", "❌ Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Advanced Integration Handlers
  const handleSyncToCloud = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await syncSettingsToCloud(user.uid);
      Alert.alert(
        result.success ? "Success" : "Error",
        result.success ? "☁️ Settings synced to cloud!" : "❌ " + result.message
      );
    } catch (error) {
      Alert.alert("Error", "❌ Failed to sync settings to cloud");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!user) return;
    
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
              // Refresh the UI with restored settings
              await fetchAccountData();
              Alert.alert("Success", "☁️ Settings restored from cloud!");
            } else {
              Alert.alert("Info", "📱 " + result.message);
            }
          } catch (error) {
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
    } catch (error) {
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
              // Refresh the UI with default settings
              await fetchAccountData();
              Alert.alert("Success", "🔄 Settings reset to defaults!");
            } else {
              Alert.alert("Error", "❌ " + result.message);
            }
          } catch (error) {
            Alert.alert("Error", "❌ Failed to reset settings");
          } finally {
            setIsLoading(false);
          }
        }}
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => {
          auth.signOut();
          router.replace("/SplashScreen");
        }}
      ]
    );
  };

  const StyleButton = ({ title, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.styleButton, isSelected && styles.selectedStyleButton]}
      onPress={onPress}
    >
      <Text style={[styles.styleButtonText, isSelected && styles.selectedStyleButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-circle" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>My Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="email" size={20} color="#6A0572" />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9CA3AF"
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>
        </View>

        {/* AI Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Preferences</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Communication Style</Text>
            <View style={styles.buttonContainer}>
              {communicationStyles.map((style) => (
                <StyleButton
                  key={style}
                  title={style}
                  isSelected={communicationStyle === style}
                  onPress={() => setCommunicationStyle(style)}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>AI Model</Text>
            <View style={styles.modelSelector}>
              {availableModels.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[styles.modelOption, preferredModel === model.id && styles.selectedModel]}
                  onPress={() => setPreferredModel(model.id)}
                >
                  <Text style={[styles.modelName, preferredModel === model.id && styles.selectedModelText]}>
                    {model.name}
                  </Text>
                  <Text style={[styles.modelDescription, preferredModel === model.id && styles.selectedModelDescription]}>
                    {model.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sliderGroup}>
            <View style={styles.sliderItem}>
              <Text style={styles.label}>Max Tokens: {maxTokens}</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity onPress={() => setMaxTokens(Math.max(100, parseInt(maxTokens) - 100).toString())}>
                  <Text style={styles.sliderButton}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.sliderInput}
                  value={maxTokens}
                  onChangeText={setMaxTokens}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={() => setMaxTokens(Math.min(4000, parseInt(maxTokens) + 100).toString())}>
                  <Text style={styles.sliderButton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sliderItem}>
              <Text style={styles.label}>Temperature: {temperature}</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity onPress={() => setTemperature(Math.max(0, parseFloat(temperature) - 0.1).toFixed(1))}>
                  <Text style={styles.sliderButton}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.sliderInput}
                  value={temperature}
                  onChangeText={setTemperature}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={() => setTemperature(Math.min(2, parseFloat(temperature) + 0.1).toFixed(1))}>
                  <Text style={styles.sliderButton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-save Messages</Text>
              <Text style={styles.settingDescription}>Automatically save chat history</Text>
            </View>
            <Switch
              value={autoSaveMessages}
              onValueChange={setAutoSaveMessages}
              trackColor={{ false: '#767577', true: '#AB47BC' }}
              thumbColor={autoSaveMessages ? '#6A0572' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Get notified of important updates</Text>
            </View>
            <Switch
              value={enableNotifications}
              onValueChange={setEnableNotifications}
              trackColor={{ false: '#767577', true: '#AB47BC' }}
              thumbColor={enableNotifications ? '#6A0572' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Advanced Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Integration</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSyncToCloud}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="cloud-upload" size={24} color="#6A0572" />
            <Text style={styles.actionButtonText}>Sync Settings to Cloud</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRestoreFromCloud}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="cloud-download" size={24} color="#6A0572" />
            <Text style={styles.actionButtonText}>Restore from Cloud</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportSettings}
          >
            <MaterialCommunityIcons name="export" size={24} color="#6A0572" />
            <Text style={styles.actionButtonText}>Export Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FEF2F2' }]}
            onPress={handleResetSettings}
          >
            <MaterialCommunityIcons name="restore" size={24} color="#DC2626" />
            <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Reset to Defaults</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/ai-personality')}
          >
            <MaterialCommunityIcons name="robot" size={24} color="#6A0572" />
            <Text style={styles.actionButtonText}>Customize AI Personality</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/settings')}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#6A0572" />
            <Text style={styles.actionButtonText}>App Settings & Integrations</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

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
    paddingTop: 50,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
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
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    flex: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedStyleButton: {
    backgroundColor: "#FFFFFF",
  },
  styleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedStyleButtonText: {
    color: "#6A0572",
    fontWeight: "bold",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6A0572",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  logoutText: {
    color: "#FF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  modelSelector: {
    gap: 8,
  },
  modelOption: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedModel: {
    borderColor: "#6A0572",
    backgroundColor: "#FFFFFF",
  },
  modelName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  selectedModelText: {
    color: "#6A0572",
  },
  modelDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  selectedModelDescription: {
    color: "#AB47BC",
  },
  sliderGroup: {
    gap: 16,
  },
  sliderItem: {
    gap: 8,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 4,
  },
  sliderButton: {
    backgroundColor: "#6A0572",
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    width: 40,
    height: 40,
    lineHeight: 40,
    borderRadius: 6,
  },
  sliderInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
