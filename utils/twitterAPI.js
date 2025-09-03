import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TwitterAPI {
  constructor() {
    this.apiKey = null;
    this.apiSecret = null;
    this.accessToken = null;
    this.accessSecret = null;
    this.bearerToken = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.log('Twitter API available on web');
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('twitter_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.accessToken = config.accessToken;
        this.accessSecret = config.accessSecret;
        this.bearerToken = config.bearerToken;
      }

      this.isInitialized = true;
      console.log('Twitter API initialized');
      return true;
      
    } catch (error) {
      console.error('Twitter API initialization failed:', error);
      return false;
    }
  }

  async setupCredentials(apiKey, apiSecret, accessToken, accessSecret, bearerToken) {
    try {
      const config = {
        apiKey,
        apiSecret,
        accessToken,
        accessSecret,
        bearerToken,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('twitter_config', JSON.stringify(config));
      
      this.apiKey = apiKey;
      this.apiSecret = apiSecret;
      this.accessToken = accessToken;
      this.accessSecret = accessSecret;
      this.bearerToken = bearerToken;

      // Test the credentials
      const testResult = await this.testConnection();
      if (testResult.success) {
        console.log('Twitter credentials validated');
        return { success: true, message: 'Twitter credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid Twitter credentials: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save Twitter credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.bearerToken) {
        return { success: false, error: 'No bearer token configured' };
      }

      const response = await fetch(
        'https://api.twitter.com/2/users/me',
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          username: data.data?.username,
          name: data.data?.name,
          userId: data.data?.id
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.title || 'Twitter connection failed'
        };
      }
      
    } catch (error) {
      return { success: false, error: 'Twitter test error: ' + error.message };
    }
  }

  async sendDirectMessage(recipientUsername, message) {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Twitter API not configured' };
      }

      // First, get the recipient's user ID
      const userResult = await this.getUserByUsername(recipientUsername);
      if (!userResult.success) {
        return { success: false, error: 'Failed to find user: ' + userResult.error };
      }

      const recipientId = userResult.userId;

      // Create the DM conversation if it doesn't exist
      const dmData = {
        type: 'MessageCreate',
        message_create: {
          target: { recipient_id: recipientId },
          message_data: { text: message }
        }
      };

      // Note: Twitter API v2 DM endpoints require special permissions
      // This is a conceptual implementation
      const response = await fetch(
        'https://api.twitter.com/1.1/direct_messages/events/new.json',
        {
          method: 'POST',
          headers: {
            'Authorization': await this.generateOAuthHeader('POST', 'https://api.twitter.com/1.1/direct_messages/events/new.json'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ event: dmData })
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.event?.id,
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Twitter DM error:', responseData);
        return {
          success: false,
          error: responseData.errors?.[0]?.message || 'Failed to send Twitter DM'
        };
      }
      
    } catch (error) {
      console.error('Twitter DM send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserByUsername(username) {
    try {
      if (!this.bearerToken) {
        return { success: false, error: 'No bearer token configured' };
      }

      const cleanUsername = username.replace('@', '');
      
      const response = await fetch(
        `https://api.twitter.com/2/users/by/username/${cleanUsername}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          userId: data.data?.id,
          username: data.data?.username,
          name: data.data?.name
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.title || 'User not found'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async postTweet(content, mediaIds = []) {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Twitter API not configured' };
      }

      const tweetData = { text: content };
      
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      const response = await fetch(
        'https://api.twitter.com/2/tweets',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tweetData)
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          tweetId: responseData.data?.id,
          tweetText: responseData.data?.text,
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Twitter post error:', responseData);
        return {
          success: false,
          error: responseData.title || 'Failed to post tweet'
        };
      }
      
    } catch (error) {
      console.error('Twitter post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getMentions(maxResults = 10) {
    try {
      if (!this.bearerToken) {
        return { success: false, error: 'No bearer token configured' };
      }

      // Get current user ID first
      const userResponse = await fetch(
        'https://api.twitter.com/2/users/me',
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          }
        }
      );

      if (!userResponse.ok) {
        return { success: false, error: 'Failed to get user info' };
      }

      const userData = await userResponse.json();
      const userId = userData.data?.id;

      // Get mentions
      const response = await fetch(
        `https://api.twitter.com/2/users/${userId}/mentions?max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const mentions = data.data?.map(tweet => ({
          id: tweet.id,
          content: tweet.text,
          authorId: tweet.author_id,
          timestamp: tweet.created_at,
          metrics: tweet.public_metrics,
          platform: 'twitter'
        })) || [];

        return {
          success: true,
          mentions
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.title || 'Failed to fetch mentions'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async replyToTweet(tweetId, replyText) {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Twitter API not configured' };
      }

      const replyData = {
        text: replyText,
        reply: {
          in_reply_to_tweet_id: tweetId
        }
      };

      const response = await fetch(
        'https://api.twitter.com/2/tweets',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(replyData)
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          replyId: responseData.data?.id,
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Twitter reply error:', responseData);
        return {
          success: false,
          error: responseData.title || 'Failed to reply to tweet'
        };
      }
      
    } catch (error) {
      console.error('Twitter reply error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate OAuth 1.0a header (simplified version)
  async generateOAuthHeader(method, url, params = {}) {
    try {
      const oauthParams = {
        oauth_consumer_key: this.apiKey,
        oauth_token: this.accessToken,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_nonce: Math.random().toString(36).substring(2, 15),
        oauth_version: '1.0'
      };

      // Note: This is a simplified implementation
      // In production, use a proper OAuth 1.0a library
      const paramString = Object.keys({...oauthParams, ...params})
        .sort()
        .map(key => `${key}=${encodeURIComponent(params[key] || oauthParams[key])}`)
        .join('&');

      const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
      const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(this.accessSecret)}`;

      // Note: HMAC-SHA1 signing would need a crypto library
      // This is a placeholder
      const signature = btoa(signatureBase + signingKey);
      oauthParams.oauth_signature = signature;

      const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
        .join(', ');

      return authHeader;
      
    } catch (error) {
      throw new Error('OAuth header generation failed: ' + error.message);
    }
  }

  isConfigured() {
    return !!(this.bearerToken || (this.apiKey && this.apiSecret && this.accessToken && this.accessSecret));
  }

  getConfiguration() {
    return {
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret,
      hasAccessToken: !!this.accessToken,
      hasAccessSecret: !!this.accessSecret,
      hasBearerToken: !!this.bearerToken,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('twitter_config');
      this.apiKey = null;
      this.apiSecret = null;
      this.accessToken = null;
      this.accessSecret = null;
      this.bearerToken = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Twitter configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const twitterAPI = new TwitterAPI();

// Twitter utility functions
export const TwitterUtils = {
  // Validate Twitter username
  isValidUsername: (username) => {
    const cleaned = username.replace('@', '');
    return /^[A-Za-z0-9_]{1,15}$/.test(cleaned);
  },

  // Format username with @ symbol
  formatUsername: (username) => {
    return username.startsWith('@') ? username : '@' + username;
  },

  // Truncate tweet to character limit
  truncateTweet: (text, maxLength = 280) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  // Extract mentions from tweet text
  extractMentions: (text) => {
    const mentionRegex = /@([A-Za-z0-9_]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  },

  // Extract hashtags from tweet text
  extractHashtags: (text) => {
    const hashtagRegex = /#([A-Za-z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  },

  // Check if tweet is a reply
  isReply: (tweetData) => {
    return !!(
      tweetData.in_reply_to_status_id ||
      tweetData.reply?.in_reply_to_tweet_id ||
      tweetData.referenced_tweets?.some(ref => ref.type === 'replied_to')
    );
  },

  // Check if tweet is a retweet
  isRetweet: (tweetData) => {
    return !!(
      tweetData.retweeted_status ||
      tweetData.referenced_tweets?.some(ref => ref.type === 'retweeted')
    );
  },

  // Format tweet for display
  formatTweet: (tweetData) => {
    let text = tweetData.text || tweetData.full_text || '';
    
    // Handle truncated tweets
    if (tweetData.truncated && tweetData.extended_tweet?.full_text) {
      text = tweetData.extended_tweet.full_text;
    }

    return text;
  },

  // Get tweet engagement metrics
  getEngagementMetrics: (tweetData) => {
    const metrics = tweetData.public_metrics || {};
    return {
      likes: metrics.like_count || 0,
      retweets: metrics.retweet_count || 0,
      replies: metrics.reply_count || 0,
      quotes: metrics.quote_count || 0
    };
  },

  // Check if user can send DMs
  canSendDirectMessage: (userPermissions) => {
    return userPermissions?.includes('dm.write') || false;
  },

  // Parse Twitter webhook event
  parseWebhookEvent: (eventData) => {
    try {
      // Handle different Twitter webhook events
      if (eventData.direct_message_events) {
        return {
          type: 'direct_message',
          events: eventData.direct_message_events
        };
      }

      if (eventData.tweet_create_events) {
        return {
          type: 'tweet',
          events: eventData.tweet_create_events
        };
      }

      if (eventData.favorite_events) {
        return {
          type: 'like',
          events: eventData.favorite_events
        };
      }

      return { type: 'unknown', events: [] };
      
    } catch (error) {
      console.error('Error parsing Twitter webhook:', error);
      return { type: 'error', error: error.message };
    }
  }
};

// Twitter webhook handler
export const TwitterWebhookHandler = {
  async processDM(dmEvent) {
    try {
      return {
        id: dmEvent.id,
        senderId: dmEvent.message_create?.sender_id,
        recipientId: dmEvent.message_create?.target?.recipient_id,
        content: dmEvent.message_create?.message_data?.text,
        timestamp: new Date(parseInt(dmEvent.created_timestamp)).toISOString(),
        platform: 'twitter',
        type: 'direct_message'
      };
    } catch (error) {
      throw new Error('Failed to process Twitter DM: ' + error.message);
    }
  },

  async processMention(tweetEvent) {
    try {
      return {
        id: tweetEvent.id_str,
        authorId: tweetEvent.user?.id_str,
        content: tweetEvent.text,
        mentions: TwitterUtils.extractMentions(tweetEvent.text),
        timestamp: new Date(tweetEvent.created_at).toISOString(),
        platform: 'twitter',
        type: 'mention'
      };
    } catch (error) {
      throw new Error('Failed to process Twitter mention: ' + error.message);
    }
  },

  async verifyWebhook(crcToken, consumerSecret) {
    try {
      // Twitter webhook verification
      // Create HMAC SHA256 signature of the CRC token using consumer secret
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', consumerSecret);
      hmac.update(crcToken);
      const signature = hmac.digest('base64');
      
      return {
        response_token: `sha256=${signature}`
      };
    } catch (error) {
      throw new Error('Webhook verification failed: ' + error.message);
    }
  }
};
