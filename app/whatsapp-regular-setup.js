import React, { useState } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  TextInput,
  Alert,
  StatusBar,
  Linking
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WhatsAppRegularSetupScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isWhatsAppInstalled, setIsWhatsAppInstalled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('not_started'); // not_started, connecting, connected, failed

  const steps = [
    {
      step: 1,
      title: "Check WhatsApp Installation",
      description: "Make sure WhatsApp is installed on your device"
    },
    {
      step: 2,
      title: "Enter Your Phone Number",
      description: "The phone number linked to your WhatsApp account"
    },
    {
      step: 3,
      title: "Connect to AIReplica",
      description: "Link your WhatsApp with our AI system"
    },
    {
      step: 4,
      title: "Test Connection",
      description: "Send a test message to verify everything works"
    }
  ];

  const handleWhatsAppCheck = async () => {
    try {
      // Try to open WhatsApp
      const whatsappUrl = 'whatsapp://';
      const supported = await Linking.canOpenURL(whatsappUrl);
      
      if (supported) {
        setIsWhatsAppInstalled(true);
        setCurrentStep(2);
        Alert.alert(
          'WhatsApp Found! ✅',
          'Great! WhatsApp is installed on your device. Let\'s continue with setup.',
          [{ text: 'Continue', style: 'default' }]
        );
      } else {
        Alert.alert(
          'WhatsApp Not Found',
          'Please install WhatsApp from the App Store or Google Play before continuing.',
          [
            { text: 'Install WhatsApp', onPress: () => Linking.openURL('https://whatsapp.com/download') },
            { text: 'I\'ll install later', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Check Manually',
        'Please make sure WhatsApp is installed on your device, then tap Continue.',
        [
          { text: 'Continue Anyway', onPress: () => { setIsWhatsAppInstalled(true); setCurrentStep(2); } },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const validatePhoneNumber = (number) => {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(number.replace(/\s/g, ''));
  };

  const handlePhoneSubmit = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid phone number with country code (e.g., +1234567890)'
      );
      return;
    }

    setCurrentStep(3);
  };

  const showQRCode = async () => {
    try {
      const qrResponse = await fetch('http://localhost:3004/api/whatsapp/qr');
      const qrData = await qrResponse.json();
      
      if (qrData.success && qrData.qrCode) {
        // Show QR code in an alert or navigate to a QR display screen
        Alert.alert(
          '📱 Scan QR Code',
          'Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Scan this QR code',
          [
            { text: 'Open QR Screen', onPress: () => router.push('/qr-display?qr=' + encodeURIComponent(qrData.qrCode)) },
            { text: 'I scanned it', onPress: () => setCurrentStep(4) }
          ]
        );
      } else if (qrData.isReady) {
        Alert.alert('Already Connected', 'WhatsApp Web is already connected!');
        setCurrentStep(4);
      } else {
        Alert.alert('QR Code Not Ready', 'Please wait for QR code generation...');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get QR code. Please try again.');
    }
  };

  const handleConnection = async () => {
    setConnectionStatus('connecting');
    
    Alert.alert(
      '🔗 Connecting WhatsApp',
      'Choose your preferred connection method:',
      [
        {
          text: '📱 QR Code Method',
          onPress: () => handleQRConnection()
        },
        {
          text: '⚡ Quick Demo Setup',
          onPress: () => handleDemoConnection()
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setConnectionStatus('not_started')
        }
      ]
    );
  };

  const handleQRConnection = async () => {
    try {
      // Try to check if backend service is running
      const response = await fetch('http://localhost:3004/api/whatsapp/status', {
        timeout: 3000
      });
      
      if (response.ok) {
        // Backend is running, show QR method
        Alert.alert(
          '📱 QR Code Setup',
          'WhatsApp Web QR code method is available. This will open a QR scanner.',
          [
            { 
              text: 'Show QR Code', 
              onPress: () => router.push('/qr-display')
            },
            { text: 'Back', style: 'cancel' }
          ]
        );
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      // Backend not available, show alternative
      Alert.alert(
        'Backend Service Offline',
        'WhatsApp Web service is not running. You can:\n\n1. Start the backend services\n2. Use demo mode for testing\n3. Try manual setup',
        [
          { 
            text: 'Demo Mode', 
            onPress: () => handleDemoConnection()
          },
          { 
            text: 'Manual Setup', 
            onPress: () => handleManualSetup()
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleDemoConnection = async () => {
    setConnectionStatus('connecting');
    
    // Simulate connection process
    setTimeout(async () => {
      setConnectionStatus('connected');
      
      await AsyncStorage.setItem('@whatsapp_regular_connected', JSON.stringify({
        phoneNumber: phoneNumber,
        connectedAt: new Date().toISOString(),
        accountType: 'regular',
        demoMode: true
      }));
      
      Alert.alert(
        '✅ Demo Connection Complete!',
        'WhatsApp demo mode is active. For real functionality:\n\n• Start the backend services\n• Use the production WhatsApp setup\n\nFor now, you can test the interface!',
        [
          { text: 'Test Interface', onPress: () => setCurrentStep(4) },
          { text: 'Go to Dashboard', onPress: () => router.push('/dashboard') }
        ]
      );
    }, 2000);
  };

  const handleManualSetup = () => {
    Alert.alert(
      '� Manual Setup Instructions',
      'To connect WhatsApp manually:\n\n1. Make sure backend services are running\n2. Run: START-COMPLETE-AIREPLICA.bat\n3. Check WhatsApp Web at web.whatsapp.com\n4. Scan QR code there\n5. Return to this app',
      [
        { 
          text: 'I Did This', 
          onPress: async () => {
            setConnectionStatus('connected');
            await AsyncStorage.setItem('@whatsapp_regular_connected', JSON.stringify({
              phoneNumber: phoneNumber,
              connectedAt: new Date().toISOString(),
              accountType: 'regular',
              manualSetup: true
            }));
            setCurrentStep(4);
          }
        },
        { text: 'Need Help', onPress: () => router.push('/support') }
      ]
    );
  };

  const handleTestMessage = () => {
    Alert.alert(
      'Test Your AI 🤖',
      `We'll send a test message to ${phoneNumber}. Your AI will auto-reply to test the connection.`,
      [
        { 
          text: 'Send Test', 
          onPress: () => {
            // Open WhatsApp with a test message
            const testMessage = 'Hi AIReplica, this is a test message. Please respond!';
            const whatsappUrl = `whatsapp://send?phone=${phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(testMessage)}`;
            
            Linking.openURL(whatsappUrl).then(() => {
              Alert.alert(
                'Test Sent! 📱',
                'Check WhatsApp for the AI auto-reply. If you receive a response, setup is complete!',
                [
                  { text: 'Setup Complete', onPress: () => router.push('/dashboard') },
                  { text: 'Need Help', onPress: () => router.push('/support') }
                ]
              );
            }).catch(() => {
              Alert.alert(
                'Alternative Test',
                'Send any message to yourself on WhatsApp and see if your AI responds automatically.',
                [{ text: 'Got it', onPress: () => router.push('/dashboard') }]
              );
            });
          }
        },
        { text: 'Skip Test', onPress: () => router.push('/dashboard') }
      ]
    );
  };

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <View style={{
              backgroundColor: '#25D366',
              borderRadius: 60,
              padding: 20,
              alignSelf: 'center',
              marginBottom: 24
            }}>
              <Feather name="message-circle" size={40} color="white" />
            </View>
            
            <Text style={{
              fontSize: 18,
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24
            }}>
              First, let's make sure WhatsApp is installed and ready on your device.
            </Text>

            <TouchableOpacity
              onPress={handleWhatsAppCheck}
              style={{
                backgroundColor: '#25D366',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                marginRight: 8
              }}>
                Check WhatsApp Installation
              </Text>
              <Feather name="search" size={18} color="white" />
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View>
            <View style={{
              backgroundColor: '#3B82F6',
              borderRadius: 60,
              padding: 20,
              alignSelf: 'center',
              marginBottom: 24
            }}>
              <Feather name="phone" size={40} color="white" />
            </View>
            
            <Text style={{
              fontSize: 18,
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24
            }}>
              Enter the phone number linked to your WhatsApp account.
            </Text>

            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 8,
                fontWeight: '600'
              }}>
                Phone Number (with country code)
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+1234567890"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  backgroundColor: '#F9FAFB'
                }}
              />
              <Text style={{
                fontSize: 12,
                color: '#6B7280',
                marginTop: 8
              }}>
                Include country code (e.g., +1 for US, +44 for UK)
              </Text>
            </View>

            <TouchableOpacity
              onPress={handlePhoneSubmit}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                marginRight: 8
              }}>
                Continue
              </Text>
              <Feather name="arrow-right" size={18} color="white" />
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View>
            <View style={{
              backgroundColor: connectionStatus === 'connected' ? '#10B981' : '#F59E0B',
              borderRadius: 60,
              padding: 20,
              alignSelf: 'center',
              marginBottom: 24
            }}>
              <Feather 
                name={connectionStatus === 'connected' ? 'check-circle' : connectionStatus === 'connecting' ? 'loader' : 'link'} 
                size={40} 
                color="white" 
              />
            </View>
            
            <Text style={{
              fontSize: 18,
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24
            }}>
              {connectionStatus === 'connected' 
                ? 'Successfully connected to WhatsApp! 🎉'
                : connectionStatus === 'connecting'
                ? 'Connecting to your WhatsApp...'
                : 'Ready to connect your WhatsApp to AIReplica.'
              }
            </Text>

            {connectionStatus !== 'connected' && (
              <TouchableOpacity
                onPress={handleConnection}
                disabled={connectionStatus === 'connecting'}
                style={{
                  backgroundColor: connectionStatus === 'connecting' ? '#9CA3AF' : '#F59E0B',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginRight: 8
                }}>
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect WhatsApp'}
                </Text>
                {connectionStatus === 'connecting' ? (
                  <Feather name="loader" size={18} color="white" />
                ) : (
                  <Feather name="link" size={18} color="white" />
                )}
              </TouchableOpacity>
            )}

            {connectionStatus === 'connected' && (
              <TouchableOpacity
                onPress={() => setCurrentStep(4)}
                style={{
                  backgroundColor: '#10B981',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginRight: 8
                }}>
                  Test Connection
                </Text>
                <Feather name="arrow-right" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        );

      case 4:
        return (
          <View>
            <View style={{
              backgroundColor: '#8B5CF6',
              borderRadius: 60,
              padding: 20,
              alignSelf: 'center',
              marginBottom: 24
            }}>
              <Feather name="send" size={40} color="white" />
            </View>
            
            <Text style={{
              fontSize: 18,
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24
            }}>
              Let's test the connection by sending a test message and seeing if your AI responds!
            </Text>
 
            <TouchableOpacity
              onPress={handleTestMessage}
              style={{
                backgroundColor: '#8B5CF6',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                marginRight: 8
              }}>
                Send Test Message
              </Text>
              <Feather name="send" size={18} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/dashboard')}
              style={{
                borderWidth: 1,
                borderColor: '#8B5CF6',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: '#8B5CF6',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Skip Test - Go to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient 
      colors={['#25D366', '#128C7E']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, padding: 24 }}>
          
          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                padding: 8
              }}
            >
              <Feather name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: 'white', 
              textAlign: 'center',
              marginBottom: 8
            }}>
              WhatsApp Setup
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: 'rgba(255,255,255,0.8)', 
              textAlign: 'center' 
            }}>
              Connect your regular WhatsApp account
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: 40
          }}>
            {[1, 2, 3, 4].map((step, index) => (
              <React.Fragment key={step}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: currentStep >= step ? 'white' : 'rgba(255,255,255,0.3)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{
                    color: currentStep >= step ? '#25D366' : 'rgba(255,255,255,0.7)',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}>
                    {step}
                  </Text>
                </View>
                {index < 3 && (
                  <View style={{
                    width: 30,
                    height: 2,
                    backgroundColor: currentStep > step ? 'white' : 'rgba(255,255,255,0.3)',
                    marginHorizontal: 8
                  }} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Step Content */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: 8
            }}>
              Step {currentStep}: {steps[currentStep - 1].title}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              marginBottom: 24
            }}>
              {steps[currentStep - 1].description}
            </Text>

            {getCurrentStepContent()}
          </View>

          {/* Help */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Feather name="help-circle" size={20} color="white" style={{ marginRight: 12 }} />
            <Text style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              flex: 1
            }}>
              Need help? This setup works with any regular WhatsApp account - no business account needed!
            </Text>
          </View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default WhatsAppRegularSetupScreen;
