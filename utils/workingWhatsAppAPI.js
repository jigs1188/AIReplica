/**
 * Working WhatsApp Business API Integration
 * Complete implementation with error handling and validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class WorkingWhatsAppAPI {
  constructor() {
    this.config = null;
    this.isInitialized = false;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Initialize the WhatsApp API with stored configuration
   */
  async initialize() {
    try {
      const storedConfig = await AsyncStorage.getItem('@whatsapp_config');
      if (storedConfig) {
        this.config = JSON.parse(storedConfig);
        this.isInitialized = true;
        console.log('✅ WhatsApp API initialized successfully');
        return true;
      } else {
        console.log('⚠️ No WhatsApp configuration found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp API:', error);
      return false;
    }
  }

  /**
   * Validate credentials by making a test API call
   */
  async validateCredentials(accessToken, phoneNumberId) {
    try {
      const response = await fetch(`${this.baseURL}/${phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.display_phone_number) {
        return {
          valid: true,
          phoneNumber: data.display_phone_number,
          id: data.id,
          data: data
        };
      } else {
        return {
          valid: false,
          error: data.error?.message || 'Invalid credentials'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Get business account information
   */
  async getBusinessInfo(accessToken, businessAccountId = null) {
    try {
      let url = `${this.baseURL}/me`;
      if (businessAccountId) {
        url = `${this.baseURL}/${businessAccountId}`;
      }

      const response = await fetch(`${url}?fields=name,id`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          name: data.name || 'WhatsApp Business',
          id: data.id
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Could not fetch business info'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a text message via WhatsApp Business API
   */
  async sendMessage(to, message, type = 'text') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config) {
      throw new Error('WhatsApp not configured');
    }

    try {
      // Clean phone number (remove non-digits)
      const cleanPhoneNumber = to.replace(/[^0-9]/g, '');

      const messageData = {
        messaging_product: "whatsapp",
        to: cleanPhoneNumber,
        type: type,
      };

      // Add message content based on type
      if (type === 'text') {
        messageData.text = {
          body: message
        };
      }

      const response = await fetch(`${this.baseURL}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      if (response.ok && data.messages) {
        return {
          success: true,
          messageId: data.messages[0].id,
          to: cleanPhoneNumber,
          status: 'sent'
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to send message',
          code: data.error?.code
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(to, templateName, languageCode = 'en', parameters = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config) {
      throw new Error('WhatsApp not configured');
    }

    try {
      const cleanPhoneNumber = to.replace(/[^0-9]/g, '');

      const messageData = {
        messaging_product: "whatsapp",
        to: cleanPhoneNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      // Add parameters if provided
      if (parameters.length > 0) {
        messageData.template.components = [{
          type: "body",
          parameters: parameters.map(param => ({
            type: "text",
            text: param
          }))
        }];
      }

      const response = await fetch(`${this.baseURL}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      if (response.ok && data.messages) {
        return {
          success: true,
          messageId: data.messages[0].id,
          to: cleanPhoneNumber,
          status: 'sent'
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to send template message',
          code: data.error?.code
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config) {
      throw new Error('WhatsApp not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          status: 'read'
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to mark message as read'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get phone number information
   */
  async getPhoneNumberInfo() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config) {
      throw new Error('WhatsApp not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/${this.config.phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          phoneNumber: data.display_phone_number,
          id: data.id,
          status: data.status,
          qualityRating: data.quality_rating
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to get phone number info'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process incoming webhook message
   */
  processIncomingMessage(webhookData) {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages) {
        return null;
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];

      return {
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text?.body || '',
        contact: {
          name: contact?.profile?.name || 'Unknown',
          phoneNumber: contact?.wa_id || message.from
        }
      };
    } catch (error) {
      console.error('Error processing incoming message:', error);
      return null;
    }
  }

  /**
   * Generate auto-reply using AI (placeholder for AI integration)
   */
  async generateAutoReply(incomingMessage, userPersonality = null) {
    try {
      // This is a placeholder - you would integrate with your AI service here
      // For now, return a simple response
      
      const responses = [
        "Thanks for your message! I'll get back to you soon.",
        "Hi! I received your message and will respond shortly.",
        "Hello! Thanks for reaching out. I'll be in touch soon.",
        "Got your message! I'll respond as soon as possible."
      ];

      // Simple keyword-based responses
      const text = incomingMessage.text.toLowerCase();
      
      if (text.includes('hello') || text.includes('hi')) {
        return "Hello! Thanks for your message. How can I help you?";
      }
      
      if (text.includes('thank')) {
        return "You're welcome! Let me know if you need anything else.";
      }
      
      if (text.includes('how are you')) {
        return "I'm doing well, thanks for asking! How are you?";
      }

      // Default response
      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      console.error('Error generating auto-reply:', error);
      return "Thanks for your message! I'll get back to you soon.";
    }
  }

  /**
   * Save configuration to local storage
   */
  async saveConfiguration(config) {
    try {
      const configToSave = {
        ...config,
        savedAt: new Date().toISOString()
      };

      await AsyncStorage.setItem('@whatsapp_config', JSON.stringify(configToSave));
      this.config = configToSave;
      this.isInitialized = true;

      return {
        success: true,
        message: 'Configuration saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current configuration
   */
  async getConfiguration() {
    try {
      const storedConfig = await AsyncStorage.getItem('@whatsapp_config');
      if (storedConfig) {
        return JSON.parse(storedConfig);
      }
      return null;
    } catch (error) {
      console.error('Error getting configuration:', error);
      return null;
    }
  }

  /**
   * Remove configuration (disconnect)
   */
  async disconnect() {
    try {
      await AsyncStorage.removeItem('@whatsapp_config');
      await AsyncStorage.removeItem('@platform_whatsapp');
      this.config = null;
      this.isInitialized = false;

      return {
        success: true,
        message: 'WhatsApp disconnected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get connection status
   */
  async getStatus() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config) {
      return {
        connected: false,
        message: 'Not configured'
      };
    }

    try {
      const phoneInfo = await this.getPhoneNumberInfo();
      
      if (phoneInfo.success) {
        return {
          connected: true,
          phoneNumber: phoneInfo.phoneNumber,
          status: phoneInfo.status,
          qualityRating: phoneInfo.qualityRating,
          configuredAt: this.config.savedAt
        };
      } else {
        return {
          connected: false,
          error: phoneInfo.error
        };
      }
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const workingWhatsAppAPI = new WorkingWhatsAppAPI();
export default workingWhatsAppAPI;
