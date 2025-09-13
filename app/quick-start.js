import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Alert,
  StatusBar 
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const QuickStartScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const steps = [
    {
      step: 1,
      title: "Connect Your First Platform",
      subtitle: "Start with WhatsApp (most popular)",
      description: "Connect WhatsApp to start getting AI auto-replies for all your messages",
      action: "Choose WhatsApp Type",
      route: "/platform-selector?focus=whatsapp"
    },
    {
      step: 2, 
      title: "Test Your AI",
      subtitle: "Make sure it works perfectly",
      description: "Send a test message and see how your AI responds",
      action: "Test AI Replies",
      route: "/test-center"
    },
    {
      step: 3,
      title: "You're Live! 🎉",
      subtitle: "AI is now handling your messages",
      description: "Your AI clone is active and will auto-reply to messages based on your style",
      action: "View Dashboard",
      route: "/dashboard"
    }
  ];

  const currentStepData = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push(currentStepData.route);
    }
  };

  const handleSkipToAction = () => {
    router.push(currentStepData.route);
  };

  return (
    <LinearGradient 
      colors={['#667eea', '#764ba2']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, padding: 24 }}>
          
          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
            <View style={{ 
              backgroundColor: 'white', 
              borderRadius: 50, 
              padding: 20, 
              marginBottom: 20 
            }}>
              <Feather name="zap" size={40} color="#667eea" />
            </View>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: 'white', 
              textAlign: 'center',
              marginBottom: 8
            }}>
              Quick Start
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: 'rgba(255,255,255,0.8)', 
              textAlign: 'center' 
            }}>
              Get your AI auto-replies running in 2 minutes
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: 40
          }}>
            {[1, 2, 3].map((step, index) => (
              <React.Fragment key={step}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: currentStep >= step ? '#25D366' : 'rgba(255,255,255,0.3)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{
                    color: currentStep >= step ? 'white' : 'rgba(255,255,255,0.7)',
                    fontWeight: 'bold',
                    fontSize: 16
                  }}>
                    {step}
                  </Text>
                </View>
                {index < 2 && (
                  <View style={{
                    width: 40,
                    height: 2,
                    backgroundColor: currentStep > step ? '#25D366' : 'rgba(255,255,255,0.3)',
                    marginHorizontal: 8
                  }} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Current Step */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <View style={{
                backgroundColor: '#667eea',
                borderRadius: 20,
                padding: 8,
                marginRight: 12
              }}>
                <Feather 
                  name={currentStep === 1 ? 'smartphone' : currentStep === 2 ? 'check-circle' : 'star'} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  marginBottom: 4
                }}>
                  Step {currentStepData.step}: {currentStepData.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#667eea',
                  fontWeight: '600'
                }}>
                  {currentStepData.subtitle}
                </Text>
              </View>
            </View>

            <Text style={{
              fontSize: 16,
              color: '#4a4a4a',
              lineHeight: 22,
              marginBottom: 24
            }}>
              {currentStepData.description}
            </Text>

            <TouchableOpacity
              onPress={handleSkipToAction}
              style={{
                backgroundColor: '#25D366',
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
                {currentStepData.action}
              </Text>
              <Feather name="arrow-right" size={18} color="white" />
            </TouchableOpacity>

            {currentStep < totalSteps && (
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  borderWidth: 1,
                  borderColor: '#667eea',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: '#667eea',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  Next Step →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Tips */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20
          }}>
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: 12
            }}>
              💡 Quick Tips:
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              lineHeight: 20
            }}>
              • WhatsApp is the most popular platform to start with{'\n'}
              • Regular WhatsApp works great (no Business account needed){'\n'}
              • Test thoroughly before going live{'\n'}
              • You can connect more platforms later
            </Text>
          </View>

          {/* Skip to Dashboard */}
          <TouchableOpacity
            onPress={() => router.push('/dashboard')}
            style={{
              alignItems: 'center',
              paddingVertical: 16
            }}
          >
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              textDecorationLine: 'underline'
            }}>
              Skip Quick Start - Go to Dashboard
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default QuickStartScreen;
