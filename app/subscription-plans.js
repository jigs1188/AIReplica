/**
 * Subscription Plans Screen - SaaS Pricing Model
 * Users can choose their plan and upgrade for more platforms
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import userAuthService from '../utils/userAuthService';

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceText: 'Free',
    description: 'Perfect for trying out AI auto-reply',
    platforms: 1,
    messagesPerMonth: 100,
    features: [
      '1 Platform (WhatsApp)',
      '100 messages/month',
      'Basic AI responses',
      'Manual training',
      'Email support'
    ],
    color: '#4CAF50',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    priceText: '$9.99/month',
    description: 'For active users who want more platforms',
    platforms: 5,
    messagesPerMonth: 2000,
    features: [
      '5 Platforms included',
      '2,000 messages/month',
      'Advanced AI responses',
      'Auto-learning from chats',
      'Analytics dashboard',
      'Priority support'
    ],
    color: '#2196F3',
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 29.99,
    priceText: '$29.99/month',
    description: 'For power users and small teams',
    platforms: 10,
    messagesPerMonth: 10000,
    features: [
      'All 10 platforms',
      '10,000 messages/month',
      'Custom AI personality',
      'Team management',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support'
    ],
    color: '#9C27B0',
    popular: false
  }
];

export default function SubscriptionPlans() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await userAuthService.getStoredUserProfile();
      setUserProfile(profile);
      setCurrentPlan(profile?.plan || 'free');
    } catch (_error) {
      console.error('Failed to load user data');
    }
  };

  const handleSelectPlan = (planId) => {
    if (planId === currentPlan) return;
    
    setSelectedPlan(planId);
    
    if (planId === 'free') {
      handleDowngrade(planId);
    } else {
      handleUpgrade(planId);
    }
  };

  const handleUpgrade = (planId) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    
    Alert.alert(
      '🚀 Upgrade Plan',
      `Upgrade to ${plan.name} for ${plan.priceText}?\n\nYou'll get:\n${plan.features.slice(0, 3).map(f => `• ${f}`).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedPlan(null) },
        { 
          text: 'Upgrade', 
          onPress: () => processPayment(planId)
        }
      ]
    );
  };

  const handleDowngrade = (planId) => {
    Alert.alert(
      '⬇️ Downgrade Plan',
      'Downgrading will disconnect some platforms. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedPlan(null) },
        { 
          text: 'Downgrade', 
          style: 'destructive',
          onPress: () => processDowngrade(planId)
        }
      ]
    );
  };

  const processPayment = async (planId) => {
    try {
      setIsLoading(true);
      
      // In production, integrate with Stripe, RevenueCat, or similar
      console.log(`💳 Processing payment for plan: ${planId}`);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user plan
      const result = await userAuthService.updateUserProfile({ 
        plan: planId,
        planUpgradedAt: new Date().toISOString()
      });

      if (result.success) {
        setCurrentPlan(planId);
        Alert.alert(
          '🎉 Upgrade Successful!',
          `Welcome to ${SUBSCRIPTION_PLANS.find(p => p.id === planId).name}! You can now connect more platforms.`,
          [{ text: 'Great!', onPress: () => console.log('Navigate to dashboard') }]
        );
      } else {
        Alert.alert('Error', 'Failed to upgrade plan. Please try again.');
      }

    } catch (_error) {
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const processDowngrade = async (planId) => {
    try {
      setIsLoading(true);
      
      // Update user plan
      const result = await userAuthService.updateUserProfile({ 
        plan: planId,
        planDowngradedAt: new Date().toISOString()
      });

      if (result.success) {
        setCurrentPlan(planId);
        Alert.alert(
          '✅ Plan Updated',
          'Your plan has been downgraded. Some platforms may be disconnected.',
          [{ text: 'OK', onPress: () => console.log('Navigate to dashboard') }]
        );
      } else {
        Alert.alert('Error', 'Failed to update plan. Please try again.');
      }

    } catch (_error) {
      Alert.alert('Error', 'Plan update failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (plan) => {
    const isCurrentPlan = plan.id === currentPlan;
    const isSelected = plan.id === selectedPlan;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isCurrentPlan && styles.currentPlanCard,
          isSelected && styles.selectedPlanCard,
          plan.popular && styles.popularPlanCard
        ]}
        onPress={() => handleSelectPlan(plan.id)}
        disabled={isLoading}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>🔥 MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
          <Text style={styles.planPrice}>{plan.priceText}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>

        <View style={styles.planFeatures}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={plan.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planFooter}>
          {isCurrentPlan ? (
            <View style={styles.currentPlanButton}>
              <Text style={styles.currentPlanButtonText}>Current Plan</Text>
            </View>
          ) : (
            <View style={[styles.selectPlanButton, { backgroundColor: plan.color }]}>
              <Text style={styles.selectPlanButtonText}>
                {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#6A0572', '#AB83A1']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚀 Choose Your Plan</Text>
          <Text style={styles.headerSubtitle}>
            Connect more platforms and unlock advanced features
          </Text>
        </View>

        {/* Current Plan Info */}
        {userProfile && (
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanTitle}>
              Current Plan: {SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)?.name || 'Free'}
            </Text>
            <Text style={styles.currentPlanStats}>
              {userProfile.platformsConnected?.length || 0} platforms connected • 
              {userProfile.usage?.messagesThisMonth || 0} messages this month
            </Text>
          </View>
        )}

        {/* Plans Grid */}
        <View style={styles.plansContainer}>
          {SUBSCRIPTION_PLANS.map(renderPlanCard)}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>💎 Why Upgrade?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📱</Text>
              <Text style={styles.benefitText}>Connect multiple platforms at once</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🧠</Text>
              <Text style={styles.benefitText}>Advanced AI learns your style better</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>Detailed analytics and insights</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={styles.benefitText}>Priority support and faster responses</Text>
            </View>
          </View>
        </View>

        {/* Money Back Guarantee */}
        <View style={styles.guaranteeSection}>
          <Text style={styles.guaranteeTitle}>💯 30-Day Money Back Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </Text>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
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
  currentPlanInfo: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  currentPlanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentPlanStats: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  plansContainer: {
    padding: 20,
    paddingTop: 0,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: '#6A0572',
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: '#FF9800',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  planFooter: {
    alignItems: 'center',
  },
  selectPlanButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  selectPlanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  currentPlanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  benefitsSection: {
    margin: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  guaranteeSection: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  guaranteeText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
});
