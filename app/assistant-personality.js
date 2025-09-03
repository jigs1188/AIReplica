import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import { personalAssistantService } from '../utils/personalAssistantService';

export default function AssistantPersonalityScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [personalityProfile, setPersonalityProfile] = useState({
    name: '',
    communicationStyle: 'Professional',
    tone: 'Friendly but Professional',
    traits: [],
    typicalResponses: '',
    responsePatterns: '',
    avoidWords: '',
    preferredGreetings: '',
    signatureStyle: ''
  });

  const [instructions, setInstructions] = useState({
    responseGuidelines: '',
    doNotRespond: '',
    alwaysInclude: '',
    urgentHandling: '',
    businessHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    },
    autoResponseLimit: 5 // Max auto-responses per conversation
  });

  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Initialize service and load existing data
      await personalAssistantService.initialize();
      
      if (personalAssistantService.personalityProfile) {
        setPersonalityProfile(prev => ({
          ...prev,
          ...personalAssistantService.personalityProfile
        }));
      }

      if (personalAssistantService.userInstructions) {
        setInstructions(prev => ({
          ...prev,
          ...personalAssistantService.userInstructions
        }));
      }

      // Set default name from user info
      const user = auth.currentUser;
      if (user && !personalityProfile.name) {
        setPersonalityProfile(prev => ({
          ...prev,
          name: user.displayName || user.email?.split('@')[0] || 'AI Assistant'
        }));
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load personality settings');
    } finally {
      setIsLoading(false);
    }
  }, [personalityProfile.name]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      if (!personalityProfile.name.trim()) {
        Alert.alert('Validation Error', 'Assistant name is required');
        return;
      }

      const result = await personalAssistantService.updateUserProfile(instructions, personalityProfile);
      
      if (result.success) {
        Alert.alert(
          'Profile Saved! ✅',
          'Your AI assistant personality has been updated. It will now respond with your personalized style.',
          [
            { text: 'OK' },
            { text: 'Test Personality', onPress: () => router.push('/test-personality') }
          ]
        );
      } else {
        Alert.alert('Save Failed', result.error);
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save personality profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrait = (trait) => {
    setPersonalityProfile(prev => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait]
    }));
  };

  const communicationStyles = [
    'Professional', 'Casual', 'Friendly', 'Formal', 'Direct', 'Empathetic', 'Humorous'
  ];

  const personalityTraits = [
    'Helpful', 'Direct', 'Thoughtful', 'Quick to respond', 'Detail-oriented',
    'Encouraging', 'Analytical', 'Creative', 'Diplomatic', 'Enthusiastic'
  ];

  const examplePrompts = [
    {
      title: 'Professional Meeting',
      prompt: "Hi, can we reschedule our meeting to tomorrow?",
      response: "Based on your personality, here's how you'd typically respond..."
    },
    {
      title: 'Casual Check-in',
      prompt: "Hey! How are you doing?",
      response: "Your AI would respond in your casual style..."
    },
    {
      title: 'Work Question',
      prompt: "Do you have the latest project updates?",
      response: "Your professional response style would be..."
    }
  ];

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="brain" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>Assistant Personality</Text>
        <TouchableOpacity 
          onPress={handleSaveProfile} 
          style={styles.saveButton}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Basic Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Basic Profile</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Assistant Name</Text>
            <TextInput
              style={styles.input}
              value={personalityProfile.name}
              onChangeText={(text) => setPersonalityProfile(prev => ({ ...prev, name: text }))}
              placeholder="How should your assistant identify itself?"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Communication Style</Text>
            <View style={styles.optionsGrid}>
              {communicationStyles.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.optionButton,
                    personalityProfile.communicationStyle === style && styles.optionButtonActive
                  ]}
                  onPress={() => setPersonalityProfile(prev => ({ ...prev, communicationStyle: style }))}
                >
                  <Text style={[
                    styles.optionText,
                    personalityProfile.communicationStyle === style && styles.optionTextActive
                  ]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Overall Tone</Text>
            <TextInput
              style={styles.input}
              value={personalityProfile.tone}
              onChangeText={(text) => setPersonalityProfile(prev => ({ ...prev, tone: text }))}
              placeholder="e.g., Friendly but Professional, Casual and Helpful"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Personality Traits */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="star-circle" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Personality Traits</Text>
          </View>
          <Text style={styles.cardDescription}>
            Select traits that describe how you typically communicate
          </Text>

          <View style={styles.traitsGrid}>
            {personalityTraits.map(trait => (
              <TouchableOpacity
                key={trait}
                style={[
                  styles.traitButton,
                  personalityProfile.traits.includes(trait) && styles.traitButtonActive
                ]}
                onPress={() => toggleTrait(trait)}
              >
                <Text style={[
                  styles.traitText,
                  personalityProfile.traits.includes(trait) && styles.traitTextActive
                ]}>
                  {trait}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Response Patterns */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="message-text" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Response Patterns</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Typical Responses</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={personalityProfile.typicalResponses}
              onChangeText={(text) => setPersonalityProfile(prev => ({ ...prev, typicalResponses: text }))}
              placeholder="Examples of how you typically respond to messages..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Preferred Greetings</Text>
            <TextInput
              style={styles.input}
              value={personalityProfile.preferredGreetings}
              onChangeText={(text) => setPersonalityProfile(prev => ({ ...prev, preferredGreetings: text }))}
              placeholder="e.g., Hi there!, Hey!, Good morning!"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Words/Phrases to Avoid</Text>
            <TextInput
              style={styles.input}
              value={personalityProfile.avoidWords}
              onChangeText={(text) => setPersonalityProfile(prev => ({ ...prev, avoidWords: text }))}
              placeholder="Words or phrases you never use"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Response Instructions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clipboard-text" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Response Instructions</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>General Response Guidelines</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={instructions.responseGuidelines}
              onChangeText={(text) => setInstructions(prev => ({ ...prev, responseGuidelines: text }))}
              placeholder="General rules for how your AI should respond on your behalf..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Topics NOT to Respond To</Text>
            <TextInput
              style={styles.input}
              value={instructions.doNotRespond}
              onChangeText={(text) => setInstructions(prev => ({ ...prev, doNotRespond: text }))}
              placeholder="e.g., personal finance, medical advice, legal matters"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Always Include in Responses</Text>
            <TextInput
              style={styles.input}
              value={instructions.alwaysInclude}
              onChangeText={(text) => setInstructions(prev => ({ ...prev, alwaysInclude: text }))}
              placeholder="e.g., I'll get back to you soon, Thanks for reaching out"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Urgent Message Handling</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={instructions.urgentHandling}
              onChangeText={(text) => setInstructions(prev => ({ ...prev, urgentHandling: text }))}
              placeholder="How should urgent messages be handled differently?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Max Auto-Responses per Conversation</Text>
            <TextInput
              style={styles.input}
              value={instructions.autoResponseLimit.toString()}
              onChangeText={(text) => setInstructions(prev => ({ 
                ...prev, 
                autoResponseLimit: parseInt(text) || 5 
              }))}
              placeholder="5"
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              Prevents endless back-and-forth conversations
            </Text>
          </View>
        </View>

        {/* Example Responses */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb" size={24} color="#6A0572" />
            <Text style={styles.cardTitle}>Response Examples</Text>
          </View>
          <Text style={styles.cardDescription}>
            See how your AI would respond with current settings
          </Text>

          {examplePrompts.map((example, index) => (
            <View key={index} style={styles.exampleCard}>
              <Text style={styles.exampleTitle}>{example.title}</Text>
              <Text style={styles.examplePrompt}>&quot;{example.prompt}&quot;</Text>
              <TouchableOpacity
                style={styles.testResponseButton}
                onPress={() => testPersonalityResponse(example.prompt, example.title)}
              >
                <MaterialCommunityIcons name="play" size={16} color="#6A0572" />
                <Text style={styles.testResponseText}>Test Response</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Saving...' : 'Save Personality'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/contact-authorization')}
          >
            <MaterialCommunityIcons name="account-group" size={20} color="#6A0572" />
            <Text style={styles.secondaryButtonText}>Manage Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Your personality profile helps the AI respond exactly like you would. 
            Be specific about your communication style, common phrases, and response patterns.
            {'\n\n'}💡 Tip: Include examples of your typical responses for better accuracy.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );

  async function testPersonalityResponse(prompt, scenario) {
    try {
      setIsLoading(true);
      
      // Simulate a test response with current personality settings
      const testResult = await personalAssistantService.simulateIncomingMessage(
        prompt,
        'whatsapp',
        'test_contact',
        scenario
      );

      if (testResult.success) {
        Alert.alert(
          `${scenario} Response`,
          `Prompt: "${prompt}"\n\nYour AI Response:\n"${testResult.response}"`,
          [
            { text: 'OK' },
            { text: 'Adjust Style', onPress: () => {} }
          ]
        );
      } else {
        Alert.alert('Test Failed', testResult.error || 'Could not generate test response');
      }
      
    } catch (error) {
      Alert.alert('Test Error', error.message);
    } finally {
      setIsLoading(false);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  saveButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6A0572',
    backgroundColor: '#FFFFFF',
  },
  optionButtonActive: {
    backgroundColor: '#6A0572',
  },
  optionText: {
    fontSize: 12,
    color: '#6A0572',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  traitButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  traitText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  traitTextActive: {
    color: '#FFFFFF',
  },
  exampleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  examplePrompt: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  testResponseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6A0572',
  },
  testResponseText: {
    fontSize: 12,
    color: '#6A0572',
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    gap: 12,
    marginTop: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6A0572',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#6A0572',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
