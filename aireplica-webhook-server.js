/**
 * AIReplica Webhook Server
 * Real auto-reply system that processes incoming messages from various platforms
 * and responds using the user's AI clone
 */

const express = require('express');
const cors = require('cors');
const { autoReplyService } = require('./utils/aiReplicaCore');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize AIReplica auto-reply service
console.log('🤖 Initializing AIReplica Webhook Server...');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'AIReplica Webhook Server Running',
    service: 'Auto-Reply Bot',
    version: '1.0.0',
    uptime: process.uptime(),
    endpoints: {
      whatsapp: '/webhook/whatsapp',
      email: '/webhook/email',
      instagram: '/webhook/instagram',
      telegram: '/webhook/telegram',
      linkedin: '/webhook/linkedin',
      slack: '/webhook/slack'
    }
  });
});

// WhatsApp webhook - receives incoming messages
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    console.log('📱 WhatsApp webhook received:', req.body);
    
    const { message, from, timestamp } = req.body;
    
    if (!message || !from) {
      return res.status(400).json({ error: 'Missing message or sender' });
    }

    // Process with AIReplica
    const result = await autoReplyService.processIncomingMessage({
      platform: 'whatsapp',
      message: message,
      sender: from,
      timestamp: timestamp || new Date().toISOString(),
      messageId: `wa_${Date.now()}`
    });

    if (result) {
      res.json({
        success: true,
        message: 'Auto-reply processed',
        response: result.generatedResponse,
        status: result.status,
        platform: 'whatsapp'
      });
    } else {
      res.json({
        success: false,
        message: 'Auto-reply not generated'
      });
    }

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Auto-reply processing failed' });
  }
});

// Email webhook - receives incoming emails
app.post('/webhook/email', async (req, res) => {
  try {
    console.log('📧 Email webhook received:', req.body);
    
    const { subject, body, from, to } = req.body;
    
    // Process with AIReplica
    const result = await autoReplyService.processIncomingMessage({
      platform: 'email',
      message: `Subject: ${subject}\n\n${body}`,
      sender: from,
      recipient: to,
      timestamp: new Date().toISOString(),
      messageId: `email_${Date.now()}`
    });

    if (result) {
      res.json({
        success: true,
        message: 'Email auto-reply processed',
        response: result.generatedResponse,
        status: result.status,
        platform: 'email'
      });
    } else {
      res.json({
        success: false,
        message: 'Email auto-reply not generated'
      });
    }

  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: 'Email auto-reply processing failed' });
  }
});

// Instagram webhook - receives DMs and comments
app.post('/webhook/instagram', async (req, res) => {
  try {
    console.log('📷 Instagram webhook received:', req.body);
    
    const { message, from, type } = req.body; // type: 'dm' or 'comment'
    
    // Process with AIReplica
    const result = await autoReplyService.processIncomingMessage({
      platform: 'instagram',
      message: message,
      sender: from,
      messageType: type,
      timestamp: new Date().toISOString(),
      messageId: `ig_${Date.now()}`
    });

    if (result) {
      res.json({
        success: true,
        message: 'Instagram auto-reply processed',
        response: result.generatedResponse,
        status: result.status,
        platform: 'instagram'
      });
    } else {
      res.json({
        success: false,
        message: 'Instagram auto-reply not generated'
      });
    }

  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).json({ error: 'Instagram auto-reply processing failed' });
  }
});

// LinkedIn webhook - receives messages
app.post('/webhook/linkedin', async (req, res) => {
  try {
    console.log('💼 LinkedIn webhook received:', req.body);
    
    const { message, from } = req.body;
    
    // Process with AIReplica
    const result = await autoReplyService.processIncomingMessage({
      platform: 'linkedin',
      message: message,
      sender: from,
      timestamp: new Date().toISOString(),
      messageId: `li_${Date.now()}`
    });

    if (result) {
      res.json({
        success: true,
        message: 'LinkedIn auto-reply processed',
        response: result.generatedResponse,
        status: result.status,
        platform: 'linkedin'
      });
    } else {
      res.json({
        success: false,
        message: 'LinkedIn auto-reply not generated'
      });
    }

  } catch (error) {
    console.error('LinkedIn webhook error:', error);
    res.status(500).json({ error: 'LinkedIn auto-reply processing failed' });
  }
});

