import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import configurationManager from './configurationManager';
import permanentTokenService from './permanentTokenService';

class WhatsAppBusinessAPI {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v17.0';
    this.accessToken = null;
    this.phoneNumberId = null;
    this.webhookVerifyToken = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.warn('WhatsApp Business API not available on web platform');
        return false;
      }

      // First try to load from configuration manager (cloud sync)
      const configResult = await configurationManager.getConfiguration('whatsapp');
      
      if (configResult.success && configResult.config) {
        const config = configResult.config;
        this.accessToken = config.accessToken;
        this.phoneNumberId = config.phoneNumberId;
        this.webhookVerifyToken = config.webhookVerifyToken;
        
        console.log('WhatsApp configuration loaded from cloud sync');
      } else {
        // Fallback to AsyncStorage for backward compatibility
        const storedConfig = await AsyncStorage.getItem('whatsapp_business_config');
        if (storedConfig) {
          const config = JSON.parse(storedConfig);
          this.accessToken = config.accessToken;
          this.phoneNumberId = config.phoneNumberId;
          this.webhookVerifyToken = config.webhookVerifyToken;
          
          console.log('WhatsApp configuration loaded from local storage');
          
          // Migrate to configuration manager
          await configurationManager.saveConfiguration('whatsapp', config);
          console.log('Configuration migrated to cloud sync');
        }
      }

      // Check if token needs refresh
      if (this.accessToken) {
        const refreshResult = await permanentTokenService.refreshTokenIfNeeded('whatsapp');
        if (refreshResult.success && refreshResult.message.includes('refreshed')) {
          // Reload configuration after refresh
          const updatedConfigResult = await configurationManager.getConfiguration('whatsapp');
          if (updatedConfigResult.success) {
            this.accessToken = updatedConfigResult.config.accessToken;
          }
        }
      }

      this.isInitialized = true;
      console.log('WhatsApp Business API initialized');
      return true;
      
    } catch (error) {
      console.error('WhatsApp Business API initialization failed:', error);
      return false;
    }
  }

  async setupCredentials(accessToken, phoneNumberId, webhookVerifyToken, appId = null, appSecret = null, isPermanent = false) {
    try {
      this.accessToken = accessToken;
      this.phoneNumberId = phoneNumberId;
      this.webhookVerifyToken = webhookVerifyToken;

      // Test the credentials first
      const testResult = await this.testConnection();
      if (!testResult.success) {
        return { success: false, error: 'Invalid credentials: ' + testResult.error };
      }

      // Prepare configuration for saving
      let config = {
        accessToken,
        phoneNumberId,
        webhookVerifyToken,
        setupDate: new Date().toISOString(),
        isPermanent,
        lastValidated: new Date().toISOString()
      };

      // If permanent token setup is requested
      if (isPermanent && appId && appSecret) {
        console.log('Setting up permanent access token...');
        
        const permanentResult = await permanentTokenService.generatePermanentToken(
          accessToken, 
          appId, 
          appSecret
        );

        if (permanentResult.success) {
          config.accessToken = permanentResult.permanentToken;
          config.appId = appId;
          config.appSecret = appSecret;
          config.expiresAt = permanentResult.expiresAt;
          config.tokenType = permanentResult.type;
          config.isPermanent = true;
          
          // Update the instance with new permanent token
          this.accessToken = permanentResult.permanentToken;
          
          console.log('Permanent access token configured successfully');
        } else {
          console.warn('Failed to generate permanent token, using temporary token');
          config.permanentTokenError = permanentResult.error;
        }
      }

      // Save using configuration manager for cloud sync
      const saveResult = await configurationManager.saveConfiguration('whatsapp', config);
      
      if (saveResult.success) {
        // Also save to AsyncStorage for backward compatibility
        await AsyncStorage.setItem('whatsapp_business_config', JSON.stringify(config));
        
        console.log('WhatsApp Business API credentials saved with cloud sync');
        return { 
          success: true, 
          message: 'Credentials saved and validated successfully',
          isPermanent: config.isPermanent,
          expiresAt: config.expiresAt
        };
      } else {
        return { success: false, error: 'Failed to save configuration: ' + saveResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        return { success: false, error: 'Missing access token or phone number ID' };
      }

      const response = await fetch(
        `${this.baseURL}/${this.phoneNumberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: 'Connection successful',
          phoneNumber: data.display_phone_number || 'Unknown'
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

  async sendMessage(to, message, messageType = 'text') {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp Business API not configured');
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: messageType,
      };

      // Handle different message types
      switch (messageType) {
        case 'text':
          payload.text = { body: message };
          break;
        case 'template':
          payload.template = message; // message should be template object
          break;
        default:
          payload.text = { body: message };
      }

      const response = await fetch(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.messages[0]?.id,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('WhatsApp send error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'Failed to send message',
          errorCode: responseData.error?.code
        };
      }
      
    } catch (error) {
      console.error('WhatsApp send message error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleWebhookMessage(webhookData) {
    try {
      // Validate webhook data structure
      if (!webhookData.entry || !Array.isArray(webhookData.entry)) {
        return { success: false, error: 'Invalid webhook data structure' };
      }

      const results = [];
      
      for (const entry of webhookData.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              for (const message of change.value.messages) {
                const result = await this.processIncomingMessage(message, change.value);
                results.push(result);
              }
            }
          }
        }
      }

      return { success: true, processedMessages: results };
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async processIncomingMessage(message, webhookValue) {
    try {
      // Extract message details
      const messageData = {
        id: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        content: this.extractMessageContent(message),
        contact: webhookValue.contacts?.[0] || null,
        metadata: webhookValue.metadata || {}
      };

      console.log('Processing WhatsApp message:', messageData);

      // This will be handled by the personal assistant service
      return {
        success: true,
        messageData,
        platform: 'whatsapp',
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing incoming message:', error);
      return { success: false, error: error.message };
    }
  }

  extractMessageContent(message) {
    switch (message.type) {
      case 'text':
        return message.text?.body || '';
      case 'audio':
        return '[Audio Message]';
      case 'document':
        return `[Document: ${message.document?.filename || 'Unknown'}]`;
      case 'image':
        return '[Image]';
      case 'video':
        return '[Video]';
      case 'sticker':
        return '[Sticker]';
      case 'location':
        return `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
      case 'contacts':
        return '[Contact Card]';
      case 'button':
        return message.button?.text || '[Button Response]';
      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          return message.interactive.button_reply?.title || '[Button Reply]';
        } else if (message.interactive?.type === 'list_reply') {
          return message.interactive.list_reply?.title || '[List Reply]';
        }
        return '[Interactive Message]';
      default:
        return '[Unsupported Message Type]';
    }
  }

  async verifyWebhook(mode, token, challenge) {
    try {
      // Verify that the webhook request is from WhatsApp
      if (mode === 'subscribe' && token === this.webhookVerifyToken) {
        console.log('Webhook verified successfully');
        return { verified: true, challenge };
      } else {
        console.log('Webhook verification failed');
        return { verified: false, error: 'Invalid verification token' };
      }
    } catch (error) {
      console.error('Webhook verification error:', error);
      return { verified: false, error: error.message };
    }
  }

  async getMessageStatus(messageId) {
    try {
      if (!this.accessToken) {
        throw new Error('WhatsApp Business API not configured');
      }

      const response = await fetch(
        `${this.baseURL}/${messageId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          status: data.status || 'unknown',
          timestamp: data.timestamp
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Failed to get message status'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async uploadMedia(mediaFile, mediaType) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp Business API not configured');
      }

      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('type', mediaType);
      formData.append('messaging_product', 'whatsapp');

      const response = await fetch(
        `${this.baseURL}/${this.phoneNumberId}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: formData
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          mediaId: responseData.id,
          mediaType: mediaType
        };
      } else {
        return {
          success: false,
          error: responseData.error?.message || 'Failed to upload media'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendTemplateMessage(to, templateName, languageCode, components = []) {
    try {
      const templateMessage = {
        name: templateName,
        language: { code: languageCode },
      };

      if (components.length > 0) {
        templateMessage.components = components;
      }

      return await this.sendMessage(to, templateMessage, 'template');
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Configuration getters
  isConfigured() {
    return !!(this.accessToken && this.phoneNumberId);
  }

  getConfiguration() {
    return {
      hasAccessToken: !!this.accessToken,
      hasPhoneNumberId: !!this.phoneNumberId,
      hasWebhookToken: !!this.webhookVerifyToken,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('whatsapp_business_config');
      this.accessToken = null;
      this.phoneNumberId = null;
      this.webhookVerifyToken = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const whatsappBusinessAPI = new WhatsAppBusinessAPI();

// Configuration helper functions
export const WhatsAppUtils = {
  // Format phone number for WhatsApp API (remove + and non-digits)
  formatPhoneNumber: (phoneNumber) => {
    return phoneNumber.replace(/[^\d]/g, '');
  },

  // Validate WhatsApp phone number format
  isValidWhatsAppNumber: (phoneNumber) => {
    const formatted = WhatsAppUtils.formatPhoneNumber(phoneNumber);
    return /^\d{10,15}$/.test(formatted);
  },

  // Generate webhook verification URL
  generateWebhookURL: (baseURL, verifyToken) => {
    return `${baseURL}/webhook?verify_token=${verifyToken}`;
  },

  // Create template component for dynamic content
  createTemplateComponent: (type, parameters) => {
    return {
      type: type, // 'header', 'body', 'button'
      parameters: parameters.map(param => ({
        type: 'text',
        text: param
      }))
    };
  },

  // Message type helpers
  isTextMessage: (message) => message.type === 'text',
  isMediaMessage: (message) => ['image', 'video', 'audio', 'document'].includes(message.type),
  isInteractiveMessage: (message) => ['button', 'interactive'].includes(message.type),
};
