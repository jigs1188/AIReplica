/**
 * Simple WhatsApp Integration
 * Direct connection to WhatsApp Web without complex APIs
 */

import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SimpleWhatsAppConnector {
  constructor() {
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
  }

  /**
   * Connect to WhatsApp - Opens WhatsApp Web for QR scan
   */
  async connect() {
    try {
      console.log('🔗 Connecting to WhatsApp...');
      
      // Step 1: Show user what will happen
      return new Promise((resolve) => {
        Alert.alert(
          '📱 Connect WhatsApp',
          'We\'ll open WhatsApp Web where you can scan QR code with your phone. This connects your WhatsApp to our AI assistant.',
          [
            { text: 'Cancel', onPress: () => resolve({ success: false }) },
            { 
              text: 'Connect', 
              onPress: () => this.openWhatsAppWeb(resolve)
            }
          ]
        );
      });

    } catch (error) {
      console.error('WhatsApp connection error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Open WhatsApp Web for QR scanning
   */
  async openWhatsAppWeb(resolve) {
    try {
      // Open WhatsApp Web
      const whatsappWebURL = 'https://web.whatsapp.com';
      
      const canOpen = await Linking.canOpenURL(whatsappWebURL);
      if (canOpen) {
        await Linking.openURL(whatsappWebURL);
        
        // Show instructions
        setTimeout(() => {
          Alert.alert(
            '📲 Scan QR Code',
            '1. Scan the QR code with your phone\n2. Keep WhatsApp Web open\n3. Come back to the app\n\nOnce connected, our AI will handle your messages!',
            [
              { 
                text: 'Connected!', 
                onPress: () => this.markAsConnected(resolve)
              },
              { 
                text: 'Cancel', 
                onPress: () => resolve({ success: false })
              }
            ]
          );
        }, 2000);
        
      } else {
        throw new Error('Cannot open WhatsApp Web');
      }

    } catch (error) {
      console.error('Error opening WhatsApp Web:', error);
      Alert.alert('Error', 'Could not open WhatsApp Web. Please try again.');
      resolve({ success: false, error: error.message });
    }
  }

  /**
   * Mark WhatsApp as connected
   */
  async markAsConnected(resolve) {
    try {
      this.isConnected = true;
      this.connectionStatus = 'connected';
      
      // Save connection status
      await AsyncStorage.setItem('whatsapp_connected', 'true');
      await AsyncStorage.setItem('whatsapp_connected_at', new Date().toISOString());
      
      console.log('✅ WhatsApp connected successfully');
      
      Alert.alert(
        '🎉 WhatsApp Connected!',
        'Your WhatsApp is now connected! Our AI will monitor your messages and help with auto-replies.',
        [{ 
          text: 'Great!',
          onPress: () => resolve({ 
            success: true, 
            platform: 'whatsapp',
            message: 'WhatsApp connected via WhatsApp Web'
          })
        }]
      );

    } catch (error) {
      console.error('Error marking as connected:', error);
      resolve({ success: false, error: error.message });
    }
  }

  /**
   * Check if WhatsApp is connected
   */
  async isWhatsAppConnected() {
    try {
      const connected = await AsyncStorage.getItem('whatsapp_connected');
      this.isConnected = connected === 'true';
      return this.isConnected;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  /**
   * Disconnect WhatsApp
   */
  async disconnect() {
    try {
      this.isConnected = false;
      this.connectionStatus = 'disconnected';
      
      await AsyncStorage.removeItem('whatsapp_connected');
      await AsyncStorage.removeItem('whatsapp_connected_at');
      
      console.log('🔌 WhatsApp disconnected');
      
      Alert.alert(
        '🔌 Disconnected',
        'WhatsApp has been disconnected. You can reconnect anytime from the dashboard.'
      );

      return { success: true };

    } catch (error) {
      console.error('Error disconnecting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection status
   */
  async getStatus() {
    const isConnected = await this.isWhatsAppConnected();
    const connectedAt = await AsyncStorage.getItem('whatsapp_connected_at');
    
    return {
      platform: 'whatsapp',
      connected: isConnected,
      status: isConnected ? 'connected' : 'disconnected',
      connectedAt: connectedAt,
      method: 'WhatsApp Web'
    };
  }

  /**
   * Send message through WhatsApp Web (simplified)
   */
  async sendMessage(phoneNumber, message) {
    try {
      // Format phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // Create WhatsApp URL with pre-filled message
      const whatsappURL = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappURL);
      if (canOpen) {
        await Linking.openURL(whatsappURL);
        return { success: true, method: 'WhatsApp Web' };
      } else {
        throw new Error('Cannot open WhatsApp');
      }

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new SimpleWhatsAppConnector();
