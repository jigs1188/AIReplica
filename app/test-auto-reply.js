import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { autoReplyService } from '../utils/autoReplyService';

export default function TestAutoReply() {
  const router = useRouter();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const testScenarios = [
    {
      id: 'whatsapp_business',
      app: 'whatsapp',
      message: 'Hi, I need help with my order. Can you provide details about shipping?',
      sender: 'customer@business.com',
      context: 'business_inquiry'
    },
    {
      id: 'email_support',
      app: 'email',
      message: 'Hello, I am experiencing issues with your product. Please help.',
      sender: 'user@example.com',
      context: 'support_request'
    },
    {
      id: 'telegram_casual',
      app: 'telegram',
      message: 'Hey! How are you doing today?',
      sender: 'friend_user',
      context: 'casual_chat'
    },
    {
      id: 'slack_urgent',
      app: 'slack',
      message: 'URGENT: Server is down, need immediate assistance!',
      sender: 'team_member',
      context: 'urgent_alert'
    },
    {
      id: 'sms_appointment',
      app: 'sms',
      message: 'Can we reschedule our meeting for tomorrow?',
      sender: '+1234567890',
      context: 'scheduling'
    }
  ];

  const runSingleTest = async (scenario) => {
    setIsRunning(true);
    try {
      console.log(`\n🧪 Testing ${scenario.app.toUpperCase()} scenario:`, scenario.id);
      
      const startTime = Date.now();
      const result = await autoReplyService.simulateIncomingMessage(
        scenario.message,
        scenario.app,
        scenario.sender,
        scenario.context
      );
      const duration = Date.now() - startTime;

      const testResult = {
        id: scenario.id,
        app: scenario.app,
        message: scenario.message,
        response: result.response,
        context: result.context,
        success: result.success,
        duration: duration,
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [testResult, ...prev]);
      
      Alert.alert(
        `${scenario.app.toUpperCase()} Test Complete`,
        `Response: ${result.response?.substring(0, 100)}...`
      );

    } catch (error) {
      console.error('Test failed:', error);
      const errorResult = {
        id: scenario.id,
        app: scenario.app,
        message: scenario.message,
        error: error.message,
        success: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setTestResults(prev => [errorResult, ...prev]);
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      await runSingleTest(scenario);
      
      // Add delay between tests
      if (i < testScenarios.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    Alert.alert('All Tests Complete', `Completed ${testScenarios.length} test scenarios`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const TestResultCard = ({ result }) => (
    <View style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
      <View style={styles.resultHeader}>
        <MaterialCommunityIcons 
          name={getAppIcon(result.app)} 
          size={20} 
          color={result.success ? "#10B981" : "#EF4444"} 
        />
        <Text style={styles.resultApp}>{result.app.toUpperCase()}</Text>
        <Text style={styles.resultTime}>{result.timestamp}</Text>
        <MaterialCommunityIcons 
          name={result.success ? "check-circle" : "alert-circle"} 
          size={16} 
          color={result.success ? "#10B981" : "#EF4444"} 
        />
      </View>
      
      <Text style={styles.resultMessage}>Message: {result.message}</Text>
      
      {result.success ? (
        <>
          <Text style={styles.resultResponse}>Response: {result.response}</Text>
          <Text style={styles.resultContext}>Context: {result.context?.type || 'general'}</Text>
          <Text style={styles.resultDuration}>Duration: {result.duration}ms</Text>
        </>
      ) : (
        <Text style={styles.resultError}>Error: {result.error}</Text>
      )}
    </View>
  );

  const getAppIcon = (app) => {
    const icons = {
      whatsapp: 'whatsapp',
      telegram: 'telegram',
      email: 'email',
      slack: 'slack',
      sms: 'message-text'
    };
    return icons[app] || 'message';
  };

  return (
    <LinearGradient colors={["#6A0572", "#AB47BC", "#E1BEE7"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="test-tube" size={28} color="#FFFFFF" />
        <Text style={styles.headerText}>Auto-Reply Testing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.primaryButton]}
            onPress={runAllTests}
            disabled={isRunning}
          >
            <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.testButton, styles.secondaryButton]}
              onPress={clearResults}
              disabled={isRunning}
            >
              <MaterialCommunityIcons name="delete-sweep" size={20} color="#6A0572" />
              <Text style={styles.secondaryButtonText}>Clear Results</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testButton, styles.secondaryButton]}
              onPress={() => router.push('/auto-reply')}
            >
              <MaterialCommunityIcons name="cog" size={20} color="#6A0572" />
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Individual Test Scenarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Tests</Text>
          {testScenarios.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={styles.scenarioButton}
              onPress={() => runSingleTest(scenario)}
              disabled={isRunning}
            >
              <MaterialCommunityIcons name={getAppIcon(scenario.app)} size={24} color="#6A0572" />
              <View style={styles.scenarioText}>
                <Text style={styles.scenarioTitle}>
                  {scenario.app.toUpperCase()} - {scenario.context.replace('_', ' ')}
                </Text>
                <Text style={styles.scenarioMessage}>&ldquo;{scenario.message}&rdquo;</Text>
              </View>
              <Ionicons name="play" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results ({testResults.length})</Text>
            {testResults.map((result, index) => (
              <TestResultCard key={`${result.id}-${index}`} result={result} />
            ))}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            This testing interface simulates incoming messages from different apps and shows how the auto-reply system responds. 
            Make sure to configure your auto-reply settings first.
          </Text>
        </View>
      </ScrollView>
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
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#6A0572',
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scenarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scenarioText: {
    flex: 1,
    marginLeft: 12,
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  scenarioMessage: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  resultCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultApp: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  resultTime: {
    fontSize: 10,
    color: '#6B7280',
    marginRight: 8,
  },
  resultMessage: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
  },
  resultResponse: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  resultContext: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultDuration: {
    fontSize: 11,
    color: '#6B7280',
  },
  resultError: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 15,
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
