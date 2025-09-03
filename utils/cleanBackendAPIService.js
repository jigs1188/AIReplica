/**
 * Backend API Infrastructure
 * Handles all OAuth flows and platform management for the startup
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class BackendAPIService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.aireplica.com' 
      : 'http://localhost:8080';
    this.userToken = null;
    this.userId = null;
  }

  /**
   * User Authentication
   */
  async authenticateUser(email, password) {
    try {
      const response = await this.mockAPICall('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (response.success) {
        this.userToken = response.token;
        this.userId = response.user.id;
        await this.storeAuthToken(response.token, response.user);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register new user account
   */
  async registerUser(userData) {
    try {
      const response = await this.mockAPICall('/auth/register', {
        method: 'POST',
        body: userData
      });

      if (response.success) {
        this.userToken = response.token;
        this.userId = response.user.id;
        await this.storeAuthToken(response.token, response.user);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * OAuth Platform Connection - Simplified for users
   */
  async connectPlatformOAuth(platform, userPermissions = {}) {
    try {
      console.log(`🔗 Connecting ${platform} via simplified OAuth...`);

      // In production: redirect to OAuth, get callback, exchange tokens
      // For demo: simulate successful connection
      const mockConnectionResult = await this.simulateOAuthSuccess(platform, userPermissions);

      return mockConnectionResult;
    } catch (error) {
      console.error(`❌ Platform connection failed:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Exchange OAuth code for access tokens
   */
  async exchangeOAuthCode(platform, authCode, state) {
    try {
      const response = await this.mockAPICall(`/oauth/${platform}/exchange`, {
        method: 'POST',
        body: {
          code: authCode,
          state,
          user_id: this.userId
        }
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh platform tokens
   */
  async refreshPlatformTokens(platform, userId) {
    try {
      const response = await this.mockAPICall(`/oauth/${platform}/refresh`, {
        method: 'POST',
        body: { user_id: userId }
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Revoke platform access
   */
  async revokePlatformAccess(platform, userId) {
    try {
      const response = await this.mockAPICall(`/oauth/${platform}/revoke`, {
        method: 'POST',
        body: { user_id: userId }
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's connected platforms
   */
  async getUserPlatforms() {
    try {
      const response = await this.mockAPICall(`/user/${this.userId}/platforms`);
      return response;
    } catch (error) {
      return {
        success: false,
        platforms: [],
        error: error.message
      };
    }
  }

  /**
   * Store auth token locally
   */
  async storeAuthToken(token, user) {
    try {
      const authData = {
        token,
        user,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        createdAt: Date.now()
      };

      await AsyncStorage.setItem('aireplica_auth', JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  /**
   * Load stored authentication
   */
  async loadStoredAuth() {
    try {
      const authData = await AsyncStorage.getItem('aireplica_auth');
      if (!authData) return null;

      const parsed = JSON.parse(authData);
      
      if (Date.now() > parsed.expiresAt) {
        await AsyncStorage.removeItem('aireplica_auth');
        return null;
      }

      this.userToken = parsed.token;
      this.userId = parsed.user.id;
      return parsed;
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      return null;
    }
  }

  /**
   * Simulate OAuth success for demo
   */
  async simulateOAuthSuccess(platform, userPermissions) {
    console.log(`🔄 Simulating OAuth flow for ${platform}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ User granted permissions for ${platform}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tokenExchange = await this.mockTokenExchange(platform, {
      code: 'auth_code_' + Math.random().toString(36),
      state: 'oauth_state_' + Math.random().toString(36)
    });

    if (!tokenExchange.success) {
      throw new Error('Token exchange failed');
    }

    const config = {
      ...tokenExchange.config,
      platform,
      userPermissions,
      connectedAt: new Date().toISOString(),
      isOAuthConnected: true,
      status: 'active'
    };

    console.log(`💾 ${platform} connected successfully via OAuth!`);

    return {
      success: true,
      config,
      message: `${platform} connected successfully! You can now enable auto-reply.`
    };
  }

  /**
   * Mock API responses
   */
  async mockAPICall(endpoint, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    console.log(`📡 API Call: ${options.method || 'GET'} ${endpoint}`);

    if (endpoint === '/auth/login') {
      return this.mockLoginResponse(options.body);
    } else if (endpoint === '/auth/register') {
      return this.mockRegisterResponse(options.body);
    } else if (endpoint.includes('/oauth/') && endpoint.includes('/exchange')) {
      const platform = endpoint.split('/')[2];
      return this.mockTokenExchange(platform, options.body);
    }

    return { success: true, data: null };
  }

  mockLoginResponse(credentials) {
    if (credentials.email && credentials.password) {
      return {
        success: true,
        token: 'aireplica_token_' + Math.random().toString(36),
        user: {
          id: 'user_' + Math.random().toString(36).substring(2, 8),
          email: credentials.email,
          name: credentials.email.split('@')[0],
          plan: 'free',
          createdAt: new Date().toISOString()
        }
      };
    }

    return {
      success: false,
      error: 'Invalid credentials'
    };
  }

  mockRegisterResponse(userData) {
    return {
      success: true,
      token: 'aireplica_token_' + Math.random().toString(36),
      user: {
        id: 'user_' + Math.random().toString(36).substring(2, 8),
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        plan: 'free',
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Mock OAuth token exchange
   */
  mockTokenExchange(platform, _exchangeData) {
    const platformConfigs = {
      whatsapp: {
        accessToken: 'EAAwhatsapp_' + Math.random().toString(36),
        phoneNumberId: '1234567890',
        businessAccountId: 'business_' + Math.random().toString(36).substring(2, 8),
        expiresAt: Date.now() + (60 * 24 * 60 * 60 * 1000)
      },
      instagram: {
        accessToken: 'IGAAinstagram_' + Math.random().toString(36),
        instagramAccountId: 'ig_' + Math.random().toString(36).substring(2, 8),
        pageId: 'page_' + Math.random().toString(36).substring(2, 8)
      },
      gmail: {
        accessToken: 'gmail_access_' + Math.random().toString(36),
        refreshToken: 'gmail_refresh_' + Math.random().toString(36),
        scope: 'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.readonly'
      }
    };

    return {
      success: true,
      config: platformConfigs[platform] || {
        accessToken: `${platform}_token_` + Math.random().toString(36),
        connectedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus() {
    const storedAuth = await this.loadStoredAuth();
    return {
      isAuthenticated: !!storedAuth,
      user: storedAuth?.user || null,
      expiresAt: storedAuth?.expiresAt || null
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.userToken && !!this.userId;
  }
}

// Export singleton instance
export default new BackendAPIService();
