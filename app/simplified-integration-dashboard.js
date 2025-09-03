import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    color: '#25D366',
    description: 'Auto-reply to WhatsApp messages',
    isPopular: true
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    description: 'Respond to DMs and comments',
    isPopular: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    description: 'Manage Messenger conversations'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    description: 'Professional networking replies'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: 'twitter',
    color: '#1DA1F2',
    description: 'Respond to DMs and mentions'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'discord',
    color: '#5865F2',
    description: 'Gaming and community chats'
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'slack',
    color: '#4A154B',
    description: 'Workplace communication'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'telegram',
    color: '#0088CC',
    description: 'Secure messaging platform'
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'email',
    color: '#EA4335',
    description: 'Gmail and other email providers'
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: 'message-text',
    color: '#34C759',
    description: 'Text message responses'
  }
];

export default function SimplifiedIntegrationDashboard() {
  const [connectedPlatforms, setConnectedPlatforms] = useState(new Set());
  const [autoReplySettings, setAutoReplySettings] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [userStats, setUserStats] = useState({
    totalMessages: 0,
    repliesGenerated: 0,
    timeSaved: 0
  });
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      // Simulate loading user's connected platforms and stats
      // In real implementation, this would call your backend API
      
      // Mock data for demonstration
      setTimeout(() => {
        setConnectedPlatforms(new Set(['whatsapp', 'instagram']));
        setAutoReplySettings({
          whatsapp: true,
          instagram: false,
          facebook: false
        });
        setUserStats({
          totalMessages: 1247,
          repliesGenerated: 892,
          timeSaved: 12.5 // hours
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  };

  const handleConnectPlatform = async (platform) => {
    setSelectedPlatform(platform);
    setShowPermissionModal(true);
  };

  const handleOAuthConnect = async () => {
    try {
      setIsLoading(true);
      setShowPermissionModal(false);
      
      // In real implementation, this would:
      // 1. Open OAuth flow for the platform
      // 2. Send permissions to your backend
      // 3. Your backend creates API connections
      // 4. Return simple success/failure
      
      // Simulate OAuth connection
      setTimeout(() => {
        setConnectedPlatforms(prev => new Set([...prev, selectedPlatform.id]));
        setAutoReplySettings(prev => ({
          ...prev,
          [selectedPlatform.id]: true
        }));
        setIsLoading(false);
        
        Alert.alert(
          'Success! 🎉',
          `${selectedPlatform.name} connected successfully!\n\nYour AI assistant is now ready to help with ${selectedPlatform.name} messages.`,
          [{ text: 'OK' }]
        );
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Connection Failed', error.message);
    }
  };

  const toggleAutoReply = async (platformId, enabled) => {
    try {
      // In real implementation, update backend settings
      setAutoReplySettings(prev => ({
        ...prev,
        [platformId]: enabled
      }));
      
      const platformName = PLATFORMS.find(p => p.id === platformId)?.name;
      Alert.alert(
        'Settings Updated',
        `Auto-reply ${enabled ? 'enabled' : 'disabled'} for ${platformName}`
      );
      
    } catch (_error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const disconnectPlatform = async (platformId) => {
    Alert.alert(
      'Disconnect Platform',
      `Are you sure you want to disconnect ${PLATFORMS.find(p => p.id === platformId)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setConnectedPlatforms(prev => {
              const newSet = new Set(prev);
              newSet.delete(platformId);
              return newSet;
            });
            setAutoReplySettings(prev => ({
              ...prev,
              [platformId]: false
            }));
          }
        }
      ]
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your AI Impact</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.totalMessages.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Messages Received</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.repliesGenerated.toLocaleString()}</Text>
          <Text style={styles.statLabel}>AI Replies Sent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.timeSaved}h</Text>
          <Text style={styles.statLabel}>Time Saved</Text>
        </View>
      </View>
    </View>
  );

  const renderPlatformCard = (platform) => {
    const isConnected = connectedPlatforms.has(platform.id);
    const autoReplyEnabled = autoReplySettings[platform.id] || false;

    return (
      <View key={platform.id} style={styles.platformCard}>
        <View style={styles.platformHeader}>
          <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
            <MaterialCommunityIcons 
              name={platform.icon} 
              size={24} 
              color={platform.color} 
            />
          </View>
          
          <View style={styles.platformInfo}>
            <View style={styles.platformNameRow}>
              <Text style={styles.platformName}>{platform.name}</Text>
              {platform.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
            </View>
            <Text style={styles.platformDescription}>{platform.description}</Text>
          </View>

          <View style={styles.platformActions}>
            {isConnected ? (
              <View style={styles.connectedActions}>
                <Switch
                  value={autoReplyEnabled}
                  onValueChange={(value) => toggleAutoReply(platform.id, value)}
                  trackColor={{ false: '#767577', true: platform.color }}
                  thumbColor={autoReplyEnabled ? '#fff' : '#f4f3f4'}
                />
                <TouchableOpacity
                  onPress={() => disconnectPlatform(platform.id)}
                  style={styles.disconnectButton}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: platform.color }]}
                onPress={() => handleConnectPlatform(platform)}
                disabled={isLoading}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isConnected && (
          <View style={styles.platformStatus}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: autoReplyEnabled ? '#34C759' : '#FF9500' }]} />
              <Text style={styles.statusText}>
                {autoReplyEnabled ? 'Auto-reply active' : 'Connected, manual replies only'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderPermissionModal = () => (
    <Modal
      visible={showPermissionModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons 
              name={selectedPlatform?.icon} 
              size={40} 
              color={selectedPlatform?.color} 
            />
            <Text style={styles.modalTitle}>Connect {selectedPlatform?.name}</Text>
          </View>

          <Text style={styles.modalDescription}>
            To enable AI auto-replies, we need permission to:
          </Text>

          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <MaterialCommunityIcons name="message-text" size={20} color="#34C759" />
              <Text style={styles.permissionText}>Read incoming messages</Text>
            </View>
            <View style={styles.permissionItem}>
              <MaterialCommunityIcons name="send" size={20} color="#34C759" />
              <Text style={styles.permissionText}>Send replies on your behalf</Text>
            </View>
            <View style={styles.permissionItem}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#34C759" />
              <Text style={styles.permissionText}>Secure, encrypted processing</Text>
            </View>
          </View>

          <Text style={styles.privacyNote}>
            🔒 Your messages are processed securely and never shared. You can disconnect anytime.
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.authorizeButton, { backgroundColor: selectedPlatform?.color }]}
              onPress={handleOAuthConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.authorizeButtonText}>Authorize & Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && connectedPlatforms.size === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0572" />
        <Text style={styles.loadingText}>Loading your AI assistant...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#6A0572', '#AB47BC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Replica</Text>
          <Text style={styles.headerSubtitle}>Your Personal AI Assistant</Text>
        </View>
      </LinearGradient>

      {renderStatsCard()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Platforms</Text>
        <Text style={styles.sectionDescription}>
          Connect your social media accounts to enable AI auto-replies
        </Text>
      </View>

      <View style={styles.platformsList}>
        {PLATFORMS.map(renderPlatformCard)}
      </View>

      <View style={styles.helpSection}>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => router.push('/training')}
        >
          <MaterialCommunityIcons name="brain" size={24} color="#6A0572" />
          <Text style={styles.helpButtonText}>Train Your AI Style</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => router.push('/history')}
        >
          <MaterialCommunityIcons name="history" size={24} color="#6A0572" />
          <Text style={styles.helpButtonText}>View AI Responses</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {renderPermissionModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6A0572',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0572',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  platformsList: {
    paddingHorizontal: 20,
  },
  platformCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformInfo: {
    flex: 1,
    marginLeft: 12,
  },
  platformNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  popularBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  platformDescription: {
    fontSize: 13,
    color: '#666',
  },
  platformActions: {
    alignItems: 'center',
  },
  connectedActions: {
    alignItems: 'center',
    gap: 8,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    padding: 4,
  },
  platformStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  helpSection: {
    padding: 20,
    gap: 12,
  },
  helpButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionsList: {
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  privacyNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  authorizeButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  authorizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
