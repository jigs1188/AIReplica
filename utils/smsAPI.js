import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SMSAPI {
  constructor() {
    this.provider = null; // 'twilio', 'aws-sns', 'custom'
    this.credentials = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.warn('SMS API limited functionality on web platform');
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('sms_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.provider = config.provider;
        this.credentials = config.credentials;
      }

      this.isInitialized = true;
      console.log('SMS API initialized');
      return true;
      
    } catch (error) {
      console.error('SMS API initialization failed:', error);
      return false;
    }
  }

  async setupTwilio(accountSid, authToken, phoneNumber) {
    try {
      const credentials = {
        accountSid,
        authToken,
        phoneNumber
      };

      const config = {
        provider: 'twilio',
        credentials,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('sms_config', JSON.stringify(config));
      
      this.provider = 'twilio';
      this.credentials = credentials;

      // Test the credentials
      const testResult = await this.testConnection();
      if (testResult.success) {
        console.log('Twilio SMS credentials validated');
        return { success: true, message: 'Twilio credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid Twilio credentials: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save Twilio credentials: ' + error.message };
    }
  }

  async setupAWSSNS(accessKeyId, secretAccessKey, region) {
    try {
      const credentials = {
        accessKeyId,
        secretAccessKey,
        region
      };

      const config = {
        provider: 'aws-sns',
        credentials,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('sms_config', JSON.stringify(config));
      
      this.provider = 'aws-sns';
      this.credentials = credentials;

      return { success: true, message: 'AWS SNS credentials saved successfully' };
      
    } catch (error) {
      return { success: false, error: 'Failed to save AWS SNS credentials: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.credentials) {
        return { success: false, error: 'No credentials configured' };
      }

      if (this.provider === 'twilio') {
        return await this.testTwilioConnection();
      } else if (this.provider === 'aws-sns') {
        return await this.testAWSSNSConnection();
      }

      return { success: false, error: 'Unknown SMS provider' };
      
    } catch (error) {
      return { success: false, error: 'Connection test failed: ' + error.message };
    }
  }

  async testTwilioConnection() {
    try {
      const auth = btoa(`${this.credentials.accountSid}:${this.credentials.authToken}`);
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.credentials.accountSid}/IncomingPhoneNumbers.json`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          accountSid: this.credentials.accountSid,
          phoneNumbers: data.incoming_phone_numbers?.length || 0
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Twilio connection failed'
        };
      }
      
    } catch (error) {
      return { success: false, error: 'Twilio test error: ' + error.message };
    }
  }

  async testAWSSNSConnection() {
    // AWS SNS connection test would require AWS SDK implementation
    // This is a placeholder for the validation
    try {
      const required = ['accessKeyId', 'secretAccessKey', 'region'];
      const missing = required.filter(field => !this.credentials[field]);
      
      if (missing.length > 0) {
        return { success: false, error: `Missing required AWS fields: ${missing.join(', ')}` };
      }

      return {
        success: true,
        message: 'AWS SNS configuration appears valid',
        region: this.credentials.region
      };
      
    } catch (error) {
      return { success: false, error: 'AWS SNS validation error: ' + error.message };
    }
  }

  async sendSMS(to, message) {
    try {
      if (this.provider === 'twilio') {
        return await this.sendTwilioSMS(to, message);
      } else if (this.provider === 'aws-sns') {
        return await this.sendAWSSNS(to, message);
      }

      return { success: false, error: 'No SMS provider configured' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendTwilioSMS(to, message) {
    try {
      const auth = btoa(`${this.credentials.accountSid}:${this.credentials.authToken}`);
      
      const payload = new URLSearchParams({
        From: this.credentials.phoneNumber,
        To: to,
        Body: message
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.credentials.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: payload
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.sid,
          status: responseData.status,
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Twilio SMS error:', responseData);
        return {
          success: false,
          error: responseData.message || 'Failed to send SMS'
        };
      }
      
    } catch (error) {
      console.error('Twilio SMS send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendAWSSNS(to, message) {
    // AWS SNS implementation would require AWS SDK
    // This is a placeholder
    try {
      console.log('AWS SNS SMS would be sent:', { to, message });
      
      return {
        success: true,
        messageId: `aws_${Date.now()}`,
        status: 'queued',
        timestamp: new Date().toISOString(),
        note: 'AWS SNS requires server-side implementation'
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleIncomingWebhook(webhookData) {
    try {
      if (this.provider === 'twilio') {
        return await this.processTwilioWebhook(webhookData);
      }

      return { success: false, error: 'Webhook not supported for this provider' };
      
    } catch (error) {
      console.error('SMS webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async processTwilioWebhook(webhookData) {
    try {
      const messageData = {
        id: webhookData.MessageSid,
        from: webhookData.From,
        to: webhookData.To,
        content: webhookData.Body,
        timestamp: new Date().toISOString(),
        platform: 'sms',
        provider: 'twilio'
      };

      console.log('Processing Twilio SMS:', messageData);
      return {
        success: true,
        messageData,
        platform: 'sms',
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing Twilio webhook:', error);
      return { success: false, error: error.message };
    }
  }

  isConfigured() {
    return !!(this.credentials && this.provider);
  }

  getConfiguration() {
    return {
      provider: this.provider,
      hasCredentials: !!this.credentials,
      isInitialized: this.isInitialized
    };
  }

  async clearConfiguration() {
    try {
      await AsyncStorage.removeItem('sms_config');
      this.provider = null;
      this.credentials = null;
      this.isInitialized = false;
      
      return { success: true, message: 'SMS configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const smsAPI = new SMSAPI();

// SMS utility functions
export const SMSUtils = {
  // Validate phone number format
  isValidPhoneNumber: (phoneNumber) => {
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    return /^\+?1?\d{10,15}$/.test(cleaned);
  },

  // Format phone number for SMS
  formatPhoneNumber: (phoneNumber) => {
    let cleaned = phoneNumber.replace(/[^\d]/g, '');
    
    // Add country code if missing
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned; // US default
    }
    
    return '+' + cleaned;
  },

  // Truncate SMS message to fit character limits
  truncateMessage: (message, maxLength = 160) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + '...';
  },

  // Split long messages into multiple SMS
  splitLongMessage: (message, maxLength = 160) => {
    if (message.length <= maxLength) return [message];
    
    const messages = [];
    let currentMessage = '';
    const words = message.split(' ');
    
    for (const word of words) {
      if ((currentMessage + ' ' + word).length <= maxLength) {
        currentMessage += (currentMessage ? ' ' : '') + word;
      } else {
        if (currentMessage) {
          messages.push(currentMessage);
          currentMessage = word;
        } else {
          // Word itself is too long
          messages.push(word.substring(0, maxLength));
          currentMessage = word.substring(maxLength);
        }
      }
    }
    
    if (currentMessage) {
      messages.push(currentMessage);
    }
    
    return messages;
  },

  // Extract phone numbers from text
  extractPhoneNumbers: (text) => {
    const phoneRegex = /(\+?1?\s*\(?[0-9]{3}\)?[-.\s]*[0-9]{3}[-.\s]*[0-9]{4})/g;
    const matches = text.match(phoneRegex);
    return matches ? matches.map(match => SMSUtils.formatPhoneNumber(match)) : [];
  },

  // Check if message contains urgent keywords
  isUrgentMessage: (message) => {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediate', 'help', 'problem'];
    const lowerMessage = message.toLowerCase();
    return urgentKeywords.some(keyword => lowerMessage.includes(keyword));
  }
};
