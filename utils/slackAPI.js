import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SlackAPI {
  constructor() {
    this.baseURL = 'https://slack.com/api';
    this.botToken = null;
    this.userToken = null;
    this.teamId = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.warn('Slack API limited functionality on web platform');
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('slack_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.botToken = config.botToken;
        this.userToken = config.userToken;
        this.teamId = config.teamId;
      }

      this.isInitialized = true;
      console.log('Slack API initialized');
      return true;
      
    } catch (error) {
      console.error('Slack API initialization failed:', error);
      return false;
    }
  }

  async setupCredentials(botToken, userToken = null) {
    try {
      this.botToken = botToken;
      this.userToken = userToken;

      // Test the credentials
      const testResult = await this.testConnection();
      if (testResult.success) {
        this.teamId = testResult.team.id;
        
        const config = {
          botToken,
          userToken,
          teamId: this.teamId,
          setupDate: new Date().toISOString()
        };

        await AsyncStorage.setItem('slack_config', JSON.stringify(config));
        
        console.log('Slack API credentials validated');
        return { success: true, message: 'Slack credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid Slack credentials: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save Slack credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.botToken) {
        return { success: false, error: 'Missing bot token' };
      }

      const response = await fetch(`${this.baseURL}/auth.test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return {
            success: true,
            team: {
              id: data.team_id,
              name: data.team,
              url: data.url
            },
            user: {
              id: data.user_id,
              name: data.user
            }
          };
        } else {
          return { success: false, error: data.error || 'Authentication failed' };
        }
      } else {
        return { success: false, error: 'Failed to connect to Slack API' };
      }
      
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  async sendMessage(channel, message, threadTs = null) {
    try {
      if (!this.botToken) {
        throw new Error('Slack bot not configured');
      }

      const payload = {
        channel: channel,
        text: message,
        as_user: false
      };

      if (threadTs) {
        payload.thread_ts = threadTs;
      }

      const response = await fetch(
        `${this.baseURL}/chat.postMessage`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.ok) {
        return {
          success: true,
          messageId: responseData.ts,
          channel: responseData.channel,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Slack send error:', responseData);
        return {
          success: false,
          error: responseData.error || 'Failed to send message'
        };
      }
      
    } catch (error) {
      console.error('Slack send message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendDirectMessage(userId, message) {
    try {
      // Open DM channel with user
      const dmResult = await this.openDM(userId);
      if (!dmResult.success) {
        return dmResult;
      }

      // Send message to DM channel
      return await this.sendMessage(dmResult.channelId, message);
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async openDM(userId) {
    try {
      const response = await fetch(
        `${this.baseURL}/conversations.open`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            users: userId
          })
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.ok) {
        return {
          success: true,
          channelId: responseData.channel.id
        };
      } else {
        return {
          success: false,
          error: responseData.error || 'Failed to open DM'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleSlackEvent(event) {
    try {
      // Handle different Slack event types
      switch (event.type) {
        case 'message':
          if (!event.bot_id) { // Ignore bot messages
            return await this.processIncomingMessage(event);
          }
          break;
          
        case 'app_mention':
          return await this.processAppMention(event);
          
        case 'reaction_added':
          return await this.processReaction(event);
          
        default:
          console.log('Unhandled Slack event type:', event.type);
      }

      return { success: true, processed: false };
      
    } catch (error) {
      console.error('Slack event processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async processAppMention(event) {
    try {
      const messageData = {
        id: event.ts,
        from: event.user,
        channel: event.channel,
        timestamp: parseFloat(event.ts) * 1000,
        content: event.text,
        platform: 'slack',
        type: 'mention'
      };

      return {
        success: true,
        messageData,
        platform: 'slack',
        processed: true
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserInfo(userId) {
    try {
      const response = await fetch(
        `${this.baseURL}/users.info?user=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return {
            success: true,
            user: {
              id: data.user.id,
              name: data.user.name,
              realName: data.user.real_name,
              email: data.user.profile?.email,
              displayName: data.user.profile?.display_name
            }
          };
        }
      }

      return { success: false, error: 'Failed to get user info' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isConfigured() {
    return !!this.botToken;
  }

  getConfiguration() {
    return {
      hasBotToken: !!this.botToken,
      hasUserToken: !!this.userToken,
      hasTeamId: !!this.teamId,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('slack_config');
      this.botToken = null;
      this.userToken = null;
      this.teamId = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Slack configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const slackAPI = new SlackAPI();

// Slack utility functions
export const SlackUtils = {
  // Validate Slack bot token format
  isValidBotToken: (token) => {
    return /^xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+$/.test(token);
  },

  // Validate Slack user token format
  isValidUserToken: (token) => {
    return /^xoxp-[0-9]+-[0-9]+-[0-9]+-[a-zA-Z0-9]+$/.test(token);
  },

  // Format message for Slack (supports mrkdwn)
  formatSlackMessage: (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold
      .replace(/__(.*?)__/g, '_$1_') // Italic
      .replace(/`(.*?)`/g, '`$1`'); // Code
  },

  // Parse Slack user mention
  parseUserMention: (text) => {
    const match = text.match(/<@([UW][A-Z0-9]+)>/);
    return match ? match[1] : null;
  },

  // Parse Slack channel mention
  parseChannelMention: (text) => {
    const match = text.match(/<#([C][A-Z0-9]+)\|([^>]+)>/);
    return match ? { id: match[1], name: match[2] } : null;
  },

  // Create Slack blocks for rich formatting
  createBlocks: (sections) => {
    return sections.map(section => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: section
      }
    }));
  },

  // Escape special characters for Slack
  escapeSlackText: (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};
