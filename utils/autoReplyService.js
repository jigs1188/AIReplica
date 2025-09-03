import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEnhancedAIResponse } from './aiSettings';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Auto-reply service for handling incoming messages
export class AutoReplyService {
  static instance = null;
  isActive = false;
  settings = null;
  
  static getInstance() {
    if (!AutoReplyService.instance) {
      AutoReplyService.instance = new AutoReplyService();
    }
    return AutoReplyService.instance;
  }

  async initialize() {
    // Skip initialization on web platform
    if (Platform.OS === 'web') {
      console.log('Auto-Reply Service: Skipping initialization on web platform');
      return;
    }
    try {
      // Load auto-reply settings
      const settingsStr = await AsyncStorage.getItem('autoReplySettings');
      this.settings = settingsStr ? JSON.parse(settingsStr) : null;
      
      if (this.settings?.enabled) {
        this.isActive = true;
        console.log('🤖 Auto-Reply Service: Activated');
        await this.logActivity('Auto-reply service initialized and activated');
      } else {
        console.log('🔕 Auto-Reply Service: Disabled');
      }
      
    } catch (error) {
      console.error('Auto-Reply Service initialization failed:', error);
    }
  }

  async processIncomingMessage(messageData) {
    if (!this.isActive || !this.settings?.enabled) {
      return null;
    }

    const { source, content, sender, timestamp } = messageData;
    
    try {
      // Check if app integration is enabled
      if (!this.settings.apps[source]?.enabled) {
        console.log(`Auto-reply disabled for ${source}`);
        return null;
      }

      console.log(`🔄 Processing auto-reply for ${source} from ${sender}`);
      
      // Detect message context and urgency
      const context = this.analyzeMessageContext(content);
      
      // Generate appropriate response
      const response = await this.generateResponse(content, source, context);
      
      // Add response delay for natural feel
      await this.delay(this.settings.responseDelay * 1000);
      
      // Log the auto-reply activity
      await this.logActivity(`Auto-replied to ${source} message from ${sender}`);
      
      return {
        response,
        context,
        source,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Auto-reply processing failed:', error);
      await this.logActivity(`Auto-reply failed for ${source}: ${error.message}`);
      return null;
    }
  }

  analyzeMessageContext(content) {
    const text = content.toLowerCase();
    
    // Check for urgent keywords
    const isUrgent = this.settings.keywords.urgent.some(keyword => 
      text.includes(keyword)
    );
    
    // Check for meeting keywords
    const isMeeting = this.settings.keywords.meeting.some(keyword => 
      text.includes(keyword)
    );
    
    // Check for project keywords
    const isProject = this.settings.keywords.project.some(keyword => 
      text.includes(keyword)
    );
    
    // Determine context type
    let contextType = 'general';
    if (isUrgent) contextType = 'urgent';
    else if (isMeeting) contextType = 'meeting';
    else if (isProject) contextType = 'project';
    
    return {
      type: contextType,
      isUrgent,
      isMeeting,
      isProject,
      length: content.length,
      hasQuestion: text.includes('?'),
      sentiment: this.detectSentiment(text)
    };
  }

  detectSentiment(text) {
    const positiveWords = ['great', 'awesome', 'excellent', 'good', 'thanks', 'appreciate'];
    const negativeWords = ['problem', 'issue', 'urgent', 'help', 'stuck', 'error'];
    
    const positive = positiveWords.some(word => text.includes(word));
    const negative = negativeWords.some(word => text.includes(word));
    
    if (positive && !negative) return 'positive';
    if (negative && !positive) return 'negative';
    return 'neutral';
  }

  async generateResponse(content, source, context) {
    try {
      const appConfig = this.settings.apps[source];
      const style = appConfig.style;
      
      // Use custom response for specific contexts
      if (context.type === 'urgent' && this.settings.customResponses.busy) {
        return this.settings.customResponses.busy;
      }
      
      if (context.isMeeting && this.settings.customResponses.meeting) {
        return this.settings.customResponses.meeting;
      }
      
      // Generate AI response
      const systemPrompt = this.buildSystemPrompt(source, style, context);
      
      const aiResponse = await getEnhancedAIResponse([
        { role: "user", content: content }
      ], systemPrompt);
      
      // Ensure response length limit
      return this.truncateResponse(aiResponse, this.settings.maxResponseLength);
      
    } catch (error) {
      console.error('Response generation failed:', error);
      // Fallback to custom response
      return this.settings.customResponses.offline;
    }
  }

  buildSystemPrompt(source, style, context) {
    const basePrompt = `You are an AI assistant responding to a ${source} message in a ${style.toLowerCase()} tone.`;
    const lengthLimit = `Keep your response under ${this.settings.maxResponseLength} characters.`;
    
    let contextPrompt = '';
    if (context.isUrgent) {
      contextPrompt = ' This appears to be urgent, so acknowledge that and provide a helpful response.';
    } else if (context.isMeeting) {
      contextPrompt = ' This is about a meeting or appointment, so be accommodating about scheduling.';
    } else if (context.isProject) {
      contextPrompt = ' This is work/project related, so be professional and offer concrete help.';
    }
    
    return `${basePrompt} ${lengthLimit}${contextPrompt} Be helpful, personable, and authentic.`;
  }

  truncateResponse(response, maxLength) {
    if (response.length <= maxLength) {
      return response;
    }
    
    // Try to truncate at sentence boundary
    const sentences = response.split('. ');
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence + '. ').length <= maxLength - 3) {
        truncated += sentence + '. ';
      } else {
        break;
      }
    }
    
    if (truncated.length > 0) {
      return truncated.trim();
    }
    
    // Fallback: hard truncate with ellipsis
    return response.substring(0, maxLength - 3) + '...';
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async logActivity(activity) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const logEntry = {
        activity,
        timestamp: serverTimestamp(),
        service: 'auto-reply'
      };
      
      await setDoc(doc(db, "users", user.uid, "activity_logs", Date.now().toString()), logEntry);
      console.log('📝 Activity logged:', activity);
      
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async updateSettings(newSettings) {
    try {
      await AsyncStorage.setItem('autoReplySettings', JSON.stringify(newSettings));
      this.settings = newSettings;
      this.isActive = newSettings.enabled;
      
      console.log('⚙️ Auto-Reply Settings Updated:', {
        enabled: newSettings.enabled,
        enabledApps: Object.keys(newSettings.apps).filter(app => newSettings.apps[app].enabled)
      });
      
    } catch (error) {
      console.error('Failed to update auto-reply settings:', error);
    }
  }

  // Simulate incoming message for testing
  async simulateIncomingMessage(source, content, sender = "Test User") {
    console.log(`📱 Simulating ${source} message: "${content}"`);
    
    const messageData = {
      source,
      content,
      sender,
      timestamp: new Date().toISOString()
    };
    
    const result = await this.processIncomingMessage(messageData);
    
    if (result) {
      console.log(`🤖 Auto-reply generated:`, result.response);
      Alert.alert(
        `${source.toUpperCase()} Auto-Reply`,
        `Message: "${content}"\n\nAI Response: "${result.response}"`
      );
    } else {
      console.log('No auto-reply generated');
      Alert.alert('Auto-Reply', 'No response generated (integration may be disabled)');
    }
    
    return result;
  }

  getStatus() {
    return {
      isActive: this.isActive,
      enabledApps: this.settings?.apps ? 
        Object.keys(this.settings.apps).filter(app => this.settings.apps[app].enabled) : [],
      responseDelay: this.settings?.responseDelay || 0,
      maxResponseLength: this.settings?.maxResponseLength || 0
    };
  }
}

// Global auto-reply service instance
const autoReplyService = new AutoReplyService();

export { autoReplyService };
export default autoReplyService;

// Initialize the service when the module loads
autoReplyService.initialize();
