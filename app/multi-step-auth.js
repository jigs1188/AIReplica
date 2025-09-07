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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const AUTH_STEPS = {
  WELCOME: 'welcome',
  INTRO_1: 'intro_1',
  INTRO_2: 'intro_2', 
  INTRO_3: 'intro_3',
  AUTH: 'auth',
  SUCCESS: 'success'
};

const MultiStepAuth = () => {
  const [currentStep, setCurrentStep] = useState(AUTH_STEPS.WELCOME);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Google Auth Setup
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    scopes: ['openid', 'profile', 'email'],
    additionalParameters: {},
    customParameters: {},
  });

  const isGoogleConfigured = !!(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID && process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB);

  const handleGoogleSignIn = async (credential) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithCredential(auth, credential);
      
      // Store user info
      await AsyncStorage.setItem('@AIReplica_user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        photoURL: userCredential.user.photoURL,
        authMethod: 'google'
      }));

      await AsyncStorage.setItem('@AIReplica_hasLaunched', 'true');
      
      setCurrentStep(AUTH_STEPS.SUCCESS);
      
    } catch (error) {
      console.error('Google auth error:', error);
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid Google credentials. Please check your OAuth configuration.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in.';
      }
      
      Alert.alert('Google Sign-In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        handleGoogleSignIn(credential);
      }
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      Alert.alert('Google Sign-In Error', 'OAuth request failed. Please check your configuration.');
    }
  }, [response]);

  const handleNext = () => {
    switch (currentStep) {
      case AUTH_STEPS.WELCOME:
        setCurrentStep(AUTH_STEPS.INTRO_1);
        break;
      case AUTH_STEPS.INTRO_1:
        setCurrentStep(AUTH_STEPS.INTRO_2);
        break;
      case AUTH_STEPS.INTRO_2:
        setCurrentStep(AUTH_STEPS.INTRO_3);
        break;
      case AUTH_STEPS.INTRO_3:
        setCurrentStep(AUTH_STEPS.AUTH);
        break;
      case AUTH_STEPS.AUTH:
        // Handle in auth form
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case AUTH_STEPS.INTRO_1:
        setCurrentStep(AUTH_STEPS.WELCOME);
        break;
      case AUTH_STEPS.INTRO_2:
        setCurrentStep(AUTH_STEPS.INTRO_1);
        break;
      case AUTH_STEPS.INTRO_3:
        setCurrentStep(AUTH_STEPS.INTRO_2);
        break;
      case AUTH_STEPS.AUTH:
        setCurrentStep(AUTH_STEPS.INTRO_3);
        break;
      default:
        break;
    }
  };

  const handleEmailAuth = async () => {
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
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      // Store user info
      await AsyncStorage.setItem('@AIReplica_user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: name || userCredential.user.displayName || 'User',
        authMethod: 'email'
      }));

      await AsyncStorage.setItem('@AIReplica_hasLaunched', 'true');
      
      setCurrentStep(AUTH_STEPS.SUCCESS);
      
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Authentication Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToDashboard = async () => {
    router.replace('/dashboard');
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons name="robot-excited" size={80} color="white" />
      </View>
      
      <Text style={styles.welcomeTitle}>Welcome to AIReplica</Text>
      <Text style={styles.welcomeSubtitle}>
        Your Personal AI Assistant that responds just like you
      </Text>
      
      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  const renderIntro1 = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="message-reply" size={80} color="white" />
      
      <Text style={styles.stepTitle}>Auto-Reply Like You</Text>
      <Text style={styles.stepSubtitle}>
        AIReplica learns your communication style and responds to messages automatically, saving you hours every day
      </Text>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Learns your writing style</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Responds in your voice</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Works across all platforms</Text>
        </View>
      </View>
    </View>
  );

  const renderIntro2 = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="account-multiple" size={80} color="white" />
      
      <Text style={styles.stepTitle}>Works Everywhere</Text>
      <Text style={styles.stepSubtitle}>
        Connect all your social media accounts and let your AI handle responses while you focus on what matters
      </Text>

      <View style={styles.platformsGrid}>
        <View style={styles.platformItem}>
          <MaterialCommunityIcons name="whatsapp" size={32} color="#25D366" />
          <Text style={styles.platformText}>WhatsApp</Text>
        </View>
        <View style={styles.platformItem}>
          <MaterialCommunityIcons name="instagram" size={32} color="#E4405F" />
          <Text style={styles.platformText}>Instagram</Text>
        </View>
        <View style={styles.platformItem}>
          <MaterialCommunityIcons name="facebook" size={32} color="#1877F2" />
          <Text style={styles.platformText}>Facebook</Text>
        </View>
        <View style={styles.platformItem}>
          <MaterialCommunityIcons name="linkedin" size={32} color="#0A66C2" />
          <Text style={styles.platformText}>LinkedIn</Text>
        </View>
      </View>
    </View>
  );

  const renderIntro3 = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="brain" size={80} color="white" />
      
      <Text style={styles.stepTitle}>Smart & Secure</Text>
      <Text style={styles.stepSubtitle}>
        Your data stays private while your AI gets smarter with every conversation
      </Text>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="shield-check" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>End-to-end encryption</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="clock-fast" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Save 3+ hours daily</Text>
        </View>
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="trending-up" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featureText}>Improves over time</Text>
        </View>
      </View>
    </View>
  );

  const renderAuth = () => (
    <KeyboardAvoidingView 
      style={styles.stepContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <MaterialCommunityIcons name="account-plus" size={60} color="white" />
      
      <Text style={styles.stepTitle}>
        {isLogin ? 'Welcome Back!' : 'Create Your Account'}
      </Text>
      <Text style={styles.stepSubtitle}>
        {isLogin ? 'Sign in to continue' : 'Join thousands who save time daily'}
      </Text>

      {!isLogin && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="rgba(255,255,255,0.7)"
            autoCapitalize="words"
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.textInput}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="rgba(255,255,255,0.7)"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.textInput, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="rgba(255,255,255,0.7)"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="rgba(255,255,255,0.7)"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleEmailAuth}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#6A0572" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.googleButton, !isGoogleConfigured && styles.disabledButton]}
        onPress={() => {
          if (!isGoogleConfigured) {
            Alert.alert(
              'Google Sign-In Not Available',
              'Google authentication is currently not properly configured. Please use email sign-in instead or contact support.',
              [
                { text: 'Use Email Instead', onPress: () => setIsLogin(true) },
                { text: 'OK', style: 'cancel' }
              ]
            );
            return;
          }
          promptAsync();
        }}
        disabled={isLoading}
      >
        <MaterialCommunityIcons name="google" size={24} color="#4285F4" />
        <Text style={styles.googleButtonText}>
          {isGoogleConfigured ? 'Continue with Google' : 'Google Auth (Not Available)'}
        </Text>
        {isLoading && <ActivityIndicator size="small" color="#4285F4" style={{ marginLeft: 8 }} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchButtonText}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <MaterialCommunityIcons name="check-circle" size={80} color="#34C759" />
      
      <Text style={styles.stepTitle}>Welcome Aboard! 🎉</Text>
      <Text style={styles.stepSubtitle}>
        Your AI assistant is ready to start learning your communication style
      </Text>

      <View style={styles.successStats}>
        <View style={styles.successItem}>
          <MaterialCommunityIcons name="account-check" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.successText}>Account Created</Text>
        </View>
        <View style={styles.successItem}>
          <MaterialCommunityIcons name="shield-check" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.successText}>Secure & Private</Text>
        </View>
        <View style={styles.successItem}>
          <MaterialCommunityIcons name="rocket" size={24} color="rgba(255,255,255,0.9)" />
          <Text style={styles.successText}>Ready to Launch</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={proceedToDashboard}>
        <Text style={styles.primaryButtonText}>Continue to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case AUTH_STEPS.WELCOME:
        return renderWelcome();
      case AUTH_STEPS.INTRO_1:
        return renderIntro1();
      case AUTH_STEPS.INTRO_2:
        return renderIntro2();
      case AUTH_STEPS.INTRO_3:
        return renderIntro3();
      case AUTH_STEPS.AUTH:
        return renderAuth();
      case AUTH_STEPS.SUCCESS:
        return renderSuccess();
      default:
        return renderWelcome();
    }
  };

  const showNavigation = currentStep !== AUTH_STEPS.WELCOME && 
                         currentStep !== AUTH_STEPS.AUTH && 
                         currentStep !== AUTH_STEPS.SUCCESS;

  return (
    <LinearGradient
      colors={['#6A0572', '#AB47BC', '#E1BEE7']}
      style={styles.container}
    >
      {renderCurrentStep()}
      
      {showNavigation && (
        <View style={styles.navigation}>
          <TouchableOpacity onPress={handleBack} style={styles.navButton}>
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.navButton, styles.primaryNavButton]}
          >
            <Text style={[styles.navButtonText, styles.primaryNavButtonText]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 15,
    flex: 1,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: 20,
  },
  platformItem: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 20,
  },
  platformText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  primaryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#6A0572',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  switchButton: {
    marginTop: 10,
  },
  switchButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  successStats: {
    alignSelf: 'stretch',
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  successItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 15,
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  navButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryNavButton: {
    backgroundColor: 'white',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  primaryNavButtonText: {
    color: '#6A0572',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
});

export default MultiStepAuth;
