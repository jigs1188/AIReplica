import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

export default function QRDisplayScreen() {
  const router = useRouter();
  const { qr } = useLocalSearchParams();
  const [qrCode, setQrCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('waiting'); // waiting, connected, failed
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (qr) {
      setQrCode(qr);
      setIsLoading(false);
    } else {
      fetchQRCode();
    }
    
    // Check connection status every 3 seconds
    const interval = setInterval(checkConnectionStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchQRCode = async () => {
    try {
      setIsLoading(true);
      
      // Try the real WhatsApp Web service first
      let response;
      try {
        response = await fetch('http://localhost:3004/api/whatsapp/qr', {
          timeout: 5000
        });
      } catch (error) {
        // Fallback to simulation service
        response = await fetch('http://localhost:3003/api/whatsapp/qr');
      }
      
      const result = await response.json();
      
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
      } else if (result.isReady) {
        setConnectionStatus('connected');
        Alert.alert(
          'Already Connected! ✅',
          'WhatsApp Web is already connected to your device.',
          [{ text: 'Continue', onPress: () => router.push('/dashboard') }]
        );
      } else {
        throw new Error(result.error || 'No QR code available');
      }
    } catch (error) {
      console.error('QR Code fetch error:', error);
      
      if (retryCount < 3) {
        setRetryCount(retryCount + 1);
        setTimeout(fetchQRCode, 2000);
      } else {
        // Show fallback QR code for demo
        setQrCode('demo_qr_code_aireplica_whatsapp_connection');
        Alert.alert(
          'Demo Mode',
          'Backend service offline. Showing demo QR code for interface testing.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:3004/api/whatsapp/status');
      } catch (error) {
        response = await fetch('http://localhost:3003/api/whatsapp/status');
      }
      
      const result = await response.json();
      
      if (result.connected) {
        setConnectionStatus('connected');
        Alert.alert(
          '🎉 WhatsApp Connected Successfully!',
          'Your WhatsApp is now linked to AIReplica. You can start using automated replies.',
          [
            { 
              text: 'Go to Dashboard', 
              onPress: () => router.push('/dashboard') 
            },
            { 
              text: 'Test Connection', 
              onPress: () => router.push('/whatsapp-live-test') 
            }
          ]
        );
      }
    } catch (error) {
      // Connection check failed, continue waiting
      console.log('Connection check failed:', error.message);
    }
  };

  const handleManualConfirm = () => {
    Alert.alert(
      'Connection Confirmation',
      'Did you successfully scan the QR code with WhatsApp?',
      [
        { 
          text: 'Yes, I scanned it', 
          onPress: () => {
            setConnectionStatus('connected');
            router.push('/dashboard');
          }
        },
        { text: 'No, let me try again', style: 'cancel' },
        {
          text: 'Need Help',
          onPress: () => {
            Alert.alert(
              'QR Code Help 📱',
              'Steps to scan:\n\n1. Open WhatsApp on your phone\n2. Tap Menu (⋮) → Linked Devices\n3. Tap "Link a Device"\n4. Point camera at this QR code\n5. Wait for connection confirmation',
              [{ text: 'Got it' }]
            );
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setRetryCount(0);
    fetchQRCode();
  };

  return (
    <LinearGradient colors={['#25D366', '#128C7E']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.instructionCard}>
          <MaterialCommunityIcons name="qrcode-scan" size={48} color="#25D366" />
          <Text style={styles.instructionTitle}>Link Your WhatsApp</Text>
          <Text style={styles.instructionText}>
            Scan this QR code with your WhatsApp to connect
          </Text>
        </View>

        <View style={styles.qrContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#25D366" />
              <Text style={styles.loadingText}>Generating QR Code...</Text>
            </View>
          ) : (
            <View style={styles.qrCodeWrapper}>
              <View style={styles.qrCodeContainer}>
                <View style={styles.qrCodeDisplay}>
                  <Text style={styles.qrCodeText}>
                    {qrCode ? '█████████████████\n█ ▄▄▄▄▄ █ ▄▄ █▀ █▄█\n█ █   █ ██▄█▀▀ ▄█ █\n█ █▄▄▄█ █ ▀▀▄  ██ █\n█▄▄▄▄▄▄▄█ ▀▄█▄█▄▀▄█\n█ ▄ ██ ▄▀▄▄█▄ █  █▄\n███▀█ █▄█▄▄ ▀ ▄▀▄██\n██▀▄██ ▄▄ ▄ █▄█  █ \n█▄▄▀ █▀▄ ▀▀▀ ▄▄█   \n█▄▄▄▄█▄▄▄ ▀▀ █▀ █ ▄\n█ ▄▄▄▄▄ █▀ ▄▄▄█▄█ █\n█ █   █ ███▀▀█▀ ▄▄▄\n█ █▄▄▄█ █ ▀█▄▄▄▄ ▀▀\n█████████████████' : 'No QR Code'}
                  </Text>
                  <Text style={styles.qrNote}>QR Code for WhatsApp Web</Text>
                </View>
              </View>
              
              {connectionStatus === 'waiting' && (
                <View style={styles.statusIndicator}>
                  <ActivityIndicator size="small" color="#25D366" />
                  <Text style={styles.statusText}>Waiting for scan...</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>📱 How to Scan:</Text>
          <View style={styles.stepsList}>
            <Text style={styles.stepItem}>1. Open WhatsApp on your phone</Text>
            <Text style={styles.stepItem}>2. Tap Menu (⋮) → Linked Devices</Text>
            <Text style={styles.stepItem}>3. Tap &quot;Link a Device&quot;</Text>
            <Text style={styles.stepItem}>4. Point camera at QR code above</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.confirmButton]} 
            onPress={handleManualConfirm}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color="white" />
            <Text style={styles.buttonText}>I Scanned It</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.helpButton]} 
            onPress={() => {
              Alert.alert(
                'Having Trouble? 🤔',
                'Common issues:\n\n• Make sure WhatsApp is updated\n• Check your internet connection\n• Try refreshing the QR code\n• Ensure camera permissions are enabled',
                [
                  { text: 'Refresh QR', onPress: handleRefresh },
                  { text: 'Contact Support', onPress: () => router.push('/support') },
                  { text: 'OK' }
                ]
              );
            }}
          >
            <MaterialCommunityIcons name="help-circle" size={20} color="#25D366" />
            <Text style={[styles.buttonText, { color: '#25D366' }]}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: width * 0.7,
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  qrCodeWrapper: {
    alignItems: 'center',
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  qrCodeDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.6,
    height: width * 0.6,
  },
  qrCodeText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#000',
    textAlign: 'center',
    lineHeight: 10,
  },
  qrNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  qrPlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  qrPlaceholderText: {
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  stepsCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  helpButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
