/**
 * 📸 INSTAGRAM PERSONALIZED SERVICE
 * Advanced DM management with role-based AI responses
 */

const express = require('express');
const cors = require('cors');
const { generatePersonalizedReply, personalizedContacts } = require('./personalized-ai-service');
require('dotenv').config();

// OAuth imports for quick connect
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Instagram-specific settings
const instagramSettings = {
    autoReplyMode: 'ask',
    personalizedReplies: true,
    businessHours: { start: '09:00', end: '18:00' },
    autoStoryReply: false,
    influencerMode: false,
    brandingEnabled: true,
    pendingDMs: new Map(),
    followersOnly: false,
    verifiedOnly: false
};

console.log('📸 Starting Instagram Personalized Service...');

// Instagram role-specific templates
const instagramRoles = {
    influencer: {
        style: 'engaging and brand-conscious',
        instructions: 'Respond as a professional influencer. Maintain brand image, be engaging, and look for collaboration opportunities.'
    },
    brand: {
        style: 'professional brand representative',
        instructions: 'Respond as a brand representative. Be helpful, professional, and focus on customer service.'
    },
    fan: {
        style: 'appreciative and friendly',
        instructions: 'Respond warmly to fans. Show appreciation, be encouraging, and maintain positive engagement.'
    },
    business: {
        style: 'business-focused and strategic',
        instructions: 'Handle business inquiries professionally. Focus on opportunities, partnerships, and professional networking.'
    },
    collaborator: {
        style: 'creative and collaborative',
        instructions: 'Respond to collaboration requests with enthusiasm. Discuss creative ideas and partnership possibilities.'
    }
};

// Simulate Instagram message processing (in real implementation, use Instagram Graph API)
async function handleInstagramDM(messageData) {
    const { senderId, senderUsername, message, isVerified, followerCount } = messageData;
    
    console.log(`📸 Instagram DM from @${senderUsername}: ${message}`);
    
    // Detect Instagram-specific contact role
    const role = detectInstagramRole(message, senderUsername, isVerified, followerCount);
    
    // Check if we should auto-reply or ask for approval
    const contact = personalizedContacts.get(senderId);
    const shouldAutoReply = contact && contact.autoConversation;
    
    if (instagramSettings.autoReplyMode === 'auto' || shouldAutoReply) {
        await sendInstagramPersonalizedReply(senderId, message, senderUsername, role);
    } else {
        // Store for approval
        const messageId = `ig_${Date.now()}_${senderId}`;
        instagramSettings.pendingDMs.set(messageId, {
            id: messageId,
            platform: 'instagram',
            senderId,
            senderUsername,
            content: message,
            timestamp: new Date(),
            role,
            isVerified,
            followerCount
        });
        
        console.log(`⏳ Instagram DM pending approval from @${senderUsername} (${role})`);
    }
}

function detectInstagramRole(message, username, isVerified, followerCount) {
    const msg = message.toLowerCase();
    
    if (msg.includes('collaboration') || msg.includes('sponsor') || msg.includes('brand deal')) {
        return 'business';
    }
    
    if (msg.includes('fan') || msg.includes('love your content') || msg.includes('amazing')) {
        return 'fan';
    }
    
    if (isVerified || followerCount > 10000) {
        return 'influencer';
    }
    
    if (msg.includes('work together') || msg.includes('collab')) {
        return 'collaborator';
    }
    
    return 'general';
}

async function sendInstagramPersonalizedReply(senderId, message, username, role) {
    try {
        // Enhance system prompt for Instagram context
        const instagramContext = {
            platform: 'Instagram',
            username: username,
            role: role,
            customInstructions: instagramRoles[role]?.instructions || '',
            brandingMessage: instagramSettings.brandingEnabled ? 
                'Subtly mention your Instagram content and encourage engagement.' : ''
        };
        
        const result = await generatePersonalizedReply(message, senderId, 'instagram');
        
        // In real implementation, send via Instagram Graph API
        console.log(`📸 Instagram Reply to @${username}: ${result.reply}`);
        
        // Store interaction
        const interaction = {
            platform: 'instagram',
            senderId,
            username,
            originalMessage: message,
            aiReply: result.reply,
            timestamp: new Date(),
            role
        };
        
        return { success: true, reply: result.reply, interaction };
        
    } catch (error) {
        console.error('Error sending Instagram reply:', error);
        return { success: false, error: error.message };
    }
}

// API Endpoints

