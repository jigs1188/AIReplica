import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

class ConfigurationManager {
  constructor() {
    this.userId = null;
    this.localConfigKey = 'app_configuration';
    this.encryptionKey = 'ai_replica_config_key_2024'; // In production, use proper encryption
  }

  // Initialize with user ID for cloud sync
  async initialize(userId) {
    this.userId = userId;
    console.log('ConfigurationManager initialized for user:', userId);
  }

  // Save configuration both locally and to cloud
  async saveConfiguration(platform, config) {
    try {
      const timestamp = new Date().toISOString();
      
      // Get existing configurations
      const existingConfig = await this.getLocalConfiguration();
      
      // Update with new platform config
      const updatedConfig = {
        ...existingConfig,
        [platform]: {
          ...config,
          lastUpdated: timestamp,
          isActive: true
        },
        lastModified: timestamp
      };

      // Save locally first
      await AsyncStorage.setItem(this.localConfigKey, JSON.stringify(updatedConfig));
      
      // Save to cloud if user is authenticated
      if (this.userId) {
        await this.syncToCloud(updatedConfig);
      }

      console.log(`Configuration saved for ${platform}`);
      return { success: true, message: 'Configuration saved successfully' };
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      return { success: false, error: error.message };
    }
  }

  // Get configuration from local storage first, fallback to cloud
  async getConfiguration(platform) {
    try {
      // Try local first
      const localConfig = await this.getLocalConfiguration();
      
      if (localConfig[platform]) {
        return { success: true, config: localConfig[platform] };
      }

      // Fallback to cloud if user is authenticated
      if (this.userId) {
        const cloudConfig = await this.getCloudConfiguration();
        if (cloudConfig[platform]) {
          // Save to local for faster access next time
          await this.saveLocalConfiguration(cloudConfig);
          return { success: true, config: cloudConfig[platform] };
        }
      }

      return { success: false, error: 'Configuration not found' };
      
    } catch (error) {
      console.error('Error getting configuration:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all configurations
  async getAllConfigurations() {
    try {
      const localConfig = await this.getLocalConfiguration();
      
      // If user is authenticated, try to sync from cloud
      if (this.userId) {
        try {
          const cloudConfig = await this.getCloudConfiguration();
          
          // Merge local and cloud configurations (cloud takes precedence)
          const mergedConfig = { ...localConfig, ...cloudConfig };
          
          // Save merged config locally
          await this.saveLocalConfiguration(mergedConfig);
          
          return { success: true, configurations: mergedConfig };
        } catch (cloudError) {
          console.warn('Cloud sync failed, using local config:', cloudError);
          return { success: true, configurations: localConfig };
        }
      }

      return { success: true, configurations: localConfig };
      
    } catch (error) {
      console.error('Error getting all configurations:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync local configuration to cloud
  async syncToCloud(config = null) {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated for cloud sync');
      }

      const configToSync = config || await this.getLocalConfiguration();
      
      const docRef = doc(db, 'user_configurations', this.userId);
      
      await setDoc(docRef, {
        configurations: configToSync,
        lastSynced: serverTimestamp(),
        version: this.generateConfigVersion(configToSync)
      }, { merge: true });

      console.log('Configuration synced to cloud successfully');
      return { success: true, message: 'Synced to cloud successfully' };
      
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      return { success: false, error: error.message };
    }
  }

  // Get configuration from cloud
  async getCloudConfiguration() {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(db, 'user_configurations', this.userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.configurations || {};
      }

      return {};
      
    } catch (error) {
      console.error('Error getting cloud configuration:', error);
      throw error;
    }
  }

  // Sync from cloud to local
  async syncFromCloud() {
    try {
      if (!this.userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const cloudConfig = await this.getCloudConfiguration();
      
      if (Object.keys(cloudConfig).length > 0) {
        await this.saveLocalConfiguration(cloudConfig);
        console.log('Configuration synced from cloud successfully');
        return { success: true, message: 'Synced from cloud successfully' };
      }

      return { success: true, message: 'No cloud configuration found' };
      
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      return { success: false, error: error.message };
    }
  }

  // Auto-save functionality - call this periodically
  async autoSave() {
    try {
      if (this.userId) {
        const localConfig = await this.getLocalConfiguration();
        await this.syncToCloud(localConfig);
        return { success: true, message: 'Auto-save completed' };
      }
      
      return { success: true, message: 'Auto-save skipped (not authenticated)' };
      
    } catch (error) {
      console.error('Auto-save error:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all configurations
  async clearAllConfigurations() {
    try {
      // Clear local
      await AsyncStorage.removeItem(this.localConfigKey);
      
      // Clear cloud if authenticated
      if (this.userId) {
        const docRef = doc(db, 'user_configurations', this.userId);
        await updateDoc(docRef, {
          configurations: {},
          lastCleared: serverTimestamp()
        });
      }

      return { success: true, message: 'All configurations cleared' };
      
    } catch (error) {
      console.error('Error clearing configurations:', error);
      return { success: false, error: error.message };
    }
  }

  // Get platform status
  async getPlatformStatus() {
    try {
      const allConfigs = await this.getAllConfigurations();
      
      if (!allConfigs.success) {
        return { success: false, error: allConfigs.error };
      }

      const platformStatus = {};
      const supportedPlatforms = [
        'whatsapp', 'instagram', 'facebook', 'linkedin', 'twitter', 
        'discord', 'slack', 'telegram', 'email', 'sms'
      ];

      supportedPlatforms.forEach(platform => {
        const config = allConfigs.configurations[platform];
        platformStatus[platform] = {
          configured: !!config,
          lastUpdated: config?.lastUpdated || null,
          isActive: config?.isActive || false,
          hasValidCredentials: this.validatePlatformConfig(platform, config)
        };
      });

      return { success: true, platformStatus };
      
    } catch (error) {
      console.error('Error getting platform status:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async getLocalConfiguration() {
    try {
      const config = await AsyncStorage.getItem(this.localConfigKey);
      return config ? JSON.parse(config) : {};
    } catch (error) {
      console.error('Error getting local configuration:', error);
      return {};
    }
  }

  async saveLocalConfiguration(config) {
    try {
      await AsyncStorage.setItem(this.localConfigKey, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving local configuration:', error);
      throw error;
    }
  }

  validatePlatformConfig(platform, config) {
    if (!config) return false;

    switch (platform) {
      case 'whatsapp':
        return !!(config.accessToken && config.phoneNumberId);
      case 'instagram':
        return !!(config.accessToken && config.pageId);
      case 'facebook':
        return !!(config.accessToken && config.pageId);
      case 'linkedin':
        return !!(config.accessToken && config.personId);
      case 'twitter':
        return !!(config.bearerToken || (config.apiKey && config.apiSecret));
      case 'discord':
        return !!(config.token && config.channelId);
      case 'slack':
        return !!(config.token && config.channelId);
      case 'telegram':
        return !!(config.botToken && config.chatId);
      case 'email':
        return !!(config.username && config.password && config.host);
      case 'sms':
        return !!(config.accountSid && config.authToken);
      default:
        return false;
    }
  }

  generateConfigVersion(config) {
    // Generate a simple version hash based on configuration
    const configString = JSON.stringify(config);
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Backup configurations to cloud storage
  async createBackup(backupName = null) {
    try {
      if (!this.userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const allConfigs = await this.getLocalConfiguration();
      const timestamp = new Date().toISOString();
      const name = backupName || `backup_${timestamp.split('T')[0]}`;

      const backupRef = doc(db, 'configuration_backups', `${this.userId}_${name}`);
      
      await setDoc(backupRef, {
        userId: this.userId,
        configurations: allConfigs,
        backupName: name,
        createdAt: serverTimestamp(),
        version: this.generateConfigVersion(allConfigs)
      });

      return { success: true, message: `Backup '${name}' created successfully` };
      
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new ConfigurationManager();
