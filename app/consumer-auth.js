/**
 * Consumer Auth Screen - Super Simple Login/Signup
 * Users just enter email/password and they're ready to go
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import userAuthService from '../utils/userAuthService';

export default function ConsumerAuth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Initialize auth service
    userAuthService.initialize();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await userAuthService.signInUser(email.trim(), password);
      } else {
        result = await userAuthService.registerUser({
          email: email.trim(),
          password,
          name: name.trim()
        });
      }

      if (result.success) {
        Alert.alert(
          '🎉 Success!',
          result.message,
          [{ 
            text: 'Continue', 
            onPress: () => {
              console.log('Navigate to dashboard');
              router.replace('/dashboard');
            }
          }]
        );
      } else {
        Alert.alert('Error', result.error);
      }

    } catch (_error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <LinearGradient colors={['#6A0572', '#AB83A1']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🤖</Text>
            <Text style={styles.title}>AiReplica</Text>
            <Text style={styles.subtitle}>
              Your AI Personal Assistant{'\n'}
              Auto-reply across all platforms
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </Text>
            
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6A0572" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6A0572" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6A0572" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6A0572" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchModeButton} onPress={switchMode}>
              <Text style={styles.switchModeText}>
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresPreview}>
            <Text style={styles.featuresTitle}>✨ What you will get:</Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>🚀 5-minute setup</Text>
              <Text style={styles.featureItem}>🤖 AI learns your style</Text>
              <Text style={styles.featureItem}>💬 Auto-reply everywhere</Text>
              <Text style={styles.featureItem}>📊 Analytics dashboard</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0572',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#6A0572',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#AB83A1',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#6A0572',
    fontSize: 14,
    fontWeight: '500',
  },
  featuresPreview: {
    marginTop: 30,
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  featuresList: {
    alignItems: 'center',
  },
  featureItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
    opacity: 0.9,
  },
});
