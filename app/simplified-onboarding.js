import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import aiReplicaBackendAPI from '../utils/aiReplicaBackendAPI';

const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  ACCOUNT: 'account', 
  TRAINING: 'training',
  PLATFORMS: 'platforms',
  COMPLETE: 'complete'
};

const SAMPLE_MESSAGES = [
  "Hey! What's up?",
  "Thanks for the info, really helpful!",
  "Sure, let me get back to you on that",
  "Haha that's pretty funny 😂",
  "I'll check my schedule and let you know"
];

export default function SimplifiedOnboarding() {
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    name: '',
    trainingMessages: ['', '', '', '', ''],
    selectedPlatforms: new Set(['whatsapp', 'instagram'])
  });
  const router = useRouter();

  const handleNextStep = async () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        setCurrentStep(ONBOARDING_STEPS.ACCOUNT);
        break;
      case ONBOARDING_STEPS.ACCOUNT:
        await handleAccountCreation();
        break;
      case ONBOARDING_STEPS.TRAINING:
        await handleTrainingSubmission();
        break;
      case ONBOARDING_STEPS.PLATFORMS:
        await handlePlatformConnection();
        break;
      default:
        break;
    }
  };

  const handleAccountCreation = async () => {
    if (!userData.email || !userData.password || !userData.name) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiReplicaBackendAPI.authenticateUser(userData.email, userData.password);
      
      if (result.success) {
        setCurrentStep(ONBOARDING_STEPS.TRAINING);
      } else {
        Alert.alert('Account Creation Failed', result.error);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrainingSubmission = async () => {
    const filledMessages = userData.trainingMessages.filter(msg => msg.trim() !== '');
    
    if (filledMessages.length < 3) {
      Alert.alert('Need More Examples', 'Please provide at least 3 message examples to train your AI');
      return;
    }

    setIsLoading(true);
    try {
      const trainingData = {
        messages: filledMessages,
        personality: 'friendly_casual', // Could be selected by user
        preferences: {
          responseLength: 'medium',
          formality: 'casual',
          emoji_usage: true
        }
      };

      const result = await aiReplicaBackendAPI.trainAIStyle(trainingData);
      
      if (result.success) {
        setCurrentStep(ONBOARDING_STEPS.PLATFORMS);
      } else {
        Alert.alert('Training Failed', result.error);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to train AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformConnection = async () => {
    if (userData.selectedPlatforms.size === 0) {
      Alert.alert('Select Platforms', 'Please select at least one platform to connect');
      return;
    }

    setCurrentStep(ONBOARDING_STEPS.COMPLETE);
  };

  const updateTrainingMessage = (index, message) => {
    const newMessages = [...userData.trainingMessages];
    newMessages[index] = message;
    setUserData({ ...userData, trainingMessages: newMessages });
  };

  const fillSampleMessages = () => {
    const newMessages = [...SAMPLE_MESSAGES];
    setUserData({ ...userData, trainingMessages: newMessages });
  };

  const togglePlatform = (platformId) => {
    const newSelected = new Set(userData.selectedPlatforms);
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId);
    } else {
      newSelected.add(platformId);
    }
    setUserData({ ...userData, selectedPlatforms: newSelected });
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="robot-excited" size={80} color="white" />
      <Text style={styles.welcomeTitle}>Welcome to AI Replica</Text>
      <Text style={styles.welcomeSubtitle}>
        Your personal AI assistant that replies just like you across all your social media platforms
      </Text>
      
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="message-reply" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Auto-reply to messages in your style</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="account-multiple" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Works on 10 social platforms</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="brain" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Learns your communication style</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="clock-fast" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Saves hours of your time daily</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccountStep = () => (
    <KeyboardAvoidingView style={styles.stepContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MaterialCommunityIcons name="account-plus" size={60} color="white" />
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>
        Quick setup to get your AI assistant ready
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.textInput}
          value={userData.name}
          onChangeText={(text) => setUserData({ ...userData, name: text })}
          placeholder="Enter your full name"
          placeholderTextColor="rgba(255,255,255,0.7)"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.textInput}
          value={userData.email}
          onChangeText={(text) => setUserData({ ...userData, email: text })}
          placeholder="Enter your email"
          placeholderTextColor="rgba(255,255,255,0.7)"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          value={userData.password}
          onChangeText={(text) => setUserData({ ...userData, password: text })}
          placeholder="Create a secure password"
          placeholderTextColor="rgba(255,255,255,0.7)"
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleNextStep}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  const renderTrainingStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <MaterialCommunityIcons name="brain" size={60} color="white" />
      <Text style={styles.stepTitle}>Train Your AI Style</Text>
      <Text style={styles.stepSubtitle}>
        Provide 3-5 examples of how you usually text or message people
      </Text>

      <TouchableOpacity style={styles.sampleButton} onPress={fillSampleMessages}>
        <MaterialCommunityIcons name="lightbulb" size={20} color="#6A0572" />
        <Text style={styles.sampleButtonText}>Use Sample Messages</Text>
      </TouchableOpacity>

      <View style={styles.trainingContainer}>
        {userData.trainingMessages.map((message, index) => (
          <View key={index} style={styles.messageInputContainer}>
            <Text style={styles.messageLabel}>Message {index + 1}</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={(text) => updateTrainingMessage(index, text)}
              placeholder={`Example message you'd send...`}
              placeholderTextColor="rgba(0,0,0,0.5)"
              multiline
              maxLength={200}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleNextStep}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Train My AI</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPlatformsStep = () => {
    const popularPlatforms = [
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
      { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E4405F' },
      { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#1877F2' },
      { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' }
    ];

    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <MaterialCommunityIcons name="connection" size={60} color="white" />
        <Text style={styles.stepTitle}>Choose Platforms</Text>
        <Text style={styles.stepSubtitle}>
          Select which platforms you&apos;d like your AI to help with (you can add more later)
        </Text>

        <View style={styles.platformsGrid}>
          {popularPlatforms.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                userData.selectedPlatforms.has(platform.id) && styles.selectedPlatformCard
              ]}
              onPress={() => togglePlatform(platform.id)}
            >
              <MaterialCommunityIcons 
                name={platform.icon} 
                size={32} 
                color={platform.color} 
              />
              <Text style={styles.platformCardText}>{platform.name}</Text>
              {userData.selectedPlatforms.has(platform.id) && (
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color="#34C759" 
                  style={styles.selectedIcon}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.platformNote}>
          💡 Don&apos;t worry - connecting is super easy! Just click &quot;Connect&quot; and grant permissions.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="check-circle" size={80} color="#34C759" />
      <Text style={styles.stepTitle}>You&apos;re All Set! 🎉</Text>
      <Text style={styles.stepSubtitle}>
        Your AI assistant is ready to start helping you with messages
      </Text>

      <View style={styles.completionStats}>
        <View style={styles.completionItem}>
          <MaterialCommunityIcons name="account-check" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.completionText}>Account Created</Text>
        </View>
        <View style={styles.completionItem}>
          <MaterialCommunityIcons name="brain" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.completionText}>AI Style Trained</Text>
        </View>
        <View style={styles.completionItem}>
          <MaterialCommunityIcons name="connection" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.completionText}>{userData.selectedPlatforms.size} Platforms Selected</Text>
        </View>
      </View>

      <Text style={styles.nextStepsText}>
        Next: Connect your social media accounts to start auto-replying!
      </Text>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={() => router.replace('/simplified-integration-dashboard')}
      >
        <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return renderWelcomeStep();
      case ONBOARDING_STEPS.ACCOUNT:
        return renderAccountStep();
      case ONBOARDING_STEPS.TRAINING:
        return renderTrainingStep();
      case ONBOARDING_STEPS.PLATFORMS:
        return renderPlatformsStep();
      case ONBOARDING_STEPS.COMPLETE:
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  const getStepProgress = () => {
    const steps = Object.values(ONBOARDING_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <LinearGradient colors={['#6A0572', '#AB47BC']} style={styles.container}>
      {currentStep !== ONBOARDING_STEPS.WELCOME && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${getStepProgress()}%` }]} 
            />
          </View>
        </View>
      )}

      {renderCurrentStep()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 15,
    flex: 1,
  },
  inputContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  sampleButtonText: {
    color: '#6A0572',
    fontWeight: '600',
    marginLeft: 8,
  },
  trainingContainer: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  messageInputContainer: {
    marginBottom: 15,
  },
  messageLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 5,
  },
  messageInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  platformCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlatformCard: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: '#34C759',
  },
  platformCardText: {
    color: 'white',
    fontWeight: '600',
    marginTop: 10,
  },
  selectedIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  platformNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  completionStats: {
    alignSelf: 'stretch',
    marginVertical: 30,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  completionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 15,
    fontWeight: '500',
  },
  nextStepsText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#6A0572',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
