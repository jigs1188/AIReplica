import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FacebookAPI {
  constructor() {
    this.accessToken = null;
    this.pageId = null;
    this.appId = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        // Web platform specific initialization
        console.log('Facebook API available on web');
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('facebook_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.accessToken = config.accessToken;
        this.pageId = config.pageId;
        this.appId = config.appId;
      }

      this.isInitialized = true;
      console.log('Facebook API initialized');
      return true;
      
    } catch (error) {
      console.error('Facebook API initialization failed:', error);
      return false;
    }
  }

  async setupCredentials(accessToken, pageId, appId) {
    try {
      const config = {
        accessToken,
        pageId,
        appId,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('facebook_config', JSON.stringify(config));
      
      this.accessToken = accessToken;
      this.pageId = pageId;
      this.appId = appId;

      // Test the credentials
      const testResult = await this.testConnection();
      if (testResult.success) {
        console.log('Facebook credentials validated');
        return { success: true, message: 'Facebook credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid Facebook credentials: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save Facebook credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.accessToken || !this.pageId) {
        return { success: false, error: 'Missing access token or page ID' };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.pageId}?fields=name,followers_count&access_token=${this.accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          pageName: data.name,
          followers: data.followers_count
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Facebook connection failed'
        };
      }
      
    } catch (error) {
      return { success: false, error: 'Facebook test error: ' + error.message };
    }
  }

  async sendMessage(recipientId, message) {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Facebook API not configured' };
      }

      const messageData = {
        recipient: { id: recipientId },
        message: { text: message }
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.pageId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...messageData,
            access_token: this.accessToken
          })
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.message_id,
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Facebook message error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'Failed to send Facebook message'
        };
      }
      
    } catch (error) {
      console.error('Facebook send message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getMessages(conversationId, limit = 20) {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Facebook API not configured' };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${conversationId}/messages?limit=${limit}&access_token=${this.accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        const messages = data.data.map(msg => ({
          id: msg.id,
          content: msg.message,
          timestamp: msg.created_time,
          from: msg.from?.name || msg.from?.id,
          platform: 'facebook'
        }));

        return {
          success: true,
          messages: messages.reverse() // Order by oldest first
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Failed to fetch Facebook messages'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getConversations() {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Facebook API not configured' };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.pageId}/conversations?access_token=${this.accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        const conversations = data.data.map(conv => ({
          id: conv.id,
          updated: conv.updated_time,
          messageCount: conv.message_count,
          platform: 'facebook'
        }));

        return {
          success: true,
          conversations
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Failed to fetch Facebook conversations'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async postToFeed(message, imageUrl = null) {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Facebook API not configured' };
      }

      const postData = {
        message,
        access_token: this.accessToken
      };

      if (imageUrl) {
        postData.url = imageUrl;
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.pageId}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          postId: responseData.id,
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Facebook post error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'Failed to post to Facebook'
        };
      }
      
    } catch (error) {
      console.error('Facebook post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleWebhookMessage(webhookData) {
    try {
      console.log('Facebook webhook received:', webhookData);

      // Extract message data from Facebook webhook
      const entry = webhookData.entry?.[0];
      const messaging = entry?.messaging?.[0];
      
      if (!messaging) {
        return { success: false, error: 'Invalid Facebook webhook format' };
      }

      const messageData = {
        id: messaging.message?.mid,
        senderId: messaging.sender?.id,
        recipientId: messaging.recipient?.id,
        content: messaging.message?.text,
        timestamp: new Date(messaging.timestamp).toISOString(),
        platform: 'facebook',
        isPageScopedId: true
      };

      return {
        success: true,
        messageData,
        platform: 'facebook',
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing Facebook webhook:', error);
      return { success: false, error: error.message };
    }
  }

  isConfigured() {
    return !!(this.accessToken && this.pageId);
  }

  getConfiguration() {
    return {
      hasAccessToken: !!this.accessToken,
      hasPageId: !!this.pageId,
      hasAppId: !!this.appId,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('facebook_config');
      this.accessToken = null;
      this.pageId = null;
      this.appId = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Facebook configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const facebookAPI = new FacebookAPI();

// Facebook utility functions
export const FacebookUtils = {
  // Validate Facebook Page ID
  isValidPageId: (pageId) => {
    return /^\d{10,20}$/.test(pageId);
  },

  // Format Facebook message for display
  formatMessage: (message) => {
    if (!message) return '';
    
    // Handle Facebook-specific formatting
    return message
      .replace(/\n/g, '\n')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  },

  // Extract user ID from page-scoped ID
  getPageScopedUserId: (senderId) => {
    return senderId; // Facebook already provides page-scoped IDs
  },

  // Check if message contains media
  hasMedia: (messageData) => {
    return !!(
      messageData.attachments ||
      messageData.image ||
      messageData.video ||
      messageData.audio
    );
  },

  // Get media URLs from message
  getMediaUrls: (messageData) => {
    const urls = [];
    
    if (messageData.attachments) {
      messageData.attachments.forEach(attachment => {
        if (attachment.payload?.url) {
          urls.push(attachment.payload.url);
        }
      });
    }

    return urls;
  },

  // Check if user has read permission
  hasReadPermission: (permissions) => {
    const requiredPerms = ['pages_messaging', 'pages_show_list'];
    return requiredPerms.every(perm => permissions.includes(perm));
  },

  // Generate webhook verification challenge
  verifyWebhook: (mode, token, challenge, verifyToken) => {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }
};
