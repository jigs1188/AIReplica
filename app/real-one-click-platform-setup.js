import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Dimensions, 
  Platform, 
  TextInput, 
  KeyboardAvoidingView 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const isSmallScreen = width < 400;

export default function RealOneClickPlatformSetup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('overview'); // 'overview', 'credentials', 'training', 'connecting'
  const [currentPlatform, setCurrentPlatform] = useState(0);
  const [setupData, setSetupData] = useState({
    credentials: {},
    training: {
      personalityType: 'professional',
      responseStyle: 'helpful',
      customInstructions: ''
    }
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  const platforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: 'whatsapp',
      color: '#25D366',
      fields: [
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
        { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
        { key: 'businessAccountId', label: 'Business Account ID', type: 'text', required: true }
      ],
      instructions: 'Get these from Meta Developer Console → WhatsApp → Configuration'
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      icon: 'instagram',
      color: '#E1306C',
      fields: [
        { key: 'accessToken', label: 'Page Access Token', type: 'password', required: true },
        { key: 'pageId', label: 'Instagram Page ID', type: 'text', required: true }
      ],
      instructions: 'Connect through Facebook Developer Console → Instagram Basic Display'
    },
    {
      id: 'email',
      name: 'Gmail Assistant',
      icon: 'email',
      color: '#EA4335',
      fields: [
        { key: 'clientId', label: 'Gmail Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      instructions: 'Enable Gmail API in Google Cloud Console'
    }
  ];

  const startSetup = () => {
    Alert.alert(
      '🚀 Real Platform Setup',
      'This will collect your actual platform credentials and set up real integrations. We&apos;ll guide you through:\n\n✅ Platform credential collection\n✅ AI personality training\n✅ Real webhook setup\n✅ Connection testing\n\nReady to start?',
      [
        { text: 'Cancel' },
        { text: 'Let&apos;s Go!', onPress: () => setCurrentStep('credentials') }
      ]
    );
  };

  const handleCredentialNext = () => {
    const platform = platforms[currentPlatform];
    const credentials = setupData.credentials[platform.id] || {};
    
    // Validate required fields
    const missing = platform.fields.filter(f => f.required && !credentials[f.key]);
    if (missing.length > 0) {
      Alert.alert('Missing Fields', `Please fill: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    if (currentPlatform < platforms.length - 1) {
      setCurrentPlatform(currentPlatform + 1);
    } else {
      setCurrentStep('training');
    }
  };

  const handleTrainingComplete = async () => {
    setCurrentStep('connecting');
    setIsConnecting(true);

    try {
      // Connect each platform with real credentials
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        const credentials = setupData.credentials[platform.id];
        
        if (!credentials) continue;

        setConnectionStatus(prev => ({
          ...prev,
          [platform.id]: { status: 'connecting', message: 'Setting up...' }
        }));

        // Real API call to setup platform
        const result = await setupPlatformReal(platform, credentials, setupData.training);

        setConnectionStatus(prev => ({
          ...prev,
          [platform.id]: { 
            status: result.success ? 'connected' : 'failed',
            message: result.message 
          }
        }));

        // Save successful connections
        if (result.success) {
          await AsyncStorage.setItem(`platform_${platform.id}_config`, JSON.stringify({
            ...credentials,
            training: setupData.training,
            connectedAt: Date.now()
          }));
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      Alert.alert('🎉 Setup Complete!', 'All platforms connected with your AI personality!', [
        { text: 'View Dashboard', onPress: () => router.push('/ai-replica-dashboard') }
      ]);

    } catch (error) {
      Alert.alert('Setup Error', error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const setupPlatformReal = async (platform, credentials, training) => {
    try {
      // Real backend call with actual credentials
      const response = await fetch('http://localhost:3001/api/platform/setup-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.id,
          credentials,
          training,
          userId: 'user_123'
        })
      });

      if (response.ok) {
        return { success: true, message: `${platform.name} connected successfully` };
      } else {
        const error = await response.json();
        return { success: false, message: error.message || 'Connection failed' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Credential Collection Screen
  if (currentStep === 'credentials') {
    const platform = platforms[currentPlatform];
    
    return (
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Platform Credentials ({currentPlatform + 1}/{platforms.length})</Text>
        </View>

        <KeyboardAvoidingView style={styles.credentialScreen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.platformHeader}>
            <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
              <MaterialCommunityIcons name={platform.icon} size={40} color={platform.color} />
            </View>
            <Text style={styles.platformTitle}>{platform.name}</Text>
            <Text style={styles.platformInstructions}>{platform.instructions}</Text>
          </View>

          <ScrollView style={styles.credentialForm}>
            {platform.fields.map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {field.label} {field.required && <Text style={styles.required}>*</Text>}
                </Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry={field.type === 'password'}
                  value={setupData.credentials[platform.id]?.[field.key] || ''}
                  onChangeText={(value) => {
                    setSetupData(prev => ({
                      ...prev,
                      credentials: {
                        ...prev.credentials,
                        [platform.id]: {
                          ...prev.credentials[platform.id],
                          [field.key]: value
                        }
                      }
                    }));
                  }}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.skipButton} onPress={handleCredentialNext}>
              <Text style={styles.skipText}>Skip Platform</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.nextButton, { backgroundColor: platform.color }]} 
              onPress={handleCredentialNext}
            >
              <Text style={styles.nextText}>
                {currentPlatform < platforms.length - 1 ? 'Next Platform' : 'Setup AI Training'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // AI Training Screen
  if (currentStep === 'training') {
    return (
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentStep('credentials')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerText}>AI Training</Text>
        </View>

        <ScrollView style={styles.trainingScreen}>
          <View style={styles.trainingHeader}>
            <MaterialCommunityIcons name="brain" size={60} color="#FFFFFF" />
            <Text style={styles.trainingTitle}>Train Your AI Personality</Text>
            <Text style={styles.trainingSubtitle}>Configure how your AI responds across all platforms</Text>
          </View>

          <View style={styles.trainingForm}>
            <Text style={styles.sectionLabel}>Personality Type</Text>
            <View style={styles.optionGrid}>
              {['professional', 'friendly', 'casual', 'formal'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.option,
                    setupData.training.personalityType === type && styles.selectedOption
                  ]}
                  onPress={() => setSetupData(prev => ({
                    ...prev,
                    training: { ...prev.training, personalityType: type }
                  }))}
                >
                  <Text style={styles.optionText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Response Style</Text>
            <View style={styles.optionGrid}>
              {['helpful', 'concise', 'detailed', 'creative'].map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.option,
                    setupData.training.responseStyle === style && styles.selectedOption
                  ]}
                  onPress={() => setSetupData(prev => ({
                    ...prev,
                    training: { ...prev.training, responseStyle: style }
                  }))}
                >
                  <Text style={styles.optionText}>{style.charAt(0).toUpperCase() + style.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Custom Instructions</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Add specific instructions for your AI behavior..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={setupData.training.customInstructions}
              onChangeText={(value) => setSetupData(prev => ({
                ...prev,
                training: { ...prev.training, customInstructions: value }
              }))}
            />

            <TouchableOpacity style={styles.connectButton} onPress={handleTrainingComplete}>
              <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFFFFF" />
              <Text style={styles.connectText}>Connect All Platforms</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Connection Progress Screen
  if (currentStep === 'connecting') {
    return (
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="rocket-launch" size={28} color="#FFFFFF" />
          <Text style={styles.headerText}>Connecting Platforms</Text>
        </View>

        <ScrollView style={styles.connectingScreen}>
          <View style={styles.connectingHeader}>
            <Text style={styles.connectingTitle}>🚀 Setting Up Real Connections</Text>
            <Text style={styles.connectingSubtitle}>
              Using your credentials to establish live platform integrations...
            </Text>
          </View>

          {platforms.map((platform) => {
            const status = connectionStatus[platform.id];
            const hasCredentials = setupData.credentials[platform.id];
            
            if (!hasCredentials) return null;

            return (
              <View key={platform.id} style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: platform.color + '20' }]}>
                    <MaterialCommunityIcons name={platform.icon} size={24} color={platform.color} />
                  </View>
                  <Text style={styles.statusName}>{platform.name}</Text>
                  <View style={styles.statusIndicator}>
                    {status?.status === 'connecting' && <ActivityIndicator size="small" color={platform.color} />}
                    {status?.status === 'connected' && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                    {status?.status === 'failed' && <Ionicons name="close-circle" size={24} color="#EF4444" />}
                  </View>
                </View>
                {status?.message && (
                  <Text style={styles.statusMessage}>{status.message}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>
    );
  }

  // Main Overview Screen
  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="link-variant" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>Real Platform Setup</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Smart Platform Connection</Text>
          <Text style={styles.sectionSubtitle}>
            Connect all your platforms with real credentials and train your AI personality. 
            This creates genuine integrations, not demos.
          </Text>
          
          <TouchableOpacity style={styles.startButton} onPress={startSetup}>
            <MaterialCommunityIcons name="rocket-launch" size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Real Setup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Platforms We&apos;ll Connect</Text>
          {platforms.map((platform) => (
            <View key={platform.id} style={styles.platformCard}>
              <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                <MaterialCommunityIcons name={platform.icon} size={24} color={platform.color} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{platform.name}</Text>
                <Text style={styles.platformDesc}>{platform.fields.length} credentials required</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ What You&apos;ll Get</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Real API connections with your credentials</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Custom AI personality training</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Live webhook setup and testing</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>24/7 automated responses</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  backButton: { padding: 8, marginRight: 8 },
  headerText: {
    color: "#FFFFFF",
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: "#E1BEE7",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 4,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  platformCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  platformInfo: { flex: 1 },
  platformName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  platformDesc: {
    fontSize: 12,
    color: "#6B7280",
  },
  benefitsList: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  
  // Credential Screen Styles
  credentialScreen: { flex: 1, padding: 16 },
  platformHeader: { alignItems: "center", marginBottom: 24 },
  platformTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  platformInstructions: {
    color: "#E1BEE7",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  credentialForm: { flex: 1 },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: { color: "#EF4444" },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
  },
  skipText: { color: "#FFFFFF", fontWeight: "600" },
  nextButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  nextText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  
  // Training Screen Styles
  trainingScreen: { flex: 1, padding: 16 },
  trainingHeader: { alignItems: "center", marginBottom: 32 },
  trainingTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  trainingSubtitle: {
    color: "#E1BEE7",
    fontSize: 16,
    textAlign: "center",
  },
  trainingForm: { flex: 1 },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  option: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  selectedOption: { backgroundColor: "#10B981" },
  optionText: { color: "#FFFFFF", fontWeight: "600" },
  customInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 24,
    textAlignVertical: "top",
  },
  connectButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  connectText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  
  // Connection Screen Styles
  connectingScreen: { flex: 1, padding: 16 },
  connectingHeader: { alignItems: "center", marginBottom: 24 },
  connectingTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  connectingSubtitle: {
    color: "#E1BEE7",
    fontSize: 14,
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusIndicator: { width: 24, height: 24 },
  statusMessage: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 8,
  },
});
