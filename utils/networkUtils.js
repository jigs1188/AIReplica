import { Platform } from 'react-native';

/**
 * 🌐 Network utility with improved error handling
 * Addresses "Premature close" errors and network timeouts
 */

export const NetworkConfig = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  baseURL: Platform.OS === 'web' ? 'http://localhost' : 'http://localhost',
  productionURL: 'https://your-production-domain.com'
};

export const createApiRequest = async (url, options = {}) => {
  const config = {
    timeout: NetworkConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add timeout to fetch
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), config.timeout);
  });

  let lastError;
  
  // Retry logic
  for (let i = 0; i < NetworkConfig.retries; i++) {
    try {
      const fetchPromise = fetch(url, config);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error;
      console.warn(`API request attempt ${i + 1} failed:`, error.message);
      
      if (i < NetworkConfig.retries - 1) {
        console.log(`Retrying in ${NetworkConfig.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, NetworkConfig.retryDelay));
      }
    }
  }
  
  throw new Error(`All ${NetworkConfig.retries} attempts failed. Last error: ${lastError.message}`);
};

export const ApiEndpoints = {
  // Production service (port 3001) - ALL APIs including WhatsApp
  getOAuthUrl: (platform, baseUrl = 'http://localhost:3001') => `${baseUrl}/api/oauth/${platform}/auth-url`,
  productionHealth: (baseUrl = 'http://localhost:3001') => `${baseUrl}/health`,
  sendWhatsAppOTP: (baseUrl = 'http://localhost:3001') => `${baseUrl}/api/whatsapp/send-otp`,
  verifyWhatsAppOTP: (baseUrl = 'http://localhost:3001') => `${baseUrl}/api/whatsapp/verify-otp`,
  whatsappStatus: (baseUrl = 'http://localhost:3003') => `${baseUrl}/api/whatsapp/status`,
  whatsappHealth: (baseUrl = 'http://localhost:3003') => `${baseUrl}/health`,
  
  // Webhook service (port 3002)
  getConversations: (phone, baseUrl = 'http://localhost:3002') => `${baseUrl}/api/conversations/${phone}`,
  sendTestMessage: (baseUrl = 'http://localhost:3002') => `${baseUrl}/api/test/send-message`,
  webhookHealth: (baseUrl = 'http://localhost:3002') => `${baseUrl}/health`
};

// Pre-configured API methods
export const ApiService = {
  // WhatsApp API
  async sendWhatsAppOTP(phoneNumber, userId) {
    return createApiRequest(ApiEndpoints.sendWhatsAppOTP(), {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, userId })
    });
  },

  async verifyWhatsAppOTP(verificationId, otpCode, phoneNumber, userId) {
    return createApiRequest(ApiEndpoints.verifyWhatsAppOTP(), {
      method: 'POST',
      body: JSON.stringify({ verificationId, otpCode, phoneNumber, userId })
    });
  },

  async getOAuthUrl(platform, userId) {
    return createApiRequest(ApiEndpoints.getOAuthUrl(platform), {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Health checks
  async checkServicesHealth() {
    try {
      const [productionHealth, webhookHealth] = await Promise.allSettled([
        createApiRequest(ApiEndpoints.productionHealth()),
        createApiRequest(ApiEndpoints.webhookHealth())
      ]);

      return {
        production: productionHealth.status === 'fulfilled' ? productionHealth.value : null,
        webhook: webhookHealth.status === 'fulfilled' ? webhookHealth.value : null,
        allHealthy: productionHealth.status === 'fulfilled' && webhookHealth.status === 'fulfilled'
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { allHealthy: false, error: error.message };
    }
  }
};

// Network status monitoring
export const NetworkMonitor = {
  isOnline: true,
  listeners: new Set(),

  addListener(callback) {
    this.listeners.add(callback);
  },

  removeListener(callback) {
    this.listeners.delete(callback);
  },

  notifyListeners(isOnline) {
    this.isOnline = isOnline;
    this.listeners.forEach(callback => callback(isOnline));
  }
};

// Initialize network monitoring for React Native
// Use React Native NetInfo instead of window events
if (typeof window === 'undefined') {
  // React Native environment - use NetInfo if available
  try {
    // Note: NetInfo should be imported properly for production use
    // For now, we'll just use a fallback
    console.log('🌐 Network monitoring initialized for React Native');
  } catch (_error) {
    console.log('📡 NetInfo not available, using fallback network monitoring');
  }
} else {
  // Web environment
  if (window.addEventListener) {
    window.addEventListener('online', () => NetworkMonitor.notifyListeners(true));
    window.addEventListener('offline', () => NetworkMonitor.notifyListeners(false));
  }
}
