import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WhatsAppLiveTest() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [autoReplyStats, setAutoReplyStats] = useState({
    totalSent: 0,
    todayCount: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    loadPhoneNumberAndStatus();
    const interval = setInterval(refreshStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPhoneNumberAndStatus = async () => {
    try {
      const verifiedNumber = await AsyncStorage.getItem('whatsapp_verified_number');
      if (verifiedNumber) {
        setPhoneNumber(verifiedNumber);
        await refreshStatus();
      }
    } catch (error) {
      console.error('Error loading phone number:', error);
    }
  };

  const refreshStatus = async () => {
    if (!phoneNumber) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/whatsapp/status/${phoneNumber}`);
      const result = await response.json();
      
      if (result.success) {
        setStatus(result);
        // Simulate recent messages for demo
        setRecentMessages([
          {
            id: 1,
            from: '+1234567890',
            message: 'Hi there!',
            reply: 'Hello! Thanks for messaging. How can I help you today? 😊',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            status: 'sent'
          },
          {
            id: 2,
            from: '+1987654321',
            message: 'How much does it cost?',
            reply: "I'll get you pricing information right away! One moment please.",
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            status: 'sent'
          },
          {
            id: 3,
            from: '+1122334455',
            message: 'Thank you!',
            reply: "You're welcome! Happy to help! 🙌",
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            status: 'sent'
          }
        ]);
        
        setAutoReplyStats({
          totalSent: 24,
          todayCount: 8,
          averageResponseTime: 2.3
        });
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStatus();
    setRefreshing(false);
  };

  const sendTestMessage = () => {
    Alert.alert(
      'Test Your Setup',
      `To test auto-reply:\n\n1. Open WhatsApp on another device\n2. Send a message to: ${phoneNumber}\n3. Try messages like "Hi", "How much?", or "Thanks"\n4. Watch for automatic replies!`,
      [{ text: 'Got it!' }]
    );
  };

  const toggleAutoReply = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call the backend to toggle auto-reply
      const newStatus = !status?.enabled;
      setStatus(prev => ({ ...prev, enabled: newStatus }));
      
      Alert.alert(
        'Auto-Reply Updated',
        `Auto-reply is now ${newStatus ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto-reply status');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPhoneNumber = (number) => {
    return number.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
  };

  if (!phoneNumber) {
    return (
      <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="phone-off" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No WhatsApp Connected</Text>
          <Text style={styles.emptyDescription}>
            Set up your WhatsApp number first to start testing auto-replies
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push('/real-whatsapp-setup')}
          >
            <Text style={styles.setupButtonText}>Set Up WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live WhatsApp Test</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshStatus}>
          <MaterialCommunityIcons name="refresh" size={24} color="#25D366" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.phoneInfo}>
              <MaterialCommunityIcons name="whatsapp" size={32} color="#25D366" />
              <View style={styles.phoneDetails}>
                <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>
                <Text style={styles.businessName}>
                  {status?.businessName || 'WhatsApp Auto-Reply'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, status?.enabled && styles.activeBadge]}>
              <Text style={[styles.statusText, status?.enabled && styles.activeStatusText]}>
                {status?.enabled ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.toggleButton, status?.enabled && styles.activeToggle]}
            onPress={toggleAutoReply}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name={status?.enabled ? "pause" : "play"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.toggleText}>
              {status?.enabled ? 'Pause Auto-Reply' : 'Start Auto-Reply'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="send" size={24} color="#25D366" />
            <Text style={styles.statNumber}>{autoReplyStats.totalSent}</Text>
            <Text style={styles.statLabel}>Total Sent</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-today" size={24} color="#007bff" />
            <Text style={styles.statNumber}>{autoReplyStats.todayCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-fast" size={24} color="#ff6b6b" />
            <Text style={styles.statNumber}>{autoReplyStats.averageResponseTime}s</Text>
            <Text style={styles.statLabel}>Avg Response</Text>
          </View>
        </View>

        {/* Test Button */}
        <TouchableOpacity style={styles.testButton} onPress={sendTestMessage}>
          <LinearGradient
            colors={['#25D366', '#128C7E']}
            style={styles.testGradient}
          >
            <MaterialCommunityIcons name="message-text" size={24} color="white" />
            <Text style={styles.testButtonText}>Test Auto-Reply Now</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Messages */}
        <View style={styles.messagesSection}>
          <Text style={styles.sectionTitle}>Recent Auto-Replies</Text>
          
          {recentMessages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <MaterialCommunityIcons name="message-outline" size={48} color="#ccc" />
              <Text style={styles.emptyMessagesText}>No messages yet</Text>
              <Text style={styles.emptyMessagesDesc}>
                Messages will appear here when people text your WhatsApp
              </Text>
            </View>
          ) : (
            recentMessages.map((msg) => (
              <View key={msg.id} style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <View style={styles.senderInfo}>
                    <MaterialCommunityIcons name="account-circle" size={20} color="#666" />
                    <Text style={styles.senderNumber}>{formatPhoneNumber(msg.from)}</Text>
                  </View>
                  <Text style={styles.messageTime}>{formatTime(msg.timestamp)}</Text>
                </View>
                
                <View style={styles.messageContent}>
                  <View style={styles.incomingMessage}>
                    <Text style={styles.messageText}>{msg.message}</Text>
                  </View>
                  
                  <MaterialCommunityIcons name="arrow-down" size={16} color="#25D366" />
                  
                  <View style={styles.replyMessage}>
                    <MaterialCommunityIcons name="robot" size={16} color="#25D366" />
                    <Text style={styles.replyText}>{msg.reply}</Text>
                  </View>
                </View>
                
                <View style={styles.messageStatus}>
                  <MaterialCommunityIcons 
                    name="check-all" 
                    size={16} 
                    color={msg.status === 'sent' ? '#25D366' : '#ccc'} 
                  />
                  <Text style={styles.statusLabel}>Auto-reply sent</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Test:</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>
                Ask a friend to send a WhatsApp message to {formatPhoneNumber(phoneNumber)}
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>
                Try keywords like "hi", "hello", "price", "cost", or "thanks"
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>
                Watch this screen update with new auto-replies in real-time
              </Text>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  phoneDetails: {
    marginLeft: 12,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  businessName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeBadge: {
    backgroundColor: '#d4edda',
    borderColor: '#25D366',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeStatusText: {
    color: '#25D366',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  activeToggle: {
    backgroundColor: '#25D366',
  },
  toggleText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  testButton: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  testGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  messagesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyMessages: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyMessagesDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  incomingMessage: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    maxWidth: '90%',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  replyMessage: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 12,
    maxWidth: '90%',
    alignSelf: 'flex-end',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#25D366',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  setupButton: {
    backgroundColor: '#25D366',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
