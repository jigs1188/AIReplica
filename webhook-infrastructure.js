/**
 * Centralized Webhook Infrastructure
 * Handles webhooks from all platforms and routes them to AI processing
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { Buffer } = require('buffer');
require('dotenv').config();

const app = express();
const PORT = process.env.WEBHOOK_PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (basic implementation)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

// Configuration
const WEBHOOK_SECRETS = {
  whatsapp: process.env.WHATSAPP_WEBHOOK_SECRET,
  instagram: process.env.INSTAGRAM_WEBHOOK_SECRET,
  facebook: process.env.FACEBOOK_WEBHOOK_SECRET,
  telegram: process.env.TELEGRAM_WEBHOOK_SECRET,
  slack: process.env.SLACK_WEBHOOK_SECRET,
  discord: process.env.DISCORD_WEBHOOK_SECRET
};

/**
 * Rate limiting middleware
 */
const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  clientData.count++;
  next();
};

/**
 * Webhook signature verification
 */
const verifyWebhookSignature = (platform, payload, signature) => {
  if (!WEBHOOK_SECRETS[platform]) {
    console.warn(`No webhook secret configured for ${platform}`);
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRETS[platform])
      .update(payload)
      .digest('hex');
    
    if (typeof signature !== 'string') {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(`sha256=${expectedSignature}`, 'utf8')
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * Main webhook handler - routes to platform-specific processors
 */
app.post('/webhook/:platform', rateLimit, async (req, res) => {
  const { platform } = req.params;
  
  try {
    console.log(`📨 Webhook received from ${platform}`);
    
    // Verify webhook signature (except for development)
    if (process.env.NODE_ENV === 'production') {
      const signature = req.headers['x-hub-signature-256'] || req.headers['x-signature'];
      if (!verifyWebhookSignature(platform, JSON.stringify(req.body), signature)) {
        console.error(`❌ Invalid webhook signature for ${platform}`);
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    // Route to platform-specific handler
    const result = await processPlatformWebhook(platform, req.body);
    
    if (result.success) {
      res.status(200).json({ status: 'processed', messageId: result.messageId });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error(`❌ Webhook processing failed for ${platform}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * WhatsApp webhook verification (GET request)
 */
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ WhatsApp webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

/**
 * Platform-specific webhook processing
 */
async function processPlatformWebhook(platform, webhookData) {
  try {
    console.log(`🔄 Processing ${platform} webhook...`);

    switch (platform) {
      case 'whatsapp':
        return await processWhatsAppWebhook(webhookData);
      
      case 'instagram':
        return await processInstagramWebhook(webhookData);
      
      case 'facebook':
        return await processFacebookWebhook(webhookData);
      
      case 'telegram':
        return await processTelegramWebhook(webhookData);
      
      case 'slack':
        return await processSlackWebhook(webhookData);
      
      case 'discord':
        return await processDiscordWebhook(webhookData);
      
      case 'gmail':
        return await processGmailWebhook(webhookData);
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

  } catch (error) {
    console.error(`❌ ${platform} webhook processing failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WhatsApp Business API webhook processor
 */
async function processWhatsAppWebhook(webhookData) {
  try {
    if (!webhookData.entry || !webhookData.entry[0]) {
      return { success: true, message: 'No entry data' };
    }

    const entry = webhookData.entry[0];
    const changes = entry.changes || [];

    for (const change of changes) {
      if (change.field === 'messages') {
        const messages = change.value.messages || [];
        
        for (const message of messages) {
          await processIncomingMessage({
            platform: 'whatsapp',
            messageId: message.id,
            senderId: message.from,
            content: extractWhatsAppMessageContent(message),
            timestamp: message.timestamp,
            messageType: message.type
          });
        }
      }
    }

    return { success: true, processed: changes.length };

  } catch (error) {
    throw new Error(`WhatsApp processing failed: ${error.message}`);
  }
}

/**
 * Instagram webhook processor
 */
async function processInstagramWebhook(webhookData) {
  try {
    if (!webhookData.entry) {
      return { success: true, message: 'No entry data' };
    }

    for (const entry of webhookData.entry) {
      const messaging = entry.messaging || [];
      
      for (const event of messaging) {
        if (event.message) {
          await processIncomingMessage({
            platform: 'instagram',
            messageId: event.message.mid,
            senderId: event.sender.id,
            content: event.message.text || '[Media message]',
            timestamp: event.timestamp
          });
        }
      }
    }

    return { success: true, processed: webhookData.entry.length };

  } catch (error) {
    throw new Error(`Instagram processing failed: ${error.message}`);
  }
}

/**
 * Facebook webhook processor
 */
async function processFacebookWebhook(webhookData) {
  try {
    if (!webhookData.entry) {
      return { success: true, message: 'No entry data' };
    }

    for (const entry of webhookData.entry) {
      const messaging = entry.messaging || [];
      
      for (const event of messaging) {
        if (event.message) {
          await processIncomingMessage({
            platform: 'facebook',
            messageId: event.message.mid,
            senderId: event.sender.id,
            content: event.message.text || '[Media message]',
            timestamp: event.timestamp
          });
        }
      }
    }

    return { success: true, processed: webhookData.entry.length };

  } catch (error) {
    throw new Error(`Facebook processing failed: ${error.message}`);
  }
}

/**
 * Telegram webhook processor
 */
async function processTelegramWebhook(webhookData) {
  try {
    if (webhookData.message) {
      const message = webhookData.message;
      
      await processIncomingMessage({
        platform: 'telegram',
        messageId: message.message_id,
        senderId: message.from.id,
        content: message.text || '[Media message]',
        timestamp: message.date * 1000, // Convert to milliseconds
        senderInfo: {
          username: message.from.username,
          firstName: message.from.first_name
        }
      });
    }

    return { success: true, processed: 1 };

  } catch (error) {
    throw new Error(`Telegram processing failed: ${error.message}`);
  }
}

/**
 * Slack webhook processor
 */
async function processSlackWebhook(webhookData) {
  try {
    // Slack events API sends event data in 'event' property
    if (webhookData.event && webhookData.event.type === 'message') {
      const event = webhookData.event;
      await processIncomingMessage({
        platform: 'slack',
        messageId: event.ts,
        senderId: event.user,
        content: event.text || '[Media message]',
        timestamp: parseFloat(event.ts) * 1000 // Slack timestamp is a string
      });
    }
    return { success: true, processed: 1 };
  } catch (error) {
    throw new Error(`Slack processing failed: ${error.message}`);
  }
}

/**
 * Discord webhook processor
 */
async function processDiscordWebhook(webhookData) {
  try {
    // Discord webhook sends different event types
    if (webhookData.t === 'MESSAGE_CREATE' && webhookData.d) {
      const message = webhookData.d;
      
      await processIncomingMessage({
        platform: 'discord',
        messageId: message.id,
        senderId: message.author.id,
        content: message.content || '[Media message]',
        timestamp: new Date(message.timestamp).getTime(),
        senderInfo: {
          username: message.author.username,
          discriminator: message.author.discriminator
        }
      });
    }

    return { success: true, processed: 1 };

  } catch (error) {
    throw new Error(`Discord processing failed: ${error.message}`);
  }
}

/**
 * Gmail webhook processor
 */
async function processGmailWebhook(webhookData) {
  try {
    // For demo, just log and return success
    console.log('📧 Gmail webhook received:', webhookData);
    // In production, parse Gmail webhook and call processIncomingMessage
    return { success: true, processed: 1 };
  } catch (error) {
    throw new Error(`Gmail processing failed: ${error.message}`);
  }
}

/**
 * Generic message processor - handles all platforms
 */
async function processIncomingMessage(messageData) {
  try {
    console.log(`💬 Processing message from ${messageData.platform}: ${messageData.senderId}`);

    // Step 1: Check if sender is authorized for auto-reply
    const isAuthorized = await checkContactAuthorization(messageData.senderId, messageData.platform);
    
    if (!isAuthorized) {
      console.log(`⏭️ Skipping unauthorized contact: ${messageData.senderId}`);
      return { success: true, skipped: true };
    }

    // Step 2: Get user's AI configuration and style
    const aiConfig = await getUserAIConfiguration(messageData.senderId, messageData.platform);
    
    if (!aiConfig || !aiConfig.autoReplyEnabled) {
      console.log(`⏭️ Auto-reply disabled for ${messageData.platform}`);
      return { success: true, skipped: true };
    }

    // Step 3: Generate AI response based on user's style
    const response = await generateAIResponse(messageData, aiConfig);
    
    if (!response) {
      console.log('🤖 No response generated');
      return { success: true, noResponse: true };
    }

    // Step 4: Send response via platform API
    const sendResult = await sendPlatformResponse(messageData.platform, messageData.senderId, response);
    
    if (sendResult.success) {
      // Step 5: Log the interaction
      await logInteraction({
        ...messageData,
        aiResponse: response,
        sentAt: new Date().toISOString()
      });
    }

    console.log(`✅ Message processed successfully for ${messageData.platform}`);
    
    return {
      success: true,
      messageId: sendResult.messageId,
      response: response
    };

  } catch (error) {
    console.error('❌ Message processing failed:', error);
    throw error;
  }
}

/**
 * Extract WhatsApp message content
 */
function extractWhatsAppMessageContent(message) {
  switch (message.type) {
    case 'text':
      return message.text.body;
    case 'image':
      return '[Image message]';
    case 'video':
      return '[Video message]';
    case 'audio':
      return '[Audio message]';
    case 'document':
      return '[Document message]';
    default:
      return '[Unsupported message type]';
  }
}

/**
 * Check if contact is authorized for auto-reply
 */
async function checkContactAuthorization(senderId, platform) {
  // In production, this would check your database
  // For demo, we'll assume all contacts are authorized
  return true;
}

/**
 * Get user's AI configuration
 */
async function getUserAIConfiguration(senderId, platform) {
  // In production, this would load user's settings from database
  // For demo, return mock configuration
  return {
    autoReplyEnabled: true,
    responseStyle: 'casual',
    aiModel: 'google/gemma-2-9b-it:free',
    maxResponseLength: 200,
    includeEmojis: true
  };
}

/**
 * Generate AI response using user's style
 */
async function generateAIResponse(messageData, aiConfig) {
  // In production, this would call your AI service
  // For demo, return a simple response
  const responses = [
    "Thanks for your message! I'll get back to you soon.",
    "Got it! Let me check on that for you.",
    "Hey! I'm currently away but I'll respond as soon as I can.",
    "Thanks for reaching out! I'll have a proper response for you shortly."
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Send response via platform API
 */
async function sendPlatformResponse(platform, recipientId, message) {
  // In production, this would use the actual platform APIs
  // For demo, simulate successful send
  console.log(`📤 Sending ${platform} message to ${recipientId}: ${message}`);
  
  return {
    success: true,
    messageId: `${platform}_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  };
}

/**
 * Log interaction for analytics
 */
async function logInteraction(interactionData) {
  // In production, this would store in your database
  console.log(`📊 Logging interaction:`, {
    platform: interactionData.platform,
    timestamp: interactionData.timestamp,
    responseGenerated: !!interactionData.aiResponse
  });
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * Platform status endpoint
 */
app.get('/status', (req, res) => {
  res.json({
    platforms: {
      whatsapp: { status: 'active', lastMessage: Date.now() - 120000 },
      instagram: { status: 'active', lastMessage: Date.now() - 300000 },
      telegram: { status: 'active', lastMessage: Date.now() - 60000 },
      gmail: { status: 'active', lastMessage: Date.now() - 1800000 }
    },
    totalMessages: 1247,
    responseRate: 0.95,
    avgResponseTime: 2.3
  });
});

/**
 * User dashboard data endpoint
 */
app.get('/api/user/:userId/dashboard', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // In production, this would fetch from your database
    const dashboardData = {
      user: {
        id: userId,
        email: 'user@example.com',
        plan: 'pro',
        joinedAt: '2024-01-15T10:30:00Z'
      },
      platforms: {
        whatsapp: { 
          connected: true, 
          autoReply: true, 
          messagesHandled: 45,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        instagram: { 
          connected: true, 
          autoReply: false, 
          messagesHandled: 12,
          lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        gmail: { 
          connected: true, 
          autoReply: true, 
          messagesHandled: 23,
          lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      },
      stats: {
        totalMessages: 80,
        responsesGenerated: 76,
        responseRate: 0.95,
        avgResponseTime: 2.1,
        topPlatform: 'whatsapp'
      }
    };

    res.json({ success: true, data: dashboardData });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data' 
    });
  }
});

/**
 * OAuth platform connection endpoint
 */
app.post('/api/oauth/:platform/connect', async (req, res) => {
  try {
    const { platform } = req.params;
    const { userId, permissions } = req.body;

    console.log(`🔗 OAuth connection request for ${platform} by user ${userId}`);

    // In production, this would:
    // 1. Generate OAuth URL with proper scopes
    // 2. Store state parameter securely
    // 3. Return authorization URL to app

    const authUrl = `https://oauth.${platform}.com/authorize?client_id=YOUR_APP_ID&redirect_uri=https://api.aireplica.com/oauth/${platform}/callback&scope=${getOAuthScopes(platform)}&state=${userId}_${Date.now()}`;

    res.json({
      success: true,
      authUrl,
      message: `OAuth URL generated for ${platform}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL'
    });
  }
});

/**
 * OAuth callback handler
 */
app.get('/oauth/:platform/callback', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state } = req.query;

    console.log(`📋 OAuth callback received for ${platform}`);

    // In production, this would:
    // 1. Validate state parameter
    // 2. Exchange code for access tokens
    // 3. Store tokens securely
    // 4. Update user's platform connections

    // Mock successful OAuth completion
    const tokens = await exchangeOAuthCode(platform, code);
    
    if (tokens.success) {
      // Redirect to success page or deep link back to app
      res.redirect(`aireplica://oauth/success?platform=${platform}&status=connected`);
    } else {
      res.redirect(`aireplica://oauth/error?platform=${platform}&error=${encodeURIComponent(tokens.error)}`);
    }

  } catch (error) {
    console.error(`❌ OAuth callback failed for ${platform}:`, error);
    res.redirect(`aireplica://oauth/error?platform=${platform}&error=callback_failed`);
  }
});

/**
 * Get OAuth scopes for platform
 */
function getOAuthScopes(platform) {
  const scopes = {
    whatsapp: 'whatsapp_business_messaging',
    instagram: 'instagram_basic,instagram_manage_messages',
    facebook: 'pages_messaging,pages_manage_metadata',
    gmail: 'https://www.googleapis.com/auth/gmail.compose,https://www.googleapis.com/auth/gmail.readonly',
    linkedin: 'r_liteprofile,w_member_social',
    twitter: 'tweet.read,tweet.write,users.read',
    slack: 'channels:read,im:write,users:read',
    discord: 'bot,messages.read',
    telegram: 'bot'
  };

  return scopes[platform] || '';
}

/**
 * Exchange OAuth authorization code for access tokens
 */
async function exchangeOAuthCode(platform, authCode) {
  try {
    // In production, this would make actual API calls to exchange tokens
    console.log(`🔄 Exchanging OAuth code for ${platform}...`);
    
    // Simulate token exchange
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      accessToken: `${platform}_access_${Math.random().toString(36)}`,
      refreshToken: `${platform}_refresh_${Math.random().toString(36)}`,
      expiresIn: 3600
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Error handling middleware
 */
app.use((error, req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AiReplica Webhook Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log('✅ Ready to process webhooks from all platforms!');
});

module.exports = app;
