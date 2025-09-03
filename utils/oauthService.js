/**
 * OAuth Service for Simplified Platform Integration
 * Handles OAuth flows for all platforms from the backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import configurationManager from './configurationManager';
import aiReplicaBackendAPI from './aiReplicaBackendAPI';

class OAuthService {
  constructor() {
    this.oauthStates = {};
    this.pendingConnections = {};
    this.supportedPlatforms = {
      whatsapp: {
        name: 'WhatsApp Business',
        scopes: ['whatsapp_business_messaging'],
        color: '#25D366'
      },
      instagram: {
        name: 'Instagram',
        scopes: ['instagram_basic', 'instagram_manage_messages'],
        color: '#E4405F'
      },
      facebook: {
        name: 'Facebook',
        scopes: ['pages_messaging', 'pages_manage_metadata'],
        color: '#1877F2'
      },
      gmail: {
        name: 'Gmail',
        scopes: ['https://www.googleapis.com/auth/gmail.compose', 'https://www.googleapis.com/auth/gmail.readonly'],
        color: '#EA4335'
      },
      linkedin: {
        name: 'LinkedIn',
        scopes: ['r_liteprofile', 'w_member_social'],
        color: '#0077B5'
      },
      twitter: {
        name: 'Twitter',
        scopes: ['tweet.read', 'tweet.write', 'users.read'],
        color: '#1DA1F2'
      },
      slack: {
        name: 'Slack',
        scopes: ['channels:read', 'im:write', 'users:read'],
        color: '#4A154B'
      },
      discord: {
        name: 'Discord',
        scopes: ['bot', 'messages.read'],
        color: '#5865F2'
      },
      telegram: {
        name: 'Telegram',
        scopes: ['bot'],
        color: '#0088CC'
      },
      sms: {
        name: 'SMS/Twilio',
        scopes: ['messaging'],
        color: '#F22F46'
      }
    };
  }

  /**
   * Initiate OAuth flow for a platform
   * This will redirect users through simplified OAuth
   */
  async initiateOAuth(platform, userId) {
    try {
      console.log(`🔐 Starting OAuth for ${platform}...`);
      
      if (!this.supportedPlatforms[platform]) {
        throw new Error(`Platform ${platform} is not supported`);
      }

      // Generate secure state parameter
      const state = this.generateSecureState(platform, userId);
      this.oauthStates[state] = {
        platform,
        userId,
        timestamp: Date.now(),
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes
      };

      // For production, this would redirect to your backend OAuth handler
      // For now, we'll simulate the OAuth flow
      const authUrl = await this.buildOAuthURL(platform, state);
      
      // Store pending connection
      this.pendingConnections[platform] = {
        state,
        status: 'pending',
        startTime: Date.now()
      };

      return {
        success: true,
        authUrl,
        state,
        platform: this.supportedPlatforms[platform]
      };

    } catch (error) {
      console.error(`❌ OAuth initiation failed for ${platform}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build OAuth URL for platform
   * In production, this redirects to your backend OAuth handler
   */
  async buildOAuthURL(platform, state) {
    const baseBackendURL = 'https://api.aireplica.com'; // Your production backend
    
    const oauthUrls = {
      whatsapp: `${baseBackendURL}/oauth/whatsapp/authorize?state=${state}`,
      instagram: `${baseBackendURL}/oauth/instagram/authorize?state=${state}`,
      facebook: `${baseBackendURL}/oauth/facebook/authorize?state=${state}`,
      gmail: `${baseBackendURL}/oauth/gmail/authorize?state=${state}`,
      linkedin: `${baseBackendURL}/oauth/linkedin/authorize?state=${state}`,
      twitter: `${baseBackendURL}/oauth/twitter/authorize?state=${state}`,
      slack: `${baseBackendURL}/oauth/slack/authorize?state=${state}`,
      discord: `${baseBackendURL}/oauth/discord/authorize?state=${state}`,
      telegram: `${baseBackendURL}/oauth/telegram/authorize?state=${state}`,
      sms: `${baseBackendURL}/oauth/twilio/authorize?state=${state}`
    };

    return oauthUrls[platform];
  }

  /**
   * Handle OAuth callback from backend
   * Called when user completes OAuth flow
   */
  async handleOAuthCallback(state, authCode, platform) {
    try {
      console.log(`🔄 Processing OAuth callback for ${platform}...`);

      // Validate state parameter
      if (!this.oauthStates[state]) {
        throw new Error('Invalid or expired OAuth state');
      }

      const stateData = this.oauthStates[state];
      
      // Check expiration
      if (Date.now() > stateData.expires) {
        delete this.oauthStates[state];
        throw new Error('OAuth session expired');
      }

      // Exchange auth code for tokens via backend
      const tokenResponse = await aiReplicaBackendAPI.exchangeOAuthCode(
        platform,
        authCode,
        state
      );

      if (!tokenResponse.success) {
        throw new Error(tokenResponse.error || 'Token exchange failed');
      }

      // Save configuration securely
      await this.savePlatformConfiguration(platform, tokenResponse.config);

      // Update connection status
      this.pendingConnections[platform] = {
        state,
        status: 'connected',
        completedTime: Date.now()
      };

      // Clean up state
      delete this.oauthStates[state];

      console.log(`✅ ${platform} connected successfully!`);

      return {
        success: true,
        platform,
        config: tokenResponse.config
      };

    } catch (error) {
      console.error(`❌ OAuth callback failed:`, error);
      
      // Update connection status
      if (this.pendingConnections[platform]) {
        this.pendingConnections[platform].status = 'failed';
        this.pendingConnections[platform].error = error.message;
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save platform configuration after successful OAuth
   */
  async savePlatformConfiguration(platform, config) {
    try {
      // Add platform metadata
      const enrichedConfig = {
        ...config,
        platform,
        connectedAt: new Date().toISOString(),
        isOAuthConnected: true,
        status: 'active'
      };

      // Save via configuration manager (handles cloud sync)
      await configurationManager.saveConfiguration(platform, enrichedConfig);

      // Update local platform status
      await this.updatePlatformStatus(platform, 'connected');

      console.log(`💾 ${platform} configuration saved successfully`);

    } catch (error) {
      console.error(`❌ Failed to save ${platform} configuration:`, error);
      throw error;
    }
  }

  /**
   * Update platform connection status
   */
  async updatePlatformStatus(platform, status) {
    try {
      const platformStatuses = await AsyncStorage.getItem('platformStatuses') || '{}';
      const statuses = JSON.parse(platformStatuses);
      
      statuses[platform] = {
        status,
        lastUpdated: new Date().toISOString(),
        isOAuthConnected: status === 'connected'
      };

      await AsyncStorage.setItem('platformStatuses', JSON.stringify(statuses));
    } catch (error) {
      console.error('Failed to update platform status:', error);
    }
  }

  /**
   * Get all platform connection statuses
   */
  async getAllPlatformStatuses() {
    try {
      const platformStatuses = await AsyncStorage.getItem('platformStatuses') || '{}';
      return JSON.parse(platformStatuses);
    } catch (error) {
      console.error('Failed to get platform statuses:', error);
      return {};
    }
  }

  /**
   * Check if platform is connected via OAuth
   */
  async isPlatformConnected(platform) {
    try {
      const config = await configurationManager.getConfiguration(platform);
      return config && config.isOAuthConnected && config.status === 'active';
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect platform (revoke OAuth)
   */
  async disconnectPlatform(platform, userId) {
    try {
      console.log(`🔌 Disconnecting ${platform}...`);

      // Revoke tokens via backend
      await aiReplicaBackendAPI.revokePlatformAccess(platform, userId);

      // Clear local configuration
      await configurationManager.clearConfiguration(platform);

      // Update status
      await this.updatePlatformStatus(platform, 'disconnected');

      console.log(`✅ ${platform} disconnected successfully`);

      return { success: true };

    } catch (error) {
      console.error(`❌ Failed to disconnect ${platform}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate secure state parameter for OAuth
   */
  generateSecureState(platform, userId) {
    const randomBytes = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return `${platform}_${userId}_${timestamp}_${randomBytes}`;
  }

  /**
   * Get platform connection summary for dashboard
   */
  async getPlatformSummary() {
    try {
      const statuses = await this.getAllPlatformStatuses();
      const summary = {};

      for (const [platform, platformInfo] of Object.entries(this.supportedPlatforms)) {
        const status = statuses[platform];
        summary[platform] = {
          ...platformInfo,
          isConnected: status?.status === 'connected',
          lastUpdated: status?.lastUpdated,
          needsSetup: !status || status.status !== 'connected'
        };
      }

      return summary;
    } catch (error) {
      console.error('Failed to get platform summary:', error);
      return {};
    }
  }

  /**
   * Refresh expired tokens automatically
   */
  async refreshExpiredTokens(userId) {
    try {
      const statuses = await this.getAllPlatformStatuses();
      const refreshResults = {};

      for (const platform of Object.keys(statuses)) {
        if (statuses[platform].status === 'connected') {
          try {
            const refreshResult = await aiReplicaBackendAPI.refreshPlatformTokens(platform, userId);
            refreshResults[platform] = refreshResult;

            if (refreshResult.success) {
              await this.savePlatformConfiguration(platform, refreshResult.config);
            }
          } catch (error) {
            console.error(`Failed to refresh ${platform} tokens:`, error);
            refreshResults[platform] = { success: false, error: error.message };
          }
        }
      }

      return refreshResults;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      return {};
    }
  }

  /**
   * Get OAuth connection progress
   */
  getConnectionProgress(platform) {
    return this.pendingConnections[platform] || { status: 'not_started' };
  }

  /**
   * Clean up expired OAuth states
   */
  cleanupExpiredStates() {
    const now = Date.now();
    for (const [state, data] of Object.entries(this.oauthStates)) {
      if (now > data.expires) {
        delete this.oauthStates[state];
      }
    }
  }
}

// Export singleton instance
export default new OAuthService();
