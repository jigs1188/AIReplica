import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DiscordAPI {
  constructor() {
    this.botToken = null;
    this.clientId = null;
    this.clientSecret = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.log('Discord API available on web');
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('discord_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.botToken = config.botToken;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
      }

      this.isInitialized = true;
      console.log('Discord API initialized');
      return true;
      
    } catch (error) {
      console.error('Discord API initialization failed:', error);
      return false;
    }
  }

  async setupCredentials(botToken, clientId, clientSecret) {
    try {
      const config = {
        botToken,
        clientId,
        clientSecret,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('discord_config', JSON.stringify(config));
      
      this.botToken = botToken;
      this.clientId = clientId;
      this.clientSecret = clientSecret;

      // Test the credentials
      const testResult = await this.testConnection();
      if (testResult.success) {
        console.log('Discord credentials validated');
        return { success: true, message: 'Discord credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid Discord credentials: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save Discord credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.botToken) {
        return { success: false, error: 'No bot token configured' };
      }

      const response = await fetch(
        'https://discord.com/api/v10/users/@me',
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          botName: data.username,
          botId: data.id,
          discriminator: data.discriminator
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Discord connection failed'
        };
      }
      
    } catch (error) {
      return { success: false, error: 'Discord test error: ' + error.message };
    }
  }

  async sendMessage(channelId, content, embeds = null) {
    try {
      if (!this.botToken) {
        return { success: false, error: 'Discord bot not configured' };
      }

      const messageData = { content };
      
      if (embeds) {
        messageData.embeds = embeds;
      }

      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${this.botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageData)
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.id,
          timestamp: responseData.timestamp,
          channelId: responseData.channel_id
        };
      } else {
        console.error('Discord message error:', responseData);
        return {
          success: false,
          error: responseData.message || 'Failed to send Discord message'
        };
      }
      
    } catch (error) {
      console.error('Discord send message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendDirectMessage(userId, content) {
    try {
      if (!this.botToken) {
        return { success: false, error: 'Discord bot not configured' };
      }

      // Create DM channel first
      const dmResponse = await fetch(
        'https://discord.com/api/v10/users/@me/channels',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${this.botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipient_id: userId
          })
        }
      );

      if (!dmResponse.ok) {
        const errorData = await dmResponse.json();
        return {
          success: false,
          error: errorData.message || 'Failed to create DM channel'
        };
      }

      const dmData = await dmResponse.json();
      const channelId = dmData.id;

      // Send message to DM channel
      return await this.sendMessage(channelId, content);
      
    } catch (error) {
      console.error('Discord DM error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getChannelMessages(channelId, limit = 20) {
    try {
      if (!this.botToken) {
        return { success: false, error: 'Discord bot not configured' };
      }

      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const messages = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          authorId: msg.author.id,
          authorName: msg.author.username,
          timestamp: msg.timestamp,
          platform: 'discord',
          channelId: msg.channel_id
        }));

        return {
          success: true,
          messages: messages.reverse() // Order by oldest first
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to fetch Discord messages'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleWebhookEvent(eventData) {
    try {
      console.log('Discord webhook received:', eventData);

      // Handle different Discord events
      switch (eventData.t) {
        case 'MESSAGE_CREATE':
          return await this.processMessageCreate(eventData.d);
        
        case 'MESSAGE_UPDATE':
          return await this.processMessageUpdate(eventData.d);
        
        case 'GUILD_MEMBER_ADD':
          return await this.processGuildMemberAdd(eventData.d);
        
        default:
          return {
            success: true,
            eventType: eventData.t,
            processed: false,
            note: 'Event type not handled'
          };
      }
      
    } catch (error) {
      console.error('Error processing Discord webhook:', error);
      return { success: false, error: error.message };
    }
  }

  async processMessageCreate(messageData) {
    try {
      // Ignore bot messages to prevent loops
      if (messageData.author.bot) {
        return { success: true, processed: false, note: 'Bot message ignored' };
      }

      const processedMessage = {
        id: messageData.id,
        content: messageData.content,
        authorId: messageData.author.id,
        authorName: messageData.author.username,
        channelId: messageData.channel_id,
        guildId: messageData.guild_id,
        timestamp: messageData.timestamp,
        platform: 'discord',
        type: 'message'
      };

      return {
        success: true,
        messageData: processedMessage,
        platform: 'discord',
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing Discord message:', error);
      return { success: false, error: error.message };
    }
  }

  async processMessageUpdate(messageData) {
    try {
      return {
        success: true,
        messageId: messageData.id,
        channelId: messageData.channel_id,
        platform: 'discord',
        type: 'message_update',
        processed: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processGuildMemberAdd(memberData) {
    try {
      return {
        success: true,
        userId: memberData.user?.id,
        guildId: memberData.guild_id,
        platform: 'discord',
        type: 'member_join',
        processed: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGuilds() {
    try {
      if (!this.botToken) {
        return { success: false, error: 'Discord bot not configured' };
      }

      const response = await fetch(
        'https://discord.com/api/v10/users/@me/guilds',
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`
          }
        }
      );

      if (response.ok) {
        const guilds = await response.json();
        return {
          success: true,
          guilds: guilds.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            permissions: guild.permissions
          }))
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to fetch guilds'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getChannels(guildId) {
    try {
      if (!this.botToken) {
        return { success: false, error: 'Discord bot not configured' };
      }

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/channels`,
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`
          }
        }
      );

      if (response.ok) {
        const channels = await response.json();
        return {
          success: true,
          channels: channels
            .filter(channel => channel.type === 0) // Text channels only
            .map(channel => ({
              id: channel.id,
              name: channel.name,
              type: channel.type,
              position: channel.position
            }))
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to fetch channels'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createEmbed(title, description, color = 0x0099ff, fields = []) {
    return {
      title,
      description,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'AI Personal Assistant'
      }
    };
  }

  isConfigured() {
    return !!(this.botToken && this.clientId);
  }

  getConfiguration() {
    return {
      hasBotToken: !!this.botToken,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('discord_config');
      this.botToken = null;
      this.clientId = null;
      this.clientSecret = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Discord configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const discordAPI = new DiscordAPI();

// Discord utility functions
export const DiscordUtils = {
  // Validate Discord user ID
  isValidUserId: (userId) => {
    return /^\d{17,19}$/.test(userId);
  },

  // Validate Discord channel ID
  isValidChannelId: (channelId) => {
    return /^\d{17,19}$/.test(channelId);
  },

  // Format Discord mention
  formatUserMention: (userId) => {
    return `<@${userId}>`;
  },

  // Format Discord channel mention
  formatChannelMention: (channelId) => {
    return `<#${channelId}>`;
  },

  // Parse Discord mentions from message
  parseMentions: (content) => {
    const userMentions = content.match(/<@!?(\d+)>/g) || [];
    const channelMentions = content.match(/<#(\d+)>/g) || [];
    const roleMentions = content.match(/<@&(\d+)>/g) || [];

    return {
      users: userMentions.map(mention => mention.match(/\d+/)[0]),
      channels: channelMentions.map(mention => mention.match(/\d+/)[0]),
      roles: roleMentions.map(mention => mention.match(/\d+/)[0])
    };
  },

  // Check if user has permission in channel
  hasPermission: (permissions, permission) => {
    const permissionMap = {
      'SEND_MESSAGES': 0x0000000000000800,
      'READ_MESSAGES': 0x0000000000000400,
      'MANAGE_MESSAGES': 0x0000000000002000,
      'EMBED_LINKS': 0x0000000000004000,
      'ATTACH_FILES': 0x0000000000008000
    };

    const permissionValue = permissionMap[permission];
    return !!(parseInt(permissions) & permissionValue);
  },

  // Escape Discord markdown
  escapeMarkdown: (text) => {
    return text
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/\|/g, '\\|');
  },

  // Format Discord timestamp
  formatTimestamp: (timestamp, format = 'f') => {
    const unixTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);
    return `<t:${unixTimestamp}:${format}>`;
  },

  // Create Discord embed field
  createEmbedField: (name, value, inline = false) => {
    return { name, value, inline };
  },

  // Chunk message for Discord's 2000 character limit
  chunkMessage: (content, maxLength = 2000) => {
    if (content.length <= maxLength) return [content];
    
    const chunks = [];
    let currentChunk = '';
    const lines = content.split('\n');
    
    for (const line of lines) {
      if ((currentChunk + '\n' + line).length <= maxLength) {
        currentChunk += (currentChunk ? '\n' : '') + line;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          // Line itself is too long
          chunks.push(line.substring(0, maxLength));
          currentChunk = line.substring(maxLength);
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
};
