/**
 * Test Webhook Integration
 * Simple test to verify webhook server and AI responses work
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function WebhookTest() {
  const [testMessage, setTestMessage] = useState('Hello AI! Can you help me?');
  const [testPlatform, setTestPlatform] = useState('whatsapp');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState([]);

  const platforms = [
    { key: 'whatsapp', name: 'WhatsApp', icon: '💬' },
    { key: 'instagram', name: 'Instagram', icon: '📷' },
    { key: 'telegram', name: 'Telegram', icon: '✈️' }
  ];

  const testWebhook = async () => {
    if (!testMessage.trim()) {
      Alert.alert('Error', 'Please enter a test message');
      return;
    }

    setIsLoading(true);

    try {
      console.log(`🧪 Testing ${testPlatform} webhook...`);
      
      // Send test message to webhook server
      const response = await fetch(`http://localhost:3000/webhook/${testPlatform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          from: 'test_user',
          timestamp: Date.now()
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Webhook test successful: ${result.response}`);
        
        // Add to response history
        setResponses(prev => [{
          id: Date.now(),
          platform: testPlatform,
          message: testMessage,
          response: result.response,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev]);

        Alert.alert(
          '✅ Webhook Test Successful!',
          `Platform: ${testPlatform}\nMessage: ${testMessage}\nAI Response: ${result.response}`,
          [{ text: 'Great!' }]
        );

      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Webhook test error:', error);
      Alert.alert(
        '❌ Webhook Test Failed',
        error.message.includes('Network request failed') 
          ? 'Make sure webhook server is running:\nnpm run webhook'
          : error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearResponses = () => {
    setResponses([]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6A0572', '#AB47BC']} style={styles.header}>
        <Text style={styles.headerTitle}>🧪 Webhook Test</Text>
        <Text style={styles.headerSubtitle}>Test AI message processing</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Platform Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Platform</Text>
          <View style={styles.platformSelector}>
            {platforms.map(platform => (
              <TouchableOpacity
                key={platform.key}
                style={[
                  styles.platformButton,
                  testPlatform === platform.key && styles.platformButtonSelected
                ]}
                onPress={() => setTestPlatform(platform.key)}
              >
                <Text style={styles.platformIcon}>{platform.icon}</Text>
                <Text style={[
                  styles.platformText,
                  testPlatform === platform.key && styles.platformTextSelected
                ]}>
                  {platform.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Message Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Message</Text>
          <TextInput
            style={styles.messageInput}
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="Enter a message to test AI response..."
            multiline
          />
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={[styles.testButton, isLoading && styles.testButtonDisabled]}
          onPress={testWebhook}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Test Webhook</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Response History */}
        {responses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Response History</Text>
              <TouchableOpacity onPress={clearResponses}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            {responses.map(response => (
              <View key={response.id} style={styles.responseCard}>
                <View style={styles.responseHeader}>
                  <Text style={styles.responseTime}>{response.timestamp}</Text>
                  <Text style={styles.responsePlatform}>
                    {platforms.find(p => p.key === response.platform)?.icon} {response.platform}
                  </Text>
                </View>
                <Text style={styles.responseMessage}>📤 {response.message}</Text>
                <Text style={styles.responseAI}>🤖 {response.response}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>💡 How to Test</Text>
          <Text style={styles.instructionText}>
            1. Make sure webhook server is running (npm run webhook){'\n'}
            2. Select a platform above{'\n'}
            3. Enter a test message{'\n'}
            4. Tap Test Webhook to see AI response{'\n'}
            5. Check the response history below
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E1BEE7',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  platformSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  platformButtonSelected: {
    borderColor: '#6A0572',
    backgroundColor: '#F3E5F5',
  },
  platformIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  platformText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  platformTextSelected: {
    color: '#6A0572',
  },
  messageInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  testButton: {
    backgroundColor: '#6A0572',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  testButtonDisabled: {
    backgroundColor: '#AB83A1',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    color: '#6A0572',
    fontSize: 14,
    fontWeight: '600',
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  responseTime: {
    fontSize: 12,
    color: '#999',
  },
  responsePlatform: {
    fontSize: 12,
    color: '#6A0572',
    fontWeight: '600',
  },
  responseMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  responseAI: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  instructions: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});
