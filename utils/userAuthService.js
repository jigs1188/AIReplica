/**
 * User Authentication Service
 * Handles user signup, login, and session management for the startup
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

class UserAuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.isInitialized = false;
  }

  /**
   * Initialize authentication service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set up Firebase auth state listener
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.currentUser = user;
          await this.loadUserProfile(user.uid);
          console.log('✅ User authenticated:', user.email);
        } else {
          this.currentUser = null;
          await this.clearLocalUserData();
          console.log('👋 User signed out');
        }

        // Notify listeners
        this.authListeners.forEach(listener => listener(user));
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize auth service:', error);
    }
  }

  /**
   * Register new user with simplified flow
   */
  async registerUser(email, password, name, phoneNumber = null) {
    try {
      console.log('🔐 Creating user account...');

      // Create Firebase auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        name: name,
        phoneNumber: phoneNumber,
        plan: 'free',
        createdAt: new Date().toISOString(),
        onboardingCompleted: false,
        platformsConnected: [],
        settings: {
          autoReplyEnabled: false,
          notificationsEnabled: true,
          aiModel: 'google/gemma-2-9b-it:free'
        },
        usage: {
          messagesThisMonth: 0,
          platformsConnected: 0,
          lastActive: new Date().toISOString()
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Store locally for quick access
      await this.storeUserProfile(userProfile);

      console.log('✅ User account created successfully!');

      return {
        success: true,
        user: userProfile,
        message: 'Account created successfully! Welcome to AiReplica.'
      };

    } catch (error) {
      console.error('❌ User registration failed:', error);
      
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Try signing in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signInUser(email, password) {
    try {
      console.log('🔐 Signing in user...');

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Load user profile
      const userProfile = await this.loadUserProfile(user.uid);

      console.log('✅ User signed in successfully!');

      return {
        success: true,
        user: userProfile,
        message: 'Welcome back!'
      };

    } catch (error) {
      console.error('❌ Sign in failed:', error);
      
      let errorMessage = 'Sign in failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sign out user
   */
  async signOutUser() {
    try {
      await signOut(auth);
      await this.clearLocalUserData();
      
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load user profile from Firestore
   */
  async loadUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userProfile = userDoc.data();
        await this.storeUserProfile(userProfile);
        return userProfile;
      } else {
        console.warn('User profile not found in database');
        return null;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      const uid = this.currentUser.uid;
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', uid), updates);
      
      // Update local storage
      const currentProfile = await this.getStoredUserProfile();
      const updatedProfile = { ...currentProfile, ...updates };
      await this.storeUserProfile(updatedProfile);

      console.log('✅ User profile updated');

      return {
        success: true,
        profile: updatedProfile
      };

    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding() {
    try {
      const updates = {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      };

      return await this.updateUserProfile(updates);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track platform connection
   */
  async trackPlatformConnection(platform) {
    try {
      const currentProfile = await this.getStoredUserProfile();
      const platformsConnected = currentProfile?.platformsConnected || [];
      
      if (!platformsConnected.includes(platform)) {
        const updates = {
          platformsConnected: [...platformsConnected, platform],
          'usage.platformsConnected': platformsConnected.length + 1,
          'usage.lastActive': new Date().toISOString()
        };

        return await this.updateUserProfile(updates);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Store user profile locally
   */
  async storeUserProfile(profile) {
    try {
      await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to store user profile:', error);
    }
  }

  /**
   * Get stored user profile
   */
  async getStoredUserProfile() {
    try {
      const profileData = await AsyncStorage.getItem('user_profile');
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Failed to get stored user profile:', error);
      return null;
    }
  }

  /**
   * Clear local user data
   */
  async clearLocalUserData() {
    try {
      await AsyncStorage.multiRemove([
        'user_profile',
        'platformStatuses',
        'aireplica_auth'
      ]);
    } catch (error) {
      console.error('Failed to clear local user data:', error);
    }
  }

  /**
   * Add auth state listener
   */
  addAuthListener(listener) {
    this.authListeners.push(listener);
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Get user's subscription plan
   */
  async getUserPlan() {
    try {
      const profile = await this.getStoredUserProfile();
      return profile?.plan || 'free';
    } catch (error) {
      return 'free';
    }
  }

  /**
   * Check if user can connect more platforms
   */
  async canConnectMorePlatforms() {
    try {
      const profile = await this.getStoredUserProfile();
      const plan = profile?.plan || 'free';
      const connectedCount = profile?.platformsConnected?.length || 0;

      const limits = {
        free: 1,
        pro: 5,
        business: 10
      };

      return connectedCount < limits[plan];
    } catch (error) {
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats() {
    try {
      const profile = await this.getStoredUserProfile();
      return profile?.usage || {
        messagesThisMonth: 0,
        platformsConnected: 0,
        lastActive: new Date().toISOString()
      };
    } catch (error) {
      return {
        messagesThisMonth: 0,
        platformsConnected: 0,
        lastActive: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new UserAuthService();
