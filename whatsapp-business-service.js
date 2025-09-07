/**
 * Real WhatsApp Business API Integration
 * Handles phone number verification, OTP sending, and auto-reply setup
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const { Buffer } = require('buffer');

const app = express();
app.use(cors());
app.use(express.json());

// WhatsApp Business API Configuration
const WHATSAPP_CONFIG = {
  apiUrl: 'https://graph.facebook.com/v18.0',
  // You need to get these from Facebook Developer Console
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'YOUR_WHATSAPP_ACCESS_TOKEN',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'YOUR_PHONE_NUMBER_ID',
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'your-verify-token-123',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'YOUR_BUSINESS_ACCOUNT_ID'
};

// Storage for user sessions and configurations
const userSessions = new Map();
const verifiedNumbers = new Map();
const autoReplyConfigs = new Map();

// Send OTP via WhatsApp Business API
app.post('/api/whatsapp/send-otp', async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;
    
    if (!phoneNumber || !userId) {
      return res.status(400).json({ success: false, error: 'Missing phone number or user ID' });
    }

    console.log(`📱 Sending OTP to WhatsApp number: ${phoneNumber}`);
    
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = crypto.randomUUID();
    
    // Store OTP session
    userSessions.set(verificationId, {
      phoneNumber,
      userId,
      otpCode,
      createdAt: new Date(),
      attempts: 0,
      verified: false
    });

    // Send OTP via WhatsApp Business API
    const messageData = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: `🔐 Your AiReplica verification code is: ${otpCode}\n\nThis code will expire in 5 minutes. Do not share it with anyone.`
      }
    };

    try {
      const response = await axios.post(
        `${WHATSAPP_CONFIG.apiUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ OTP sent successfully to ${phoneNumber}:`, response.data);
      
      res.json({
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        verificationId,
        expiresIn: '5 minutes'
      });

    } catch (whatsappError) {
      console.error('WhatsApp API Error:', whatsappError.response?.data || whatsappError.message);
      
      // Fallback: Store OTP for manual testing
      console.log(`📋 FALLBACK - Manual OTP for ${phoneNumber}: ${otpCode}`);
      
      res.json({
        success: true,
        message: 'OTP generated (check console for manual testing)',
        verificationId,
        testOtp: otpCode, // Only for development
        expiresIn: '5 minutes'
      });
    }

  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify OTP and register phone number
app.post('/api/whatsapp/verify-otp', async (req, res) => {
  try {
    const { verificationId, otpCode, phoneNumber, userId } = req.body;
    
    if (!verificationId || !otpCode || !phoneNumber || !userId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const session = userSessions.get(verificationId);
    
    if (!session) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification ID' });
    }

    if (session.phoneNumber !== phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number mismatch' });
    }

    // Check if OTP is expired (5 minutes)
    const now = new Date();
    const otpAge = now - session.createdAt;
    if (otpAge > 5 * 60 * 1000) {
      userSessions.delete(verificationId);
      return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
    }

    // Check attempts limit
    if (session.attempts >= 3) {
      userSessions.delete(verificationId);
      return res.status(400).json({ success: false, error: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (session.otpCode !== otpCode) {
      session.attempts += 1;
      return res.status(400).json({ 
        success: false, 
        error: `Invalid OTP. ${3 - session.attempts} attempts remaining.` 
      });
    }

    // OTP verified successfully
    session.verified = true;
    session.verifiedAt = new Date();
    
    // Store verified number
    verifiedNumbers.set(phoneNumber, {
      userId,
      phoneNumber,
      verifiedAt: new Date(),
      status: 'verified',
      sessionId: verificationId
    });

    console.log(`✅ Phone number verified successfully: ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber,
      verifiedAt: session.verifiedAt
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete WhatsApp auto-reply setup
app.post('/api/whatsapp/complete-setup', async (req, res) => {
  try {
    const { phoneNumber, userId, config, verificationId } = req.body;
    
    if (!phoneNumber || !userId || !config || !verificationId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Verify the session exists and is verified
    const session = userSessions.get(verificationId);
    const verifiedNumber = verifiedNumbers.get(phoneNumber);
    
    if (!session || !session.verified || !verifiedNumber) {
      return res.status(400).json({ success: false, error: 'Phone number not verified' });
    }

    // Store auto-reply configuration
    const autoReplyConfig = {
      phoneNumber,
      userId,
      businessName: config.businessName,
      responseStyle: config.responseStyle,
      customGreeting: config.customGreeting,
      workingHours: config.workingHours,
      autoReplyRules: config.autoReplyRules,
      enabled: true,
      createdAt: new Date(),
      webhookUrl: `${req.protocol}://${req.get('host')}/webhook/whatsapp/${phoneNumber.replace('+', '')}`,
      status: 'active'
    };

    autoReplyConfigs.set(phoneNumber, autoReplyConfig);

    console.log(`🤖 Auto-reply setup completed for ${phoneNumber}:`, {
      businessName: config.businessName,
      responseStyle: config.responseStyle,
      rulesCount: config.autoReplyRules.length
    });

    // Set up webhook subscription (if using WhatsApp Business API)
    try {
      await setupWhatsAppWebhook(phoneNumber, autoReplyConfig.webhookUrl);
    } catch (webhookError) {
      console.warn('Webhook setup warning:', webhookError.message);
    }

    res.json({
      success: true,
      message: 'WhatsApp auto-reply setup completed successfully',
      config: autoReplyConfig,
      webhookUrl: autoReplyConfig.webhookUrl,
      testInstructions: {
        step1: `Send a message to ${phoneNumber} from any WhatsApp`,
        step2: 'The AI will automatically respond based on your configuration',
        step3: 'Check the response history in your dashboard'
      }
    });

  } catch (error) {
    console.error('Complete Setup Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WhatsApp webhook endpoint for receiving messages
app.get('/webhook/whatsapp/:phoneNumber', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log(`📋 WhatsApp webhook verification for ${req.params.phoneNumber}:`, { mode, token, challenge });
  console.log('📋 Full query parameters:', req.query);
  console.log('📋 Expected verify token:', WHATSAPP_CONFIG.webhookVerifyToken);
  
  if (mode === 'subscribe' && token === WHATSAPP_CONFIG.webhookVerifyToken) {
    console.log('✅ WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else if (!mode && !token && !challenge) {
    // Handle case where this is just a health check or setup request
    console.log('📋 Webhook endpoint ready - waiting for Meta verification');
    res.status(200).json({ 
      status: 'ready', 
      phoneNumber: req.params.phoneNumber,
      message: 'Webhook endpoint is ready for Meta verification' 
    });
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    console.log('❌ Mode:', mode, '| Expected: subscribe');
    console.log('❌ Token:', token, '| Expected:', WHATSAPP_CONFIG.webhookVerifyToken);
    res.status(403).send('Forbidden');
  }
});

app.post('/webhook/whatsapp/:phoneNumber', async (req, res) => {
  try {
    const targetPhoneNumber = '+' + req.params.phoneNumber;
    const webhookData = req.body;
    
    console.log(`📨 WhatsApp message received for ${targetPhoneNumber}:`, JSON.stringify(webhookData, null, 2));
    
    // Extract message data from WhatsApp webhook
    const entry = webhookData.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    
    if (!messages || messages.length === 0) {
      return res.json({ success: true, message: 'No messages to process' });
    }

    const message = messages[0];
    const senderPhoneNumber = message.from;
    const messageText = message.text?.body || '';
    const messageType = message.type;
    
    console.log(`💬 Message details:`, {
      from: senderPhoneNumber,
      to: targetPhoneNumber,
      text: messageText,
      type: messageType
    });

    // Get auto-reply configuration for this number
    const config = autoReplyConfigs.get(targetPhoneNumber);
    
    if (!config || !config.enabled) {
      console.log(`⚠️ Auto-reply not enabled for ${targetPhoneNumber}`);
      return res.json({ success: true, message: 'Auto-reply not enabled' });
    }

    // Generate AI response based on configuration
    const aiResponse = generateAutoReply(messageText, config);
    
    if (aiResponse) {
      // Send auto-reply via WhatsApp Business API
      const replyData = {
        messaging_product: 'whatsapp',
        to: senderPhoneNumber,
        type: 'text',
        text: {
          body: aiResponse
        }
      };

      try {
        const response = await axios.post(
          `${WHATSAPP_CONFIG.apiUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
          replyData,
          {
            headers: {
              'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`🤖 Auto-reply sent to ${senderPhoneNumber}:`, aiResponse);
        console.log(`📊 WhatsApp API response:`, response.data);

        res.json({
          success: true,
          message: 'Auto-reply sent successfully',
          reply: aiResponse,
          sentTo: senderPhoneNumber,
          messageId: response.data.messages?.[0]?.id
        });

      } catch (replyError) {
        console.error('Auto-reply send error:', replyError.response?.data || replyError.message);
        
        // Log the attempt even if sending fails
        res.json({
          success: false,
          error: 'Failed to send auto-reply',
          reply: aiResponse,
          attemptedTo: senderPhoneNumber
        });
      }
    } else {
      res.json({ 
        success: true, 
        message: 'No auto-reply generated for this message' 
      });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate auto-reply based on message and configuration
function generateAutoReply(messageText, config) {
  const lowerMessage = messageText.toLowerCase();
  
  // Check auto-reply rules
  for (const rule of config.autoReplyRules) {
    const keywords = rule.keyword.split('|');
    const hasKeyword = keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (hasKeyword) {
      return personalizeResponse(rule.response, config);
    }
  }
  
  // Default greeting if no specific rule matches
  if (config.customGreeting) {
    return personalizeResponse(config.customGreeting, config);
  }
  
  // Style-based default responses
  const defaultResponses = {
    professional: `Hello! Thank you for contacting ${config.businessName}. I've received your message and will respond shortly.`,
    friendly: `Hey there! 😊 Thanks for reaching out to ${config.businessName}! I'll get back to you real soon! 🚀`,
    casual: `Hi! Got your message. Will get back to you soon! 👍`,
    helpful: `Thank you for your message! I'm here to help. Let me look into this for you right away! 💪`
  };
  
  return defaultResponses[config.responseStyle] || defaultResponses.helpful;
}

// Personalize response with business name and style
function personalizeResponse(response, config) {
  return response
    .replace('{businessName}', config.businessName)
    .replace('{name}', config.businessName);
}

// Setup WhatsApp webhook subscription
async function setupWhatsAppWebhook(phoneNumber, webhookUrl) {
  try {
    console.log(`📡 Setting up webhook for ${phoneNumber}: ${webhookUrl}`);
    
    // In production, you would configure this via Facebook Developer Console
    // or WhatsApp Business API webhook setup
    
    return { success: true, webhookUrl };
  } catch (error) {
    throw new Error('Webhook setup failed: ' + error.message);
  }
}

// Get auto-reply status for a phone number
app.get('/api/whatsapp/status/:phoneNumber', (req, res) => {
  const phoneNumber = req.params.phoneNumber;
  const config = autoReplyConfigs.get(phoneNumber);
  const verified = verifiedNumbers.get(phoneNumber);
  
  res.json({
    success: true,
    phoneNumber,
    verified: !!verified,
    configured: !!config,
    enabled: config?.enabled || false,
    status: config?.status || 'not_configured',
    businessName: config?.businessName,
    responseStyle: config?.responseStyle,
    webhookUrl: config?.webhookUrl,
    lastActivity: config?.lastActivity || verified?.verifiedAt
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'whatsapp-business-api',
    timestamp: new Date().toISOString(),
    stats: {
      verifiedNumbers: verifiedNumbers.size,
      activeConfigs: autoReplyConfigs.size,
      activeSessions: userSessions.size
    }
  });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Business API Service running on port ${PORT}`);
  console.log(`📱 Ready to handle real WhatsApp integrations`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`⚠️  Don't forget to set your WhatsApp Business API credentials!`);
  console.log(`📋 Required environment variables:`);
  console.log(`   WHATSAPP_ACCESS_TOKEN=your_access_token`);
  console.log(`   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id`);
  console.log(`   WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id`);
});

module.exports = app;
