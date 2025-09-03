/**
 * AIReplica Webhook Server (Simplified for testing)
 * Real auto-reply system that processes incoming messages
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

app.use(cors());
app.use(express.json());

console.log('🤖 Starting AIReplica Webhook Server...');

// Mock AI response generation for testing
const generateAIResponse = async (message, platform, sender) => {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const responses = {
    whatsapp: `Hi ${sender}! Thanks for your message. I'm currently busy but I'll get back to you soon. My AI assistant is helping manage my communications! 🤖`,
    email: `Thank you for your email. I've received your message and will respond personally within 24 hours. This auto-reply is powered by my AI clone. Best regards!`,
    instagram: `Thanks for reaching out! ✨ I appreciate your interest. I'll get back to you soon - my AI clone is helping me stay on top of messages! 📱`,
    linkedin: `Hello! Thank you for connecting. I'm currently managing a high volume of messages with my AI assistant. I'll respond personally to important matters soon.`,
    telegram: `Hey! Got your message 👋 My AI clone is helping me handle routine communications. I'll get back to you personally if needed!`,
    slack: `Thanks for the message! I'm using my AI clone to manage communications while I focus on deep work. I'll respond if this needs personal attention.`
  };
  
  return responses[platform] || `Thanks for your message! I'll get back to you soon. (Auto-replied by AI clone)`;
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: '✅ AIReplica Webhook Server Running',
    service: 'Auto-Reply Bot for Personal Digital Clone',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    message: '🤖 Your AI clone is ready to handle routine communications!',
    endpoints: {
      whatsapp: 'POST /webhook/whatsapp',
      email: 'POST /webhook/email',
      instagram: 'POST /webhook/instagram',
      telegram: 'POST /webhook/telegram',
      linkedin: 'POST /webhook/linkedin',
      slack: 'POST /webhook/slack',
      test: 'POST /test/message'
    }
  });
});

// WhatsApp webhook
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    console.log('📱 WhatsApp message received:', req.body);
    
    const { message, from, timestamp } = req.body;
    
    if (!message || !from) {
      return res.status(400).json({ error: 'Missing message or sender' });
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(message, 'whatsapp', from);
    
    console.log(`🤖 Generated response: "${aiResponse}"`);

    res.json({
      success: true,
      message: 'WhatsApp auto-reply generated',
      original_message: message,
      ai_response: aiResponse,
      sender: from,
      platform: 'whatsapp',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Auto-reply processing failed' });
  }
});

// Email webhook
app.post('/webhook/email', async (req, res) => {
  try {
    console.log('📧 Email received:', req.body);
    
    const { subject, body, from, to } = req.body;
    const fullMessage = `Subject: ${subject}\n\n${body}`;
    
    // Generate AI response
    const aiResponse = await generateAIResponse(fullMessage, 'email', from);
    
    console.log(`🤖 Generated email response: "${aiResponse}"`);

    res.json({
      success: true,
      message: 'Email auto-reply generated',
      original_subject: subject,
      original_body: body,
      ai_response: aiResponse,
      sender: from,
      platform: 'email',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: 'Email auto-reply processing failed' });
  }
});

// Instagram webhook
app.post('/webhook/instagram', async (req, res) => {
  try {
    console.log('📷 Instagram message received:', req.body);
    
    const { message, from, type } = req.body;
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, 'instagram', from);
    
    console.log(`🤖 Generated Instagram response: "${aiResponse}"`);

    res.json({
      success: true,
      message: 'Instagram auto-reply generated',
      original_message: message,
      ai_response: aiResponse,
      sender: from,
      message_type: type,
      platform: 'instagram',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).json({ error: 'Instagram auto-reply processing failed' });
  }
});

// LinkedIn webhook
app.post('/webhook/linkedin', async (req, res) => {
  try {
    console.log('💼 LinkedIn message received:', req.body);
    
    const { message, from } = req.body;
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, 'linkedin', from);
    
    console.log(`🤖 Generated LinkedIn response: "${aiResponse}"`);

    res.json({
      success: true,
      message: 'LinkedIn auto-reply generated',
      original_message: message,
      ai_response: aiResponse,
      sender: from,
      platform: 'linkedin',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LinkedIn webhook error:', error);
    res.status(500).json({ error: 'LinkedIn auto-reply processing failed' });
  }
});

// Telegram webhook
app.post('/webhook/telegram', async (req, res) => {
  try {
    console.log('✈️ Telegram message received:', req.body);
    
    const { message, chat, from } = req.body;
    const messageText = message?.text || req.body.text || 'No message text';
    const sender = from?.username || from?.first_name || req.body.from || 'Unknown';
    
    // Generate AI response
    const aiResponse = await generateAIResponse(messageText, 'telegram', sender);
    
    console.log(`🤖 Generated Telegram response: "${aiResponse}"`);

    res.json({
      success: true,
      message: 'Telegram auto-reply generated',
      original_message: messageText,
      ai_response: aiResponse,
      sender: sender,
      platform: 'telegram',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Telegram auto-reply processing failed' });
  }
});

// Slack webhook
app.post('/webhook/slack', async (req, res) => {
  try {
    console.log('💬 Slack message received:', req.body);
    
    const { text, user, channel } = req.body;
    
    // Generate AI response
    const aiResponse = await generateAIResponse(text, 'slack', user);
    
    console.log(`🤖 Generated Slack response: "${aiResponse}"`);

    res.json({
      success: true,
      message: 'Slack auto-reply generated',
      original_message: text,
      ai_response: aiResponse,
      sender: user,
      channel: channel,
      platform: 'slack',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Slack webhook error:', error);
    res.status(500).json({ error: 'Slack auto-reply processing failed' });
  }
});

// Test endpoint for any platform
app.post('/test/message', async (req, res) => {
  try {
    const { platform = 'whatsapp', message, sender = 'Test User' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`🧪 Testing ${platform} auto-reply for: "${message}"`);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, platform, sender);
    
    res.json({
      success: true,
      test: true,
      platform: platform,
      original_message: message,
      ai_response: aiResponse,
      sender: sender,
      processing_time: '~1s',
      timestamp: new Date().toISOString(),
      note: '🤖 This is your AI clone responding in your communication style!'
    });

  } catch (error) {
    console.error('Test message error:', error);
    res.status(500).json({ 
      success: false,
      test: true,
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AIReplica Webhook Server running on port ${PORT}`);
  console.log('🌐 Server URL: http://localhost:' + PORT);
  console.log('\n📨 Ready to process auto-replies for:');
  console.log('   📱 WhatsApp Business Messages');
  console.log('   📧 Email Auto-Responses');
  console.log('   📷 Instagram DMs & Comments');
  console.log('   💼 LinkedIn Professional Messages');
  console.log('   ✈️ Telegram Bot Messages');
  console.log('   💬 Slack Workspace Communications');
  console.log('\n🤖 Your personal AI clone is ready to handle routine communications!');
  console.log('💡 Test with: POST /test/message');
});

module.exports = app;
