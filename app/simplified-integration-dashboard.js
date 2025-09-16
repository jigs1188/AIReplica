/**
 * Simplified Integration Dashboard - Easy Platform Setup
 * Streamlined interface for quick platform connections
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createShadow } from '../utils/shadowUtils';

const simplePlatforms = [
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    route: '/simplified-whatsapp-setup',
    description: 'Easy WhatsApp auto-replies',
    isConnected: false,
    difficulty: 'Easy'
  },
  {
    key: 'email',
    name: 'Email',
    icon: 'mail-outline',
    color: '#EA4335',
    route: '/simplified-email-setup',
    description: 'Smart email responses',
    isConnected: false,
    difficulty: 'Easy'
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    route: '/simplified-instagram-setup',
    description: 'Instagram DM automation',
    isConnected: false,
    difficulty: 'Medium'
  }
];

export default function SimplifiedIntegrationDashboard() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState([]);
  const [connectedCount, setConnectedCount] = useState(0);

  const loadSimplePlatforms = useCallback(async () => {
    try {
      setPlatforms(simplePlatforms);
      const connected = simplePlatforms.filter(p => p.isConnected).length;
      setConnectedCount(connected);
    } catch (error) {
      console.error('Error loading platforms:', error);
    }
  }, []);

  useEffect(() => {
    loadSimplePlatforms();
  }, [loadSimplePlatforms]);

  const connectPlatform = (platform) => {
    router.push(platform.route);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderSimplePlatformCard = (platform) => (
    <TouchableOpacity
      key={platform.key}
      style={styles.platformCard}
      onPress={() => connectPlatform(platform)}
    >
      <LinearGradient
        colors={[platform.color + '10', 'white']}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: platform.color + '20' }]}>
              <Ionicons name={platform.icon} size={32} color={platform.color} />
            </View>
            
            <View style={styles.platformDetails}>
              <Text style={styles.platformName}>{platform.name}</Text>
              <Text style={styles.platformDescription}>{platform.description}</Text>
              
              <View style={styles.difficultyContainer}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(platform.difficulty) }]}>
                  <Text style={styles.difficultyText}>{platform.difficulty}</Text>
                </View>
                {platform.isConnected && (
                  <View style={styles.connectedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.connectedText}>Connected</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.connectButton, { backgroundColor: platform.color }]}
            onPress={() => connectPlatform(platform)}
          >
            <Text style={styles.connectButtonText}>
              {platform.isConnected ? 'Manage' : 'Connect'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Easy Setup</Text>
            <View style={styles.placeholder} />
          </View>
          
          <Text style={styles.headerSubtitle}>
            Connect your platforms in just a few taps
          </Text>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {connectedCount} of {platforms.length} platforms connected
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: platforms.length > 0 ? `${(connectedCount / platforms.length) * 100}%` : '0%' }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        {connectedCount > 0 && (
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.statsGradient}
            >
              <View style={styles.statsContent}>
                <Text style={styles.statsTitle}>🎉 Great Progress!</Text>
                <Text style={styles.statsDescription}>
                  You&apos;ve connected {connectedCount} platform{connectedCount !== 1 ? 's' : ''}. 
                  Your AI is ready to start auto-replying!
                </Text>
                <TouchableOpacity 
                  style={styles.testButton}
                  onPress={() => router.push('/test-center')}
                >
                  <Text style={styles.testButtonText}>Test AI Responses</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Platforms */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>Available Platforms</Text>
          <Text style={styles.sectionSubtitle}>
            Choose platforms to connect for auto-replies
          </Text>
          
          {platforms.map(renderSimplePlatformCard)}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          
          <TouchableOpacity 
            style={styles.helpCard}
            onPress={() => router.push('/quick-start')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#3B82F6" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Quick Start Guide</Text>
              <Text style={styles.helpDescription}>Step-by-step setup instructions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.helpCard}
            onPress={() => router.push('/test-center')}
          >
            <Ionicons name="flask-outline" size={24} color="#10B981" />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Test Your Setup</Text>
              <Text style={styles.helpDescription}>See how your AI responds</Text>
            </View>
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
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 20,
  },
  statsContent: {
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  statsDescription: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  platformsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  platformCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  cardGradient: {
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  platformDetails: {
    flex: 1,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
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
  helpSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    ...createShadow({ shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }),
  },
  helpContent: {
    marginLeft: 15,
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  helpDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});