// Telegram webhook - receives messages
app.post('/webhook/telegram', async (req, res) => {
  try {
    console.log('✈️ Telegram webhook received:', req.body);
    
    const { message, chat, from } = req.body;
    
    // Process with AIReplica
    const result = await autoReplyService.processIncomingMessage({
      platform: 'telegram',
      message: message.text,
      sender: from.username || from.first_name,
      chatId: chat.id,
      timestamp: new Date().toISOString(),
      messageId: `tg_${message.message_id}`
    });

    if (result) {
      res.json({
        success: true,
        message: 'Telegram auto-reply processed',
        response: result.generatedResponse,
        status: result.status,
        platform: 'telegram'
      });
    } else {
      res.json({
        success: false,
        message: 'Telegram auto-reply not generated'
      });
    }

  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Telegram auto-reply processing failed' });
  }
});

// Slack webhook - receives messages
app.post('/webhook/slack', async (req, res) => {
  try {
    console.log('💬 Slack webhook received:', req.body);
    
    const { text, user, channel } = req.body;
    
    // Process with AIReplica
    const result = await autoReplyService.processIncomingMessage({
      platform: 'slack',
      message: text,
      sender: user,
      channel: channel,
      timestamp: new Date().toISOString(),
      messageId: `slack_${Date.now()}`
    });

    if (result) {
      res.json({
        success: true,
        message: 'Slack auto-reply processed',
        response: result.generatedResponse,
        status: result.status,
        platform: 'slack'
      });
    } else {
      res.json({
        success: false,
        message: 'Slack auto-reply not generated'
      });
    }

  } catch (error) {
    console.error('Slack webhook error:', error);
    res.status(500).json({ error: 'Slack auto-reply processing failed' });
  }
});

// Test endpoint for simulating incoming messages
app.post('/test/message', async (req, res) => {
  try {
    const { platform, message, sender = 'Test User' } = req.body;
    
    console.log(`🧪 Testing ${platform} auto-reply for message: "${message}"`);
    
    const result = await autoReplyService.simulateIncomingMessage(message, platform, sender);
    
    if (result) {
      res.json({
        success: true,
        test: true,
        original_message: message,
        ai_response: result.generatedResponse,
        platform: platform,
        status: result.status,
        timestamp: result.timestamp
      });
    } else {
      res.json({
        success: false,
        test: true,
        message: 'No response generated'
      });
    }

  } catch (error) {
    console.error('Test message error:', error);
    res.status(500).json({ 
      success: false,
      test: true,
      error: error.message 
    });
  }
});

// Get auto-reply statistics
app.get('/stats', async (req, res) => {
  try {
    // This would query the database for statistics
    res.json({
      total_replies: 0, // Would be populated from database
      platforms: {
        whatsapp: { active: true, replies: 0 },
        email: { active: true, replies: 0 },
        instagram: { active: true, replies: 0 },
        linkedin: { active: true, replies: 0 },
        telegram: { active: true, replies: 0 },
        slack: { active: true, replies: 0 }
      },
      status: 'active',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Webhook server error:', err);
  res.status(500).json({ 
    error: 'AIReplica server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AIReplica Webhook Server running on port ${PORT}`);
  console.log('📨 Ready to process auto-replies for:');
  console.log('   📱 WhatsApp Business API');
  console.log('   📧 Email (Gmail, Outlook, etc.)');
  console.log('   📷 Instagram DMs & Comments');
  console.log('   💼 LinkedIn Messages');
  console.log('   ✈️ Telegram Bot');
  console.log('   💬 Slack Workspace');
  console.log('\n💡 Your AI clone is ready to handle routine communications!');
  
  // Initialize the auto-reply service
  if (autoReplyService && autoReplyService.initialize) {
    autoReplyService.initialize().catch(console.error);
  }
});

module.exports = app;
