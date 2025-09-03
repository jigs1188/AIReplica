/**
 * Platform Connector Component
 * One-tap platform connection with OAuth flow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import oauthManager from '../utils/oauthManager';

export default function PlatformConnector({ 
  platform, 
  onConnectionComplete,
  style = {} 
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');

      console.log(`🔗 User tapped to connect ${platform.name}`);

      // Step 1: Check if user can connect more platforms
      const canConnect = await checkConnectionLimits();
      if (!canConnect.allowed) {
        Alert.alert(
          '⬆️ Upgrade Required',
          canConnect.message,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'View Plans', onPress: () => navigateToPlans() }
          ]
        );
        return;
      }

      // Step 2: Show simplified OAuth explanation
      Alert.alert(
        `🔗 Connect ${platform.name}`,
        `We'll open ${platform.name} to get your permission. This is completely secure and you can revoke access anytime.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => initiateOAuthFlow()
          }
        ]
      );

    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Error', 'Failed to connect platform. Please try again.');
    } finally {
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    }
  };

  const initiateOAuthFlow = async () => {
    try {
      // Step 3: Start OAuth flow via backend
      const result = await oauthManager.connectPlatform(platform.key);

      if (result.success) {
        // Step 4: Open OAuth URL (in production, this opens browser/webview)
        console.log('🌐 Would open OAuth URL:', result.authUrl);
        
        // For demo: simulate successful OAuth
        await simulateOAuthCompletion();
        
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('OAuth flow failed:', error);
      Alert.alert('Connection Failed', error.message);
    }
  };

  const simulateOAuthCompletion = async () => {
    try {
      // Simulate user going through OAuth flow
      setConnectionStatus('authorizing');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`✅ ${platform.name} OAuth completed successfully`);
      setConnectionStatus('connected');
      
      // Show success message
      Alert.alert(
        '🎉 Connected!',
        `${platform.name} is now connected! You can enable auto-reply in your dashboard.`,
        [{ 
          text: 'Great!', 
          onPress: () => {
            if (onConnectionComplete) {
              onConnectionComplete(platform.key, true);
            }
          }
        }]
      );

    } catch (error) {
      console.error('OAuth completion failed:', error);
      setConnectionStatus('failed');
      Alert.alert('Error', 'Connection failed during authorization');
    }
  };

  const checkConnectionLimits = async () => {
    try {
      // This would check user's subscription plan
      const userPlan = 'free'; // Get from userAuthService
      
      const planLimits = {
        free: { platforms: 1, name: 'Free' },
        pro: { platforms: 5, name: 'Pro' },
        business: { platforms: 10, name: 'Business' }
      };

      const currentConnected = 0; // Get actual count
      const limit = planLimits[userPlan]?.platforms || 1;

      if (currentConnected >= limit) {
        return {
          allowed: false,
          message: `You've reached the ${planLimits[userPlan].name} plan limit of ${limit} platform${limit > 1 ? 's' : ''}. Upgrade to connect more platforms.`
        };
      }

      return { allowed: true };

    } catch (_error) {
      return { 
        allowed: false, 
        message: 'Unable to verify connection limits' 
      };
    }
  };

  const navigateToPlans = () => {
    // In production, navigate to subscription plans
    console.log('🚀 Navigate to subscription plans');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'authorizing': return '#2196F3';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected ✅';
      case 'connecting': return 'Connecting...';
      case 'authorizing': return 'Authorizing...';
      case 'failed': return 'Failed ❌';
      default: return 'Not Connected';
    }
  };

  const getButtonText = () => {
    if (isConnecting) return '';
    if (connectionStatus === 'connected') return 'Disconnect';
    return 'Connect';
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.platformInfo}>
        <View style={styles.platformHeader}>
          <Text style={styles.platformIcon}>{platform.icon}</Text>
          <View style={styles.platformDetails}>
            <Text style={styles.platformName}>{platform.name}</Text>
            <Text style={styles.platformDescription}>{platform.description}</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.connectButton,
          connectionStatus === 'connected' && styles.disconnectButton,
          isConnecting && styles.connectingButton
        ]}
        onPress={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons 
              name={connectionStatus === 'connected' ? 'unlink' : 'link'} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.connectButtonText}>
              {getButtonText()}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformInfo: {
    marginBottom: 12,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  platformDetails: {
    flex: 1,
  },
  platformName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  platformDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#6A0572',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  connectingButton: {
    backgroundColor: '#AB83A1',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
