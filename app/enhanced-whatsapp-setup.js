import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  Linking
} from 'react-native';
import { whatsappBusinessAPI } from '../utils/whatsappBusinessAPI';
import configurationManager from '../utils/configurationManager';
import permanentTokenService from '../utils/permanentTokenService';

export default function EnhancedWhatsAppSetup() {
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [testNumber, setTestNumber] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [isPermanentSetup, setIsPermanentSetup] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [configurations, setConfigurations] = useState({});
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  useEffect(() => {
    loadExistingConfiguration();
    
    // Auto-sync every 5 minutes if enabled
    let syncInterval;
    if (autoSyncEnabled) {
      syncInterval = setInterval(() => {
        configurationManager.autoSave();
      }, 5 * 60 * 1000); // 5 minutes
    }
    
    return () => {
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [autoSyncEnabled, loadExistingConfiguration]);

  const loadExistingConfiguration = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load WhatsApp configuration
      const configResult = await configurationManager.getConfiguration('whatsapp');
      if (configResult.success && configResult.config) {
        const config = configResult.config;
        setAccessToken(config.accessToken || '');
        setPhoneNumberId(config.phoneNumberId || '');
        setWebhookVerifyToken(config.webhookVerifyToken || '');
        setAppId(config.appId || '');
        setAppSecret(config.appSecret || '');
        setIsPermanentSetup(config.isPermanent || false);
        
        if (config.accessToken && config.phoneNumberId) {
          setIsConnected(true);
          setConnectionStatus('✅ Configuration loaded from storage');
        }
        
        // Get token info if permanent
        if (config.isPermanent && config.accessToken) {
          const tokenInfoResult = await permanentTokenService.getTokenInfo(config.accessToken);
          if (tokenInfoResult.success) {
            setTokenInfo(tokenInfoResult);
          }
        }
      }
      
      // Load all configurations for status display
      const allConfigsResult = await configurationManager.getAllConfigurations();
      if (allConfigsResult.success) {
        setConfigurations(allConfigsResult.configurations);
      }
      
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = async (silent = false) => {
    if (!accessToken || !phoneNumberId) {
      if (!silent) {
        Alert.alert('Error', 'Please enter Access Token and Phone Number ID');
      }
      return;
    }

    setIsLoading(true);
    try {
      // Setup temporary credentials for testing
      const result = await whatsappBusinessAPI.setupCredentials(
        accessToken,
        phoneNumberId,
        webhookVerifyToken || 'test_verify_token',
        appId,
        appSecret,
        isPermanentSetup
      );

      if (result.success) {
        setIsConnected(true);
        setConnectionStatus('✅ Connected successfully');
        
        if (result.isPermanent) {
          setConnectionStatus(`✅ Connected with permanent token (expires: ${result.expiresAt})`);
          // Refresh token info
          const tokenInfoResult = await permanentTokenService.getTokenInfo(accessToken);
          if (tokenInfoResult.success) {
            setTokenInfo(tokenInfoResult);
          }
        }
        
        if (!silent) {
          Alert.alert('Success', result.message);
        }
      } else {
        setIsConnected(false);
        setConnectionStatus('❌ Connection failed: ' + result.error);
        if (!silent) {
          Alert.alert('Error', result.error);
        }
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('❌ Error: ' + error.message);
      if (!silent) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await whatsappBusinessAPI.sendMessage(
        testNumber,
        `🤖 Test message from AI Replica Personal Assistant\n\nTime: ${new Date().toLocaleString()}\n\nIf you receive this message, your WhatsApp Business API is working correctly!`
      );

      console.log('Test message result:', result);

      if (result.success) {
        Alert.alert(
          'Success',
          `Test message sent successfully!\n\nMessage ID: ${result.messageId}\nStatus: ${result.status}\nTime: ${result.timestamp}`,
          [{ text: 'OK', onPress: () => setShowTestModal(false) }]
        );
      } else {
        Alert.alert('Error', `Failed to send test message: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const syncToCloud = async () => {
    setIsLoading(true);
    try {
      const result = await configurationManager.syncToCloud();
      if (result.success) {
        Alert.alert('Success', 'Configuration synced to cloud successfully');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromCloud = async () => {
    setIsLoading(true);
    try {
      const result = await configurationManager.syncFromCloud();
      if (result.success) {
        await loadExistingConfiguration();
        Alert.alert('Success', 'Configuration synced from cloud successfully');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      const result = await configurationManager.createBackup();
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAllTokens = async () => {
    setIsLoading(true);
    try {
      const result = await permanentTokenService.validateAllTokens();
      if (result.success) {
        const validationSummary = Object.entries(result.validationResults)
          .map(([platform, status]) => 
            `${platform}: ${status.isValid ? '✅' : '❌'} ${status.expiresAt}`
          )
          .join('\n');
        
        Alert.alert('Token Validation Results', validationSummary);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSetupGuide = () => {
    const guide = permanentTokenService.getPermanentTokenSetupGuide();
    
    return (
      <Modal
        visible={showSetupGuide}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <ScrollView style={styles.guideContainer}>
            <View style={styles.guideHeader}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <TouchableOpacity
                onPress={() => setShowSetupGuide(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {guide.steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <Text style={styles.stepTitle}>
                  Step {step.step}: {step.title}
                </Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
                {step.details.map((detail, detailIndex) => (
                  <Text key={detailIndex} style={styles.stepDetail}>
                    • {detail}
                  </Text>
                ))}
              </View>
            ))}
            
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Requirements:</Text>
              {guide.requirements.map((req, index) => (
                <Text key={index} style={styles.requirement}>• {req}</Text>
              ))}
            </View>
            
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Important Notes:</Text>
              {guide.notes.map((note, index) => (
                <Text key={index} style={styles.note}>• {note}</Text>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.openFacebookButton}
              onPress={() => Linking.openURL('https://developers.facebook.com/apps/')}
            >
              <Text style={styles.openFacebookButtonText}>
                Open Facebook Developer Console
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderTestModal = () => (
    <Modal
      visible={showTestModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Send Test Message</Text>
          <Text style={styles.modalDescription}>
            Enter the recipient&apos;s phone number (with country code, e.g., +1234567890):
          </Text>
          
          <TextInput
            style={styles.modalInput}
            value={testNumber}
            onChangeText={setTestNumber}
            placeholder="e.g., +1234567890"
            keyboardType="phone-pad"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowTestModal(false);
                setTestNumber('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.sendButton]}
              onPress={sendTestMessage}
              disabled={isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : 'Send Test'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>WhatsApp Business API Setup</Text>
      
      {/* Cloud Sync Status */}
      <View style={styles.syncStatusContainer}>
        <View style={styles.syncRow}>
          <Text style={styles.syncLabel}>Auto Cloud Sync:</Text>
          <Switch
            value={autoSyncEnabled}
            onValueChange={setAutoSyncEnabled}
            trackColor={{ false: '#767577', true: '#25D366' }}
            thumbColor={autoSyncEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.syncButtons}>
          <TouchableOpacity style={styles.syncButton} onPress={syncToCloud}>
            <Text style={styles.syncButtonText}>☁️ Sync to Cloud</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.syncButton} onPress={syncFromCloud}>
            <Text style={styles.syncButtonText}>📥 Sync from Cloud</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.syncButton} onPress={createBackup}>
            <Text style={styles.syncButtonText}>💾 Create Backup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Permanent Token Setup */}
      <View style={styles.permanentSection}>
        <View style={styles.permanentHeader}>
          <Text style={styles.permanentTitle}>Permanent Token Setup</Text>
          <Switch
            value={isPermanentSetup}
            onValueChange={setIsPermanentSetup}
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </View>
        
        <TouchableOpacity
          style={styles.guideButton}
          onPress={() => setShowSetupGuide(true)}
        >
          <Text style={styles.guideButtonText}>📖 View Setup Guide</Text>
        </TouchableOpacity>
      </View>

      {/* Configuration Inputs */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Access Token *</Text>
        <TextInput
          style={styles.input}
          value={accessToken}
          onChangeText={setAccessToken}
          placeholder="Enter WhatsApp Business API access token"
          secureTextEntry={true}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number ID *</Text>
        <TextInput
          style={styles.input}
          value={phoneNumberId}
          onChangeText={setPhoneNumberId}
          placeholder="Enter phone number ID from Facebook"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Webhook Verify Token</Text>
        <TextInput
          style={styles.input}
          value={webhookVerifyToken}
          onChangeText={setWebhookVerifyToken}
          placeholder="Enter webhook verification token"
          autoCapitalize="none"
        />
      </View>

      {isPermanentSetup && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Facebook App ID *</Text>
            <TextInput
              style={styles.input}
              value={appId}
              onChangeText={setAppId}
              placeholder="Enter Facebook App ID"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Facebook App Secret *</Text>
            <TextInput
              style={styles.input}
              value={appSecret}
              onChangeText={setAppSecret}
              placeholder="Enter Facebook App Secret"
              secureTextEntry={true}
              autoCapitalize="none"
            />
          </View>
        </>
      )}

      {/* Token Information */}
      {tokenInfo && (
        <View style={styles.tokenInfoContainer}>
          <Text style={styles.tokenInfoTitle}>Token Information</Text>
          <Text style={styles.tokenInfoText}>User: {tokenInfo.userName}</Text>
          <Text style={styles.tokenInfoText}>Expires: {tokenInfo.expiresAt}</Text>
          <Text style={styles.tokenInfoText}>Valid: {tokenInfo.isValid ? '✅' : '❌'}</Text>
        </View>
      )}

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={() => testConnection(false)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        {isConnected && (
          <TouchableOpacity
            style={[styles.button, styles.sendButton]}
            onPress={() => setShowTestModal(true)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Send Test Message</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.validateButton]}
          onPress={validateAllTokens}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Validate All Tokens</Text>
        </TouchableOpacity>
      </View>

      {/* Platform Status */}
      <View style={styles.platformStatusContainer}>
        <Text style={styles.platformStatusTitle}>Platform Configuration Status</Text>
        {Object.entries(configurations).map(([platform, config]) => (
          <View key={platform} style={styles.platformStatus}>
            <Text style={styles.platformName}>{platform.toUpperCase()}</Text>
            <Text style={styles.platformStatusText}>
              {config ? '✅ Configured' : '❌ Not configured'}
            </Text>
          </View>
        ))}
      </View>

      {renderSetupGuide()}
      {renderTestModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  syncStatusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  syncLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  syncButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 2,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  permanentSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permanentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  permanentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  guideButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  guideButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  tokenInfoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  tokenInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1976D2',
  },
  tokenInfoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  testButton: {
    backgroundColor: '#25D366',
  },
  sendButton: {
    backgroundColor: '#007AFF',
  },
  validateButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  platformStatusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  platformStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  platformStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  platformStatusText: {
    fontSize: 14,
    color: '#666',
  },
  modal: {
    flex: 1,
    backgroundColor: 'white',
  },
  guideContainer: {
    flex: 1,
    padding: 20,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  stepContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  stepDetail: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
    paddingLeft: 10,
  },
  requirementsContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#856404',
  },
  requirement: {
    fontSize: 14,
    marginBottom: 4,
    color: '#856404',
  },
  notesContainer: {
    backgroundColor: '#d1ecf1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#0c5460',
  },
  note: {
    fontSize: 14,
    marginBottom: 4,
    color: '#0c5460',
  },
  openFacebookButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  openFacebookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
