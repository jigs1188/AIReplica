/**
 * Webhook Server for AiReplica Personal Assistant
 * Handles incoming messages from all platforms and processes them through the personal assistant
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'mySecureToken123';
const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;

// Import the personal assistant service (when running in Node.js environment)
try {
  // This would be imported differently in a full Node.js setup
  console.log('📱 Webhook server starting - Personal Assistant integration ready');
} catch (_error) {
  console.log('⚠️  Personal Assistant not available in this environment');
}

/**
 * WhatsApp Webhook Verification (GET)
 * Facebook/WhatsApp will verify your webhook endpoint
 */
app.get('/webhook', (req, res) => {
  console.log('🔍 Webhook verification request received');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify the webhook
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * WhatsApp Webhook Handler (POST)
 * Processes incoming messages from WhatsApp Business API
 */
app.post('/webhook', async (req, res) => {
  console.log('📨 Incoming webhook message:', JSON.stringify(req.body, null, 2));

  try {
    // Verify webhook signature (security)
    if (WHATSAPP_WEBHOOK_SECRET) {
      const signature = req.headers['x-hub-signature-256'];
      if (!verifyWebhookSignature(req.body, signature, WHATSAPP_WEBHOOK_SECRET)) {
        console.log('❌ Invalid webhook signature');
        return res.sendStatus(403);
      }
    }

    const body = req.body;

    // Process WhatsApp messages
    if (body.object === 'whatsapp_business_account') {
      await processWhatsAppWebhook(body);
    }
    
    // Process Instagram messages
    else if (body.object === 'instagram') {
      await processInstagramWebhook(body);
    }
    
    // Process Facebook messages
    else if (body.object === 'page') {
      await processFacebookWebhook(body);
    }
    
    // Process other platforms...
    else {
      console.log('📝 Unknown webhook object type:', body.object);
    }

    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.sendStatus(500);
  }
});

/**
 * Process WhatsApp Business API webhooks
 */
async function processWhatsAppWebhook(body) {
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (value?.messages) {
    for (const message of value.messages) {
      const messageData = {
        platform: 'whatsapp',
        source: 'webhook',
        messageId: message.id,
        sender: message.from,
        content: getMessageContent(message),
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        type: message.type,
        raw: message
      };

      console.log('💬 Processing WhatsApp message:', messageData);

      // Forward to personal assistant service
      await forwardToPersonalAssistant(messageData);
    }
  }

  // Handle message status updates
  if (value?.statuses) {
    for (const status of value.statuses) {
      console.log('📊 Message status update:', {
        id: status.id,
        status: status.status,
        timestamp: status.timestamp
      });
    }
  }
}

/**
 * Process Instagram Business API webhooks
 */
async function processInstagramWebhook(body) {
  const entry = body.entry?.[0];
  
  if (entry?.messaging) {
    for (const messaging of entry.messaging) {
      if (messaging.message) {
        const messageData = {
          platform: 'instagram',
          source: 'webhook',
          messageId: messaging.message.mid,
          sender: messaging.sender.id,
          content: messaging.message.text || '[Media message]',
          timestamp: new Date(messaging.timestamp),
          type: 'text',
          raw: messaging
        };

        console.log('📷 Processing Instagram message:', messageData);
        await forwardToPersonalAssistant(messageData);
      }
    }
  }
}

/**
 * Process Facebook Messenger webhooks
 */
async function processFacebookWebhook(body) {
  const entry = body.entry?.[0];
  
  if (entry?.messaging) {
    for (const messaging of entry.messaging) {
      if (messaging.message && !messaging.message.is_echo) {
        const messageData = {
          platform: 'facebook',
          source: 'webhook',
          messageId: messaging.message.mid,
          sender: messaging.sender.id,
          content: messaging.message.text || '[Media message]',
          timestamp: new Date(messaging.timestamp),
          type: 'text',
          raw: messaging
        };

        console.log('💙 Processing Facebook message:', messageData);
        await forwardToPersonalAssistant(messageData);
      }
    }
  }
}

/**
 * Extract message content based on message type
 */
function getMessageContent(message) {
  switch (message.type) {
    case 'text':
      return message.text.body;
    case 'image':
      return '[Image message]';
    case 'document':
      return '[Document message]';
    case 'audio':
      return '[Audio message]';
    case 'video':
      return '[Video message]';
    default:
      return '[Unknown message type]';
  }
}

/**
 * Forward message to Personal Assistant Service
 */
async function forwardToPersonalAssistant(messageData) {
  try {
    console.log('🤖 Forwarding to Personal Assistant:', messageData.platform);
    
    // In a full Node.js environment, you would:
    // const result = await personalAssistantService.processIncomingMessage(messageData);
    
    // For testing, simulate the processing
    console.log('✅ Message processed successfully');
    console.log('📤 AI response would be generated and sent back via platform API');
    
    // You can add actual processing here when integrating with your React Native app
    // This could be done via:
    // 1. Direct API calls to your mobile app backend
    // 2. Firebase real-time database updates
    // 3. Push notifications to trigger processing
    
  } catch (error) {
    console.error('❌ Error forwarding to Personal Assistant:', error);
  }
}

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) return true; // Skip verification if not configured
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return signature === expectedSignature;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platform: 'AiReplica Webhook Server'
  });
});

/**
 * Get webhook status and statistics
 */
app.get('/status', (req, res) => {
  res.json({
    server: 'AiReplica Webhook Server',
    version: '1.0.0',
    status: 'active',
    platforms: ['whatsapp', 'instagram', 'facebook', 'telegram', 'slack'],
    timestamp: new Date().toISOString(),
    endpoints: {
      verification: 'GET /webhook',
      messages: 'POST /webhook',
      health: 'GET /health',
      status: 'GET /status'
    }
  });
});

/**
 * Test endpoint for manual testing
 */
app.post('/test', async (req, res) => {
  const { platform, message, sender } = req.body;
  
  console.log('🧪 Test message received:', { platform, message, sender });
  
  const testMessageData = {
    platform: platform || 'whatsapp',
    source: 'test',
    messageId: 'test_' + Date.now(),
    sender: sender || 'test_user',
    content: message || 'Test message',
    timestamp: new Date(),
    type: 'text'
  };

  await forwardToPersonalAssistant(testMessageData);
  
  res.json({
    success: true,
    message: 'Test message processed',
    data: testMessageData
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('🚀 AiReplica Webhook Server started!');
  console.log('📡 Server running on port:', PORT);
  console.log('🔗 Webhook URL: http://localhost:' + PORT + '/webhook');
  console.log('🏥 Health check: http://localhost:' + PORT + '/health');
  console.log('📊 Status: http://localhost:' + PORT + '/status');
  console.log('🧪 Test endpoint: POST http://localhost:' + PORT + '/test');
  console.log('');
  console.log('📝 Ready to receive webhooks from:');
  console.log('   • WhatsApp Business API');
  console.log('   • Instagram Business API');
  console.log('   • Facebook Messenger');
  console.log('   • Other platforms...');
  console.log('');
  console.log('💡 Use ngrok to expose this server for external webhook testing');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down webhook server...');
  process.exit(0);
});

module.exports = app;
