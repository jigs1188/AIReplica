import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class EmailAPI {
  constructor() {
    this.provider = null; // 'gmail', 'outlook', 'smtp'
    this.credentials = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (Platform.OS === 'web') {
        console.warn('Email API limited functionality on web platform');
      }

      // Load stored credentials
      const storedConfig = await AsyncStorage.getItem('email_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        this.provider = config.provider;
        this.credentials = config.credentials;
      }

      this.isInitialized = true;
      console.log('Email API initialized');
      return true;
      
    } catch (error) {
      console.error('Email API initialization failed:', error);
      return false;
    }
  }

  async setupGmailAPI(accessToken, refreshToken, clientId, clientSecret) {
    try {
      const credentials = {
        accessToken,
        refreshToken,
        clientId,
        clientSecret
      };

      const config = {
        provider: 'gmail',
        credentials,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('email_config', JSON.stringify(config));
      
      this.provider = 'gmail';
      this.credentials = credentials;

      // Test the credentials
      const testResult = await this.testConnection();
      if (testResult.success) {
        console.log('Gmail API credentials validated');
        return { success: true, message: 'Gmail credentials saved successfully' };
      } else {
        return { success: false, error: 'Invalid Gmail credentials: ' + testResult.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to save Gmail credentials: ' + error.message };
    }
  }

  async setupSMTPConfig(host, port, username, password, secure = true) {
    try {
      const credentials = {
        host,
        port,
        username,
        password,
        secure
      };

      const config = {
        provider: 'smtp',
        credentials,
        setupDate: new Date().toISOString()
      };

      await AsyncStorage.setItem('email_config', JSON.stringify(config));
      
      this.provider = 'smtp';
      this.credentials = credentials;

      return { success: true, message: 'SMTP configuration saved successfully' };
      
    } catch (error) {
      return { success: false, error: 'Failed to save SMTP configuration: ' + error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.credentials) {
        return { success: false, error: 'No credentials configured' };
      }

      if (this.provider === 'gmail') {
        return await this.testGmailConnection();
      } else if (this.provider === 'smtp') {
        return await this.testSMTPConnection();
      }

      return { success: false, error: 'Unknown provider' };
      
    } catch (error) {
      return { success: false, error: 'Connection test failed: ' + error.message };
    }
  }

  async testGmailConnection() {
    try {
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          email: data.emailAddress,
          messagesTotal: data.messagesTotal || 0
        };
      } else {
        // Try to refresh token if expired
        if (response.status === 401) {
          const refreshResult = await this.refreshGmailToken();
          if (refreshResult.success) {
            return await this.testGmailConnection(); // Retry with new token
          }
        }
        
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Gmail connection failed'
        };
      }
      
    } catch (error) {
      return { success: false, error: 'Gmail test error: ' + error.message };
    }
  }

  async testSMTPConnection() {
    // For SMTP, we'll do a basic validation
    // In a real implementation, you'd want to test actual SMTP connection
    try {
      const required = ['host', 'port', 'username', 'password'];
      const missing = required.filter(field => !this.credentials[field]);
      
      if (missing.length > 0) {
        return { success: false, error: `Missing required fields: ${missing.join(', ')}` };
      }

      return {
        success: true,
        message: 'SMTP configuration appears valid',
        host: this.credentials.host,
        port: this.credentials.port
      };
      
    } catch (error) {
      return { success: false, error: 'SMTP validation error: ' + error.message };
    }
  }

  async refreshGmailToken() {
    try {
      if (!this.credentials.refreshToken) {
        return { success: false, error: 'No refresh token available' };
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          refresh_token: this.credentials.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.credentials.accessToken = data.access_token;
        
        // Update stored credentials
        const config = {
          provider: 'gmail',
          credentials: this.credentials,
          setupDate: new Date().toISOString()
        };
        await AsyncStorage.setItem('email_config', JSON.stringify(config));
        
        return { success: true, accessToken: data.access_token };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error_description || 'Token refresh failed' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendEmail(to, subject, message, isHTML = false) {
    try {
      if (this.provider === 'gmail') {
        return await this.sendGmailMessage(to, subject, message, isHTML);
      } else if (this.provider === 'smtp') {
        return await this.sendSMTPMessage(to, subject, message, isHTML);
      }

      return { success: false, error: 'No email provider configured' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendGmailMessage(to, subject, message, isHTML = false) {
    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: ${isHTML ? 'text/html' : 'text/plain'}; charset=utf-8`,
        '',
        message
      ].join('\n');

      const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.id,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Failed to send email'
        };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendSMTPMessage(to, subject, message, isHTML = false) {
    // For SMTP, we'd need a server-side component or use a service like EmailJS
    // This is a placeholder for the implementation
    try {
      console.log('SMTP Email would be sent:', { to, subject, message, isHTML });
      
      return {
        success: true,
        messageId: `smtp_${Date.now()}`,
        status: 'queued',
        timestamp: new Date().toISOString(),
        note: 'SMTP sending requires server-side implementation'
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getInbox(maxResults = 10) {
    try {
      if (this.provider !== 'gmail') {
        return { success: false, error: 'Inbox only available for Gmail' };
      }

      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messages: data.messages || [],
          resultSizeEstimate: data.resultSizeEstimate || 0
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Failed to get inbox'
        };
      }
      
    } catch (error) {
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
      await AsyncStorage.removeItem('email_config');
      this.provider = null;
      this.credentials = null;
      this.isInitialized = false;
      
      return { success: true, message: 'Email configuration cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const emailAPI = new EmailAPI();

// Email utility functions
export const EmailUtils = {
  // Validate email address format
  isValidEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Extract email domain
  getDomain: (email) => {
    return email.split('@')[1];
  },

  // Format email for display
  formatEmailForDisplay: (email, maxLength = 30) => {
    if (email.length <= maxLength) return email;
    const [local, domain] = email.split('@');
    const availableLength = maxLength - domain.length - 1; // -1 for @
    if (availableLength > 3) {
      return `${local.substring(0, availableLength - 3)}...@${domain}`;
    }
    return `...@${domain}`;
  },

  // Create email signature
  createSignature: (name, title, company) => {
    let signature = `\n\nBest regards,\n${name}`;
    if (title) signature += `\n${title}`;
    if (company) signature += `\n${company}`;
    signature += '\n\n[This message was sent by AI assistant]';
    return signature;
  },

  // Parse email headers
  parseEmailHeaders: (rawEmail) => {
    const lines = rawEmail.split('\n');
    const headers = {};
    
    for (const line of lines) {
      if (line.trim() === '') break; // End of headers
      
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    }
    
    return headers;
  }
};
