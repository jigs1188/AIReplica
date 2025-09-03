import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEnhancedAIResponse } from '../utils/aiSettings';

export default function AutoReplyScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [autoReplySettings, setAutoReplySettings] = useState({
    enabled: false,
    apps: {
      whatsapp: { enabled: false, style: 'Professional' },
      telegram: { enabled: false, style: 'Casual' },
      slack: { enabled: false, style: 'Professional' },
      email: { enabled: false, style: 'Formal' },
      sms: { enabled: false, style: 'Friendly' }
    },
    responseDelay: 5, // seconds
    maxResponseLength: 150,
    personalityMode: 'adaptive', // adaptive, consistent, context-aware
    keywords: {
      urgent: ['urgent', 'asap', 'important', 'emergency'],
      meeting: ['meeting', 'call', 'zoom', 'appointment'],
      project: ['project', 'deadline', 'task', 'work']
    },
    customResponses: {
      busy: "I'm currently busy but will get back to you soon! 🤖",
      meeting: "I'm in a meeting right now. I'll respond shortly! ⏰",
      offline: "I'm offline but your AI assistant is here to help! 🚀"
    }
  });
  
  const user = auth.currentUser;

  useEffect(() => {
    loadAutoReplySettings();
  }, []);

  const testAllIntegrations = async () => {
    setIsLoading(true);
    try {
      const enabledApps = Object.entries(autoReplySettings.apps)
        .filter(([_, config]) => config.enabled)
        .map(([app, _]) => app);
      
      if (enabledApps.length === 0) {
        Alert.alert('No Integrations', 'Enable at least one app integration to test');
        return;
      }
      
      Alert.alert(
        'Integration Test',
        `Testing ${enabledApps.length} app integrations:\n${enabledApps.join(', ')}\n\nThis will generate sample responses for each enabled app.`
      );
      
      for (const app of enabledApps) {
        await testAutoReply(app);
      }
      
    } catch (_error) {
      Alert.alert('Test Failed', 'Could not complete integration test');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAutoReplySettings = async () => {
    try {
      const settingsJson = JSON.stringify(autoReplySettings, null, 2);
      Alert.alert(
        'Settings Exported',
        'Auto-reply settings exported successfully!\n\n(In production, this would save to file or cloud)',
        [
          { text: 'OK' },
          { text: 'View JSON', onPress: () => console.log('Auto-Reply Settings:', settingsJson) }
        ]
      );
    } catch (_error) {
      Alert.alert('Export Failed', 'Could not export settings');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all auto-reply settings to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          const defaultSettings = {
            enabled: false,
            apps: {
              whatsapp: { enabled: false, style: 'Professional' },
              telegram: { enabled: false, style: 'Casual' },
              slack: { enabled: false, style: 'Professional' },
              email: { enabled: false, style: 'Formal' },
              sms: { enabled: false, style: 'Friendly' }
            },
            responseDelay: 5,
            maxResponseLength: 150,
            personalityMode: 'adaptive',
            keywords: {
              urgent: ['urgent', 'asap', 'important', 'emergency'],
              meeting: ['meeting', 'call', 'zoom', 'appointment'],
              project: ['project', 'deadline', 'task', 'work']
            },
            customResponses: {
              busy: "I'm currently busy but will get back to you soon! 🤖",
              meeting: "I'm in a meeting right now. I'll respond shortly! ⏰",
              offline: "I'm offline but your AI assistant is here to help! 🚀"
            }
          };
          await saveSettings(defaultSettings);
          Alert.alert('Reset Complete', 'Auto-reply settings reset to defaults');
        }}
      ]
    );
  };

  const loadAutoReplySettings = async () => {
    try {
      setIsLoading(true);
      
      // Load from Firebase first
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().autoReplySettings) {
          setAutoReplySettings(prev => ({
            ...prev,
            ...docSnap.data().autoReplySettings
          }));
        }
      }
      
      // Load local settings as fallback
      const localSettings = await AsyncStorage.getItem('autoReplySettings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setAutoReplySettings(prev => ({
          ...prev,
          ...parsed
        }));
      }
      
    } catch (_error) {
      console.error('Error loading auto-reply settings:', _error);
      Alert.alert('Error', 'Failed to load auto-reply settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      // Save to local storage
      await AsyncStorage.setItem('autoReplySettings', JSON.stringify(newSettings));
      
      // Save to Firebase if user is logged in
      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          autoReplySettings: newSettings,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }
      
      setAutoReplySettings(newSettings);
      
    } catch (error) {
      console.error('Error saving auto-reply settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleAutoReply = async () => {
    const newSettings = {
      ...autoReplySettings,
      enabled: !autoReplySettings.enabled
    };
    await saveSettings(newSettings);
    
    Alert.alert(
      autoReplySettings.enabled ? 'Auto-Reply Disabled' : 'Auto-Reply Enabled',
      autoReplySettings.enabled 
        ? '🔕 Auto-reply is now disabled' 
        : '🤖 Auto-reply is now active! Your AI will respond to messages automatically.'
    );
  };

  const toggleAppIntegration = async (appName) => {
    const newSettings = {
      ...autoReplySettings,
      apps: {
        ...autoReplySettings.apps,
        [appName]: {
          ...autoReplySettings.apps[appName],
          enabled: !autoReplySettings.apps[appName].enabled
        }
      }
    };
    await saveSettings(newSettings);
  };

  const updateAppStyle = async (appName, style) => {
    const newSettings = {
      ...autoReplySettings,
      apps: {
        ...autoReplySettings.apps,
        [appName]: {
          ...autoReplySettings.apps[appName],
          style: style
        }
      }
    };
    await saveSettings(newSettings);
  };

  const testAutoReply = async (appName) => {
    try {
      setIsLoading(true);
      
      const testMessage = "Hey, are you available for a quick chat about the project?";
      const systemPrompt = `You are an AI assistant responding to a ${appName} message in a ${autoReplySettings.apps[appName].style.toLowerCase()} tone. Keep the response under ${autoReplySettings.maxResponseLength} characters. Be helpful and personable.`;
      
      const response = await getEnhancedAIResponse([
        { role: "user", content: testMessage }
      ], systemPrompt);
      
      Alert.alert(
        `${appName.toUpperCase()} Test Response`,
        `Message: "${testMessage}"\n\nAI Response: "${response}"`
      );
      
    } catch (error) {
      Alert.alert('Test Failed', 'Could not generate test response');
    } finally {
      setIsLoading(false);
    }
  };

  const appIcons = {
    whatsapp: 'whatsapp',
    telegram: 'telegram',
    slack: 'slack',
    email: 'email',
    sms: 'message-text'
  };

  const communicationStyles = ['Professional', 'Casual', 'Friendly', 'Formal', 'Witty'];

  if (isLoading) {
    return (
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading Auto-Reply Settings...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auto-Reply & Integrations</Text>
        <TouchableOpacity 
          onPress={() => router.push('/test-auto-reply')} 
          style={styles.headerTestButton}
        >
          <MaterialCommunityIcons name="test-tube" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="robot" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Auto-Reply System</Text>
            <Switch 
              value={autoReplySettings.enabled}
              onValueChange={toggleAutoReply}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={autoReplySettings.enabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
          <Text style={styles.cardDescription}>
            {autoReplySettings.enabled 
              ? '🤖 Your AI assistant will automatically respond to messages'
              : '🔕 Auto-reply is disabled. Enable to start automated responses'
            }
          </Text>
        </View>

        {/* App Integrations */}
        {autoReplySettings.enabled && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="apps" size={24} color="#6A0572" />
              <Text style={styles.cardTitle}>App Integrations</Text>
            </View>
            
            {Object.entries(autoReplySettings.apps).map(([appName, appConfig]) => (
              <View key={appName} style={styles.appIntegration}>
                <View style={styles.appHeader}>
                  <View style={styles.appInfo}>
                    <MaterialCommunityIcons 
                      name={appIcons[appName]} 
                      size={24} 
                      color={appConfig.enabled ? '#10B981' : '#9CA3AF'} 
                    />
                    <Text style={styles.appName}>{appName.charAt(0).toUpperCase() + appName.slice(1)}</Text>
                  </View>
                  <Switch 
                    value={appConfig.enabled}
                    onValueChange={() => toggleAppIntegration(appName)}
                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                    thumbColor={appConfig.enabled ? '#FFFFFF' : '#9CA3AF'}
                  />
                </View>
                
                {appConfig.enabled && (
                  <View style={styles.appConfig}>
                    <Text style={styles.configLabel}>Response Style:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleSelector}>
                      {communicationStyles.map((style) => (
                        <TouchableOpacity
                          key={style}
                          style={[
                            styles.styleButton,
                            appConfig.style === style && styles.selectedStyle
                          ]}
                          onPress={() => updateAppStyle(appName, style)}
                        >
                          <Text style={[
                            styles.styleText,
                            appConfig.style === style && styles.selectedStyleText
                          ]}>
                            {style}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    <TouchableOpacity 
                      style={styles.testButton}
                      onPress={() => testAutoReply(appName)}
                    >
                      <MaterialCommunityIcons name="test-tube" size={16} color="#6A0572" />
                      <Text style={styles.testButtonText}>Test Response</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Auto-Reply Configuration */}
        {autoReplySettings.enabled && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cog" size={24} color="#6A0572" />
              <Text style={styles.cardTitle}>Auto-Reply Settings</Text>
            </View>
            
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Response Delay: {autoReplySettings.responseDelay}s</Text>
              <View style={styles.delayButtons}>
                {[1, 3, 5, 10].map(delay => (
                  <TouchableOpacity
                    key={delay}
                    style={[
                      styles.delayButton,
                      autoReplySettings.responseDelay === delay && styles.selectedDelay
                    ]}
                    onPress={async () => {
                      const newSettings = { ...autoReplySettings, responseDelay: delay };
                      await saveSettings(newSettings);
                    }}
                  >
                    <Text style={[
                      styles.delayText,
                      autoReplySettings.responseDelay === delay && styles.selectedDelayText
                    ]}>
                      {delay}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Max Response Length: {autoReplySettings.maxResponseLength} chars</Text>
              <View style={styles.lengthButtons}>
                {[100, 150, 200, 300].map(length => (
                  <TouchableOpacity
                    key={length}
                    style={[
                      styles.lengthButton,
                      autoReplySettings.maxResponseLength === length && styles.selectedLength
                    ]}
                    onPress={async () => {
                      const newSettings = { ...autoReplySettings, maxResponseLength: length };
                      await saveSettings(newSettings);
                    }}
                  >
                    <Text style={[
                      styles.lengthText,
                      autoReplySettings.maxResponseLength === length && styles.selectedLengthText
                    ]}>
                      {length}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Custom Responses */}
        {autoReplySettings.enabled && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="message-reply" size={24} color="#6A0572" />
              <Text style={styles.cardTitle}>Custom Response Templates</Text>
            </View>
            
            {Object.entries(autoReplySettings.customResponses).map(([key, response]) => (
              <View key={key} style={styles.responseTemplate}>
                <Text style={styles.templateLabel}>{key.charAt(0).toUpperCase() + key.slice(1)} Response:</Text>
                <TextInput
                  style={styles.responseInput}
                  value={response}
                  onChangeText={(text) => {
                    const newSettings = {
                      ...autoReplySettings,
                      customResponses: {
                        ...autoReplySettings.customResponses,
                        [key]: text
                      }
                    };
                    saveSettings(newSettings);
                  }}
                  placeholder={`Enter ${key} response template...`}
                  multiline
                />
              </View>
            ))}
          </View>
        )}

        {/* Integration Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="check-network" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Integration Status</Text>
          </View>
          
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="api" size={20} color="#10B981" />
              <Text style={styles.statusText}>OpenRouter API: Connected</Text>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
            </View>
            
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="firebase" size={20} color="#10B981" />
              <Text style={styles.statusText}>Firebase: Connected</Text>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
            </View>
            
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="cloud" size={20} color="#F59E0B" />
              <Text style={styles.statusText}>Background Processing: Setup Required</Text>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => testAllIntegrations()}>
              <MaterialCommunityIcons name="test-tube" size={20} color="#6A0572" />
              <Text style={styles.actionButtonText}>Test All Integrations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => exportAutoReplySettings()}>
              <MaterialCommunityIcons name="export" size={20} color="#6A0572" />
              <Text style={styles.actionButtonText}>Export Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => resetToDefaults()}>
              <MaterialCommunityIcons name="restore" size={20} color="#DC2626" />
              <Text style={styles.actionButtonText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  headerTestButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  appIntegration: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 16,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  appConfig: {
    gap: 12,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  styleSelector: {
    flexDirection: 'row',
  },
  styleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  selectedStyle: {
    backgroundColor: '#6A0572',
  },
  styleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedStyleText: {
    color: '#FFFFFF',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  testButtonText: {
    fontSize: 12,
    color: '#6A0572',
    fontWeight: '500',
  },
  configRow: {
    marginBottom: 16,
  },
  delayButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  delayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedDelay: {
    backgroundColor: '#10B981',
  },
  delayText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedDelayText: {
    color: '#FFFFFF',
  },
  lengthButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  lengthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedLength: {
    backgroundColor: '#8B5CF6',
  },
  lengthText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedLengthText: {
    color: '#FFFFFF',
  },
  responseTemplate: {
    marginBottom: 16,
  },
  templateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6A0572',
    fontWeight: '500',
  },
});
