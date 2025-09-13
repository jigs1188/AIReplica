import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Alert,
  StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PlatformSelectorScreen = () => {
  const { focus } = useLocalSearchParams();
  const [selectedPlatform, setSelectedPlatform] = useState(focus || null);

  const platforms = [
    {
      id: 'whatsapp-regular',
      name: 'WhatsApp (Regular)',
      icon: 'message-circle',
      color: '#25D366',
      description: 'Your personal WhatsApp account',
      badge: 'RECOMMENDED',
      badgeColor: '#FF6B35',
      features: ['Personal messages', 'Easy setup', 'No special account needed', 'Works with any phone number'],
      route: '/whatsapp-regular-setup'
    },
    {
      id: 'whatsapp-business',
      name: 'WhatsApp Business',
      icon: 'briefcase',
      color: '#25D366',
      description: 'Official WhatsApp Business API',
      badge: 'ADVANCED',
      badgeColor: '#8E44AD',
      features: ['Business features', 'API integration', 'Webhook support', 'Requires Business account'],
      route: '/detailed-whatsapp-setup'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      color: '#E4405F',
      description: 'Direct messages and comments',
      badge: 'COMING SOON',
      badgeColor: '#6B7280',
      features: ['DM auto-replies', 'Comment responses', 'Story replies', 'Requires Instagram Business'],
      route: '/instagram-setup',
      disabled: true
    },
    {
      id: 'email',
      name: 'Email',
      icon: 'mail',
      color: '#3B82F6',
      description: 'Gmail, Outlook, and more',
      badge: 'BETA',
      badgeColor: '#F59E0B',
      features: ['Smart replies', 'Email templates', 'Auto-categorization', 'Multiple accounts'],
      route: '/email-setup',
      disabled: true
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0077B5',
      description: 'Professional networking messages',
      badge: 'PRO FEATURE',
      badgeColor: '#EC4899',
      features: ['Connection requests', 'InMail responses', 'Professional tone', 'Lead generation'],
      route: '/linkedin-setup',
      disabled: true
    }
  ];

  const handlePlatformSelect = (platform) => {
    if (platform.disabled) {
      Alert.alert(
        platform.badge,
        `${platform.name} integration is ${platform.badge.toLowerCase()}. We'll notify you when it's ready!`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setSelectedPlatform(platform.id);
    
    // Special handling for WhatsApp types
    if (platform.id === 'whatsapp-regular') {
      Alert.alert(
        'Regular WhatsApp Setup',
        'This will guide you through connecting your personal WhatsApp. No special business account needed!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => router.push(platform.route) }
        ]
      );
    } else if (platform.id === 'whatsapp-business') {
      Alert.alert(
        'WhatsApp Business Setup',
        'This requires a WhatsApp Business account and API access. More complex but has advanced features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => router.push(platform.route) }
        ]
      );
    } else {
      router.push(platform.route);
    }
  };

  const PlatformCard = ({ platform }) => (
    <TouchableOpacity
      onPress={() => handlePlatformSelect(platform)}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        opacity: platform.disabled ? 0.6 : 1
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16
      }}>
        <View style={{
          backgroundColor: platform.color,
          borderRadius: 12,
          padding: 12,
          marginRight: 16
        }}>
          <Feather name={platform.icon} size={24} color="white" />
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginRight: 12
            }}>
              {platform.name}
            </Text>
            <View style={{
              backgroundColor: platform.badgeColor,
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4
            }}>
              <Text style={{
                color: 'white',
                fontSize: 10,
                fontWeight: 'bold'
              }}>
                {platform.badge}
              </Text>
            </View>
          </View>
          
          <Text style={{
            fontSize: 14,
            color: '#666',
            marginBottom: 12
          }}>
            {platform.description}
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {platform.features.map((feature, index) => (
              <View key={index} style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginRight: 8,
                marginBottom: 8
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#4B5563'
                }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      {!platform.disabled && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: platform.color,
          borderRadius: 12,
          paddingVertical: 12
        }}>
          <Text style={{
            color: 'white',
            fontWeight: 'bold',
            marginRight: 8
          }}>
            Setup {platform.name}
          </Text>
          <Feather name="arrow-right" size={16} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient 
      colors={['#4F46E5', '#7C3AED']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, padding: 24 }}>
          
          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 32 }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                padding: 8
              }}
            >
              <Feather name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            
            <View style={{ 
              backgroundColor: 'white', 
              borderRadius: 50, 
              padding: 20, 
              marginBottom: 20 
            }}>
              <Feather name="link" size={40} color="#4F46E5" />
            </View>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: 'white', 
              textAlign: 'center',
              marginBottom: 8
            }}>
              Connect Platform
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: 'rgba(255,255,255,0.8)', 
              textAlign: 'center',
              paddingHorizontal: 20
            }}>
              Choose which messaging platform to connect with your AI
            </Text>
          </View>

          {/* WhatsApp Focus Banner */}
          {focus === 'whatsapp' && (
            <View style={{
              backgroundColor: 'rgba(37, 211, 102, 0.9)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Feather name="trending-up" size={20} color="white" style={{ marginRight: 12 }} />
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600',
                flex: 1
              }}>
                WhatsApp is the most popular starting platform - choose regular or business version below
              </Text>
            </View>
          )}

          {/* Platform Cards */}
          {platforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}

          {/* Footer Info */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
            marginBottom: 40
          }}>
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: 12
            }}>
              🤔 Not sure which to choose?
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              lineHeight: 20
            }}>
              <Text style={{ fontWeight: 'bold' }}>Regular WhatsApp</Text> is perfect for personal use and small businesses. Easy setup, works with your current phone number.{'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>WhatsApp Business</Text> offers advanced features like webhooks and API access but requires a business account.{'\n\n'}
              You can always add more platforms later!
            </Text>
          </View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default PlatformSelectorScreen;