// OAuth Endpoints for Quick Connect
app.get('/api/instagram/auth', (req, res) => {
    const facebookAppId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${facebookAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=instagram_basic,instagram_content_publish,pages_show_list&` +
        `response_type=code&` +
        `state=instagram_quick_connect`;
    
    res.json({
        success: true,
        authUrl: authUrl,
        message: 'Click the URL to authorize Instagram access'
    });
});

app.get('/api/instagram/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.status(400).json({
            success: false,
            error: 'Authorization code is required'
        });
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', {
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
            code: code
        });
        
        const { access_token } = tokenResponse.data;
        
        // Store token securely (in production, use database)
        instagramSettings.accessToken = access_token;
        instagramSettings.connected = true;
        
        res.json({
            success: true,
            message: 'Instagram connected successfully!',
            platform: 'Instagram',
            status: 'connected'
        });
    } catch (error) {
        console.error('❌ Instagram OAuth Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect Instagram'
        });
    }
});

app.post('/api/instagram/quick-connect', async (req, res) => {
    try {
        const { consumerUsername, consumerPassword, setupType } = req.body;
        
        // Use stored credentials from .env for backend connection
        if (process.env.INSTAGRAM_ACCESS_TOKEN) {
            // Store consumer info for personalized replies
            if (setupType === 'consumer' && consumerUsername) {
                instagramSettings.consumerUsername = consumerUsername;
                instagramSettings.consumerSetup = true;
                console.log(`📱 Consumer setup for Instagram: @${consumerUsername}`);
            }
            
            instagramSettings.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
            instagramSettings.connected = true;
            instagramSettings.autoReplyEnabled = true; // Auto-enable for consumer setup
            
            res.json({
                success: true,
                message: `Instagram connected for @${consumerUsername || 'user'}`,
                platform: 'Instagram',
                status: 'connected',
                autoRepliesActive: true,
                consumerMode: setupType === 'consumer'
            });
        } else {
            res.json({
                success: false,
                error: 'Backend Instagram credentials not configured. Please add INSTAGRAM_ACCESS_TOKEN to .env file.',
                requiresManualSetup: true,
                setupInstructions: 'Add your Instagram access token to .env file for automated connections'
            });
        }
    } catch (error) {
        console.error('❌ Instagram Quick Connect Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect Instagram'
        });
    }
});

// Activate auto-replies for consumer setup
app.post('/api/instagram/activate-auto-replies', async (req, res) => {
    try {
        const { username, autoReplyEnabled, personalizedReplies, features, aiSettings } = req.body;
        
        // Update settings for auto-replies
        instagramSettings.autoReplyEnabled = autoReplyEnabled;
        instagramSettings.personalizedReplies = personalizedReplies;
        instagramSettings.consumerUsername = username;
        
        if (aiSettings) {
            instagramSettings.aiTone = aiSettings.tone;
            instagramSettings.responseTime = aiSettings.responseTime;
            instagramSettings.personalityStyle = aiSettings.personalityStyle;
        }
        
        if (features) {
            instagramSettings.enabledFeatures = features;
        }
        
        console.log(`🤖 Auto-replies activated for Instagram: @${username}`);
        console.log(`✅ Features: ${features?.join(', ') || 'Standard auto-replies'}`);
        
        res.json({
            success: true,
            message: `Auto-replies activated for @${username}`,
            platform: 'Instagram',
            username: username,
            autoRepliesActive: true,
            features: features || ['dm_auto_replies'],
            aiPersonality: aiSettings?.personalityStyle || 'friendly',
            status: 'ready_for_auto_replies'
        });
        
    } catch (error) {
        console.error('❌ Failed to activate Instagram auto-replies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to activate auto-replies'
        });
    }
});

app.get('/api/instagram/status', (req, res) => {
    res.json({
        success: true,
        platform: 'Instagram',
        connected: instagramSettings.connected || false,
        settings: instagramSettings,
        pendingDMs: instagramSettings.pendingDMs.size,
        personalizedContacts: personalizedContacts.size
    });
});

app.post('/api/instagram/configure', (req, res) => {
    const updates = req.body;
    Object.assign(instagramSettings, updates);
    
    res.json({
        success: true,
        message: 'Instagram settings updated',
        settings: instagramSettings
    });
});

app.get('/api/instagram/pending-dms', (req, res) => {
    const pendingDMs = Array.from(instagramSettings.pendingDMs.values());
    res.json({ success: true, pendingDMs });
});

app.post('/api/instagram/approve-dm/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const { customResponse } = req.body;
    
    const pendingDM = instagramSettings.pendingDMs.get(messageId);
    if (!pendingDM) {
        return res.status(404).json({ success: false, error: 'DM not found' });
    }
    
    let responseToSend = customResponse;
    if (!responseToSend) {
        const result = await generatePersonalizedReply(
            pendingDM.content, 
            pendingDM.senderId, 
            'instagram'
        );
        responseToSend = result.reply;
    }
    
    // Send response (simulate Instagram API call)
    console.log(`📸 Approved Instagram Reply to @${pendingDM.senderUsername}: ${responseToSend}`);
    
    instagramSettings.pendingDMs.delete(messageId);
    
    res.json({
        success: true,
        message: `Reply sent to @${pendingDM.senderUsername}`,
        response: responseToSend
    });
});

app.post('/api/instagram/simulate-dm', async (req, res) => {
    const { senderUsername, message, isVerified = false, followerCount = 0 } = req.body;
    
    const messageData = {
        senderId: `ig_${senderUsername}`,
        senderUsername,
        message,
        isVerified,
        followerCount
    };
    
    await handleInstagramDM(messageData);
    
    res.json({
        success: true,
        message: 'Instagram DM processed',
        data: messageData
    });
});

const PORT = 3006;

app.listen(PORT, () => {
    console.log(`📸 Instagram Personalized Service running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api/instagram`);
    console.log('');
    console.log('Instagram Features:');
    console.log('• Influencer/Brand role detection');
    console.log('• Business collaboration handling');
    console.log('• Fan engagement responses');
    console.log('• Verified account recognition');
    console.log('• Story reply automation');
    console.log('');
});

module.exports = { handleInstagramDM, instagramSettings };
