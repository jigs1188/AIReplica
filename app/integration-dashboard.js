/**
 * Integration Dashboard - Platform Connection Hub
 * Centralized platform integration management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createShadow } from '../utils/shadowUtils';

const platformList = [
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    route: '/whatsapp-setup',
    description: 'Connect WhatsApp for auto-replies'
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    route: '/instagram-setup',
    description: 'Auto-respond to Instagram DMs'
  },
  {
    key: 'gmail',
    name: 'Gmail',
    icon: 'mail',
    color: '#EA4335',
    route: '/email-setup',
    description: 'Smart email auto-responses'
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: 'logo-linkedin',
    color: '#0077B5',
    route: '/linkedin-setup',
    description: 'Professional message automation'
  }
];

export default function IntegrationDashboard() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPlatformStatuses = useCallback(async () => {
    try {
      // Load platform connection statuses
      setConnectedCount(0); // Default for now
      setPlatforms(platformList);
    } catch (error) {
      console.error('Error loading platform statuses:', error);
    }
  }, []);

  useEffect(() => {
    loadPlatformStatuses();
  }, [loadPlatformStatuses]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPlatformStatuses();
    setIsRefreshing(false);
  };

  const connectPlatform = (platform) => {
    router.push(platform.route);
  };

  const renderPlatformCard = (platform) => (
    <TouchableOpacity
      key={platform.key}
      style={styles.platformCard}
      onPress={() => connectPlatform(platform)}
    >
      <LinearGradient
        colors={[platform.color + '20', platform.color + '10']}
        style={styles.platformGradient}
      >
        <View style={styles.platformHeader}>
          <Ionicons name={platform.icon} size={32} color={platform.color} />
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>{platform.name}</Text>
            <Text style={styles.platformDescription}>{platform.description}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.connectButton, { backgroundColor: platform.color }]}
          onPress={() => connectPlatform(platform)}
        >
          <Text style={styles.connectButtonText}>Connect</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Integration Hub</Text>
            <View style={styles.placeholder} />
          </View>
          
          <Text style={styles.headerSubtitle}>
            Connect your platforms for AI-powered auto-replies
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{connectedCount}</Text>
              <Text style={styles.statLabel}>Connected</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{platformList.length}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>
        </View>

        {/* Setup Mode Selection */}
        <View style={styles.setupModeSection}>
          <Text style={styles.sectionTitle}>Choose Setup Mode</Text>
          
          <TouchableOpacity 
            style={[styles.setupModeCard, { backgroundColor: '#FF6B35' }]}
            onPress={() => router.push('/simple-user-setup')}
          >
            <MaterialCommunityIcons name="rocket-launch" size={32} color="white" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.setupModeTitle, { color: 'white' }]}>Quick Setup</Text>
              <Text style={[styles.setupModeDesc, { color: 'rgba(255,255,255,0.9)' }]}>
                One-click connect for normal users (OAuth for non-WhatsApp platforms)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.setupModeCard, { backgroundColor: '#6366F1' }]}
            onPress={() => router.push('/platform-selector')}
          >
            <MaterialCommunityIcons name="cog" size={32} color="white" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.setupModeTitle, { color: 'white' }]}>Detailed Setup</Text>
              <Text style={[styles.setupModeDesc, { color: 'rgba(255,255,255,0.9)' }]}>
                Advanced configuration with API keys (for all platforms)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Connected Platforms Status */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>Connected Platforms</Text>
          {platforms.map(renderPlatformCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/test-center')}
          >
            <MaterialCommunityIcons name="test-tube" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Test AI Responses</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#10B981" />
            <Text style={styles.actionText}>AI Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyItems: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  setupModeSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  setupModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    ...createShadow({ shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }),
  },
  setupModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  setupModeDesc: {
    fontSize: 14,
  },
  platformsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  platformCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  platformGradient: {
    padding: 20,
    backgroundColor: 'white',
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  platformInfo: {
    marginLeft: 15,
    flex: 1,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  platformDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    ...createShadow({ shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }),
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
});