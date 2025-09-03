import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TelegramAPI {
  constructor() {
    this.baseURL = 'https://api.telegram.org/bot';
    this.botToken = null;
    this.webhookURL = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.warn('Telegram API limited functionality on web platform');
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('telegram_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.botToken = config.botToken;
        this.webhookURL = config.webhookURL;
      }

      this.isInitialized = true;
      console.log('Telegram API initialized');
      return true;
      
    } catch (error) {
      console.error('Telegram API initialization failed:', error);
      return false;
    }
  }

  async setupBot(botToken, webhookURL = null) {
    try {
      this.botToken = botToken;
      this.webhookURL = webhookURL;

      // Test the bot token
      const testResult = await this.testConnection();
      if (testResult.success) {
        const config = {
          botToken,
          webhookURL,
          setupDate: new Date().toISOString()
        };

        await AsyncStorage.setItem('telegram_config', JSON.stringify(config));
        
        console.log('Telegram bot credentials validated');
        return { success: true, message: 'Bot credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid bot token: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save bot credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.botToken) {
        return { success: false, error: 'Missing bot token' };
      }

      const response = await fetch(`${this.baseURL}${this.botToken}/getMe`);

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return {
            success: true,
            bot: {
              id: data.result.id,
              username: data.result.username,
              firstName: data.result.first_name,
              canJoinGroups: data.result.can_join_groups,
              canReadAllGroupMessages: data.result.can_read_all_group_messages
            }
          };
        } else {
          return { success: false, error: data.description || 'Bot verification failed' };
        }
      } else {
        return { success: false, error: 'Failed to connect to Telegram API' };
      }
      
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  async sendMessage(chatId, message, parseMode = 'HTML') {
    try {
      if (!this.botToken) {
        throw new Error('Telegram bot not configured');
      }

      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode
      };

      const response = await fetch(
        `${this.baseURL}${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.ok) {
        return {
          success: true,
          messageId: responseData.result.message_id,
          chatId: responseData.result.chat.id,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Telegram send error:', responseData);
        return {
          success: false,
          error: responseData.description || 'Failed to send message'
        };
      }
      
    } catch (error) {
      console.error('Telegram send message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleWebhookUpdate(update) {
    try {
      // Process Telegram webhook update
      if (update.message) {
        return await this.processIncomingMessage(update.message);
      } else if (update.edited_message) {
        return await this.processIncomingMessage(update.edited_message, true);
      } else if (update.callback_query) {
        return await this.processCallbackQuery(update.callback_query);
      }

      return { success: false, error: 'Unknown update type' };
      
    } catch (error) {
      console.error('Telegram webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async processIncomingMessage(message, isEdit = false) {
    try {
      const messageData = {
        id: message.message_id,
        from: message.from.id,
        chatId: message.chat.id,
        timestamp: message.date * 1000, // Convert to milliseconds
        content: this.extractMessageContent(message),
        isEdit,
        platform: 'telegram',
        user: {
          id: message.from.id,
          username: message.from.username,
          firstName: message.from.first_name,
          lastName: message.from.last_name
        },
        chat: {
          id: message.chat.id,
          type: message.chat.type,
          title: message.chat.title
        }
      };

      console.log('Processing Telegram message:', messageData);
      return {
        success: true,
        messageData,
        platform: 'telegram',
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing Telegram message:', error);
      return { success: false, error: error.message };
    }
  }

  extractMessageContent(message) {
    if (message.text) return message.text;
    if (message.photo) return '[Photo]';
    if (message.video) return '[Video]';
    if (message.audio) return '[Audio]';
    if (message.voice) return '[Voice Message]';
    if (message.document) return `[Document: ${message.document.file_name || 'Unknown'}]`;
    if (message.sticker) return '[Sticker]';
    if (message.location) return '[Location]';
    if (message.contact) return '[Contact]';
    if (message.poll) return `[Poll: ${message.poll.question}]`;
    
    return '[Unsupported Message Type]';
  }

  async processCallbackQuery(callbackQuery) {
    try {
      // Handle inline keyboard button presses
      const messageData = {
        id: callbackQuery.id,
        from: callbackQuery.from.id,
        data: callbackQuery.data,
        messageId: callbackQuery.message?.message_id,
        chatId: callbackQuery.message?.chat?.id,
        platform: 'telegram',
        type: 'callback'
      };

      // Answer the callback query to remove loading state
      await this.answerCallbackQuery(callbackQuery.id);

      return {
        success: true,
        messageData,
        platform: 'telegram',
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing Telegram callback:', error);
      return { success: false, error: error.message };
    }
  }

  async answerCallbackQuery(callbackQueryId, text = null) {
    try {
      const payload = { callback_query_id: callbackQueryId };
      if (text) payload.text = text;

      await fetch(
        `${this.baseURL}${this.botToken}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      
    } catch (error) {
      console.error('Error answering callback query:', error);
    }
  }

  async setWebhook(webhookURL) {
    try {
      if (!this.botToken) {
        throw new Error('Bot token not configured');
      }

      const payload = {
        url: webhookURL,
        allowed_updates: ['message', 'edited_message', 'callback_query']
      };

      const response = await fetch(
        `${this.baseURL}${this.botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.ok) {
        this.webhookURL = webhookURL;
        return {
          success: true,
          message: 'Webhook set successfully',
          url: webhookURL
        };
      } else {
        return {
          success: false,
          error: responseData.description || 'Failed to set webhook'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteWebhook() {
    try {
      const response = await fetch(`${this.baseURL}${this.botToken}/deleteWebhook`);
      const responseData = await response.json();

      if (response.ok && responseData.ok) {
        this.webhookURL = null;
        return { success: true, message: 'Webhook deleted successfully' };
      } else {
        return { success: false, error: responseData.description || 'Failed to delete webhook' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPhoto(chatId, photoURL, caption = '') {
    try {
      const payload = {
        chat_id: chatId,
        photo: photoURL,
        caption: caption
      };

      const response = await fetch(
        `${this.baseURL}${this.botToken}/sendPhoto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.ok) {
        return {
          success: true,
          messageId: responseData.result.message_id,
          status: 'sent'
        };
      } else {
        return {
          success: false,
          error: responseData.description || 'Failed to send photo'
        };
      }
      
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
      hasWebhookURL: !!this.webhookURL,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('telegram_config');
      this.botToken = null;
      this.webhookURL = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Telegram configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const telegramAPI = new TelegramAPI();

// Telegram utility functions
export const TelegramUtils = {
  // Validate bot token format
  isValidBotToken: (token) => {
    return /^\d+:[a-zA-Z0-9_-]{35}$/.test(token);
  },

  // Format message for Telegram (supports HTML and Markdown)
  formatHTML: (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
      .replace(/\*(.*?)\*/g, '<i>$1</i>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>'); // Code
  },

  // Format message for Telegram Markdown
  formatMarkdown: (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold
      .replace(/__(.*?)__/g, '_$1_') // Italic
      .replace(/`(.*?)`/g, '`$1`'); // Code
  },

  // Create inline keyboard
  createInlineKeyboard: (buttons) => {
    return {
      inline_keyboard: buttons.map(row => 
        row.map(button => ({
          text: button.text,
          callback_data: button.data,
          url: button.url
        }))
      )
    };
  },

  // Parse Telegram username
  parseUsername: (username) => {
    return username.startsWith('@') ? username.slice(1) : username;
  },

  // Generate bot invite link
  generateBotLink: (botUsername) => {
    return `https://t.me/${TelegramUtils.parseUsername(botUsername)}`;
  }
};
