/**
 * Simple Dashboard - Clean Interface
 * One-tap platform connections and AI controls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import simpleIntegrationManager from '../utils/simpleIntegrationManager';

export default function SimpleDashboard() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadPlatformStatuses();
  }, []);

  const loadPlatformStatuses = async () => {
    try {
      const statuses = await simpleIntegrationManager.getAllPlatformStatuses();
      const platformList = simpleIntegrationManager.getPlatforms().map(platform => ({
        ...platform,
        ...statuses[platform.key]
      }));
      
      setPlatforms(platformList);
      setConnectedCount(await simpleIntegrationManager.getConnectedCount());
      
    } catch (error) {
      console.error('Error loading platform statuses:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPlatformStatuses();
    setIsRefreshing(false);
  };

  const handleConnectPlatform = async (platform) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      console.log(`🔗 User wants to connect ${platform.name}`);
      
      const result = await simpleIntegrationManager.connectPlatform(platform.key);
      
      if (result.success) {
        console.log(`✅ ${platform.name} connected successfully`);
        await loadPlatformStatuses(); // Refresh status
      } else if (result.message !== 'Coming soon') {
        Alert.alert('Connection Failed', result.error || 'Please try again');
      }
      
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect platform');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPlatform = async (platform) => {
    Alert.alert(
      'Disconnect Platform',
      `Are you sure you want to disconnect ${platform.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const result = await simpleIntegrationManager.disconnectPlatform(platform.key);
            if (result.success) {
              await loadPlatformStatuses();
            }
          }
        }
      ]
    );
  };

  const renderPlatformCard = (platform) => (
    <View key={platform.key} style={styles.platformCard}>
      <View style={styles.platformHeader}>
        <Text style={styles.platformIcon}>{platform.icon}</Text>
        <View style={styles.platformInfo}>
          <Text style={styles.platformName}>{platform.name}</Text>
          <Text style={styles.platformDescription}>{platform.description}</Text>
        </View>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: platform.connected ? '#4CAF50' : '#E0E0E0' }
        ]} />
      </View>

      <TouchableOpacity
        style={[
          styles.connectButton,
          platform.connected ? styles.disconnectButton : styles.connectButtonDefault
        ]}
        onPress={() => platform.connected 
          ? handleDisconnectPlatform(platform)
          : handleConnectPlatform(platform)
        }
        disabled={isConnecting}
      >
        <Ionicons 
          name={platform.connected ? 'checkmark-circle' : 'add-circle'} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.connectButtonText}>
          {platform.connected ? 'Connected' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6A0572', '#AB47BC']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AIReplica</Text>
          <Text style={styles.headerSubtitle}>AI Personal Assistant</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{connectedCount}</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>AI</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Platform Connections */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Connect Your Platforms</Text>
        <Text style={styles.sectionSubtitle}>
          Tap to connect platforms where AI will help with messages
        </Text>

        {platforms.map(renderPlatformCard)}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/chat')}
          >
            <Ionicons name="chatbubbles" size={24} color="#6A0572" />
            <Text style={styles.actionText}>Test AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/training')}
          >
            <Ionicons name="school" size={24} color="#6A0572" />
            <Text style={styles.actionText}>Train AI</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/subscription-plans')}
          >
            <Ionicons name="card" size={24} color="#6A0572" />
            <Text style={styles.actionText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>🚀 How It Works</Text>
          <Text style={styles.instructionText}>
            1. Connect your platforms above{'\n'}
            2. AI learns from your messages{'\n'}
            3. Enable auto-reply when ready{'\n'}
            4. AI handles messages for you!
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
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E1BEE7',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#E1BEE7',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  platformCard: {
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
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  platformDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonDefault: {
    backgroundColor: '#6A0572',
  },
  disconnectButton: {
    backgroundColor: '#4CAF50',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    color: '#6A0572',
    fontWeight: '600',
    marginTop: 8,
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
