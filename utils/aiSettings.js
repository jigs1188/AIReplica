import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Default settings
const defaultSettings = {
  autoSaveMessages: true,
  enableNotifications: true,
  preferredModel: 'google/gemma-2-9b-it:free',
  maxTokens: 1000,
  temperature: 0.7,
  communicationStyle: 'Professional',
};

// Get user settings from Firebase and local storage
export const getUserSettings = async () => {
  const user = auth.currentUser;
  if (!user) return defaultSettings;

  try {
    // Get cloud settings from Firebase
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    const cloudSettings = docSnap.exists() ? docSnap.data() : {};

    // Get local settings from AsyncStorage
    const localSettingsStr = await AsyncStorage.getItem('appSettings');
    const localSettings = localSettingsStr ? JSON.parse(localSettingsStr) : {};

    // Merge settings with defaults
    return {
      ...defaultSettings,
      ...cloudSettings,
      ...localSettings,
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
};

// Save user settings to Firebase and local storage
export const saveUserSettings = async (settings) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    // Separate cloud and local settings
    const cloudSettings = {
      name: settings.name,
      bio: settings.bio,
      communicationStyle: settings.communicationStyle,
      preferredModel: settings.preferredModel,
      maxTokens: settings.maxTokens,
      temperature: settings.temperature,
      updatedAt: new Date(),
    };

    const localSettings = {
      autoSaveMessages: settings.autoSaveMessages,
      enableNotifications: settings.enableNotifications,
    };

    // Save to Firebase
    await setDoc(doc(db, "users", user.uid), cloudSettings, { merge: true });

    // Save to local storage
    await AsyncStorage.setItem('appSettings', JSON.stringify(localSettings));

    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

// Get AI configuration for API calls
export const getAIConfig = async () => {
  const settings = await getUserSettings();
  return {
    model: settings.preferredModel,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    communicationStyle: settings.communicationStyle,
  };
};

// API Key validation
export const validateAPIKey = () => {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_actual_")) {
    throw new Error("🔑 OpenRouter API key not configured.\n\n📝 Steps to fix:\n1. Visit https://openrouter.ai\n2. Create account & get free API key\n3. Update .env file\n4. Restart the app");
  }
  return apiKey;
};

// Enhanced AI response function with user settings
export const getEnhancedAIResponse = async (messages, customPrompt = "") => {
  try {
    const apiKey = validateAPIKey();
    const config = await getAIConfig();
    
    const systemPrompt = customPrompt || `You are a helpful AI assistant. Respond in a ${config.communicationStyle.toLowerCase()} tone. Be conversational and helpful.`;
    
    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid messages format. Please provide a valid conversation history.");
    }
    
    const payload = {
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    };

    console.log('Sending payload to OpenRouter:', JSON.stringify(payload, null, 2));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aireplica.app",
        "X-Title": "AI Replica App",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API Error:", response.status, errorData);
      
      if (response.status === 400) {
        throw new Error("🚫 Invalid input format! Please check your message and try again.");
      } else if (response.status === 401) {
        throw new Error("🔐 Invalid API key! Check your OpenRouter configuration.");
      } else if (response.status === 429) {
        throw new Error("⏳ Rate limit reached! Try again in a moment.");
      } else if (response.status === 402) {
        throw new Error("💳 Insufficient credits! Check your OpenRouter balance.");
      } else {
        throw new Error(`❌ API Error: ${response.status}. ${errorData.error?.message || 'Try again later.'}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("🤖 Invalid response format from AI service. Please try again.");
    }
    
    return data.choices[0].message.content || "No response received.";
  } catch (error) {
    console.error("getEnhancedAIResponse error:", error);
    throw error;
  }
};

// Advanced Settings Integration Features
export const syncSettingsToCloud = async (userId) => {
  try {
    const settings = await getUserSettings();
    await setDoc(doc(db, 'user_settings', userId), {
      ...settings,
      lastSynced: new Date().toISOString(),
      syncVersion: 1
    });
    return { success: true, message: 'Settings synced to cloud successfully' };
  } catch (error) {
    console.error('Error syncing settings to cloud:', error);
    return { success: false, message: 'Failed to sync settings to cloud' };
  }
};

export const restoreSettingsFromCloud = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'user_settings', userId));
    if (userDoc.exists()) {
      const cloudSettings = userDoc.data();
      await saveUserSettings(cloudSettings);
      return { success: true, message: 'Settings restored from cloud successfully', data: cloudSettings };
    }
    return { success: false, message: 'No cloud settings found' };
  } catch (error) {
    console.error('Error restoring settings from cloud:', error);
    return { success: false, message: 'Failed to restore settings from cloud' };
  }
};

export const exportUserSettings = async () => {
  try {
    const settings = await getUserSettings();
    const exportData = {
      ...settings,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0'
    };
    return { success: true, data: exportData };
  } catch (error) {
    console.error('Error exporting settings:', error);
    return { success: false, message: 'Failed to export settings' };
  }
};

export const importUserSettings = async (importData) => {
  try {
    // Validate import data structure
    if (!importData || typeof importData !== 'object') {
      throw new Error('Invalid import data format');
    }
    
    const validatedSettings = {
      preferredModel: importData.preferredModel || defaultSettings.preferredModel,
      maxTokens: Math.min(Math.max(importData.maxTokens || defaultSettings.maxTokens, 100), 8000),
      temperature: Math.min(Math.max(importData.temperature || defaultSettings.temperature, 0), 2),
      autoSave: importData.autoSave !== undefined ? importData.autoSave : defaultSettings.autoSave,
      notifications: importData.notifications !== undefined ? importData.notifications : defaultSettings.notifications,
      enhancedErrorMessages: importData.enhancedErrorMessages !== undefined ? importData.enhancedErrorMessages : defaultSettings.enhancedErrorMessages
    };
    
    await saveUserSettings(validatedSettings);
    return { success: true, message: 'Settings imported successfully' };
  } catch (error) {
    console.error('Error importing settings:', error);
    return { success: false, message: 'Failed to import settings: ' + error.message };
  }
};

export const resetToDefaultSettings = async () => {
  try {
    await saveUserSettings(defaultSettings);
    return { success: true, message: 'Settings reset to defaults successfully' };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, message: 'Failed to reset settings' };
  }
};
