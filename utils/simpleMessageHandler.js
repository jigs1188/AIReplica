/**
 * Simple Message Handler
 * Processes incoming messages and generates AI responses
 */

class SimpleMessageHandler {
  constructor() {
    this.isActive = false;
    this.aiApiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  }

  /**
   * Start message monitoring
   */
  async start() {
    try {
      this.isActive = true;
      console.log('🤖 AI Message Handler started');
      
      // In a real app, this would start listening to platform webhooks
      // For now, we'll simulate message processing
      
      return { success: true, message: 'AI assistant is now active' };
      
    } catch (error) {
      console.error('Error starting message handler:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop message monitoring
   */
  async stop() {
    this.isActive = false;
    console.log('🔇 AI Message Handler stopped');
    return { success: true };
  }

  /**
   * Process incoming message and generate AI response
   */
  async processMessage(platform, messageData) {
    try {
      if (!this.isActive) {
        console.log('⏸️ Message handler not active, skipping message');
        return null;
      }

      console.log(`📨 Processing ${platform} message:`, messageData.message);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        messageData.message,
        platform,
        messageData.sender
      );

      console.log(`🤖 AI Response generated: ${aiResponse}`);

      // In a real app, this would send the response back to the platform
      // For now, we'll just log it
      
      return {
        success: true,
        response: aiResponse,
        platform: platform,
        originalMessage: messageData.message
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate AI response using OpenRouter
   */
  async generateAIResponse(message, platform, sender) {
    try {
      if (!this.aiApiKey) {
        return 'AI response temporarily unavailable. Please check API configuration.';
      }

      // Create system prompt based on platform
      const systemPrompt = this.getSystemPrompt(platform);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aireplica.app',
          'X-Title': 'AIReplica App',
        },
        body: JSON.stringify({
          model: 'google/gemma-2-9b-it:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    } catch (error) {
      console.error('AI response error:', error);
      return 'Sorry, I\'m temporarily unavailable. I\'ll get back to you soon!';
    }
  }

  /**
   * Get system prompt for platform
   */
  getSystemPrompt(platform) {
    const basePrompt = 'You are a helpful AI assistant. Respond naturally and helpfully.';
    
    const platformPrompts = {
      whatsapp: basePrompt + ' Keep responses casual and concise for WhatsApp.',
      instagram: basePrompt + ' Keep responses friendly and engaging for Instagram.',
      linkedin: basePrompt + ' Keep responses professional for LinkedIn.',
      twitter: basePrompt + ' Keep responses brief and witty for Twitter.',
      telegram: basePrompt + ' Keep responses helpful and informative for Telegram.'
    };

    return platformPrompts[platform] || basePrompt;
  }

  /**
   * Test message processing (for demo)
   */
  async testMessage(platform = 'whatsapp', message = 'Hello AI!') {
    console.log(`🧪 Testing message processing for ${platform}`);
    
    const result = await this.processMessage(platform, {
      message: message,
      sender: 'test_user',
      timestamp: Date.now()
    });

    if (result.success) {
      console.log(`✅ Test successful: ${result.response}`);
      return result;
    } else {
      console.log(`❌ Test failed: ${result.error}`);
      return result;
    }
  }

  /**
   * Get handler status
   */
  getStatus() {
    return {
      active: this.isActive,
      apiConfigured: !!this.aiApiKey,
      platforms: Object.keys(this.getSystemPrompt.toString()).length
    };
  }
}

// Export singleton instance
export default new SimpleMessageHandler();
