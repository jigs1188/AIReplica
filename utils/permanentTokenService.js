import configurationManager from './configurationManager';

class PermanentTokenService {
  constructor() {
    this.facebookAppId = null;
    this.facebookAppSecret = null;
    this.temporaryToken = null;
    this.permanentToken = null;
  }

  // Step 1: Generate permanent access token from temporary token
  async generatePermanentToken(temporaryToken, appId, appSecret) {
    try {
      this.temporaryToken = temporaryToken;
      this.facebookAppId = appId;
      this.facebookAppSecret = appSecret;

      console.log('Generating permanent access token...');

      // Exchange short-lived token for long-lived token (60 days)
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v17.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${appId}&` +
        `client_secret=${appSecret}&` +
        `fb_exchange_token=${temporaryToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const longLivedData = await longLivedResponse.json();

      if (!longLivedResponse.ok) {
        throw new Error(longLivedData.error?.message || 'Failed to exchange token');
      }

      this.permanentToken = longLivedData.access_token;
      
      // Get token expiration info
      const tokenInfo = await this.getTokenInfo(this.permanentToken);
      
      console.log('Permanent token generated successfully');
      console.log('Token expires:', tokenInfo.expiresAt);

      return {
        success: true,
        permanentToken: this.permanentToken,
        expiresIn: longLivedData.expires_in,
        expiresAt: tokenInfo.expiresAt,
        type: 'long_lived'
      };

    } catch (error) {
      console.error('Error generating permanent token:', error);
      return { success: false, error: error.message };
    }
  }

  // Get token information including expiration
  async getTokenInfo(accessToken) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/me?access_token=${accessToken}&fields=id,name`,
        {
          method: 'GET'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get token info');
      }

      // Get token debug info
      const debugResponse = await fetch(
        `https://graph.facebook.com/v17.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`,
        {
          method: 'GET'
        }
      );

      const debugData = await debugResponse.json();

      const expiresAt = debugData.data?.expires_at 
        ? new Date(debugData.data.expires_at * 1000).toISOString()
        : 'Never (permanent)';

