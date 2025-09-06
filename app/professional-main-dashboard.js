import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { autoReplyService } from '../utils/aiReplicaCore';

export default function AIReplicaDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [autoReplies, setAutoReplies] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [settings, setSettings] = useState({
    enabled: true,
    platforms: {
      email: { enabled: true, approvalRequired: true, count: 0 },
      whatsapp: { enabled: true, approvalRequired: false, count: 0 },
      instagram: { enabled: true, approvalRequired: true, count: 0 },
      linkedin: { enabled: true, approvalRequired: true, count: 0 },
      telegram: { enabled: true, approvalRequired: false, count: 0 },
      slack: { enabled: true, approvalRequired: false, count: 0 }
    }
  });
  const [testMessage, setTestMessage] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    loadDashboardData();
    subscribeToAutoReplies();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize auto-reply service
      await autoReplyService.initialize();
      
      // Load settings
      const stored = await AsyncStorage.getItem('@AIReplica_autoReply');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToAutoReplies = () => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "auto_replies"),
      orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const replies = [];
      const pending = [];
      
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        replies.push(data);
        
        if (data.status === 'pending_approval') {
          pending.push(data);
        }
      });
      
      setAutoReplies(replies);
      setPendingApprovals(pending);
    });
  };

  const togglePlatform = async (platform) => {
    const newSettings = {
      ...settings,
      platforms: {
        ...settings.platforms,
        [platform]: {
          ...settings.platforms[platform],
          enabled: !settings.platforms[platform].enabled
        }
      }
    };
    
    setSettings(newSettings);
    await AsyncStorage.setItem('@AIReplica_autoReply', JSON.stringify(newSettings));
  };

  const toggleApprovalRequired = async (platform) => {
    const newSettings = {
      ...settings,
      platforms: {
        ...settings.platforms,
        [platform]: {
          ...settings.platforms[platform],
          approvalRequired: !settings.platforms[platform].approvalRequired
        }
      }
    };
    
    setSettings(newSettings);
    await AsyncStorage.setItem('@AIReplica_autoReply', JSON.stringify(newSettings));
  };

  const approveResponse = async (replyId) => {
    try {
      const replyRef = doc(db, "users", user.uid, "auto_replies", replyId);
      await updateDoc(replyRef, {
        status: 'approved',
        approvedAt: new Date()
      });
      
      Alert.alert('✅ Approved', 'Response has been sent!');
    } catch (error) {
      console.error('Error approving response:', error);
      Alert.alert('Error', 'Failed to approve response');
    }
  };

  const rejectResponse = async (replyId) => {
    try {
      const replyRef = doc(db, "users", user.uid, "auto_replies", replyId);
      await updateDoc(replyRef, {
        status: 'rejected',
        rejectedAt: new Date()
      });
      
      Alert.alert('❌ Rejected', 'Response has been discarded');
    } catch (error) {
      console.error('Error rejecting response:', error);
      Alert.alert('Error', 'Failed to reject response');
    }
  };

  const testAutoReply = async () => {
    if (!testMessage.trim()) {
      Alert.alert('Enter Message', 'Please enter a test message');
      return;
    }

    setIsLoading(true);
    try {
      const result = await autoReplyService.simulateIncomingMessage(
        testMessage,
        'whatsapp',
        'Test User'
      );

      if (result) {
        Alert.alert(
          '🤖 AI Response Generated!',
          `Original: "${result.originalMessage}"\n\nAI Response: "${result.generatedResponse}"`,
          [
            { text: 'Test Another', onPress: () => setTestMessage('') },
            { text: 'Done' }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to generate response');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const PlatformCard = ({ platform, config, platformKey }) => {
    const icons = {
      email: 'email',
      whatsapp: 'whatsapp',
      instagram: 'instagram',
      linkedin: 'linkedin',
      telegram: 'send',
      slack: 'slack'
    };

    const colors = {
      email: '#EA4335',
      whatsapp: '#25D366',
      instagram: '#E1306C',
      linkedin: '#0077B5',
      telegram: '#0088CC',
      slack: '#4A154B'
    };

    const handleSetupPlatform = (platformKey) => {
      switch (platformKey) {
        case 'whatsapp':
          router.push('/working-whatsapp-setup');
          break;
        case 'email':
          router.push('/email-setup');
          break;
        case 'instagram':
          router.push('/instagram-setup');
          break;
        case 'linkedin':
          Alert.alert('Coming Soon', 'LinkedIn setup will be available soon!');
          break;
        case 'telegram':
          Alert.alert('Coming Soon', 'Telegram setup will be available soon!');
          break;
        case 'slack':
          Alert.alert('Coming Soon', 'Slack setup will be available soon!');
          break;
        default:
          Alert.alert('Coming Soon', `${platform} setup will be available soon!`);
      }
    };

    return (
      <View style={styles.platformCard}>
        <View style={styles.platformHeader}>
          <View style={[styles.platformIcon, { backgroundColor: colors[platformKey] + '20' }]}>
            <MaterialCommunityIcons 
              name={icons[platformKey]} 
              size={24} 
              color={colors[platformKey]} 
            />
          </View>
          <Switch
            value={config.enabled}
            onValueChange={() => togglePlatform(platformKey)}
            trackColor={{ false: '#E5E7EB', true: colors[platformKey] + '50' }}
            thumbColor={config.enabled ? colors[platformKey] : '#9CA3AF'}
          />
        </View>
        <Text style={styles.platformName}>{platform}</Text>
        <Text style={styles.platformStatus}>
          {config.enabled ? '✅ Active' : '⏸️ Paused'} • {config.count || 0} replies
        </Text>
        
        {/* Platform Setup Button */}
        <TouchableOpacity
          style={[styles.setupButton, { borderColor: colors[platformKey] }]}
          onPress={() => handleSetupPlatform(platformKey)}
        >
          <MaterialCommunityIcons 
            name="cog-outline" 
            size={16} 
            color={colors[platformKey]} 
          />
          <Text style={[styles.setupButtonText, { color: colors[platformKey] }]}>
            Setup {platform}
          </Text>
        </TouchableOpacity>
        
        {config.enabled && (
          <View style={styles.platformControls}>
            <Text style={styles.controlLabel}>Require Approval:</Text>
            <Switch
              value={config.approvalRequired}
              onValueChange={() => toggleApprovalRequired(platformKey)}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={config.approvalRequired ? '#10B981' : '#9CA3AF'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        )}
      </View>
    );
  };

  const PendingApprovalCard = ({ reply }) => (
    <View style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <MaterialCommunityIcons name="clock-outline" size={20} color="#F59E0B" />
        <Text style={styles.pendingPlatform}>{reply.platform.toUpperCase()}</Text>
        <Text style={styles.pendingSender}>from {reply.sender}</Text>
      </View>
      
      <View style={styles.messageContainer}>
        <Text style={styles.originalMessage}>📨 {"\u201C"}{reply.originalMessage}{"\u201D"}</Text>
        <Text style={styles.generatedResponse}>🤖 {"\u201C"}{reply.generatedResponse}{"\u201D"}</Text>
      </View>
      
      <View style={styles.approvalActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => rejectResponse(reply.id)}
        >
          <Text style={styles.rejectText}>❌ Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => approveResponse(reply.id)}
        >
          <Text style={styles.approveText}>✅ Send Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading AIReplica...</Text>
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
        <MaterialCommunityIcons name="robot-outline" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>AIReplica Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Auto-Reply Activity</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{autoReplies.length}</Text>
              <Text style={styles.statLabel}>Total Replies</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingApprovals.length}</Text>
              <Text style={styles.statLabel}>Pending Approval</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Object.values(settings.platforms).filter(p => p.enabled).length}
              </Text>
              <Text style={styles.statLabel}>Active Platforms</Text>
            </View>
          </View>
        </View>

        {/* Test AI Clone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Test Your AI Clone</Text>
          <Text style={styles.sectionSubtitle}>
            Send a test message to see how your AI clone responds
          </Text>
          <TextInput
            style={styles.testInput}
            placeholder="Hey, can you help me with something urgent?"
            placeholderTextColor="#9CA3AF"
            value={testMessage}
            onChangeText={setTestMessage}
            multiline
          />
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testAutoReply}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="test-tube" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>
              {isLoading ? 'Testing...' : 'Test AI Response'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Pending Approvals ({pendingApprovals.length})</Text>
            {pendingApprovals.map((reply) => (
              <PendingApprovalCard key={reply.id} reply={reply} />
            ))}
          </View>
        )}

        {/* Platform Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Platform Auto-Reply Settings</Text>
          <Text style={styles.sectionSubtitle}>
            Enable auto-replies for your connected platforms
          </Text>
          <View style={styles.platformGrid}>
            {Object.entries(settings.platforms).map(([key, config]) => (
              <PlatformCard
                key={key}
                platform={key.charAt(0).toUpperCase() + key.slice(1)}
                config={config}
                platformKey={key}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/training')}
          >
            <MaterialCommunityIcons name="brain" size={24} color="#6A0572" />
            <Text style={styles.quickActionText}>Update Training Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/clone')}
          >
            <MaterialCommunityIcons name="robot-outline" size={24} color="#6A0572" />
            <Text style={styles.quickActionText}>Chat with Your Clone</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/prompts')}
          >
            <MaterialCommunityIcons name="flash" size={24} color="#6A0572" />
            <Text style={styles.quickActionText}>Manage Prompt Templates</Text>
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0572',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  testInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6A0572',
    borderRadius: 12,
    padding: 15,
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  pendingPlatform: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  pendingSender: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageContainer: {
    marginBottom: 15,
  },
  originalMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  generatedResponse: {
    fontSize: 14,
    color: '#6A0572',
    fontWeight: '500',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  approveText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  platformCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  platformStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  platformControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  setupButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
});
