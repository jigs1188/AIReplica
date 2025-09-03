/**
 * Centralized OAuth Manager
 * Coordinates OAuth flows for all platforms with simplified user experience
 */

import userAuthService from './userAuthService';
import backendAPIService from './cleanBackendAPIService';
import configurationManager from './configurationManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OAuthManager {
  constructor() {
    this.supportedPlatforms = {
      whatsapp: {
        name: 'WhatsApp Business',
        description: 'Auto-reply to WhatsApp messages',
        icon: '💬',
        color: '#25D366',
        category: 'messaging'
      },
      instagram: {
        name: 'Instagram',
        description: 'Respond to Instagram DMs',
        icon: '📷',
        color: '#E4405F',
        category: 'social'
      },
      facebook: {
        name: 'Facebook',
        description: 'Handle Facebook Messenger',
        icon: '📘',
        color: '#1877F2',
        category: 'social'
      },
      gmail: {
        name: 'Gmail',
        description: 'Auto-reply to emails',
        icon: '📧',
        color: '#EA4335',
        category: 'email'
      },
      linkedin: {
        name: 'LinkedIn',
        description: 'Professional networking messages',
        icon: '💼',
        color: '#0077B5',
        category: 'professional'
      },
      twitter: {
        name: 'Twitter/X',
        description: 'Respond to DMs and mentions',
        icon: '🐦',
        color: '#1DA1F2',
        category: 'social'
      },
      slack: {
        name: 'Slack',
        description: 'Team communication',
        icon: '💬',
        color: '#4A154B',
        category: 'work'
      },
      discord: {
        name: 'Discord',
        description: 'Gaming and community chats',
        icon: '🎮',
        color: '#5865F2',
        category: 'gaming'
      },
      telegram: {
        name: 'Telegram',
        description: 'Secure messaging',
        icon: '✈️',
        color: '#0088CC',
        category: 'messaging'
      },
      sms: {
        name: 'SMS/Text',
        description: 'Text message responses',
        icon: '📱',
        color: '#F22F46',
        category: 'messaging'
      }
    };

    this.connectionStates = {};
  }

  /**
   * Get platforms available for user's subscription plan
   */
  async getAvailablePlatforms() {
    try {
      const userPlan = await userAuthService.getUserPlan();
      const allPlatforms = Object.entries(this.supportedPlatforms);

      const planLimits = {
        free: 1,      // WhatsApp only
        pro: 5,       // Top 5 platforms
        business: 10  // All platforms
      };

      const availableCount = planLimits[userPlan] || 1;
      
      // Get connection statuses
      const statuses = await this.getPlatformStatuses();

      return allPlatforms.slice(0, availableCount).map(([key, platform]) => ({
        key,
        ...platform,
        isConnected: statuses[key]?.isConnected || false,
        isAvailable: true
      }));

    } catch (error) {
      console.error('Failed to get available platforms:', error);
      return [];
    }
  }

  /**
   * Connect platform with simplified OAuth flow
   */
  async connectPlatform(platformKey) {
    try {
      console.log(`🔗 Starting simplified connection for ${platformKey}...`);

      if (!this.supportedPlatforms[platformKey]) {
        throw new Error(`Platform ${platformKey} is not supported`);
      }

      // Check if user can connect more platforms
      const canConnect = await userAuthService.canConnectMorePlatforms();
      if (!canConnect) {
        return {
          success: false,
          error: 'Upgrade your plan to connect more platforms',
          upgradeRequired: true
        };
      }

      // Update connection state
      this.connectionStates[platformKey] = {
        status: 'connecting',
        startTime: Date.now()
      };

      // For production: This would open OAuth flow in browser/webview
      // For demo: Simulate the simplified OAuth process
      const result = await this.simulateSimplifiedOAuth(platformKey);

      if (result.success) {
        // Save configuration
        await configurationManager.saveConfiguration(platformKey, result.config);
        
        // Track platform connection
        await userAuthService.trackPlatformConnection(platformKey);
        
        // Update connection state
        this.connectionStates[platformKey] = {
          status: 'connected',
          connectedAt: Date.now()
        };

        // Store platform status
        await this.updatePlatformStatus(platformKey, 'connected');

        console.log(`✅ ${platformKey} connected successfully!`);
      } else {
        this.connectionStates[platformKey] = {
          status: 'failed',
          error: result.error
        };
      }

      return result;

    } catch (error) {
      console.error(`❌ Failed to connect ${platformKey}:`, error);
      
      this.connectionStates[platformKey] = {
        status: 'failed',
        error: error.message
      };

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect platform
   */
  async disconnectPlatform(platformKey) {
    try {
      console.log(`🔌 Disconnecting ${platformKey}...`);

      // Clear configuration
      await configurationManager.clearConfiguration(platformKey);
      
      // Update platform status
      await this.updatePlatformStatus(platformKey, 'disconnected');
      
      // Update connection state
      this.connectionStates[platformKey] = {
        status: 'disconnected',
        disconnectedAt: Date.now()
      };

      console.log(`✅ ${platformKey} disconnected successfully`);

      return {
        success: true,
        message: `${this.supportedPlatforms[platformKey].name} disconnected successfully`
      };

    } catch (error) {
      console.error(`❌ Failed to disconnect ${platformKey}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all platform connection statuses
   */
  async getPlatformStatuses() {
    try {
      const statusData = await AsyncStorage.getItem('platform_statuses') || '{}';
      return JSON.parse(statusData);
    } catch (error) {
      console.error('Failed to get platform statuses:', error);
      return {};
    }
  }

  /**
   * Update platform status
   */
  async updatePlatformStatus(platformKey, status) {
    try {
      const statuses = await this.getPlatformStatuses();
      
      statuses[platformKey] = {
        status,
        isConnected: status === 'connected',
        lastUpdated: new Date().toISOString(),
        platform: this.supportedPlatforms[platformKey]
      };

      await AsyncStorage.setItem('platform_statuses', JSON.stringify(statuses));
    } catch (error) {
      console.error(`Failed to update ${platformKey} status:`, error);
    }
  }

  /**
   * Simulate simplified OAuth flow (for demo)
   */
  async simulateSimplifiedOAuth(platformKey) {
    try {
      console.log(`🔄 Starting OAuth simulation for ${platformKey}...`);
      
      // Step 1: Show "Connecting..." message
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log(`📱 Opening ${this.supportedPlatforms[platformKey].name} permission screen...`);
      
      // Step 2: Simulate user granting permissions
      await new Promise(resolve => setTimeout(resolve, 1200));
      console.log(`✅ User granted permissions for ${this.supportedPlatforms[platformKey].name}`);
      
      // Step 3: Backend exchanges tokens
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log(`🔄 Backend processing OAuth tokens...`);

      // Generate mock configuration for the platform
      const config = this.generatePlatformConfig(platformKey);

      console.log(`💾 ${this.supportedPlatforms[platformKey].name} connected successfully!`);

      return {
        success: true,
        config,
        platform: platformKey,
        message: `${this.supportedPlatforms[platformKey].name} connected! Auto-reply is now available.`
      };

    } catch (error) {
      console.error(`❌ OAuth simulation failed for ${platformKey}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate platform-specific configuration
   */
  generatePlatformConfig(platformKey) {
    const baseConfig = {
      platform: platformKey,
      connectedAt: new Date().toISOString(),
      isOAuthConnected: true,
      status: 'active',
      autoReplyEnabled: false // User needs to enable this
    };

    const platformConfigs = {
      whatsapp: {
        ...baseConfig,
        accessToken: 'EAAwhatsapp_' + Math.random().toString(36),
        phoneNumberId: '1234567890',
        businessAccountId: 'business_' + Math.random().toString(36).substring(2, 8),
        expiresAt: Date.now() + (60 * 24 * 60 * 60 * 1000) // 60 days
      },
      instagram: {
        ...baseConfig,
        accessToken: 'IGAAinstagram_' + Math.random().toString(36),
        instagramAccountId: 'ig_' + Math.random().toString(36).substring(2, 8),
        pageId: 'page_' + Math.random().toString(36).substring(2, 8)
      },
      facebook: {
        ...baseConfig,
        accessToken: 'EAAFacebook_' + Math.random().toString(36),
        pageId: 'fb_page_' + Math.random().toString(36).substring(2, 8)
      },
      gmail: {
        ...baseConfig,
        accessToken: 'gmail_access_' + Math.random().toString(36),
        refreshToken: 'gmail_refresh_' + Math.random().toString(36),
        scope: 'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.readonly'
      },
      linkedin: {
        ...baseConfig,
        accessToken: 'linkedin_' + Math.random().toString(36),
        scope: 'r_liteprofile w_member_social'
      },
      twitter: {
        ...baseConfig,
        accessToken: 'twitter_access_' + Math.random().toString(36),
        accessSecret: 'twitter_secret_' + Math.random().toString(36),
        userId: 'twitter_user_' + Math.random().toString(36).substring(2, 8)
      },
      slack: {
        ...baseConfig,
        botToken: 'xoxb-' + Math.random().toString(36),
        teamId: 'T' + Math.random().toString(36).substring(2, 10),
        userId: 'U' + Math.random().toString(36).substring(2, 10)
      },
      discord: {
        ...baseConfig,
        botToken: 'discord_bot_' + Math.random().toString(36),
        guildId: 'guild_' + Math.random().toString(36).substring(2, 8)
      },
      telegram: {
        ...baseConfig,
        botToken: 'telegram_' + Math.random().toString(36),
        chatId: 'chat_' + Math.random().toString(36).substring(2, 8)
      },
      sms: {
        ...baseConfig,
        accountSid: 'twilio_sid_' + Math.random().toString(36).substring(2, 8),
        phoneNumber: '+1234567890'
      }
    };

    return platformConfigs[platformKey] || baseConfig;
  }

  /**
   * Enable/disable auto-reply for platform
   */
  async toggleAutoReply(platformKey, enabled) {
    try {
      const config = await configurationManager.getConfiguration(platformKey);
      
      if (!config) {
        throw new Error(`${platformKey} is not connected`);
      }

      const updatedConfig = {
        ...config,
        autoReplyEnabled: enabled,
        autoReplyUpdatedAt: new Date().toISOString()
      };

      await configurationManager.saveConfiguration(platformKey, updatedConfig);

      console.log(`🔄 Auto-reply ${enabled ? 'enabled' : 'disabled'} for ${platformKey}`);

      return {
        success: true,
        enabled,
        platform: this.supportedPlatforms[platformKey].name
      };

    } catch (error) {
      console.error(`❌ Failed to toggle auto-reply for ${platformKey}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get dashboard summary for user
   */
  async getDashboardSummary() {
    try {
      const availablePlatforms = await this.getAvailablePlatforms();
      const statuses = await this.getPlatformStatuses();
      const userStats = await userAuthService.getUsageStats();

      const summary = {
        user: await userAuthService.getStoredUserProfile(),
        platforms: availablePlatforms.map(platform => ({
          ...platform,
          isConnected: statuses[platform.key]?.isConnected || false,
          autoReplyEnabled: statuses[platform.key]?.autoReplyEnabled || false,
          lastActivity: statuses[platform.key]?.lastActivity
        })),
        stats: {
          connectedPlatforms: availablePlatforms.filter(p => statuses[p.key]?.isConnected).length,
          totalPlatforms: availablePlatforms.length,
          messagesThisMonth: userStats.messagesThisMonth,
          lastActive: userStats.lastActive
        },
        plan: await userAuthService.getUserPlan()
      };

      return {
        success: true,
        summary
      };

    } catch (error) {
      console.error('❌ Failed to get dashboard summary:', error);
      return {
        success: false,
        error: error.message,
        summary: null
      };
    }
  }

  /**
   * Quick setup flow for first-time users
   */
  async quickSetupFlow(selectedPlatforms = ['whatsapp']) {
    try {
      console.log('🚀 Starting quick setup flow...');
      
      const results = {};
      
      for (const platformKey of selectedPlatforms) {
        console.log(`🔗 Setting up ${platformKey}...`);
        const result = await this.connectPlatform(platformKey);
        results[platformKey] = result;
        
        // Small delay between connections
        if (selectedPlatforms.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = Object.values(results).filter(r => r.success).length;
      const totalCount = selectedPlatforms.length;

      console.log(`✅ Quick setup completed: ${successCount}/${totalCount} platforms connected`);

      return {
        success: successCount > 0,
        results,
        connectedCount: successCount,
        totalCount,
        message: `Connected ${successCount} out of ${totalCount} platforms successfully!`
      };

    } catch (error) {
      console.error('❌ Quick setup flow failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get connection progress for platform
   */
  getConnectionProgress(platformKey) {
    return this.connectionStates[platformKey] || { status: 'not_started' };
  }

  /**
   * Check if platform is connected
   */
  async isPlatformConnected(platformKey) {
    try {
      const statuses = await this.getPlatformStatuses();
      return statuses[platformKey]?.isConnected || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get platforms grouped by category
   */
  async getPlatformsByCategory() {
    try {
      const availablePlatforms = await this.getAvailablePlatforms();
      
      const grouped = {};
      
      availablePlatforms.forEach(platform => {
        const category = platform.category;
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(platform);
      });

      return grouped;
    } catch (error) {
      console.error('Failed to group platforms by category:', error);
      return {};
    }
  }

  /**
   * Validate platform configuration
   */
  async validatePlatformConfiguration(platformKey) {
    try {
      const config = await configurationManager.getConfiguration(platformKey);
      
      if (!config) {
        return { valid: false, error: 'Platform not configured' };
      }

      if (!config.isOAuthConnected) {
        return { valid: false, error: 'OAuth connection required' };
      }

      // Platform-specific validation
      const validationRules = {
        whatsapp: ['accessToken', 'phoneNumberId'],
        instagram: ['accessToken', 'instagramAccountId'],
        gmail: ['accessToken', 'refreshToken'],
        slack: ['botToken'],
        // Add more as needed
      };

      const requiredFields = validationRules[platformKey] || ['accessToken'];
      const missingFields = requiredFields.filter(field => !config[field]);

      if (missingFields.length > 0) {
        return { 
          valid: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Bulk enable/disable auto-reply for all connected platforms
   */
  async toggleAllAutoReply(enabled) {
    try {
      const statuses = await this.getPlatformStatuses();
      const connectedPlatforms = Object.keys(statuses).filter(
        key => statuses[key].isConnected
      );

      const results = {};
      
      for (const platformKey of connectedPlatforms) {
        const result = await this.toggleAutoReply(platformKey, enabled);
        results[platformKey] = result;
      }

      const successCount = Object.values(results).filter(r => r.success).length;

      return {
        success: successCount > 0,
        results,
        message: `Auto-reply ${enabled ? 'enabled' : 'disabled'} for ${successCount} platforms`
      };

    } catch (error) {
      console.error('❌ Failed to toggle all auto-reply:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats() {
    try {
      const statuses = await this.getPlatformStatuses();
      const availablePlatforms = await this.getAvailablePlatforms();

      const connected = Object.values(statuses).filter(s => s.isConnected).length;
      const autoReplyEnabled = Object.values(statuses).filter(
        s => s.isConnected && s.autoReplyEnabled
      ).length;

      return {
        totalAvailable: availablePlatforms.length,
        connected,
        autoReplyEnabled,
        connectionRate: connected / availablePlatforms.length,
        autoReplyRate: autoReplyEnabled / Math.max(connected, 1)
      };
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return {
        totalAvailable: 0,
        connected: 0,
        autoReplyEnabled: 0,
        connectionRate: 0,
        autoReplyRate: 0
      };
    }
  }
}

// Export singleton instance
export default new OAuthManager();
