/**
 * Consumer Dashboard - Super Simple Interface
 * This is what users see: one-click platform connections and auto-reply toggles
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import oauthManager from '../utils/oauthManager';
import userAuthService from '../utils/userAuthService';

export default function ConsumerDashboard() {
  const [platforms, setPlatforms] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get dashboard summary
      const summaryResult = await oauthManager.getDashboardSummary();
      
      if (summaryResult.success) {
        setPlatforms(summaryResult.summary.platforms);
        setUserStats(summaryResult.summary.stats);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleConnectPlatform = async (platformKey) => {
    try {
      setConnectingPlatform(platformKey);
      
      const result = await oauthManager.connectPlatform(platformKey);
      
      if (result.success) {
        Alert.alert(
          '🎉 Connected!', 
          result.message,
          [{ text: 'Great!', onPress: () => loadDashboardData() }]
        );
      } else if (result.upgradeRequired) {
        Alert.alert(
          '⬆️ Upgrade Required',
          'You need to upgrade your plan to connect more platforms.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => console.log('Navigate to upgrade') }
          ]
        );
      } else {
        Alert.alert('Connection Failed', result.error || 'Please try again');
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to connect platform');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnectPlatform = (platformKey, platformName) => {
    Alert.alert(
      'Disconnect Platform',
      `Are you sure you want to disconnect ${platformName}? Auto-reply will be disabled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            const result = await oauthManager.disconnectPlatform(platformKey);
            if (result.success) {
              loadDashboardData();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const handleToggleAutoReply = async (platformKey, enabled) => {
    try {
      const result = await oauthManager.toggleAutoReply(platformKey, enabled);
      
      if (result.success) {
        // Update local state immediately for responsive UI
        setPlatforms(prev => 
          prev.map(p => 
            p.key === platformKey 
              ? { ...p, autoReplyEnabled: enabled }
              : p
          )
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto-reply setting');
    }
  };

  const renderPlatformCard = (platform) => {
    const isConnecting = connectingPlatform === platform.key;
    
    return (
      <View key={platform.key} style={styles.platformCard}>
        <View style={styles.platformHeader}>
          <View style={styles.platformInfo}>
            <Text style={styles.platformIcon}>{platform.icon}</Text>
            <View style={styles.platformDetails}>
              <Text style={styles.platformName}>{platform.name}</Text>
              <Text style={styles.platformDescription}>{platform.description}</Text>
            </View>
          </View>
          
          {platform.isConnected ? (
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.connectButton, isConnecting && styles.connectingButton]}
              onPress={() => handleConnectPlatform(platform.key)}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.connectButtonText}>Connect</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {platform.isConnected && (
          <View style={styles.platformControls}>
            <View style={styles.autoReplyControl}>
              <Text style={styles.autoReplyLabel}>Auto-Reply</Text>
              <Switch
                value={platform.autoReplyEnabled || false}
                onValueChange={(enabled) => handleToggleAutoReply(platform.key, enabled)}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor={platform.autoReplyEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={() => handleDisconnectPlatform(platform.key, platform.name)}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>📊 Your Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.connectedPlatforms || 0}</Text>
          <Text style={styles.statLabel}>Platforms</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.messagesThisMonth || 0}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {platforms.filter(p => p.autoReplyEnabled).length}
          </Text>
          <Text style={styles.statLabel}>Auto-Reply</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0572" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#6A0572', '#AB83A1']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 Your AI Assistant</Text>
          <Text style={styles.headerSubtitle}>
            Connect platforms and enable auto-reply with one tap
          </Text>
        </View>

        {/* Stats Section */}
        {renderStatsSection()}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => oauthManager.toggleAllAutoReply(true)}
            >
              <Ionicons name="play-circle" size={24} color="#4CAF50" />
              <Text style={styles.quickActionText}>Enable All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => oauthManager.toggleAllAutoReply(false)}
            >
              <Ionicons name="pause-circle" size={24} color="#FF9800" />
              <Text style={styles.quickActionText}>Pause All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => console.log('Navigate to training')}
            >
              <Ionicons name="school" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Train AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Platforms Section */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>🔗 Your Platforms</Text>
          {platforms.map(renderPlatformCard)}
        </View>

        {/* Upgrade Prompt */}
        {platforms.length >= 1 && (
          <View style={styles.upgradeSection}>
            <Text style={styles.upgradeTitle}>🚀 Want More Platforms?</Text>
            <Text style={styles.upgradeDescription}>
              Upgrade to Pro to connect up to 5 platforms, or Business for all 10 platforms!
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>View Plans</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  quickActionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  quickActionText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '600',
  },
  platformsSection: {
    padding: 20,
    paddingTop: 0,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  platformDetails: {
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
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  connectButton: {
    backgroundColor: '#6A0572',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  connectingButton: {
    backgroundColor: '#AB83A1',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  platformControls: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoReplyControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoReplyLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
    fontWeight: '500',
  },
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  disconnectButtonText: {
    color: '#FF5722',
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeSection: {
    margin: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: '#6A0572',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
