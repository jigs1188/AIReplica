/**
 * Working WhatsApp Webhook Server
 * Handles incoming messages and sends AI-powered auto-replies
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration storage
let whatsappConfig = {
  accessToken: '',
  phoneNumberId: '',
  webhookVerifyToken: 'aireplica_webhook_2024',
  businessAccountId: ''
};

// Message history storage
let messageHistory = [];

// Load configuration from file if exists
const loadConfig = () => {
  try {
    const configPath = './whatsapp-config.json';
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8');
      whatsappConfig = { ...whatsappConfig, ...JSON.parse(config) };
      console.log('✅ Configuration loaded from file');
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
};

// Save configuration to file
const saveConfig = () => {
  try {
    const configPath = './whatsapp-config.json';
    fs.writeFileSync(configPath, JSON.stringify(whatsappConfig, null, 2));
    console.log('✅ Configuration saved to file');
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
};

// Load config on startup
loadConfig();

/**
 * Webhook verification endpoint
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('📞 Webhook verification request:', { mode, token, challenge });

  if (mode === 'subscribe' && token === whatsappConfig.webhookVerifyToken) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * Webhook message handler
 */
app.post('/webhook', async (req, res) => {
  console.log('📨 Received webhook:', JSON.stringify(req.body, null, 2));

  try {
    const body = req.body;

    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        const message = value.messages[0];
        const contact = value.contacts?.[0];

        const incomingMessage = {
          messageId: message.id,
          from: message.from,
          timestamp: message.timestamp,
          type: message.type,
          text: message.text?.body || '',
          contact: {
            name: contact?.profile?.name || 'Unknown',
            phoneNumber: contact?.wa_id || message.from
          }
        };

        console.log('📥 Processing message:', incomingMessage);

        // Store message in history
        messageHistory.push({
          ...incomingMessage,
          direction: 'incoming',
          receivedAt: new Date().toISOString()
        });

        // Generate and send auto-reply
        await handleAutoReply(incomingMessage);

        // Mark message as read
        await markMessageAsRead(message.id);
      }

      // Handle message status updates
      if (value?.statuses) {
        const status = value.statuses[0];
        console.log('📊 Message status update:', status);
        
        // Update message history with status
        const messageIndex = messageHistory.findIndex(m => m.messageId === status.id);
        if (messageIndex !== -1) {
          messageHistory[messageIndex].status = status.status;
          messageHistory[messageIndex].timestamp = status.timestamp;
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * Generate AI-powered auto-reply
 */
async function generateAutoReply(incomingMessage) {
  try {
    const text = incomingMessage.text.toLowerCase();
    
    // Simple keyword-based responses for now
    // In production, you would integrate with OpenAI or other AI service
    
    const responses = {
      greeting: [
        "Hello! Thanks for your message. How can I help you today?",
        "Hi there! I received your message and I'll get back to you shortly.",
        "Hey! Thanks for reaching out. What can I do for you?"
      ],
      thanks: [
        "You're very welcome! Let me know if there's anything else I can help with.",
        "My pleasure! Feel free to reach out anytime.",
        "You're welcome! Happy to help anytime."
      ],
      question: [
        "That's a great question! Let me think about it and get back to you soon.",
        "Thanks for asking! I'll need to look into that and respond shortly.",
        "Interesting question! Give me a moment to provide you with a proper answer."
      ],
      business: [
        "Thanks for your interest! I'll get back to you with more details soon.",
        "Great to hear from you! Let me gather some information and respond shortly.",
        "Thank you for reaching out about this. I'll follow up with you soon."
      ],
      default: [
        "Thanks for your message! I'll get back to you as soon as possible.",
        "Hi! I received your message and will respond shortly. Thanks for your patience!",
        "Hello! Thanks for reaching out. I'll be in touch soon.",
        "Got your message! I'll respond as soon as I can. Have a great day!"
      ]
    };

    // Determine response category
    let category = 'default';
    
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      category = 'greeting';
    } else if (text.includes('thank') || text.includes('thanks')) {
      category = 'thanks';
    } else if (text.includes('?') || text.includes('how') || text.includes('what') || text.includes('when') || text.includes('where') || text.includes('why')) {
      category = 'question';
    } else if (text.includes('business') || text.includes('service') || text.includes('price') || text.includes('cost')) {
      category = 'business';
    }

    // Select random response from category
    const categoryResponses = responses[category];
    const reply = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

    // Add personalization if contact name is available
    if (incomingMessage.contact.name && incomingMessage.contact.name !== 'Unknown') {
      return `Hi ${incomingMessage.contact.name}! ${reply}`;
    }

    return reply;
  } catch (error) {
    console.error('Error generating auto-reply:', error);
    return "Thanks for your message! I'll get back to you soon.";
  }
}

/**
 * Handle auto-reply logic
 */
async function handleAutoReply(incomingMessage) {
  try {
    if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
      console.log('⚠️ WhatsApp not configured, skipping auto-reply');
      return;
    }

    // Generate AI response
    const replyText = await generateAutoReply(incomingMessage);

    // Send reply
    const result = await sendWhatsAppMessage(incomingMessage.from, replyText);
    
    if (result.success) {
      console.log('✅ Auto-reply sent successfully:', result.messageId);
      
      // Store sent message in history
      messageHistory.push({
        messageId: result.messageId,
        from: whatsappConfig.phoneNumberId,
        to: incomingMessage.from,
        text: replyText,
        type: 'text',
        direction: 'outgoing',
        sentAt: new Date().toISOString(),
        status: 'sent'
      });
    } else {
      console.error('❌ Failed to send auto-reply:', result.error);
    }
  } catch (error) {
    console.error('❌ Error handling auto-reply:', error);
  }
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(to, message, type = 'text') {
  try {
    const cleanPhoneNumber = to.replace(/[^0-9]/g, '');

    const messageData = {
      messaging_product: "whatsapp",
      to: cleanPhoneNumber,
      type: type,
    };

    if (type === 'text') {
      messageData.text = {
        body: message
      };
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${whatsappConfig.phoneNumberId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.data.messages) {
      return {
        success: true,
        messageId: response.data.messages[0].id,
        to: cleanPhoneNumber,
        status: 'sent'
      };
    } else {
      return {
        success: false,
        error: 'No message ID returned'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Mark message as read
 */
async function markMessageAsRead(messageId) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${whatsappConfig.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      },
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('✅ Message marked as read:', messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to mark message as read:', error);
    return false;
  }
}

/**
 * Configuration management endpoints
 */

// Get current configuration
app.get('/api/config', (req, res) => {
  const safeConfig = {
    phoneNumberId: whatsappConfig.phoneNumberId,
    webhookVerifyToken: whatsappConfig.webhookVerifyToken,
    businessAccountId: whatsappConfig.businessAccountId,
    hasAccessToken: !!whatsappConfig.accessToken
  };
  res.json(safeConfig);
});

// Update configuration
app.post('/api/config', (req, res) => {
  try {
    const { accessToken, phoneNumberId, businessAccountId, webhookVerifyToken } = req.body;
    
    if (accessToken) whatsappConfig.accessToken = accessToken;
    if (phoneNumberId) whatsappConfig.phoneNumberId = phoneNumberId;
    if (businessAccountId) whatsappConfig.businessAccountId = businessAccountId;
    if (webhookVerifyToken) whatsappConfig.webhookVerifyToken = webhookVerifyToken;

    saveConfig();
    
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test connection
app.post('/api/test-connection', async (req, res) => {
  try {
    const { accessToken, phoneNumberId } = req.body;
    
    const response = await axios.get(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.data.display_phone_number) {
      res.json({
        success: true,
        phoneNumber: response.data.display_phone_number,
        id: response.data.id,
        status: response.data.status
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid response from WhatsApp API'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Send test message
app.post('/api/send-test-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    const result = await sendWhatsAppMessage(to, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get message history
app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  const messages = messageHistory
    .sort((a, b) => new Date(b.receivedAt || b.sentAt) - new Date(a.receivedAt || a.sentAt))
    .slice(offset, offset + limit);
    
  res.json({
    messages,
    total: messageHistory.length,
    limit,
    offset
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    configured: !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId),
    messagesReceived: messageHistory.filter(m => m.direction === 'incoming').length,
    messagesSent: messageHistory.filter(m => m.direction === 'outgoing').length
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AIReplica WhatsApp Webhook Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      webhook: '/webhook',
      config: '/api/config',
      test: '/api/test-connection',
      messages: '/api/messages',
      health: '/health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AIReplica WhatsApp Webhook Server running on port ${PORT}`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🔧 Configuration: ${whatsappConfig.accessToken ? 'Configured' : 'Not configured'}`);
  
  if (whatsappConfig.accessToken && whatsappConfig.phoneNumberId) {
    console.log('✅ WhatsApp API ready for incoming messages');
  } else {
    console.log('⚠️ WhatsApp API not configured - update config via /api/config');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down AIReplica WhatsApp Webhook Server...');
  process.exit(0);
});

module.exports = app;
