/**
 * Simple Webhook Server
 * Clean, working webhook server for message processing
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage for demo
let connectedUsers = new Map();
let messageHistory = [];

console.log('🚀 Starting AIReplica Webhook Server...');

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'AIReplica Webhook Server',
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size,
    messagesProcessed: messageHistory.length
  });
});

/**
 * WhatsApp webhook - receives incoming messages
 */
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    console.log('📱 WhatsApp webhook received:', req.body);
    
    const { message, from, timestamp } = req.body;
    
    if (!message || !from) {
      return res.status(400).json({ error: 'Missing message or sender' });
    }

    // Process message and generate AI response
    const aiResponse = await generateAIResponse(message, 'whatsapp', from);
    
    // Store in history
    messageHistory.push({
      platform: 'whatsapp',
      from: from,
      message: message,
      aiResponse: aiResponse,
      timestamp: timestamp || Date.now()
    });

    console.log(`🤖 AI Response: ${aiResponse}`);

    // In a real implementation, send response back to WhatsApp
    res.json({ 
      success: true, 
      response: aiResponse,
      platform: 'whatsapp'
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Instagram webhook - receives DMs
 */
app.post('/webhook/instagram', async (req, res) => {
  try {
    console.log('📷 Instagram webhook received:', req.body);
    
    const { message, from } = req.body;
    const aiResponse = await generateAIResponse(message, 'instagram', from);
    
    messageHistory.push({
      platform: 'instagram',
      from: from,
      message: message,
      aiResponse: aiResponse,
      timestamp: Date.now()
    });

    res.json({ 
      success: true, 
      response: aiResponse,
      platform: 'instagram'
    });

  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Generic platform webhook
 */
app.post('/webhook/:platform', async (req, res) => {
  let platform = req.params.platform;
  try {
    console.log(`📨 ${platform} webhook received:`, req.body);
    
    const { message, from } = req.body;
    const aiResponse = await generateAIResponse(message, platform, from);
    
    messageHistory.push({
      platform: platform,
      from: from,
      message: message,
      aiResponse: aiResponse,
      timestamp: Date.now()
    });

    res.json({ 
      success: true, 
      response: aiResponse,
      platform: platform
    });

  } catch (error) {
    console.error(`${platform} webhook error:`, error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * User connection endpoint - when user connects a platform
 */
app.post('/connect/:platform', (req, res) => {
  try {
    const platform = req.params.platform;
    const { userId, userInfo } = req.body;
    
    console.log(`🔗 User connecting ${platform}:`, userId);
    
    connectedUsers.set(`${platform}_${userId}`, {
      platform: platform,
      userId: userId,
      userInfo: userInfo,
      connectedAt: Date.now(),
      status: 'active'
    });

    res.json({ 
      success: true, 
      message: `${platform} connected successfully`,
      totalConnected: connectedUsers.size
    });

  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ error: 'Failed to connect platform' });
  }
});

/**
 * Get message history
 */
app.get('/messages', (req, res) => {
  const { platform, limit = 50 } = req.query;
  
  let messages = messageHistory;
  
  if (platform) {
    messages = messages.filter(m => m.platform === platform);
  }
  
  messages = messages.slice(-limit);
  
  res.json({ 
    success: true, 
    messages: messages,
    total: messageHistory.length 
  });
});

/**
 * Generate AI response using OpenRouter
 */
async function generateAIResponse(message, platform, sender) {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return 'AI temporarily unavailable. Please check configuration.';
    }

    const systemPrompt = getSystemPrompt(platform);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aireplica.app',
        'X-Title': 'AIReplica Webhook Server',
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
function getSystemPrompt(platform) {
  const prompts = {
    whatsapp: 'You are a helpful AI assistant responding to WhatsApp messages. Be casual, friendly, and concise.',
    instagram: 'You are a helpful AI assistant responding to Instagram DMs. Be engaging and friendly.',
    linkedin: 'You are a helpful AI assistant for professional LinkedIn messages. Be professional but friendly.',
    twitter: 'You are a helpful AI assistant for Twitter/X. Be witty and concise.',
    telegram: 'You are a helpful AI assistant for Telegram. Be helpful and informative.'
  };

  return prompts[platform] || 'You are a helpful AI assistant. Respond naturally and helpfully.';
}

// Start server
app.listen(PORT, () => {
  console.log(`🌐 AIReplica Webhook Server running on port ${PORT}`);
  console.log(`📡 WhatsApp webhook: http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`📷 Instagram webhook: http://localhost:${PORT}/webhook/instagram`);
  console.log(`🔗 Connect endpoint: http://localhost:${PORT}/connect/:platform`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log('');
  console.log('🎉 Ready to receive messages and generate AI responses!');
});

module.exports = app;
