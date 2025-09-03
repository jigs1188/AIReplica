import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { getEnhancedAIResponse } from './aiSettings';
import { whatsappBusinessAPI } from './whatsappBusinessAPI';
import { instagramAPI } from './instagramAPI';
import { emailAPI } from './emailAPI';
import { linkedInAPI } from './linkedInAPI';
import { telegramAPI } from './telegramAPI';
import { slackAPI } from './slackAPI';
import { smsAPI } from './smsAPI';
import { facebookAPI } from './facebookAPI';
import { twitterAPI } from './twitterAPI';
import { discordAPI } from './discordAPI';

/**
 * Personal Assistant Service
 * Handles authorized contacts, conversation history, and personalized responses
 */
class PersonalAssistantService {
  constructor() {
    this.isActive = false;
    this.authorizedContacts = new Map();
    this.conversationHistory = new Map();
    this.userInstructions = null;
    this.personalityProfile = null;
    this.platformAPIs = new Map();
    
    if (Platform.OS !== 'web') {
      this.initialize();
    }
  }

  async initialize() {
    try {
      console.log('🤖 Initializing Personal Assistant Service...');
      
      // Initialize all platform APIs
      await this.initializePlatformAPIs();
      
      // Load authorized contacts
      await this.loadAuthorizedContacts();
      
      // Load user instructions and personality
      await this.loadUserProfile();
      
      // Load recent conversation histories
      await this.loadConversationHistories();
      
      this.isActive = true;
      console.log('✅ Personal Assistant Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Personal Assistant Service initialization failed:', error);
    }
  }

  async initializePlatformAPIs() {
    try {
      // Initialize all platform APIs
      const apiMap = {
        whatsapp: whatsappBusinessAPI,
        instagram: instagramAPI,
        email: emailAPI,
        linkedin: linkedInAPI,
        telegram: telegramAPI,
        slack: slackAPI,
        sms: smsAPI,
        facebook: facebookAPI,
        twitter: twitterAPI,
        discord: discordAPI
      };

      for (const [platform, api] of Object.entries(apiMap)) {
        try {
          await api.initialize();
          this.platformAPIs.set(platform, api);
          console.log(`✅ ${platform} API initialized`);
        } catch (error) {
          console.error(`❌ Failed to initialize ${platform} API:`, error);
        }
      }
    } catch (error) {
      console.error('Error initializing platform APIs:', error);
    }
  }

  async registerPlatform(platformName, platformAPI) {
    try {
      this.platformAPIs.set(platformName, platformAPI);
      console.log(`✅ Registered ${platformName} platform API`);
      return { success: true };
    } catch (error) {
      console.error(`Error registering ${platformName} platform:`, error);
      return { success: false, error: error.message };
    }
  }

  getPlatformAPI(platformName) {
    return this.platformAPIs.get(platformName);
  }

  getConfiguredPlatforms() {
    const configured = [];
    for (const [platform, api] of this.platformAPIs.entries()) {
      if (api.isConfigured && api.isConfigured()) {
        configured.push(platform);
      }
    }
    return configured;
  }

