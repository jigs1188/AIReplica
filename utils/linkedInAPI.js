import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LinkedInAPI {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
    this.accessToken = null;
    this.personId = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.warn('LinkedIn API not available on web platform');
        return false;
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('linkedin_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.accessToken = config.accessToken;
        this.personId = config.personId;
      }

      this.isInitialized = true;
      console.log('LinkedIn API initialized');
      return true;
      
    } catch (error) {
      console.error('LinkedIn API initialization failed:', error);
      return false;
    }
  }

  async setupCredentials(accessToken) {
    try {
      this.accessToken = accessToken;

      // Get person ID from LinkedIn
      const profileResult = await this.getProfile();
      if (profileResult.success) {
        this.personId = profileResult.profile.id;
        
        const config = {
          accessToken,
          personId: this.personId,
          setupDate: new Date().toISOString()
        };

        await AsyncStorage.setItem('linkedin_config', JSON.stringify(config));
        
        console.log('LinkedIn API credentials validated');
        return { success: true, message: 'LinkedIn credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid LinkedIn credentials: ' + profileResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save LinkedIn credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.accessToken) {
        return { success: false, error: 'Missing access token' };
      }

      const profileResult = await this.getProfile();
      return profileResult;
      
    } catch (error) {
      return { success: false, error: 'Connection test failed: ' + error.message };
    }
  }

  async getProfile() {
    try {
      const response = await fetch(
        `${this.baseURL}/people/~:(id,firstName,lastName,headline,profilePicture(displayImage~:playableStreams))`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          profile: {
            id: data.id,
            name: `${data.firstName?.localized?.en_US || ''} ${data.lastName?.localized?.en_US || ''}`.trim(),
            headline: data.headline?.localized?.en_US || '',
            profilePicture: data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || null
          }
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to get profile'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendMessage(recipientId, message) {
    try {
      if (!this.accessToken || !this.personId) {
        throw new Error('LinkedIn API not configured');
      }

      // LinkedIn messaging requires specific conversation setup
      const conversationPayload = {
        recipients: [recipientId],
        subject: 'AI Assistant Message'
      };

      // Create conversation first
      const conversationResponse = await fetch(
        `${this.baseURL}/conversations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(conversationPayload)
        }
      );

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.json();
        return {
          success: false,
          error: errorData.message || 'Failed to create conversation'
        };
      }

      const conversationData = await conversationResponse.json();
      const conversationId = conversationData.value?.conversationId;

      if (!conversationId) {
        return { success: false, error: 'Failed to get conversation ID' };
      }

      // Send message
      const messagePayload = {
        from: this.personId,
        body: message
      };

      const messageResponse = await fetch(
        `${this.baseURL}/conversations/${conversationId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(messagePayload)
        }
      );

      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        return {
          success: true,
          messageId: messageData.value?.eventId,
          conversationId: conversationId,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
      } else {
        const errorData = await messageResponse.json();
        return {
          success: false,
          error: errorData.message || 'Failed to send message'
        };
      }
      
    } catch (error) {
      console.error('LinkedIn send message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getConversations(maxResults = 20) {
    try {
      if (!this.accessToken) {
        throw new Error('LinkedIn API not configured');
      }

      const response = await fetch(
        `${this.baseURL}/conversations?q=participant&participant=${this.personId}&count=${maxResults}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          conversations: data.elements || [],
          total: data.paging?.total || 0
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to get conversations'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sharePost(content, visibility = 'PUBLIC') {
    try {
      if (!this.accessToken || !this.personId) {
        throw new Error('LinkedIn API not configured');
      }

      const payload = {
        author: `urn:li:person:${this.personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      };

      const response = await fetch(
        `${this.baseURL}/ugcPosts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          postId: data.id,
          status: 'published',
          timestamp: new Date().toISOString()
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to share post'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isConfigured() {
    return !!(this.accessToken && this.personId);
  }

  getConfiguration() {
    return {
      hasAccessToken: !!this.accessToken,
      hasPersonId: !!this.personId,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('linkedin_config');
      this.accessToken = null;
      this.personId = null;
      this.isInitialized = false;
      
      return { success: true, message: 'LinkedIn configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const linkedInAPI = new LinkedInAPI();

// LinkedIn utility functions
export const LinkedInUtils = {
  // Validate LinkedIn profile URL
  isValidLinkedInURL: (url) => {
    return /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/.test(url);
  },

  // Extract username from LinkedIn URL
  extractUsername: (url) => {
    const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9\-]+)/);
    return match ? match[1] : null;
  },

  // Format message for LinkedIn (professional tone)
  formatProfessionalMessage: (message) => {
    // Add professional greeting and closing
    const greeting = 'Hello,\n\n';
    const closing = '\n\nBest regards,\n[AI Assistant]';
    
    return greeting + message + closing;
  },

  // Post visibility options
  getVisibilityOptions: () => [
    { key: 'PUBLIC', label: 'Public', description: 'Visible to everyone' },
    { key: 'CONNECTIONS', label: 'Connections', description: 'Visible to your connections only' },
    { key: 'LOGGED_IN', label: 'LinkedIn Members', description: 'Visible to LinkedIn members' }
  ],

  // Professional hashtags generator
  generateProfessionalHashtags: (content) => {
    const keywords = content.toLowerCase();
    const hashtags = [];
    
    if (keywords.includes('ai') || keywords.includes('artificial intelligence')) {
      hashtags.push('#AI', '#ArtificialIntelligence');
    }
    if (keywords.includes('business') || keywords.includes('professional')) {
      hashtags.push('#Business', '#Professional');
    }
    if (keywords.includes('technology') || keywords.includes('tech')) {
      hashtags.push('#Technology', '#Innovation');
    }
    if (keywords.includes('network') || keywords.includes('connection')) {
      hashtags.push('#Networking', '#ProfessionalGrowth');
    }
    
    return hashtags.slice(0, 5); // Limit to 5 hashtags
  }
};
