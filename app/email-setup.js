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
import { emailAPI } from '../utils/emailAPI';
import { personalAssistantService } from '../utils/personalAssistantService';

export default function EmailSetupScreen() {
  const [emailProvider, setEmailProvider] = useState('gmail'); // 'gmail' or 'smtp'
  
  // Gmail OAuth credentials
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  
  // SMTP credentials
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(true);
  
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
      const config = await AsyncStorage.getItem('email_config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        setEmailProvider(parsedConfig.provider || 'gmail');
        
        if (parsedConfig.provider === 'gmail') {
          setClientId(parsedConfig.credentials?.clientId || '');
          setClientSecret(parsedConfig.credentials?.clientSecret || '');
          setRefreshToken(parsedConfig.credentials?.refreshToken || '');
        } else if (parsedConfig.provider === 'smtp') {
          setSmtpHost(parsedConfig.credentials?.host || '');
          setSmtpPort(parsedConfig.credentials?.port?.toString() || '587');
          setSmtpUsername(parsedConfig.credentials?.user || '');
          setSmtpPassword(parsedConfig.credentials?.pass || '');
          setSmtpSecure(parsedConfig.credentials?.secure !== false);
        }
      }

      const autoReply = await AsyncStorage.getItem('email_auto_reply_enabled');
      setAutoReplyEnabled(autoReply === 'true');
    } catch (error) {
      console.error('Error loading email credentials:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      await emailAPI.initialize();
      const config = emailAPI.getConfiguration();
      setIsConnected(config.hasCredentials);
      
      if (config.hasCredentials) {
        const testResult = await emailAPI.testConnection();
        setConnectionStatus(testResult);
      }
    } catch (error) {
      console.error('Error checking email connection:', error);
    }
  };

  const saveGmailCredentials = async () => {
    if (!clientId || !clientSecret) {
      Alert.alert('Error', 'Please enter Client ID and Client Secret');
      return;
    }

    setIsLoading(true);
    try {
      const result = await emailAPI.setupGmail(clientId, clientSecret, refreshToken);

      if (result.success) {
        setIsConnected(true);
        setConnectionStatus(result);
        Alert.alert('Success', 'Gmail API connected successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save Gmail credentials: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSMTPCredentials = async () => {
    if (!smtpHost || !smtpUsername || !smtpPassword) {
      Alert.alert('Error', 'Please enter SMTP host, username, and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await emailAPI.setupSMTP(
        smtpHost,
        parseInt(smtpPort),
        smtpUsername,
        smtpPassword,
        smtpSecure
      );

      if (result.success) {
        setIsConnected(true);
        setConnectionStatus(result);
        Alert.alert('Success', 'SMTP configuration saved successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save SMTP credentials: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await emailAPI.testConnection();
      setConnectionStatus(result);
      
      if (result.success) {
        Alert.alert('Success', `Email connection successful!`);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Connection test failed: ' + error.message);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestEmail = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect to email service first');
      return;
    }

    Alert.alert(
      'Test Email',
      'Enter recipient email address:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Send',
          onPress: async (recipientEmail) => {
            if (!recipientEmail) {
              Alert.alert('Error', 'Please enter a recipient email');
              return;
            }

            setIsLoading(true);
            try {
              const testSubject = 'Test from AI Personal Assistant';
              const testBody = 'Hello! This is a test email from your AI Personal Assistant. 📧\n\nIf you received this, the email integration is working correctly!';

              const result = emailProvider === 'gmail' 
                ? await emailAPI.sendGmailMessage(recipientEmail, testSubject, testBody)
                : await emailAPI.sendSMTPMessage(recipientEmail, testSubject, testBody);
              
              if (result.success) {
                Alert.alert('Success', 'Test email sent successfully!');
              } else {
                Alert.alert('Error', 'Failed to send test email: ' + result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Test email failed: ' + error.message);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const toggleAutoReply = async (enabled) => {
    try {
      await AsyncStorage.setItem('email_auto_reply_enabled', enabled.toString());
      setAutoReplyEnabled(enabled);
      
      if (enabled && isConnected) {
        // Register email with personal assistant service
        const sendFunction = emailProvider === 'gmail' 
          ? emailAPI.sendGmailMessage.bind(emailAPI)
          : emailAPI.sendSMTPMessage.bind(emailAPI);
          
        await personalAssistantService.registerPlatform('email', {
          sendMessage: sendFunction,
          isConnected: () => emailAPI.isConfigured()
        });
        Alert.alert('Success', 'Email auto-reply enabled!');
      } else {
        Alert.alert('Info', 'Email auto-reply disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle auto-reply: ' + error.message);
    }
  };

  const clearCredentials = async () => {
    Alert.alert(
      'Clear Credentials',
      'Are you sure you want to clear all email credentials?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await emailAPI.clearConfiguration();
              await AsyncStorage.removeItem('email_auto_reply_enabled');
              
              setClientId('');
              setClientSecret('');
              setRefreshToken('');
              setSmtpHost('');
              setSmtpPort('587');
              setSmtpUsername('');
              setSmtpPassword('');
              setIsConnected(false);
              setConnectionStatus(null);
              setAutoReplyEnabled(false);
              
              Alert.alert('Success', 'Email credentials cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear credentials: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderGmailForm = () => (
    <>
      <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
        Client ID *
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
        value={clientId}
        onChangeText={setClientId}
        placeholder="Enter Gmail API Client ID"
        placeholderTextColor="rgba(255,255,255,0.5)"
      />

      <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
        Client Secret *
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
        value={clientSecret}
        onChangeText={setClientSecret}
        placeholder="Enter Gmail API Client Secret"
        placeholderTextColor="rgba(255,255,255,0.5)"
        secureTextEntry
      />

      <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
        Refresh Token
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
        value={refreshToken}
        onChangeText={setRefreshToken}
        placeholder="Enter OAuth Refresh Token"
        placeholderTextColor="rgba(255,255,255,0.5)"
        secureTextEntry
      />

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
        onPress={saveGmailCredentials}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="save" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Save Gmail Credentials
            </Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSMTPForm = () => (
    <>
      <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
        SMTP Host *
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
        value={smtpHost}
        onChangeText={setSmtpHost}
        placeholder="smtp.gmail.com, outlook.office365.com, etc."
        placeholderTextColor="rgba(255,255,255,0.5)"
      />

      <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
        SMTP Port *
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
        value={smtpPort}
        onChangeText={setSmtpPort}
        placeholder="587, 465, 25"
        placeholderTextColor="rgba(255,255,255,0.5)"
        keyboardType="numeric"
      />

      <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
        Username/Email *
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
        value={smtpUsername}
        onChangeText={setSmtpUsername}
        placeholder="your-email@domain.com"
        placeholderTextColor="rgba(255,255,255,0.5)"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={{ color: 'white', marginBottom: 5, fontSize: 16 }}>
        Password *
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
        value={smtpPassword}
        onChangeText={setSmtpPassword}
        placeholder="Enter your email password or app password"
        placeholderTextColor="rgba(255,255,255,0.5)"
        secureTextEntry
      />

      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 20 
      }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Use SSL/TLS</Text>
        <Switch
          value={smtpSecure}
          onValueChange={setSmtpSecure}
          trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(0,255,0,0.6)' }}
          thumbColor={smtpSecure ? '#00ff00' : 'white'}
        />
      </View>

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
        onPress={saveSMTPCredentials}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="save" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Save SMTP Credentials
            </Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ marginTop: 40, marginBottom: 30 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
            Email Setup
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 10 }}>
            Configure Gmail API or SMTP for email auto-replies
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
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                {connectionStatus.success ? connectionStatus.message : connectionStatus.error}
              </Text>
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
                Email Auto-Reply
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 5 }}>
                Enable automatic responses to emails
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

        {/* Provider Selection */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: 20,
          borderRadius: 15,
          marginBottom: 20
        }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
            Email Provider
          </Text>
          
          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: emailProvider === 'gmail' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                padding: 15,
                borderRadius: 10,
                marginRight: 10,
                alignItems: 'center'
              }}
              onPress={() => setEmailProvider('gmail')}
            >
              <Ionicons name="logo-google" size={24} color="white" />
              <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>
                Gmail API
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: emailProvider === 'smtp' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                padding: 15,
                borderRadius: 10,
                marginLeft: 10,
                alignItems: 'center'
              }}
              onPress={() => setEmailProvider('smtp')}
            >
              <Ionicons name="mail" size={24} color="white" />
              <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>
                SMTP
              </Text>
            </TouchableOpacity>
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
            {emailProvider === 'gmail' ? 'Gmail API' : 'SMTP'} Configuration
          </Text>

          {emailProvider === 'gmail' ? renderGmailForm() : renderSMTPForm()}

          {/* Common Action Buttons */}
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
            disabled={isTestingConnection || !isConnected}
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
            onPress={sendTestEmail}
            disabled={isLoading || !isConnected}
          >
            <Ionicons name="paper-plane" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              Send Test Email
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
          
          {emailProvider === 'gmail' ? (
            <>
              <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
                1. Go to Google Cloud Console (console.cloud.google.com)
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
                2. Create a new project or select existing one
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
                3. Enable Gmail API in Library section
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
                4. Create OAuth 2.0 credentials (Client ID and Secret)
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 22 }}>
                5. Use OAuth Playground to get refresh token
              </Text>
            </>
          ) : (
            <>
              <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
                1. Get SMTP settings from your email provider
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
                2. Gmail: smtp.gmail.com:587, Outlook: smtp.office365.com:587
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 22 }}>
                3. Use app passwords for Gmail (not your regular password)
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 22 }}>
                4. Enable 2FA and create app-specific password if required
              </Text>
            </>
          )}
        </View>

        {/* Status Information */}
        {isConnected && connectionStatus?.success && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: 20,
            borderRadius: 15,
            marginBottom: 40
          }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Connection Status
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="checkmark-circle" size={20} color="#00ff00" />
              <Text style={{ color: 'white', marginLeft: 10 }}>
                Provider: {emailProvider.toUpperCase()}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="mail" size={20} color="white" />
              <Text style={{ color: 'white', marginLeft: 10 }}>
                Auto-Reply: {autoReplyEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            {emailProvider === 'smtp' && smtpUsername && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="person" size={20} color="white" />
                <Text style={{ color: 'white', marginLeft: 10 }}>
                  Account: {smtpUsername}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
