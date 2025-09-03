import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { instagramAPI } from '../utils/instagramAPI';
import { personalAssistantService } from '../utils/personalAssistantService';

export default function InstagramSetupScreen() {
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);

  useEffect(() => {
    loadSavedCredentials();
    checkConnectionStatus();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const config = await AsyncStorage.getItem('instagram_config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        setAccessToken(parsedConfig.accessToken || '');
        setPageId(parsedConfig.pageId || '');
        setBusinessAccountId(parsedConfig.businessAccountId || '');
        setAppId(parsedConfig.appId || '');
        setAppSecret(parsedConfig.appSecret || '');
        setWebhookVerifyToken(parsedConfig.webhookVerifyToken || '');
      }

      const autoReply = await AsyncStorage.getItem('instagram_auto_reply_enabled');
      setAutoReplyEnabled(autoReply === 'true');
    } catch (error) {
      console.error('Error loading Instagram credentials:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      await instagramAPI.initialize();
      const config = instagramAPI.getConfiguration();
      setIsConnected(config.hasAccessToken && config.hasPageId);
      
      if (config.hasAccessToken && config.hasPageId) {
        const testResult = await instagramAPI.testConnection();
        setConnectionStatus(testResult);
      }
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
    }
  };

  const saveCredentials = async () => {
    if (!accessToken || !pageId) {
      Alert.alert('Error', 'Please enter Access Token and Page ID');
      return;
    }

    setIsLoading(true);
    try {
      const result = await instagramAPI.setupCredentials(
        accessToken,
        pageId,
        businessAccountId,
        appId,
        appSecret
      );

      if (result.success) {
        // Save webhook verify token separately
        if (webhookVerifyToken) {
          await AsyncStorage.setItem('instagram_webhook_verify_token', webhookVerifyToken);
        }

        setIsConnected(true);
        setConnectionStatus(result);
        Alert.alert('Success', 'Instagram Business API connected successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await instagramAPI.testConnection();
      setConnectionStatus(result);
      
      if (result.success) {
        Alert.alert('Success', `Connected to Instagram Business Account: ${result.username}`);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Connection test failed: ' + error.message);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestMessage = async () => {
    Alert.alert(
      'Test Message',
      'To send a test Instagram DM, you need a real recipient Instagram User ID. This would typically come from webhook events when users message your business account.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const toggleAutoReply = async (enabled) => {
    try {
      await AsyncStorage.setItem('instagram_auto_reply_enabled', enabled.toString());
      setAutoReplyEnabled(enabled);
      
      if (enabled && isConnected) {
        // Register Instagram with personal assistant service
        await personalAssistantService.registerPlatform('instagram', {
          sendMessage: instagramAPI.sendMessage.bind(instagramAPI),
          isConnected: () => instagramAPI.isConfigured()
        });
        Alert.alert('Success', 'Instagram auto-reply enabled!');
      } else {
        Alert.alert('Info', 'Instagram auto-reply disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle auto-reply: ' + error.message);
    }
  };

  const clearCredentials = async () => {
    Alert.alert(
      'Clear Credentials',
      'Are you sure you want to clear all Instagram credentials?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await instagramAPI.clearConfiguration();
              await AsyncStorage.removeItem('instagram_webhook_verify_token');
              await AsyncStorage.removeItem('instagram_auto_reply_enabled');
              
              setAccessToken('');
              setPageId('');
              setBusinessAccountId('');
              setAppId('');
              setAppSecret('');
              setWebhookVerifyToken('');
              setIsConnected(false);
              setConnectionStatus(null);
              setAutoReplyEnabled(false);
              
              Alert.alert('Success', 'Instagram credentials cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear credentials: ' + error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <LinearGradient colors={['#833ab4', '#fd1d1d', '#fcb045']} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ marginTop: 40, marginBottom: 30 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
            Instagram Business Setup
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 10 }}>
            Configure Instagram Business API for auto-replies
          </Text>
        </View>

        {/* Connection Status */}
        {connectionStatus && (
          <View style={{
            backgroundColor: connectionStatus.success ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)',
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons 
              name={connectionStatus.success ? 'checkmark-circle' : 'alert-circle'} 
              size={24} 
              color={connectionStatus.success ? '#00ff00' : '#ff0000'} 
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {connectionStatus.success ? 'Connected' : 'Connection Failed'}
              </Text>
              {connectionStatus.success && connectionStatus.username && (
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Business Account: @{connectionStatus.username}
                </Text>
              )}
              {!connectionStatus.success && (
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {connectionStatus.error}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Auto-Reply Toggle */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 20
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                Auto-Reply
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 5 }}>
                Enable automatic responses to Instagram DMs
              </Text>
            </View>
            <Switch
              value={autoReplyEnabled}
              onValueChange={toggleAutoReply}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(0,255,0,0.6)' }}
              thumbColor={autoReplyEnabled ? '#00ff00' : 'white'}
            />
          </View>
        </View>

        {/* Credentials Form */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 20
        }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
            API Credentials
          </Text>

          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            Access Token *
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
            value={accessToken}
            onChangeText={setAccessToken}
            placeholder="Enter Instagram Business API access token"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
          />

          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            Page ID *
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
            value={pageId}
            onChangeText={setPageId}
            placeholder="Enter Instagram Business Page ID"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />

          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            Business Account ID
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
            value={businessAccountId}
            onChangeText={setBusinessAccountId}
            placeholder="Enter Instagram Business Account ID"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />

          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            App ID
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
            value={appId}
            onChangeText={setAppId}
            placeholder="Enter Facebook App ID"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />

          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            App Secret
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
            value={appSecret}
            onChangeText={setAppSecret}
            placeholder="Enter Facebook App Secret"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
          />

          <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
            Webhook Verify Token
          </Text>
          <TextInput
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 10,
              padding: 15,
              color: 'white',
              marginBottom: 20,
              fontSize: 16
            }}
            value={webhookVerifyToken}
            onChangeText={setWebhookVerifyToken}
            placeholder="Enter webhook verification token"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={{
              backgroundColor: isConnected ? 'rgba(0,255,0,0.3)' : 'rgba(255,255,255,0.2)',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={saveCredentials}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  Save Credentials
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(100,200,255,0.3)',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={testConnection}
            disabled={isTestingConnection || !accessToken || !pageId}
          >
            {isTestingConnection ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="wifi" size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  Test Connection
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,200,0,0.3)',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={sendTestMessage}
            disabled={isLoading || !isConnected}
          >
            <Ionicons name="paper-plane" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Send Test Message
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,100,100,0.3)',
              padding: 15,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={clearCredentials}
          >
            <Ionicons name="trash" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Clear Credentials
            </Text>
          </TouchableOpacity>
        </View>

        {/* Setup Instructions */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 20
        }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
            Setup Instructions
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
            1. Create a Facebook App at developers.facebook.com
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
            2. Add Instagram Basic Display and Instagram Messaging products
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
            3. Connect your Instagram Business Account
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
            4. Get your Access Token from Facebook Graph API Explorer
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
            5. Find your Page ID and Business Account ID in Facebook Business Manager
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 22 }}>
            6. Set up webhooks to receive real-time messages
          </Text>
        </View>

        {/* Status Information */}
        {isConnected && connectionStatus?.success && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 20,
            borderRadius: 15,
            marginBottom: 20
          }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Connection Status
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="checkmark-circle" size={20} color="#00ff00" />
              <Text style={{ color: 'white', marginLeft: 10 }}>
                Business Account: @{connectionStatus.username}
              </Text>
            </View>
            
            {connectionStatus.followers && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="people" size={20} color="white" />
                <Text style={{ color: 'white', marginLeft: 10 }}>
                  Followers: {connectionStatus.followers?.toLocaleString()}
                </Text>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chatbubble" size={20} color="white" />
              <Text style={{ color: 'white', marginLeft: 10 }}>
                Auto-Reply: {autoReplyEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        )}

        {/* Required Permissions */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 40
        }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
            Required Permissions
          </Text>
          
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
            • instagram_basic
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
            • instagram_manage_messages
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
            • pages_messaging
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
            • pages_show_list
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
            • business_management
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
