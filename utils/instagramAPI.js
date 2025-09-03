import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class InstagramAPI {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.accessToken = null;
    this.instagramAccountId = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.warn('Instagram API not available on web platform');
        return false;
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('instagram_business_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.accessToken = config.accessToken;
        this.instagramAccountId = config.instagramAccountId;
      }

      this.isInitialized = true;
      console.log('Instagram API initialized');
      return true;
      
    } catch (error) {
      console.error('Instagram API initialization failed:', error);
      return false;
    }
  }

  async setupCredentials(accessToken, instagramAccountId) {
    try {
      this.accessToken = accessToken;
      this.instagramAccountId = instagramAccountId;

      // Store credentials securely
      const config = {
        accessToken,
        instagramAccountId,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('instagram_business_config', JSON.stringify(config));
      
      // Test the credentials
      const testResult = await this.testConnection();
      if (testResult.success) {
        console.log('Instagram API credentials validated');
        return { success: true, message: 'Credentials saved and validated successfully' };
      } else {
        return { success: false, error: 'Invalid credentials: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        return { success: false, error: 'Missing access token or Instagram account ID' };
      }

      const response = await fetch(
        `${this.baseURL}/${this.instagramAccountId}?fields=id,username,followers_count&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: 'Connection successful',
          username: data.username || 'Unknown',
          followers: data.followers_count || 0
        };
      } else {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error?.message || 'Connection failed'
        };
      }
      
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  async getMessages() {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error('Instagram API not configured');
      }

      const response = await fetch(
        `${this.baseURL}/${this.instagramAccountId}/conversations?fields=id,participants,updated_time&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          conversations: data.data || []
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Failed to get messages'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendMessage(recipientId, message) {
    try {
      if (!this.accessToken || !this.instagramAccountId) {
        throw new Error('Instagram API not configured');
      }

      const payload = {
        recipient: { id: recipientId },
        message: { text: message }
      };

      const response = await fetch(
        `${this.baseURL}/${this.instagramAccountId}/messages?access_token=${this.accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.message_id,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Instagram send error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'Failed to send message'
        };
      }
      
    } catch (error) {
      console.error('Instagram send message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleWebhookMessage(webhookData) {
    try {
      // Process Instagram webhook
      const entry = webhookData.entry?.[0];
      if (!entry || !entry.messaging) {
        return { success: false, error: 'Invalid Instagram webhook data' };
      }

      const results = [];
      for (const messagingEvent of entry.messaging) {
        if (messagingEvent.message) {
          const result = await this.processIncomingMessage(messagingEvent);
          results.push(result);
        }
      }

      return { success: true, processedMessages: results };
      
    } catch (error) {
      console.error('Instagram webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async processIncomingMessage(messagingEvent) {
    try {
      const messageData = {
        id: messagingEvent.message.mid,
        from: messagingEvent.sender.id,
        timestamp: messagingEvent.timestamp,
        content: messagingEvent.message.text || '[Media Message]',
        platform: 'instagram'
      };

      console.log('Processing Instagram message:', messageData);
      return {
        success: true,
        messageData,
        platform: 'instagram',
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing Instagram message:', error);
      return { success: false, error: error.message };
    }
  }

  isConfigured() {
    return !!(this.accessToken && this.instagramAccountId);
  }

  getConfiguration() {
    return {
      hasAccessToken: !!this.accessToken,
      hasInstagramAccountId: !!this.instagramAccountId,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('instagram_business_config');
      this.accessToken = null;
      this.instagramAccountId = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const instagramAPI = new InstagramAPI();

// Instagram utility functions
export const InstagramUtils = {
  // Validate Instagram username format
  isValidUsername: (username) => {
    return /^[a-zA-Z0-9_.]{1,30}$/.test(username);
  },

  // Format message for Instagram (max 1000 characters)
  formatMessage: (message) => {
    if (message.length > 1000) {
      return message.substring(0, 997) + '...';
    }
    return message;
  },

  // Extract mentions from message
  extractMentions: (message) => {
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  },

  // Extract hashtags from message
  extractHashtags: (message) => {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(message)) !== null) {
      hashtags.push(match[1]);
    }
    return hashtags;
  }
};