  async loadAuthorizedContacts() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load from Firebase
      const docRef = doc(db, "users", user.uid, "assistant", "authorized_contacts");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const contacts = docSnap.data().contacts || {};
        Object.entries(contacts).forEach(([contactId, contactData]) => {
          this.authorizedContacts.set(contactId, {
            ...contactData,
            lastAccessed: contactData.lastAccessed?.toDate?.() || new Date(contactData.lastAccessed),
            expiresAt: contactData.expiresAt?.toDate?.() || new Date(contactData.expiresAt) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
        });
      }

      // Load from local storage as backup
      const localContacts = await AsyncStorage.getItem('authorizedContacts');
      if (localContacts) {
        const parsed = JSON.parse(localContacts);
        Object.entries(parsed).forEach(([contactId, contactData]) => {
          if (!this.authorizedContacts.has(contactId)) {
            this.authorizedContacts.set(contactId, contactData);
          }
        });
      }

      console.log(`📋 Loaded ${this.authorizedContacts.size} authorized contacts`);
      
    } catch (error) {
      console.error('Error loading authorized contacts:', error);
    }
  }

  async loadUserProfile() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load user instructions and personality from Firebase
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        this.userInstructions = userData.assistantInstructions || null;
        this.personalityProfile = userData.personalityProfile || null;
      }

      // Load from local storage as backup
      const localInstructions = await AsyncStorage.getItem('assistantInstructions');
      const localPersonality = await AsyncStorage.getItem('personalityProfile');
      
      if (localInstructions && !this.userInstructions) {
        this.userInstructions = JSON.parse(localInstructions);
      }
      
      if (localPersonality && !this.personalityProfile) {
        this.personalityProfile = JSON.parse(localPersonality);
      }

      console.log('👤 User profile loaded:', {
        hasInstructions: !!this.userInstructions,
        hasPersonality: !!this.personalityProfile
      });
      
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async loadConversationHistories() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load recent conversation history for each authorized contact
      for (const [contactId] of this.authorizedContacts.entries()) {
        try {
          const messagesRef = collection(db, "users", user.uid, "conversations", contactId, "messages");
          const q = query(messagesRef, orderBy("timestamp", "desc"), limit(50));
          const querySnapshot = await getDocs(q);
          
          const messages = [];
          querySnapshot.forEach((doc) => {
            messages.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
            });
          });

          this.conversationHistory.set(contactId, messages.reverse()); // Reverse to get chronological order
          
        } catch (error) {
          console.error(`Error loading history for contact ${contactId}:`, error);
        }
      }

      console.log(`💬 Loaded conversation histories for ${this.conversationHistory.size} contacts`);
      
    } catch (error) {
      console.error('Error loading conversation histories:', error);
    }
  }

  /**
   * Process incoming message from authorized contact
   */
  async processIncomingMessage(messageData) {
    try {
      const { source, content, sender, platform, timestamp } = messageData;
      
      console.log('📨 Processing incoming message:', { source, sender, platform });

      // Check if contact is authorized
      if (!this.isContactAuthorized(sender)) {
        console.log('❌ Unauthorized contact:', sender);
        return {
          success: false,
          error: 'Contact not authorized for auto-response',
          shouldRespond: false
        };
      }

      const contactData = this.authorizedContacts.get(sender);
      
      // Check if auto-response is enabled for this contact and platform
      if (!contactData.enabledPlatforms.includes(platform)) {
        console.log('❌ Platform not enabled for contact:', platform);
        return {
          success: false,
          error: `${platform} not enabled for this contact`,
          shouldRespond: false
        };
      }

      // Add message to conversation history
      await this.addToConversationHistory(sender, {
        content,
        isFromContact: true,
        platform,
        timestamp: new Date(timestamp)
      });

      // Analyze message context with conversation history
      const context = await this.analyzeMessageWithHistory(content, sender);
      
      // Generate personalized response
      const response = await this.generatePersonalizedResponse(content, sender, platform, context);
      
      if (response) {
        // Add response to conversation history
        await this.addToConversationHistory(sender, {
          content: response,
          isFromContact: false,
          platform,
          timestamp: new Date(),
          isAssistantResponse: true
        });

        // Apply response delay if configured
        if (contactData.responseDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, contactData.responseDelay * 1000));
        }

        // Log activity
        await this.logAssistantActivity({
          type: 'auto_response',
          contactId: sender,
          platform,
          messageContent: content,
          responseContent: response,
          context: context.type,
          timestamp: new Date()
        });

        // Send response via appropriate platform
        let sendResult = { success: true };
        sendResult = await this.sendPlatformResponse(sender, response, platform, messageData);

        return {
          success: true,
          response,
          context,
          shouldRespond: true,
          delay: contactData.responseDelay,
          sendResult
        };
      }

      return {
        success: false,
        error: 'No response generated',
        shouldRespond: false
      };

    } catch (error) {
      console.error('❌ Error processing incoming message:', error);
      return {
        success: false,
        error: error.message,
        shouldRespond: false
      };
    }
  }

  /**
   * Analyze message with full conversation context
   */
  async analyzeMessageWithHistory(content, contactId) {
    try {
      const history = this.conversationHistory.get(contactId) || [];
      const contactData = this.authorizedContacts.get(contactId);
      
      // Get recent conversation context (last 10 messages)
      const recentMessages = history.slice(-10);
      
      // Basic context analysis
      const text = content.toLowerCase();
      
      // Analyze conversation patterns
      const isFollowUp = recentMessages.length > 0 && 
        Date.now() - recentMessages[recentMessages.length - 1].timestamp.getTime() < 24 * 60 * 60 * 1000; // 24 hours
      
      // Detect urgency
      const urgentWords = ['urgent', 'asap', 'emergency', 'important', 'now', 'immediately'];
      const isUrgent = urgentWords.some(word => text.includes(word));
      
      // Detect question
      const hasQuestion = text.includes('?') || text.startsWith('can ') || text.startsWith('will ') || text.startsWith('do ');
      
      // Detect meeting/scheduling
      const meetingWords = ['meeting', 'call', 'appointment', 'schedule', 'zoom', 'teams'];
      const isMeetingRelated = meetingWords.some(word => text.includes(word));
      
      // Detect work/business context
      const workWords = ['project', 'deadline', 'work', 'business', 'client', 'proposal'];
      const isWorkRelated = workWords.some(word => text.includes(word));
      
      // Analyze sentiment
      const sentiment = this.analyzeSentiment(text);
      
      // Determine response style based on contact preferences and context
      let responseStyle = contactData.preferredStyle || 'Professional';
      if (isUrgent) responseStyle = 'Direct';
      if (sentiment === 'positive') responseStyle = 'Friendly';
      
      return {
        type: isUrgent ? 'urgent' : isMeetingRelated ? 'meeting' : isWorkRelated ? 'work' : 'general',
        isUrgent,
        isFollowUp,
        hasQuestion,
        isMeetingRelated,
        isWorkRelated,
        sentiment,
        responseStyle,
        conversationLength: history.length,
        recentContext: recentMessages.map(m => ({
          content: m.content.substring(0, 100),
          isFromContact: m.isFromContact,
          timestamp: m.timestamp
        }))
      };
      
    } catch (error) {
      console.error('Error analyzing message context:', error);
      return { type: 'general', responseStyle: 'Professional' };
    }
  }

  analyzeSentiment(text) {
    const positiveWords = ['great', 'awesome', 'excellent', 'good', 'thanks', 'appreciate', 'wonderful', 'perfect'];
    const negativeWords = ['problem', 'issue', 'urgent', 'help', 'stuck', 'error', 'wrong', 'bad'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Generate personalized response based on user's personality and instructions
   */
  async generatePersonalizedResponse(content, contactId, platform, context) {
    try {
      const contactData = this.authorizedContacts.get(contactId);
      const history = this.conversationHistory.get(contactId) || [];
      
      // Build conversation context for AI
      const recentMessages = history.slice(-5).map(msg => ({
        role: msg.isFromContact ? 'user' : 'assistant',
        content: msg.content
      }));

      // Build personalized system prompt
      const systemPrompt = this.buildPersonalizedPrompt(contactData, platform, context);
      
      // Prepare messages for AI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentMessages,
        { role: 'user', content: content }
      ];

      // Generate response using AI
      const response = await getEnhancedAIResponse(messages);
      
      // Apply contact-specific formatting
      return this.formatResponseForContact(response, contactData, platform);
      
    } catch (error) {
      console.error('Error generating personalized response:', error);
      throw error;
    }
  }

  buildPersonalizedPrompt(contactData, platform, context) {
    const basePrompt = `You are responding as ${this.personalityProfile?.name || 'the user'} on ${platform}.`;
    
    let personalityInstructions = '';
    if (this.personalityProfile) {
      personalityInstructions = `
PERSONALITY PROFILE:
- Communication Style: ${this.personalityProfile.communicationStyle}
- Tone: ${this.personalityProfile.tone}
- Key Traits: ${this.personalityProfile.traits?.join(', ')}
- Typical Responses: ${this.personalityProfile.typicalResponses}`;
    }
    
    let contactInstructions = '';
    if (contactData.customInstructions) {
      contactInstructions = `
CONTACT-SPECIFIC INSTRUCTIONS:
${contactData.customInstructions}`;
    }
    
    let contextInstructions = '';
    if (context.isUrgent) {
      contextInstructions = '\nIMPORTANT: This message seems urgent. Respond quickly and offer immediate help.';
    } else if (context.isMeetingRelated) {
      contextInstructions = '\nCONTEXT: This is about scheduling/meetings. Be helpful with availability and scheduling.';
    } else if (context.isWorkRelated) {
      contextInstructions = '\nCONTEXT: This is work/business related. Be professional and focused.';
    }

    let generalInstructions = '';
    if (this.userInstructions) {
      generalInstructions = `
GENERAL INSTRUCTIONS:
${this.userInstructions.responseGuidelines}
${this.userInstructions.doNotRespond ? `DO NOT respond to: ${this.userInstructions.doNotRespond}` : ''}
${this.userInstructions.alwaysInclude ? `ALWAYS include: ${this.userInstructions.alwaysInclude}` : ''}`;
    }

    return `${basePrompt}${personalityInstructions}${contactInstructions}${contextInstructions}${generalInstructions}

RESPONSE GUIDELINES:
- Respond naturally as if you are the actual person
- Keep responses ${contactData.preferredStyle?.toLowerCase() || 'professional'}
- Match the tone and formality of the conversation
- If you don't know something, say "I'll check on that and get back to you"
- Keep responses under ${contactData.maxResponseLength || 200} characters
- Use the same language as the incoming message

Generate a response that sounds exactly like how this person would respond based on the conversation history and personality profile.`;
  }

  formatResponseForContact(response, contactData, platform) {
    // Apply platform-specific formatting
    switch (platform) {
      case 'whatsapp':
        // WhatsApp supports emojis and casual formatting
        return response;
      
      case 'email':
        // Email might need signature
        return contactData.includeSignature ? 
          `${response}\n\nBest regards,\n${this.personalityProfile?.name || 'AI Assistant'}` : 
          response;
      
      case 'sms':
        // SMS should be shorter
        return response.length > 160 ? response.substring(0, 157) + '...' : response;
      
      case 'slack':
        // Slack supports threading
        return response;
      
      default:
        return response;
    }
  }

  /**
   * Check if contact is authorized for auto-response
   */
  isContactAuthorized(contactId) {
    const contact = this.authorizedContacts.get(contactId);
    return contact && contact.enabled && new Date() < new Date(contact.expiresAt);
  }

  /**
   * Add contact to authorized list
   */
  async authorizeContact(contactData) {
    try {
      const {
        contactId,
        name,
        phone,
        email,
        enabledPlatforms,
        preferredStyle,
        customInstructions,
        responseDelay,
        maxResponseLength,
        expiresAt,
        includeSignature
      } = contactData;

      const authData = {
        contactId,
        name,
        phone,
        email,
        enabledPlatforms: enabledPlatforms || ['whatsapp', 'sms'],
        preferredStyle: preferredStyle || 'Professional',
        customInstructions: customInstructions || '',
        responseDelay: responseDelay || 0,
        maxResponseLength: maxResponseLength || 200,
        enabled: true,
        authorizedAt: new Date(),
        expiresAt: new Date(expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        includeSignature: includeSignature || false,
        lastAccessed: new Date()
      };

      // Save to memory
      this.authorizedContacts.set(contactId, authData);

      // Save to Firebase
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid, "assistant", "authorized_contacts");
        const currentData = await getDoc(docRef);
        const contacts = currentData.exists() ? currentData.data().contacts || {} : {};
        
        contacts[contactId] = authData;
        
        await setDoc(docRef, { contacts }, { merge: true });
      }

      // Save to local storage
      const localContacts = {};
      this.authorizedContacts.forEach((data, id) => {
        localContacts[id] = data;
      });
      await AsyncStorage.setItem('authorizedContacts', JSON.stringify(localContacts));

      console.log('✅ Contact authorized:', name);
      return { success: true };
      
    } catch (error) {
      console.error('Error authorizing contact:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove contact authorization
   */
  async revokeContactAccess(contactId) {
    try {
      // Remove from memory
      this.authorizedContacts.delete(contactId);
      this.conversationHistory.delete(contactId);

      // Update Firebase
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid, "assistant", "authorized_contacts");
        const currentData = await getDoc(docRef);
        if (currentData.exists()) {
          const contacts = currentData.data().contacts || {};
          delete contacts[contactId];
          await setDoc(docRef, { contacts });
        }
      }

      // Update local storage
      const localContacts = {};
      this.authorizedContacts.forEach((data, id) => {
        localContacts[id] = data;
      });
      await AsyncStorage.setItem('authorizedContacts', JSON.stringify(localContacts));

      console.log('❌ Contact access revoked:', contactId);
      return { success: true };
      
    } catch (error) {
      console.error('Error revoking contact access:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user instructions and personality
   */
  async updateUserProfile(instructions, personality) {
    try {
      this.userInstructions = instructions;
      this.personalityProfile = personality;

      // Save to Firebase
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, {
          assistantInstructions: instructions,
          personalityProfile: personality,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Save to local storage
      await AsyncStorage.setItem('assistantInstructions', JSON.stringify(instructions));
      await AsyncStorage.setItem('personalityProfile', JSON.stringify(personality));

      console.log('✅ User profile updated');
      return { success: true };
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add message to conversation history
   */
  async addToConversationHistory(contactId, messageData) {
    try {
      // Add to memory
      if (!this.conversationHistory.has(contactId)) {
        this.conversationHistory.set(contactId, []);
      }
      
      const history = this.conversationHistory.get(contactId);
      history.push(messageData);
      
      // Keep only last 100 messages in memory
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      // Save to Firebase
      const user = auth.currentUser;
      if (user) {
        const messagesRef = collection(db, "users", user.uid, "conversations", contactId, "messages");
        await addDoc(messagesRef, {
          ...messageData,
          timestamp: serverTimestamp()
        });
      }
      
    } catch (error) {
      console.error('Error adding to conversation history:', error);
    }
  }

  /**
   * Log assistant activity
   */
  async logAssistantActivity(activity) {
    try {
      const user = auth.currentUser;
      if (user) {
        const activityRef = collection(db, "users", user.uid, "assistant_activity");
        await addDoc(activityRef, {
          ...activity,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error logging assistant activity:', error);
    }
  }

  /**
   * Get authorized contacts list
   */
  getAuthorizedContacts() {
    const contacts = [];
    this.authorizedContacts.forEach((data, id) => {
      contacts.push({ id, ...data });
    });
    return contacts.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
  }

  /**
   * Get conversation history for a contact
   */
  getConversationHistory(contactId) {
    return this.conversationHistory.get(contactId) || [];
  }

  /**
   * Get assistant status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      authorizedContactsCount: this.authorizedContacts.size,
      hasUserInstructions: !!this.userInstructions,
      hasPersonalityProfile: !!this.personalityProfile,
      totalConversations: this.conversationHistory.size
    };
  }

  /**
   * Simulate incoming message for testing
   */
  async simulateIncomingMessage(content, platform, contactId, testName = 'Test') {
    try {
      console.log(`🧪 Simulating incoming message from ${testName}...`);
      
      const messageData = {
        source: platform,
        content,
        sender: contactId,
        platform,
        timestamp: new Date().toISOString()
      };

      const result = await this.processIncomingMessage(messageData);
      
      console.log('🧪 Simulation result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Simulation failed:', error);
      return {
        success: false,
        error: error.message,
        shouldRespond: false
      };
    }
  }

  async sendPlatformResponse(contactId, responseText, platform, originalMessage) {
    try {
      const contact = this.authorizedContacts.get(contactId);
      if (!contact || !contact.platforms[platform]) {
        return { success: false, error: `Contact not authorized for ${platform}` };
      }

      const api = this.platformAPIs.get(platform);
      if (!api || !api.isConfigured()) {
        return { success: false, error: `${platform} API not configured` };
      }

      let result;
      
      // Platform-specific message sending
      switch (platform) {
        case 'whatsapp':
          result = await api.sendMessage(contact.phoneNumber || contactId, responseText);
          break;
          
        case 'instagram':
          result = await api.sendMessage(contactId, responseText);
          break;
          
        case 'email':
          const subject = `Re: ${originalMessage?.subject || 'Message'}`;
          result = api.sendGmailMessage 
            ? await api.sendGmailMessage(contactId, subject, responseText)
            : await api.sendSMTPMessage(contactId, subject, responseText);
          break;
          
        case 'linkedin':
          result = await api.sendMessage(contactId, responseText);
          break;
          
        case 'telegram':
          result = await api.sendMessage(contactId, responseText);
          break;
          
        case 'slack':
          // Determine if it's a DM or channel message
          if (contactId.startsWith('D') || contactId.startsWith('U')) {
            result = await api.sendDirectMessage(contactId, responseText);
          } else {
            result = await api.sendMessage(contactId, responseText);
          }
          break;
          
        case 'sms':
          result = await api.sendSMS(contact.phoneNumber || contactId, responseText);
          break;
          
        case 'facebook':
          result = await api.sendMessage(contactId, responseText);
          break;
          
        case 'twitter':
          result = await api.sendDirectMessage(contactId.replace('@', ''), responseText);
          break;
          
        case 'discord':
          result = await api.sendMessage(contactId, responseText);
          break;
          
        default:
          return { success: false, error: `Unsupported platform: ${platform}` };
      }

      if (result.success) {
        // Log the response in conversation history
        await this.logMessage(contactId, platform, {
          type: 'sent',
          content: responseText,
          messageId: result.messageId,
          originalMessageId: originalMessage?.id,
          timestamp: new Date().toISOString()
        });

        console.log(`📱 ${platform} response sent to ${contact.name || contactId}:`, responseText.substring(0, 100));
        return { success: true, messageId: result.messageId, platform };
      } else {
        console.error(`${platform} send failed:`, result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error(`Error sending ${platform} response:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendWhatsAppResponse(contactId, responseText, originalMessage) {
    try {
      const contact = this.authorizedContacts.get(contactId);
      if (!contact || !contact.platforms.whatsapp) {
        return { success: false, error: 'Contact not authorized for WhatsApp' };
      }

      if (!whatsappBusinessAPI.isConfigured()) {
        return { success: false, error: 'WhatsApp Business API not configured' };
      }

      // Send the message via WhatsApp Business API
      const result = await whatsappBusinessAPI.sendMessage(
        contact.phoneNumber,
        responseText,
        'text'
      );

      if (result.success) {
        // Log the response in conversation history
        await this.logMessage(contactId, 'whatsapp', {
          type: 'sent',
          content: responseText,
          messageId: result.messageId,
          originalMessageId: originalMessage?.id,
          timestamp: new Date().toISOString()
        });

        console.log(`📱 WhatsApp response sent to ${contact.name || contactId}:`, responseText.substring(0, 100));
        return { success: true, messageId: result.messageId };
      } else {
        console.error('WhatsApp send failed:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('Error sending WhatsApp response:', error);
      return { success: false, error: error.message };
    }
  }
}

// Global personal assistant service instance
const personalAssistantService = new PersonalAssistantService();

export { personalAssistantService };
export default personalAssistantService;
