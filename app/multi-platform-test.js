import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { whatsappBusinessAPI } from '../utils/whatsappBusinessAPI';
import { instagramAPI } from '../utils/instagramAPI';
import { emailAPI } from '../utils/emailAPI';
import { linkedInAPI } from '../utils/linkedInAPI';
import { telegramAPI } from '../utils/telegramAPI';
import { slackAPI } from '../utils/slackAPI';
import { smsAPI } from '../utils/smsAPI';
import { facebookAPI } from '../utils/facebookAPI';
import { twitterAPI } from '../utils/twitterAPI';
import { discordAPI } from '../utils/discordAPI';
import { personalAssistantService } from '../utils/personalAssistantService';

export default function MultiPlatformTestScreen() {
  const [platformStatuses, setPlatformStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from your AI Personal Assistant. 🤖');
  const [testRecipient, setTestRecipient] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');

  const platforms = useMemo(() => [
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      api: whatsappBusinessAPI, 
      icon: 'logo-whatsapp',
      color: '#25D366',
      recipientPlaceholder: '+1234567890'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      api: instagramAPI, 
      icon: 'logo-instagram',
      color: '#E4405F',
      recipientPlaceholder: 'Instagram User ID'
    },
    { 
      id: 'email', 
      name: 'Email', 
      api: emailAPI, 
      icon: 'mail',
      color: '#0078D4',
      recipientPlaceholder: 'recipient@example.com'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      api: linkedInAPI, 
      icon: 'logo-linkedin',
      color: '#0077B5',
      recipientPlaceholder: 'LinkedIn Member ID'
    },
    { 
      id: 'telegram', 
      name: 'Telegram', 
      api: telegramAPI, 
      icon: 'paper-plane',
      color: '#0088cc',
      recipientPlaceholder: 'Chat ID or @username'
    },
    { 
      id: 'slack', 
      name: 'Slack', 
      api: slackAPI, 
      icon: 'chatbubbles',
      color: '#4A154B',
      recipientPlaceholder: 'Channel ID or User ID'
    },
    { 
      id: 'sms', 
      name: 'SMS', 
      api: smsAPI, 
      icon: 'chatbox',
      color: '#00C851',
      recipientPlaceholder: '+1234567890'
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      api: facebookAPI, 
      icon: 'logo-facebook',
      color: '#1877F2',
      recipientPlaceholder: 'Facebook User ID'
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      api: twitterAPI, 
      icon: 'logo-twitter',
      color: '#1DA1F2',
      recipientPlaceholder: '@username'
    },
    { 
      id: 'discord', 
      name: 'Discord', 
      api: discordAPI, 
      icon: 'game-controller',
      color: '#5865F2',
      recipientPlaceholder: 'User ID or Channel ID'
    }
  ], []);

  useEffect(() => {
    checkAllPlatformStatuses();
  }, [checkAllPlatformStatuses]);

  const checkAllPlatformStatuses = useCallback(async () => {
    setIsLoading(true);
    const statuses = {};

    for (const platform of platforms) {
      try {
        await platform.api.initialize();
        const config = platform.api.getConfiguration();
        const isConfigured = platform.api.isConfigured();
        
        let testResult = null;
        if (isConfigured && platform.api.testConnection) {
          testResult = await platform.api.testConnection();
        }

        statuses[platform.id] = {
          isConfigured,
          config,
          testResult,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error checking ${platform.name}:`, error);
        statuses[platform.id] = {
          isConfigured: false,
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }

    setPlatformStatuses(statuses);
    setIsLoading(false);
  }, [platforms]);

  const testSinglePlatform = async (platformId) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;

    setIsLoading(true);
    try {
      await platform.api.initialize();
      
      if (!platform.api.isConfigured()) {
        Alert.alert('Error', `${platform.name} is not configured. Please set it up first.`);
        return;
      }

      const testResult = await platform.api.testConnection();
      
      // Update status for this platform
      setPlatformStatuses(prev => ({
        ...prev,
        [platformId]: {
          ...prev[platformId],
          testResult,
          lastTested: new Date().toISOString()
        }
      }));

      if (testResult.success) {
        Alert.alert('Success', `${platform.name} connection successful!`);
      } else {
        Alert.alert('Error', `${platform.name} test failed: ${testResult.error}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to test ${platform.name}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testRecipient || !testMessage) {
      Alert.alert('Error', 'Please enter recipient and test message');
      return;
    }

    const platform = platforms.find(p => p.id === selectedPlatform);
    if (!platform) return;

    setIsLoading(true);
    try {
      await platform.api.initialize();
      
      if (!platform.api.isConfigured()) {
        Alert.alert('Error', `${platform.name} is not configured. Please set it up first.`);
        return;
      }

      let result;
      
      // Platform-specific message sending
      switch (selectedPlatform) {
        case 'whatsapp':
          result = await platform.api.sendMessage(testRecipient, testMessage);
          break;
        case 'instagram':
          result = await platform.api.sendMessage(testRecipient, testMessage);
          break;
        case 'email':
          result = await platform.api.sendGmailMessage 
            ? await platform.api.sendGmailMessage(testRecipient, 'Test from AI Assistant', testMessage)
            : await platform.api.sendSMTPMessage(testRecipient, 'Test from AI Assistant', testMessage);
          break;
        case 'linkedin':
          result = await platform.api.sendMessage(testRecipient, testMessage);
          break;
        case 'telegram':
          result = await platform.api.sendMessage(testRecipient, testMessage);
          break;
        case 'slack':
          result = await platform.api.sendMessage(testRecipient, testMessage);
          break;
        case 'sms':
          result = await platform.api.sendSMS(testRecipient, testMessage);
          break;
        case 'facebook':
          result = await platform.api.sendMessage(testRecipient, testMessage);
          break;
        case 'twitter':
          result = await platform.api.sendDirectMessage(testRecipient, testMessage);
          break;
        case 'discord':
          result = await platform.api.sendMessage(testRecipient, testMessage);
          break;
        default:
          throw new Error('Unknown platform');
      }

      if (result.success) {
        Alert.alert('Success', `Test message sent via ${platform.name}!`);
      } else {
        Alert.alert('Error', `Failed to send via ${platform.name}: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', `Test message failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPersonalAssistant = async () => {
    setIsLoading(true);
    try {
      // Test the personal assistant service with mock data
      const mockIncomingMessage = {
        content: 'Hi, are you available for a quick call?',
        senderId: testRecipient,
        platform: selectedPlatform,
        timestamp: new Date().toISOString()
      };

      const result = await personalAssistantService.processIncomingMessage(mockIncomingMessage);
      
      if (result.success) {
        Alert.alert(
          'Personal Assistant Test', 
          `AI Response Generated:\n\n"${result.response}"\n\nWould be sent via ${selectedPlatform}`
        );
      } else {
        Alert.alert('Error', `Personal assistant test failed: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', `Personal assistant test error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlatformStatus = (platform) => {
    const status = platformStatuses[platform.id];
    const isConfigured = status?.isConfigured || false;
    const testPassed = status?.testResult?.success || false;

    return (
      <View key={platform.id} style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: platform.color,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 15
        }}>
          <Ionicons name={platform.icon} size={24} color="white" />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {platform.name}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            {isConfigured ? 'Configured' : 'Not configured'}
          </Text>
          {status?.testResult && (
            <Text style={{ 
              color: testPassed ? '#00ff00' : '#ff0000', 
              fontSize: 12,
              marginTop: 2 
            }}>
              Test: {testPassed ? 'Passed' : 'Failed'}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name={isConfigured ? 'checkmark-circle' : 'close-circle'} 
            size={20} 
            color={isConfigured ? '#00ff00' : '#ff0000'} 
            style={{ marginRight: 10 }}
          />
          
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: 8,
              borderRadius: 5
            }}
            onPress={() => testSinglePlatform(platform.id)}
            disabled={!isConfigured}
          >
            <Ionicons name="wifi" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPlatformSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
      {platforms.map(platform => (
        <TouchableOpacity
          key={platform.id}
          style={{
            backgroundColor: selectedPlatform === platform.id 
              ? platform.color 
              : 'rgba(255,255,255,0.1)',
            padding: 15,
            borderRadius: 10,
            marginRight: 10,
            alignItems: 'center',
            minWidth: 100
          }}
          onPress={() => {
            setSelectedPlatform(platform.id);
            setTestRecipient('');
          }}
        >
          <Ionicons name={platform.icon} size={24} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5, fontSize: 12 }}>
            {platform.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ marginTop: 40, marginBottom: 30 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
            Multi-Platform Testing
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 10 }}>
            Test all your platform integrations in one place
          </Text>
        </View>

        {/* Platform Status Overview */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 20
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              Platform Status
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={checkAllPlatformStatuses}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="refresh" size={16} color="white" style={{ marginRight: 5 }} />
                  <Text style={{ color: 'white', fontSize: 14 }}>Refresh</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {platforms.map(platform => renderPlatformStatus(platform))}
        </View>

        {/* Test Message Interface */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 20
        }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
            Send Test Message
          </Text>

          {/* Platform Selector */}
          <Text style={{ color: 'white', marginBottom: 10, fontSize: 16 }}>
            Select Platform:
          </Text>
          {renderPlatformSelector()}

          {/* Recipient Input */}
          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            Recipient:
          </Text>
          <TextInput
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 10,
              padding: 15,
              color: 'white',
              marginBottom: 15,
              fontSize: 16
            }}
            value={testRecipient}
            onChangeText={setTestRecipient}
            placeholder={platforms.find(p => p.id === selectedPlatform)?.recipientPlaceholder || 'Enter recipient'}
            placeholderTextColor="rgba(255,255,255,0.5)"
          />

          {/* Message Input */}
          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            Test Message:
          </Text>
          <TextInput
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 10,
              padding: 15,
              color: 'white',
              marginBottom: 20,
              fontSize: 16,
              minHeight: 80,
              textAlignVertical: 'top'
            }}
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="Enter your test message"
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={{
              backgroundColor: platforms.find(p => p.id === selectedPlatform)?.color || 'rgba(255,255,255,0.2)',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={sendTestMessage}
            disabled={isLoading || !testRecipient || !testMessage}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  Send via {platforms.find(p => p.id === selectedPlatform)?.name}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(138, 43, 226, 0.8)',
              padding: 15,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={testPersonalAssistant}
            disabled={isLoading || !testRecipient}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Test AI Assistant
            </Text>
          </TouchableOpacity>
        </View>

        {/* Platform Statistics */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 20
        }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
            Integration Statistics
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#00ff00', fontSize: 24, fontWeight: 'bold' }}>
                {Object.values(platformStatuses).filter(s => s.isConfigured).length}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Configured
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#ffff00', fontSize: 24, fontWeight: 'bold' }}>
                {Object.values(platformStatuses).filter(s => s.testResult?.success).length}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Tested
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#ff6b6b', fontSize: 24, fontWeight: 'bold' }}>
                {platforms.length - Object.values(platformStatuses).filter(s => s.isConfigured).length}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Pending
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 40
        }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
            Quick Actions
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(0, 150, 255, 0.6)',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={() => {
              const configuredPlatforms = Object.entries(platformStatuses)
                .filter(([_, status]) => status.isConfigured)
                .map(([id, _]) => platforms.find(p => p.id === id)?.name)
                .join(', ');
              
              Alert.alert(
                'Platform Summary',
                `Configured Platforms: ${configuredPlatforms || 'None'}\n\nTotal: ${Object.values(platformStatuses).filter(s => s.isConfigured).length}/${platforms.length}`
              );
            }}
          >
            <Ionicons name="stats-chart" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              View Summary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 165, 0, 0.6)',
              padding: 15,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={() => {
              const unconfigured = platforms
                .filter(p => !platformStatuses[p.id]?.isConfigured)
                .map(p => p.name)
                .join('\n• ');
              
              if (unconfigured) {
                Alert.alert(
                  'Setup Remaining Platforms',
                  `Platforms to configure:\n\n• ${unconfigured}`
                );
              } else {
                Alert.alert('Complete', 'All platforms are configured! 🎉');
              }
            }}
          >
            <Ionicons name="construct" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Setup Guide
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
