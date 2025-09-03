/**
 * Simple Integration Manager
 * Handles all platform connections with easy, direct methods
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';
import simpleWhatsAppConnector from './simpleWhatsAppConnector';

class SimpleIntegrationManager {
  constructor() {
    this.platforms = {
      whatsapp: {
        name: 'WhatsApp',
        icon: '💬',
        description: 'Connect via WhatsApp Web',
        connector: simpleWhatsAppConnector,
        color: '#25D366'
      },
      instagram: {
        name: 'Instagram',
        icon: '📷',
        description: 'Connect Instagram DMs',
        color: '#E1306C'
      },
      linkedin: {
        name: 'LinkedIn',
        icon: '💼',
        description: 'Professional messaging',
        color: '#0077B5'
      },
      twitter: {
        name: 'Twitter/X',
        icon: '🐦',
        description: 'Tweet and DM management',
        color: '#1DA1F2'
      },
      telegram: {
        name: 'Telegram',
        icon: '✈️',
        description: 'Telegram bot integration',
        color: '#0088CC'
      }
    };
  }

  /**
   * Get all available platforms
   */
  getPlatforms() {
    return Object.entries(this.platforms).map(([key, platform]) => ({
      key,
      ...platform
    }));
  }

  /**
   * Connect to a platform
   */
  async connectPlatform(platformKey) {
    try {
      const platform = this.platforms[platformKey];
      if (!platform) {
        throw new Error(`Platform ${platformKey} not supported`);
      }

      console.log(`🔗 Connecting to ${platform.name}...`);

      // Handle different platform connection methods
      switch (platformKey) {
        case 'whatsapp':
          return await simpleWhatsAppConnector.connect();

        case 'instagram':
          return await this.connectInstagram();

        case 'linkedin':
          return await this.connectLinkedIn();

        case 'twitter':
          return await this.connectTwitter();

        case 'telegram':
          return await this.connectTelegram();

        default:
          return await this.connectGenericPlatform(platformKey);
      }

    } catch (error) {
      console.error(`Error connecting to ${platformKey}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect Instagram (simplified)
   */
  async connectInstagram() {
    return new Promise((resolve) => {
      Alert.alert(
        '📷 Connect Instagram',
        'We\'ll open Instagram where you can enable message permissions for our AI assistant.',
        [
          { text: 'Cancel', onPress: () => resolve({ success: false }) },
          { 
            text: 'Open Instagram', 
            onPress: async () => {
              try {
                await Linking.openURL('https://instagram.com');
                setTimeout(() => {
                  Alert.alert(
                    '📱 Enable Message Permissions',
                    '1. Go to Settings → Privacy → Messages\n2. Allow messages from everyone\n3. Come back to mark as connected',
                    [
                      { 
                        text: 'Connected!', 
                        onPress: async () => {
                          await AsyncStorage.setItem('instagram_connected', 'true');
                          resolve({ 
                            success: true, 
                            platform: 'instagram',
                            message: 'Instagram DMs enabled'
                          });
                        }
                      }
                    ]
                  );
                }, 3000);
              } catch (error) {
                resolve({ success: false, error: error.message });
              }
            }
          }
        ]
      );
    });
  }

  /**
   * Connect LinkedIn (simplified)
   */
  async connectLinkedIn() {
    return new Promise((resolve) => {
      Alert.alert(
        '💼 Connect LinkedIn',
        'We\'ll help you connect LinkedIn for professional messaging assistance.',
        [
          { text: 'Cancel', onPress: () => resolve({ success: false }) },
          { 
            text: 'Open LinkedIn', 
            onPress: async () => {
              try {
                await Linking.openURL('https://linkedin.com');
                setTimeout(() => {
                  Alert.alert(
                    '✅ LinkedIn Ready',
                    'Your LinkedIn is connected! Our AI can now help with professional messaging.',
                    [
                      { 
                        text: 'Done!', 
                        onPress: async () => {
                          await AsyncStorage.setItem('linkedin_connected', 'true');
                          resolve({ 
                            success: true, 
                            platform: 'linkedin',
                            message: 'LinkedIn professional messaging ready'
                          });
                        }
                      }
                    ]
                  );
                }, 2000);
              } catch (error) {
                resolve({ success: false, error: error.message });
              }
            }
          }
        ]
      );
    });
  }

  /**
   * Connect Twitter (simplified)
   */
  async connectTwitter() {
    return new Promise((resolve) => {
      Alert.alert(
        '🐦 Connect Twitter/X',
        'Connect your Twitter account to manage tweets and DMs with AI assistance.',
        [
          { text: 'Cancel', onPress: () => resolve({ success: false }) },
          { 
            text: 'Open Twitter', 
            onPress: async () => {
              try {
                await Linking.openURL('https://twitter.com');
                setTimeout(() => {
                  Alert.alert(
                    '🎉 Twitter Connected',
                    'Twitter is ready! AI can now help with tweets and direct messages.',
                    [
                      { 
                        text: 'Awesome!', 
                        onPress: async () => {
                          await AsyncStorage.setItem('twitter_connected', 'true');
                          resolve({ 
                            success: true, 
                            platform: 'twitter',
                            message: 'Twitter/X social media assistance ready'
                          });
                        }
                      }
                    ]
                  );
                }, 2000);
              } catch (error) {
                resolve({ success: false, error: error.message });
              }
            }
          }
        ]
      );
    });
  }

  /**
   * Connect Telegram (simplified)
   */
  async connectTelegram() {
    return new Promise((resolve) => {
      Alert.alert(
        '✈️ Connect Telegram',
        'We\'ll help you set up Telegram bot integration for AI assistance.',
        [
          { text: 'Cancel', onPress: () => resolve({ success: false }) },
          { 
            text: 'Setup Telegram', 
            onPress: async () => {
              try {
                // In a real implementation, this would create a Telegram bot
                Alert.alert(
                  '🤖 Telegram Bot Setup',
                  'Search for @AIReplicaBot on Telegram and start a chat. Your AI assistant is ready!',
                  [
                    { 
                      text: 'Open Telegram', 
                      onPress: async () => {
                        await Linking.openURL('https://t.me/AIReplicaBot');
                      }
                    },
                    { 
                      text: 'Mark Connected', 
                      onPress: async () => {
                        await AsyncStorage.setItem('telegram_connected', 'true');
                        resolve({ 
                          success: true, 
                          platform: 'telegram',
                          message: 'Telegram bot @AIReplicaBot ready'
                        });
                      }
                    }
                  ]
                );
              } catch (error) {
                resolve({ success: false, error: error.message });
              }
            }
          }
        ]
      );
    });
  }

  /**
   * Generic platform connection (for future platforms)
   */
  async connectGenericPlatform(platformKey) {
    const platform = this.platforms[platformKey];
    
    return new Promise((resolve) => {
      Alert.alert(
        `${platform.icon} Connect ${platform.name}`,
        `${platform.description}\n\nComing soon! We're working on direct integration.`,
        [
          { text: 'OK', onPress: () => resolve({ success: false, message: 'Coming soon' }) }
        ]
      );
    });
  }

  /**
   * Disconnect platform
   */
  async disconnectPlatform(platformKey) {
    try {
      const platform = this.platforms[platformKey];
      
      if (platformKey === 'whatsapp') {
        return await simpleWhatsAppConnector.disconnect();
      }
      
      // Generic disconnect
      await AsyncStorage.removeItem(`${platformKey}_connected`);
      
      Alert.alert(
        '🔌 Disconnected',
        `${platform.name} has been disconnected successfully.`
      );

      return { success: true };

    } catch (error) {
      console.error(`Error disconnecting ${platformKey}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all platform statuses
   */
  async getAllPlatformStatuses() {
    const statuses = {};
    
    for (const [key, platform] of Object.entries(this.platforms)) {
      try {
        if (key === 'whatsapp') {
          statuses[key] = await simpleWhatsAppConnector.getStatus();
        } else {
          const connected = await AsyncStorage.getItem(`${key}_connected`);
          statuses[key] = {
            platform: key,
            connected: connected === 'true',
            status: connected === 'true' ? 'connected' : 'disconnected',
            name: platform.name,
            icon: platform.icon
          };
        }
      } catch (error) {
        console.error(`Error getting status for ${key}:`, error);
        statuses[key] = {
          platform: key,
          connected: false,
          status: 'error',
          error: error.message
        };
      }
    }
    
    return statuses;
  }

  /**
   * Get connected platforms count
   */
  async getConnectedCount() {
    const statuses = await this.getAllPlatformStatuses();
    return Object.values(statuses).filter(status => status.connected).length;
  }

  /**
   * Send message through platform
   */
  async sendMessage(platformKey, recipient, message) {
    try {
      const platform = this.platforms[platformKey];
      
      if (platformKey === 'whatsapp') {
        return await simpleWhatsAppConnector.sendMessage(recipient, message);
      }
      
      // For other platforms, show "coming soon"
      Alert.alert(
        `${platform.icon} ${platform.name}`,
        'Direct messaging integration coming soon!'
      );
      
      return { success: false, message: 'Not implemented yet' };

    } catch (error) {
      console.error(`Error sending message via ${platformKey}:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new SimpleIntegrationManager();