      return {
        success: true,
        userId: data.id,
        userName: data.name,
        expiresAt: expiresAt,
        isValid: debugData.data?.is_valid || false,
        scopes: debugData.data?.scopes || []
      };

    } catch (error) {
      console.error('Error getting token info:', error);
      return { success: false, error: error.message };
    }
  }

  // Save permanent WhatsApp Business configuration
  async savePermanentWhatsAppConfig(config) {
    try {
      const permanentConfig = {
        accessToken: config.accessToken,
        phoneNumberId: config.phoneNumberId,
        webhookVerifyToken: config.webhookVerifyToken,
        appId: config.appId,
        appSecret: config.appSecret,
        businessAccountId: config.businessAccountId,
        isPermanent: true,
        createdAt: new Date().toISOString(),
        tokenType: 'long_lived',
        expiresAt: config.expiresAt
      };

      // Save using configuration manager for cloud sync
      const result = await configurationManager.saveConfiguration('whatsapp', permanentConfig);
      
      if (result.success) {
        console.log('Permanent WhatsApp configuration saved with cloud sync');
      }

      return result;

    } catch (error) {
      console.error('Error saving permanent WhatsApp config:', error);
      return { success: false, error: error.message };
    }
  }

  // Auto-refresh token before expiration
  async refreshTokenIfNeeded(platform = 'whatsapp') {
    try {
      const configResult = await configurationManager.getConfiguration(platform);
      
      if (!configResult.success || !configResult.config) {
        return { success: false, error: 'No configuration found' };
      }

      const config = configResult.config;
      
      // Check if token expires within 7 days
      if (config.expiresAt && config.expiresAt !== 'Never (permanent)') {
        const expiryDate = new Date(config.expiresAt);
        const now = new Date();
        const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry <= 7) {
          console.log(`Token expires in ${Math.floor(daysUntilExpiry)} days, refreshing...`);
          
          // Generate new long-lived token
          const refreshResult = await this.generatePermanentToken(
            config.accessToken,
            config.appId,
            config.appSecret
          );

          if (refreshResult.success) {
            // Update configuration with new token
            const updatedConfig = {
              ...config,
              accessToken: refreshResult.permanentToken,
              expiresAt: refreshResult.expiresAt,
              lastRefreshed: new Date().toISOString()
            };

            await configurationManager.saveConfiguration(platform, updatedConfig);
            
            return { 
              success: true, 
              message: 'Token refreshed successfully',
              newExpiryDate: refreshResult.expiresAt
            };
          }

          return refreshResult;
        }

        return { 
          success: true, 
          message: `Token valid for ${Math.floor(daysUntilExpiry)} more days` 
        };
      }

      return { success: true, message: 'Token is permanent or expiry unknown' };

    } catch (error) {
      console.error('Error refreshing token:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate current tokens for all platforms
  async validateAllTokens() {
    try {
      const allConfigsResult = await configurationManager.getAllConfigurations();
      
      if (!allConfigsResult.success) {
        return { success: false, error: allConfigsResult.error };
      }

      const validationResults = {};
      const configurations = allConfigsResult.configurations;

      for (const [platform, config] of Object.entries(configurations)) {
        if (config && config.accessToken) {
          try {
            let isValid = false;
            
            switch (platform) {
              case 'whatsapp':
              case 'instagram':
              case 'facebook':
                // Facebook Graph API validation
                const tokenInfo = await this.getTokenInfo(config.accessToken);
                isValid = tokenInfo.success && tokenInfo.isValid;
                validationResults[platform] = {
                  isValid,
                  expiresAt: tokenInfo.expiresAt,
                  error: tokenInfo.error || null
                };
                break;
              
              default:
                // For other platforms, assume valid if config exists
                validationResults[platform] = {
                  isValid: true,
                  expiresAt: 'Unknown',
                  error: null
                };
            }
          } catch (error) {
            validationResults[platform] = {
              isValid: false,
              expiresAt: 'Unknown',
              error: error.message
            };
          }
        } else {
          validationResults[platform] = {
            isValid: false,
            expiresAt: 'Not configured',
            error: 'No access token found'
          };
        }
      }

      return { success: true, validationResults };

    } catch (error) {
      console.error('Error validating tokens:', error);
      return { success: false, error: error.message };
    }
  }

  // Get permanent token setup instructions
  getPermanentTokenSetupGuide() {
    return {
      title: "WhatsApp Business API - Permanent Access Token Setup",
      steps: [
        {
          step: 1,
          title: "Facebook App Configuration",
          description: "Create a Facebook App with WhatsApp Business API permissions",
          details: [
            "Go to https://developers.facebook.com/apps/",
            "Create a new app and select 'Business' type",
            "Add WhatsApp Business API product",
            "Note down your App ID and App Secret"
          ]
        },
        {
          step: 2,
          title: "System User Creation",
          description: "Create a system user for permanent tokens",
          details: [
            "Go to Facebook Business Manager",
            "Users > System Users",
            "Create new system user with admin permissions",
            "Generate access token with whatsapp_business_management permissions"
          ]
        },
        {
          step: 3,
          title: "Token Exchange",
          description: "Exchange temporary token for permanent token",
          details: [
            "Use the temporary token from Graph API Explorer",
            "Enter App ID and App Secret in the app",
            "The app will automatically exchange for a 60-day token",
            "System user tokens don't expire automatically"
          ]
        },
        {
          step: 4,
          title: "WhatsApp Business Account",
          description: "Configure WhatsApp Business Account",
          details: [
            "Add phone number to WhatsApp Business Account",
            "Verify phone number",
            "Note the Phone Number ID",
            "Set up webhook URL for message receiving"
          ]
        }
      ],
      requirements: [
        "Facebook Developer Account",
        "Facebook Business Manager Account",
        "WhatsApp Business Account",
        "Verified phone number",
        "Valid webhook URL (use ngrok for testing)"
      ],
      notes: [
        "System user tokens are the most permanent option",
        "Long-lived tokens last 60 days and can be refreshed",
        "The app automatically handles token refresh",
        "All configurations are synced to cloud storage"
      ]
    };
  }
}

export default new PermanentTokenService();
