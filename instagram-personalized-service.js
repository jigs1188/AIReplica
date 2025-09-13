/**
 * 📸 INSTAGRAM PERSONALIZED SERVICE
 * Advanced DM management with role-based AI responses
 */

const express = require('express');
const cors = require('cors');
const { generatePersonalizedReply, personalizedContacts } = require('./personalized-ai-service');
require('dotenv').config();

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

app.get('/api/instagram/status', (req, res) => {
    res.json({
        success: true,
        platform: 'Instagram',
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

const PORT = 3007;

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
