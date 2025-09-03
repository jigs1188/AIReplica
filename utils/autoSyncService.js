import configurationManager from './configurationManager';
import permanentTokenService from './permanentTokenService';
import { AppState } from 'react-native';

class AutoSyncService {
  constructor() {
    this.isActive = false;
    this.syncInterval = null;
    this.tokenRefreshInterval = null;
    this.appStateSubscription = null;
    this.syncIntervalMinutes = 5; // Default 5 minutes
    this.tokenCheckIntervalHours = 24; // Check tokens daily
  }

  // Initialize auto-sync service
  async initialize(userId, options = {}) {
    try {
      if (this.isActive) {
        this.stop(); // Stop existing service
      }

      await configurationManager.initialize(userId);
      
      this.syncIntervalMinutes = options.syncIntervalMinutes || 5;
      this.tokenCheckIntervalHours = options.tokenCheckIntervalHours || 24;

      // Start intervals
      this.startSyncInterval();
      this.startTokenRefreshInterval();
      this.setupAppStateListener();

      this.isActive = true;
      console.log('AutoSyncService initialized successfully');
      
      // Perform initial sync
      await this.performInitialSync();
      
      return { success: true, message: 'Auto-sync service started' };

    } catch (error) {
      console.error('Error initializing AutoSyncService:', error);
      return { success: false, error: error.message };
    }
  }

  // Perform initial sync on startup
  async performInitialSync() {
    try {
      console.log('Performing initial sync...');
      
      // Sync from cloud first to get latest configuration
      const syncResult = await configurationManager.syncFromCloud();
      
      // Validate tokens
      const validationResult = await permanentTokenService.validateAllTokens();
      
      // Refresh tokens if needed
      const refreshResult = await permanentTokenService.refreshTokenIfNeeded('whatsapp');
      
      console.log('Initial sync completed:', {
        sync: syncResult.success,
        validation: validationResult.success,
        refresh: refreshResult.success
      });

      return { 
        success: true, 
        syncResult, 
        validationResult, 
        refreshResult 
      };

    } catch (error) {
      console.error('Error in initial sync:', error);
      return { success: false, error: error.message };
    }
  }

  // Start periodic configuration sync
  startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        console.log('Auto-sync: Syncing configuration to cloud...');
        const result = await configurationManager.autoSave();
        
        if (!result.success) {
          console.warn('Auto-sync failed:', result.error);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    }, this.syncIntervalMinutes * 60 * 1000);

    console.log(`Auto-sync interval started: ${this.syncIntervalMinutes} minutes`);
  }

  // Start periodic token refresh check
  startTokenRefreshInterval() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    this.tokenRefreshInterval = setInterval(async () => {
      try {
        console.log('Auto-sync: Checking token expiration...');
        
        // Check all platforms for token refresh needs
        const platforms = ['whatsapp', 'instagram', 'facebook', 'linkedin', 'twitter'];
        
        for (const platform of platforms) {
          const refreshResult = await permanentTokenService.refreshTokenIfNeeded(platform);
          if (refreshResult.success && refreshResult.message.includes('refreshed')) {
            console.log(`Token refreshed for ${platform}:`, refreshResult.message);
          }
        }
        
      } catch (error) {
        console.error('Token refresh check error:', error);
      }
    }, this.tokenCheckIntervalHours * 60 * 60 * 1000);

    console.log(`Token refresh check interval started: ${this.tokenCheckIntervalHours} hours`);
  }

  // Setup app state listener for foreground sync
  setupAppStateListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App became active, performing sync...');
        try {
          // Sync from cloud when app becomes active
          await configurationManager.syncFromCloud();
          
          // Quick token validation
          const validationResult = await permanentTokenService.validateAllTokens();
          if (!validationResult.success) {
            console.warn('Token validation failed:', validationResult.error);
          }
        } catch (error) {
          console.error('Foreground sync error:', error);
        }
      }
    });
  }

  // Stop auto-sync service
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.isActive = false;
    console.log('AutoSyncService stopped');
  }

  // Force sync now
  async forceSyncNow() {
    try {
      console.log('Force sync initiated...');
      
      // Sync to cloud
      const syncToCloudResult = await configurationManager.syncToCloud();
      
      // Sync from cloud
      const syncFromCloudResult = await configurationManager.syncFromCloud();
      
      // Validate all tokens
      const validationResult = await permanentTokenService.validateAllTokens();
      
      return {
        success: true,
        results: {
          syncToCloud: syncToCloudResult,
          syncFromCloud: syncFromCloudResult,
          tokenValidation: validationResult
        }
      };

    } catch (error) {
      console.error('Force sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get sync status
  getStatus() {
    return {
      isActive: this.isActive,
      syncIntervalMinutes: this.syncIntervalMinutes,
      tokenCheckIntervalHours: this.tokenCheckIntervalHours,
      hasSyncInterval: !!this.syncInterval,
      hasTokenRefreshInterval: !!this.tokenRefreshInterval,
      hasAppStateListener: !!this.appStateSubscription
    };
  }

  // Update sync intervals
  updateIntervals(syncMinutes, tokenCheckHours) {
    this.syncIntervalMinutes = syncMinutes;
    this.tokenCheckIntervalHours = tokenCheckHours;
    
    if (this.isActive) {
      this.startSyncInterval();
      this.startTokenRefreshInterval();
    }
    
    console.log('Sync intervals updated:', {
      syncMinutes,
      tokenCheckHours
    });
  }

  // Create emergency backup
  async createEmergencyBackup(reason = 'Emergency backup') {
    try {
      const timestamp = new Date().toISOString();
      const backupName = `emergency_${timestamp.split('T')[0]}_${Date.now()}`;
      
      const result = await configurationManager.createBackup(backupName);
      
      console.log('Emergency backup created:', {
        name: backupName,
        reason,
        success: result.success
      });

      return result;

    } catch (error) {
      console.error('Emergency backup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Health check for all services
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        autoSyncService: this.getStatus(),
        configurationManager: null,
        tokenValidation: null,
        cloudConnectivity: null
      };

      // Test configuration manager
      try {
        const testSave = await configurationManager.saveConfiguration('health_check', {
          timestamp: healthStatus.timestamp,
          type: 'health_check'
        });
        healthStatus.configurationManager = testSave.success;
      } catch (error) {
        healthStatus.configurationManager = false;
        healthStatus.configurationManagerError = error.message;
      }

      // Test token validation
      try {
        const tokenValidation = await permanentTokenService.validateAllTokens();
        healthStatus.tokenValidation = tokenValidation.success;
      } catch (error) {
        healthStatus.tokenValidation = false;
        healthStatus.tokenValidationError = error.message;
      }

      // Test cloud connectivity
      try {
        const cloudTest = await configurationManager.syncToCloud();
        healthStatus.cloudConnectivity = cloudTest.success;
      } catch (error) {
        healthStatus.cloudConnectivity = false;
        healthStatus.cloudConnectivityError = error.message;
      }

      return { success: true, healthStatus };

    } catch (error) {
      console.error('Health check error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new AutoSyncService();
