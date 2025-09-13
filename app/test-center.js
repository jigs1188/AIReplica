import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * 🧪 TEST CENTER
 * Real testing interface to verify AI auto-replies work
 * Users can see actual conversations and test responses
 */

export default function TestCenter() {
  const router = useRouter();
  const { platform } = useLocalSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('+919876543210');
  const [isLoading, setIsLoading] = useState(false);
  const [userPhone] = useState('+919106764653'); // Should come from user context

  useEffect(() => {
    loadConversations();
    
    // Auto-refresh conversations every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/conversations/${userPhone.replace(/\+/g, '')}`);
      const result = await response.json();
      
      if (result.success) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversationDetails = async (conversationId) => {
    try {
      const response = await fetch(`http://localhost:3002/api/conversation/${conversationId}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedConversation(result.conversation);
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim()) {
      Alert.alert('Error', 'Please enter a test message');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/test/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhone: userPhone.replace(/\+/g, ''),
          senderPhone: testPhone.replace(/\+/g, ''),
          message: testMessage
        })
      });

      if (response.ok) {
        Alert.alert(
          'Test Message Sent! 🚀',
          `Simulated message from ${testPhone}:\n"${testMessage}"\n\nCheck conversations below to see AI response.`,
          [{ text: 'OK', onPress: () => {
            setTestMessage('');
            setTimeout(loadConversations, 2000); // Refresh after 2 seconds
          }}]
        );
      } else {
        Alert.alert('Error', 'Failed to send test message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test message');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => loadConversationDetails(item.id)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>{item.senderName}</Text>
          <Text style={styles.conversationPhone}>{item.senderPhone}</Text>
        </View>
        <View style={styles.conversationMeta}>
          <Text style={styles.conversationTime}>
            {formatTime(item.lastMessage?.timestamp)}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.lastMessage} numberOfLines={2}>
        {item.lastMessage?.isAIReply ? '🤖 ' : ''}
        {item.lastMessage?.text || 'No messages yet'}
      </Text>
      <View style={styles.messageCount}>
        <Text style={styles.messageCountText}>{item.messageCount} messages</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = (message, index) => {
    const isAI = message.isAIReply;
    const isOutgoing = message.direction === 'outgoing';
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isOutgoing ? styles.outgoingMessage : styles.incomingMessage
        ]}
      >
        <View style={[
          styles.messageBubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
          isAI && styles.aiBubble
        ]}>
          {isAI && (
            <View style={styles.aiLabel}>
              <MaterialCommunityIcons name="robot" size={12} color="white" />
              <Text style={styles.aiLabelText}>AI Reply</Text>
            </View>
          )}
          <Text style={[
            styles.messageText,
            isOutgoing ? styles.outgoingText : styles.incomingText
          ]}>
            {message.text}
          </Text>
          <Text style={styles.messageTime}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#6A0572', '#AB47BC']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>🧪 Test AI Replies</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadConversations}
        >
          <MaterialCommunityIcons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Test Message Section */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>📤 Send Test Message</Text>
          <Text style={styles.sectionDescription}>
            Simulate a friend messaging you to test AI auto-reply
          </Text>
          
          <View style={styles.testForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>From Phone Number:</Text>
              <TextInput
                style={styles.input}
                value={testPhone}
                onChangeText={setTestPhone}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Test Message:</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={testMessage}
                onChangeText={setTestMessage}
                placeholder="Hey, are you free for a meeting tomorrow?"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.sendButton, isLoading && styles.disabledButton]}
              onPress={sendTestMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="white" />
                  <Text style={styles.sendButtonText}>Send Test Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Conversations Section */}
        <View style={styles.conversationsSection}>
          <Text style={styles.sectionTitle}>💬 Your Conversations</Text>
          <Text style={styles.sectionDescription}>
            Real conversations where AI has responded automatically
          </Text>
          
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="message-outline" size={48} color="rgba(255,255,255,0.6)" />
              <Text style={styles.emptyStateText}>No conversations yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Send a test message above or ask a friend to message your WhatsApp
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Conversation Details */}
        {selectedConversation && (
          <View style={styles.conversationDetails}>
            <View style={styles.detailsHeader}>
              <Text style={styles.sectionTitle}>
                💬 Chat with {selectedConversation.senderName}
              </Text>
              <TouchableOpacity 
                onPress={() => setSelectedConversation(null)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.messagesContainer}>
              {selectedConversation.messages.map(renderMessage)}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>📋 How to Test</Text>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Make sure WhatsApp is connected in Integration Hub
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Send a test message above OR ask a real friend to message your WhatsApp
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              AI will automatically generate and send a reply in your style
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>4</Text>
            <Text style={styles.instructionText}>
              Check conversations above to see AI responses marked with 🤖
            </Text>
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
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  testSection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  testForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationsSection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  conversationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  conversationPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  unreadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  messageCount: {
    marginTop: 8,
  },
  messageCountText: {
    fontSize: 12,
    color: '#999',
  },
  conversationDetails: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  messagesContainer: {
    gap: 8,
  },
  messageContainer: {
    flexDirection: 'row',
  },
  incomingMessage: {
    justifyContent: 'flex-start',
  },
  outgoingMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  incomingBubble: {
    backgroundColor: '#f0f0f0',
  },
  outgoingBubble: {
    backgroundColor: '#007AFF',
  },
  aiBubble: {
    backgroundColor: '#25D366',
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  aiLabelText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  incomingText: {
    color: '#333',
  },
  outgoingText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  instructionsSection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#6A0572',
    color: 'white',
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
