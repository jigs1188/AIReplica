/**
 * Production Integration Dashboard - Enterprise Platform Management
 * Advanced platform integration with production-ready features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createShadow } from '../utils/shadowUtils';

const productionPlatforms = [
  {
    key: 'whatsapp_business',
    name: 'WhatsApp Business',
    icon: 'logo-whatsapp',
    color: '#25D366',
    route: '/production-whatsapp-setup',
    description: 'Enterprise WhatsApp automation',
    status: 'live',
    dailyLimit: 10000,
    messagesProcessed: 2847
  },
  {
    key: 'instagram_business',
    name: 'Instagram Business',
    icon: 'logo-instagram',
    color: '#E4405F',
    route: '/production-instagram-setup',
    description: 'Business Instagram automation',
    status: 'testing',
    dailyLimit: 5000,
    messagesProcessed: 156
  },
  {
    key: 'gmail_workspace',
    name: 'Gmail Workspace',
    icon: 'mail',
    color: '#EA4335',
    route: '/production-email-setup',
    description: 'Professional email automation',
    status: 'live',
    dailyLimit: 15000,
    messagesProcessed: 4521
  },
  {
    key: 'linkedin_sales',
    name: 'LinkedIn Sales Navigator',
    icon: 'logo-linkedin',
    color: '#0077B5',
    route: '/production-linkedin-setup',
    description: 'Professional network automation',
    status: 'paused',
    dailyLimit: 1000,
    messagesProcessed: 89
  }
];

export default function ProductionIntegrationDashboard() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  const loadProductionStats = useCallback(async () => {
    try {
      setPlatforms(productionPlatforms);
      const total = productionPlatforms.reduce((sum, platform) => sum + platform.messagesProcessed, 0);
      setTotalMessages(total);
    } catch (error) {
      console.error('Error loading production stats:', error);
    }
  }, []);

  useEffect(() => {
    loadProductionStats();
  }, [loadProductionStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProductionStats();
    setIsRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return '#10B981';
      case 'testing': return '#F59E0B';
      case 'paused': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'testing': return 'TESTING';
      case 'paused': return 'PAUSED';
      default: return 'OFFLINE';
    }
  };

  const renderProductionPlatformCard = (platform) => (
    <TouchableOpacity
      key={platform.key}
      style={styles.productionCard}
      onPress={() => router.push(platform.route)}
    >
      <LinearGradient
        colors={['white', platform.color + '05']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.platformIcon}>
            <Ionicons name={platform.icon} size={24} color={platform.color} />
          </View>
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>{platform.name}</Text>
            <Text style={styles.platformDescription}>{platform.description}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(platform.status) }]}>
            <Text style={styles.statusText}>{getStatusText(platform.status)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{platform.messagesProcessed.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Messages Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{platform.dailyLimit.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Daily Limit</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: platform.color }]}>
              {Math.round((platform.messagesProcessed / platform.dailyLimit) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Usage</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min((platform.messagesProcessed / platform.dailyLimit) * 100, 100)}%`,
                backgroundColor: platform.color 
              }
            ]} 
          />
        </View>
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
            <Text style={styles.headerTitle}>Production Dashboard</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.headerSubtitle}>
            Enterprise-grade platform automation
          </Text>
        </View>

        {/* Global Controls */}
        <View style={styles.controlPanel}>
          <View style={styles.globalToggle}>
            <Text style={styles.toggleLabel}>Auto-Reply System</Text>
            <Switch
              value={autoReplyEnabled}
              onValueChange={setAutoReplyEnabled}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={autoReplyEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.globalStats}>
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatNumber}>{totalMessages.toLocaleString()}</Text>
              <Text style={styles.globalStatLabel}>Messages Today</Text>
            </View>
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatNumber}>{platforms.filter(p => p.status === 'live').length}</Text>
              <Text style={styles.globalStatLabel}>Live Platforms</Text>
            </View>
          </View>
        </View>

        {/* Production Platforms */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>Production Platforms</Text>
          {platforms.map(renderProductionPlatformCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Production Tools</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/history')}
          >
            <MaterialCommunityIcons name="chart-line" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Message History</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/logs')}
          >
            <MaterialCommunityIcons name="text-box-outline" size={24} color="#10B981" />
            <Text style={styles.actionText}>System Logs</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/alerts')}
          >
            <MaterialCommunityIcons name="bell-alert" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>Alert Management</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  controlPanel: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  globalToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  globalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  globalStatItem: {
    alignItems: 'center',
  },
  globalStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  globalStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  productionCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformInfo: {
    marginLeft: 15,
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  platformDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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