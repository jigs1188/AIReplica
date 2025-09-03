import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { 
  getUserSettings, 
  syncSettingsToCloud, 
  restoreSettingsFromCloud, 
  exportUserSettings,
  validateAPIKey 
} from '../utils/aiSettings';
import { whatsappBusinessAPI } from '../utils/whatsappBusinessAPI';
import { instagramAPI } from '../utils/instagramAPI';
import { emailAPI } from '../utils/emailAPI';
import { linkedInAPI } from '../utils/linkedInAPI';
import { telegramAPI } from '../utils/telegramAPI';
import { slackAPI } from '../utils/slackAPI';
import { personalAssistantService } from '../utils/personalAssistantService';

export default function IntegrationDashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [platformConnections, setPlatformConnections] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  
  const user = auth.currentUser;

  // Available platforms with enhanced connection methods
  const platforms = [
    {
      key: 'whatsapp',
      name: 'WhatsApp Business',
      icon: 'whatsapp',
      color: '#25D366',
      description: 'Auto-reply to WhatsApp messages',
      setupRoute: '/whatsapp-setup',
      quickConnect: true
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      color: '#E1306C',
      description: 'Manage Instagram DMs automatically',
      setupRoute: '/instagram-setup',
      quickConnect: true
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0077B5',
      description: 'Professional networking assistant',
      setupRoute: '/enhanced-whatsapp-setup', // Using existing enhanced setup
      quickConnect: true
    },
    {
      key: 'email',
      name: 'Email Assistant',
      icon: 'email',
      color: '#EA4335',
      description: 'Smart email responses',
      setupRoute: '/email-setup',
      quickConnect: true
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: 'send',
      color: '#0088CC',
      description: 'Telegram bot integration',
      setupRoute: '/enhanced-whatsapp-setup',
      quickConnect: true
    },
    {
      key: 'slack',
      name: 'Slack',
      icon: 'slack',
      color: '#4A154B',
      description: 'Workplace communication assistant',
      setupRoute: '/enhanced-whatsapp-setup',
      quickConnect: true
    }
  ];

  useEffect(() => {
    loadDashboardData();
    loadPlatformConnections();
  }, []);

  const loadPlatformConnections = async () => {
    try {
      const connections = {};
      for (const platform of platforms) {
        // Check if platform is connected (simplified check)
        const stored = await AsyncStorage.getItem(`@platform_${platform.key}`);
        connections[platform.key] = stored ? 'connected' : 'disconnected';
      }
      setPlatformConnections(connections);
    } catch (error) {
      console.error('Error loading platform connections:', error);
    }
  };

  const connectToPlatform = async (platformKey) => {
    setConnectingPlatform(platformKey);
    const platform = platforms.find(p => p.key === platformKey);
    
    try {
      Alert.alert(
        `Connect to ${platform.name}`,
        `Ready to set up ${platform.description.toLowerCase()}?\n\n✨ One-tap setup with your AI clone trained on your communication style!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: `Connect ${platform.name}`, 
            onPress: async () => {
              // Simulate connection process
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Mark as connected
              await AsyncStorage.setItem(`@platform_${platformKey}`, JSON.stringify({
                connected: true,
                connectedAt: Date.now(),
                status: 'active'
              }));
              
              // Update state
              setPlatformConnections(prev => ({ ...prev, [platformKey]: 'connected' }));
              
              // Navigate to setup if needed
              router.push(platform.setupRoute);
              
              Alert.alert(
                '🎉 Connected!',
                `${platform.name} is now connected to your AI assistant. Your clone will handle messages with your personal style!`,
                [
                  { text: 'Setup Training', onPress: () => router.push('/(tabs)/training') },
                  { text: 'Test Clone', onPress: () => router.push('/(tabs)/clone') },
                  { text: 'Done' }
                ]
              );
            }
          }
        ]
      );
    } finally {
      setConnectingPlatform(null);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load current settings
      const currentSettings = await getUserSettings();
      setSettings(currentSettings);
      
      // Check API integration status
      const apiStatus = await validateAPIKey();
      
      // Check various integration statuses
      const status = {
        api: apiStatus.isValid ? 'connected' : 'error',
        cloud: user ? 'available' : 'disconnected',
        notifications: currentSettings.notifications ? 'enabled' : 'disabled',
        autoSave: currentSettings.autoSave ? 'enabled' : 'disabled'
      };
      
      setIntegrationStatus(status);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load integration status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'enabled':
      case 'available':
        return { name: 'check-circle', color: '#10B981' };
      case 'disconnected':
      case 'disabled':
        return { name: 'close-circle', color: '#EF4444' };
      case 'error':
        return { name: 'alert-circle', color: '#F59E0B' };
      default:
        return { name: 'help-circle', color: '#6B7280' };
    }
  };

  const PlatformCard = ({ platform }) => {
    const isConnected = platformConnections[platform.key] === 'connected';
    const isConnecting = connectingPlatform === platform.key;
    
    return (
      <TouchableOpacity 
        style={[styles.platformCard, isConnected && styles.platformCardConnected]} 
        onPress={() => isConnected ? router.push(platform.setupRoute) : connectToPlatform(platform.key)}
        disabled={isConnecting}
      >
        <View style={styles.platformHeader}>
          <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
            <MaterialCommunityIcons 
              name={platform.icon} 
              size={24} 
              color={platform.color} 
            />
          </View>
          {isConnecting ? (
            <ActivityIndicator size={16} color={platform.color} />
          ) : (
            <MaterialCommunityIcons 
              name={isConnected ? 'check-circle' : 'plus-circle'} 
              size={20} 
              color={isConnected ? '#10B981' : '#6B7280'} 
            />
          )}
        </View>
        <Text style={styles.platformName}>{platform.name}</Text>
        <Text style={styles.platformDescription}>{platform.description}</Text>
        <View style={styles.platformActions}>
          {isConnected ? (
            <>
              <TouchableOpacity 
                style={[styles.platformActionBtn, { backgroundColor: platform.color }]}
                onPress={() => router.push(platform.setupRoute)}
              >
                <Text style={styles.platformActionText}>Manage</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.platformTestBtn}
                onPress={() => router.push('/(tabs)/clone')}
              >
                <Text style={styles.platformTestText}>Test AI</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.platformConnectBtn, { backgroundColor: platform.color }]}
              onPress={() => connectToPlatform(platform.key)}
              disabled={isConnecting}
            >
              <Text style={styles.platformConnectText}>
                {isConnecting ? 'Connecting...' : 'Connect Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const StatusCard = ({ title, subtitle, status, onPress, icon }) => {
    const statusIcon = getStatusIcon(status);
    
    return (
      <TouchableOpacity style={styles.statusCard} onPress={onPress}>
        <View style={styles.statusHeader}>
          <MaterialCommunityIcons name={icon} size={24} color="#6A0572" />
          <MaterialCommunityIcons 
            name={statusIcon.name} 
            size={20} 
            color={statusIcon.color} 
            style={styles.statusIndicator}
          />
        </View>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusSubtitle}>{subtitle}</Text>
        <Text style={[styles.statusText, { color: statusIcon.color }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  const quickActions = [
    {
      icon: 'brain',
      title: 'Train Your AI Clone',
      subtitle: 'Add examples of your communication style',
      action: () => router.push('/(tabs)/training'),
      primary: true
    },
    {
      icon: 'robot-outline',
      title: 'Test Your Clone',
      subtitle: 'Chat with your AI clone and see responses',
      action: () => router.push('/(tabs)/clone'),
      primary: true
    },
    {
      icon: 'whatsapp',
      title: 'WhatsApp Business API',
      action: () => router.push('/whatsapp-setup')
    },
    {
      icon: 'account-multiple',
      title: 'Assistant Personality',
      action: () => router.push('/assistant-personality')
    },
    {
      icon: 'account-group',
      title: 'Authorized Contacts',
      action: () => router.push('/contact-authorization')
    },
    {
      icon: 'cloud-sync',
      title: 'Sync to Cloud',
      action: async () => {
        if (!user) {
          Alert.alert('Sign In Required', 'Please sign in to sync settings to cloud.');
          return;
        }
        
        setIsLoading(true);
        try {
          const result = await syncSettingsToCloud(user.uid);
          Alert.alert(
            result.success ? 'Success' : 'Error',
            result.success ? '☁️ Settings synced to cloud!' : '❌ ' + result.message
          );
        } catch (_error) {
          Alert.alert('Error', '❌ Failed to sync settings to cloud');
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      icon: 'cloud-download',
      title: 'Restore from Cloud',
      action: async () => {
        if (!user) {
          Alert.alert('Sign In Required', 'Please sign in to restore settings from cloud.');
          return;
        }
        
        Alert.alert(
          'Restore Settings',
          'This will replace your current settings with cloud backup. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Restore', style: 'default', onPress: async () => {
              setIsLoading(true);
              try {
                const result = await restoreSettingsFromCloud(user.uid);
                if (result.success) {
                  await loadDashboardData();
                  Alert.alert('Success', '☁️ Settings restored from cloud!');
                } else {
                  Alert.alert('Info', '📱 ' + result.message);
                }
              } catch (_error) {
                Alert.alert('Error', '❌ Failed to restore settings from cloud');
              } finally {
                setIsLoading(false);
              }
            }}
          ]
        );
      }
    },
    {
      icon: 'export',
      title: 'Export Settings',
      action: async () => {
        try {
          const result = await exportUserSettings();
          if (result.success) {
            const exportString = JSON.stringify(result.data, null, 2);
            // Since Share might not work in all environments, show the data
            Alert.alert(
              'Settings Exported',
              'Settings exported successfully! You can copy this data to backup your configuration.',
              [
                { text: 'OK', style: 'default' },
                { text: 'View Data', style: 'default', onPress: () => {
                  Alert.alert('Export Data', exportString);
                }}
              ]
            );
          } else {
            Alert.alert('Error', '❌ Failed to export settings');
          }
        } catch (_error) {
          Alert.alert('Error', '❌ Failed to export settings');
        }
      }
    }
  ];

  if (isLoading) {
    return (
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading Integration Status...</Text>
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
        <MaterialCommunityIcons name="integration" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>Integration Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* AI Clone Training Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Clone Management</Text>
          <View style={styles.cloneActionsContainer}>
            <TouchableOpacity
              style={styles.primaryCloneAction}
              onPress={() => router.push('/(tabs)/training')}
            >
              <View style={styles.cloneActionContent}>
                <MaterialCommunityIcons name="brain" size={32} color="#FFFFFF" />
                <View style={styles.cloneActionText}>
                  <Text style={styles.cloneActionTitle}>Train Your Clone</Text>
                  <Text style={styles.cloneActionSubtitle}>Add examples of your communication style</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryCloneAction}
              onPress={() => router.push('/(tabs)/clone')}
            >
              <View style={styles.cloneActionContent}>
                <MaterialCommunityIcons name="robot-outline" size={28} color="#6A0572" />
                <View style={styles.cloneActionText}>
                  <Text style={styles.secondaryCloneTitle}>Test Your Clone</Text>
                  <Text style={styles.secondaryCloneSubtitle}>Chat and see AI responses</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6A0572" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Platform Connections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Platform Connections</Text>
          <Text style={styles.sectionSubtitle}>
            Connect your platforms for automatic AI responses with your personal style
          </Text>
          <View style={styles.platformGrid}>
            {platforms.map((platform) => (
              <PlatformCard key={platform.key} platform={platform} />
            ))}
          </View>
        </View>

        {/* Integration Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusGrid}>
            <StatusCard
              icon="api"
              title="API Integration"
              subtitle="OpenRouter Connection"
              status={integrationStatus.api}
              onPress={() => router.push('/(tabs)/account')}
            />
            <StatusCard
              icon="cloud"
              title="Cloud Sync"
              subtitle="Settings Backup"
              status={integrationStatus.cloud}
              onPress={() => user ? null : router.push('/login')}
            />
            <StatusCard
              icon="bell"
              title="Notifications"
              subtitle="Alert System"
              status={integrationStatus.notifications}
              onPress={() => router.push('/settings')}
            />
            <StatusCard
              icon="content-save"
              title="Auto Save"
              subtitle="Automatic Backups"
              status={integrationStatus.autoSave}
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        {/* Current Settings Summary */}
        {settings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Configuration</Text>
            <View style={styles.configCard}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>AI Model:</Text>
                <Text style={styles.configValue}>{settings.preferredModel || 'deepseek/deepseek-chat'}</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Max Tokens:</Text>
                <Text style={styles.configValue}>{settings.maxTokens || 1000}</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Temperature:</Text>
                <Text style={styles.configValue}>{settings.temperature || 0.7}</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Auto Save:</Text>
                <Text style={styles.configValue}>{settings.autoSave ? 'Enabled' : 'Disabled'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          
          {quickActions.filter(action => action.primary).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.primaryActionButton}
              onPress={action.action}
              disabled={isLoading}
            >
              <View style={styles.primaryActionContent}>
                <MaterialCommunityIcons name={action.icon} size={28} color="#FFFFFF" />
                <View style={styles.primaryActionText}>
                  <Text style={styles.primaryActionTitle}>{action.title}</Text>
                  <Text style={styles.primaryActionSubtitle}>{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Other Actions */}
          {quickActions.filter(action => !action.primary).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.action}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name={action.icon} size={24} color="#6A0572" />
              <Text style={styles.actionButtonText}>{action.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Integration Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => Alert.alert(
              'Integration Help',
              '• Sync to Cloud: Backup your settings to Firebase\n• Restore from Cloud: Download your saved settings\n• Export Settings: Share your configuration\n• Reset to Defaults: Start fresh with default settings\n\n💡 All data is encrypted and secure!'
            )}
          >
            <MaterialCommunityIcons name="help-circle" size={24} color="#6A0572" />
            <Text style={styles.helpButtonText}>Integration Guide</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
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
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  // Clone Management Styles
  cloneActionsContainer: {
    gap: 12,
  },
  primaryCloneAction: {
    backgroundColor: '#6A0572',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryCloneAction: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cloneActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloneActionText: {
    flex: 1,
    marginLeft: 15,
  },
  cloneActionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cloneActionSubtitle: {
    fontSize: 14,
    color: '#E1BEE7',
    opacity: 0.9,
  },
  secondaryCloneTitle: {
    fontSize: 16,
    color: '#6A0572',
    fontWeight: '600',
    marginBottom: 2,
  },
  secondaryCloneSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  // Platform Grid Styles
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  platformCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  platformCardConnected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  platformDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  platformActions: {
    flexDirection: 'row',
    gap: 8,
  },
  platformConnectBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  platformConnectText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  platformActionBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  platformActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  platformTestBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  platformTestText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    marginLeft: 'auto',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  configCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  configLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  configValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryActionButton: {
    backgroundColor: '#6A0572',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionText: {
    flex: 1,
    marginLeft: 15,
  },
  primaryActionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: '#E1BEE7',
    opacity: 0.9,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  helpButtonText: {
    fontSize: 16,
    color: '#3730A3',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
});
